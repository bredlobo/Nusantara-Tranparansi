package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
	"unicode"

	"gorm.io/gorm"
	"nusantara-transparan/backend/internal/database"
)

// =============================================================================
// 1. KEBIJAKAN KOMPLEKSITAS PASSWORD (NIST / OWASP PASSWORD POLICY)
// Minimal 10 karakter, wajib mengandung: Huruf Besar, Huruf Kecil, Angka, & Simbol
// =============================================================================

func ValidatePasswordStrength(password string) error {
	if len(password) < 10 {
		return errors.New("password wajib minimal 10 karakter")
	}

	var hasUpper, hasLower, hasNumber, hasSymbol bool
	for _, ch := range password {
		switch {
		case unicode.IsUpper(ch):
			hasUpper = true
		case unicode.IsLower(ch):
			hasLower = true
		case unicode.IsDigit(ch):
			hasNumber = true
		case unicode.IsPunct(ch) || unicode.IsSymbol(ch):
			hasSymbol = true
		}
	}

	if !hasUpper {
		return errors.New("password wajib mengandung minimal 1 huruf besar (A-Z)")
	}
	if !hasLower {
		return errors.New("password wajib mengandung minimal 1 huruf kecil (a-z)")
	}
	if !hasNumber {
		return errors.New("password wajib mengandung minimal 1 angka (0-9)")
	}
	if !hasSymbol {
		return errors.New("password wajib mengandung minimal 1 simbol khusus (!@#$%^&* dll.)")
	}

	return nil
}

func HashPassword(plain string) string {
	h := sha256.Sum256([]byte("nusantara-salt-2026|" + plain))
	return hex.EncodeToString(h[:])
}

// =============================================================================
// 2. PROTEKSI ANTI-BRUTE FORCE LOGIN (ACCOUNT LOCKOUT 5 PERCOBAAN GAGAL)
// =============================================================================

type loginAttempt struct {
	failedCount int
	lockedUntil time.Time
}

var (
	loginAttempts   = make(map[string]*loginAttempt)
	loginAttemptsMu sync.Mutex
)

const (
	MaxFailedLoginAttempts = 5
	LockoutDuration        = 5 * time.Minute
)

func checkLoginLockout(key string) (bool, time.Duration) {
	loginAttemptsMu.Lock()
	defer loginAttemptsMu.Unlock()

	att, exists := loginAttempts[key]
	if !exists {
		return false, 0
	}

	now := time.Now()
	if !att.lockedUntil.IsZero() && now.Before(att.lockedUntil) {
		return true, att.lockedUntil.Sub(now)
	}

	if !att.lockedUntil.IsZero() && now.After(att.lockedUntil) {
		delete(loginAttempts, key)
	}
	return false, 0
}

func recordFailedLogin(key string) (int, bool) {
	loginAttemptsMu.Lock()
	defer loginAttemptsMu.Unlock()

	att, exists := loginAttempts[key]
	if !exists {
		att = &loginAttempt{}
		loginAttempts[key] = att
	}

	att.failedCount++
	if att.failedCount >= MaxFailedLoginAttempts {
		att.lockedUntil = time.Now().Add(LockoutDuration)
		return 0, true
	}
	return MaxFailedLoginAttempts - att.failedCount, false
}

func resetLoginAttempts(key string) {
	loginAttemptsMu.Lock()
	defer loginAttemptsMu.Unlock()
	delete(loginAttempts, key)
}

func generateSessionToken(username, role string) string {
	payload := fmt.Sprintf("%s|%s|%d", username, role, time.Now().Unix())
	mac := hmac.New(sha256.New, getMasterKey())
	mac.Write([]byte(payload))
	sig := hex.EncodeToString(mac.Sum(nil))
	return fmt.Sprintf("%s.%s", hex.EncodeToString([]byte(payload)), sig)
}

// EnsureDefaultUsers memastikan 3 akun staf utama tersedia dengan password yang memenuhi standar keamanan tinggi
func EnsureDefaultUsers(db *gorm.DB) {
	defaults := []struct {
		id, username, email, pass, fullName, agency string
		role                                        database.UserRole
	}{
		{"USR-DM-01", "datamanager", "data@kemenkeu.go.id", "Manager#2026!", "Raka Pratama (Data Manager)", "Kementerian Keuangan RI", database.RoleDataManager},
		{"USR-AU-02", "auditor", "auditor@bpk.go.id", "Auditor#2026!", "Sinta Maharani (Auditor BPK)", "Badan Pemeriksa Keuangan RI", database.RoleAuditor},
		{"USR-AD-03", "admin", "admin@transparan.go.id", "Admin#2026!", "Dewi Anggraini (Administrator)", "Pusat Data & Transparansi Nasional", database.RoleAdmin},
	}

	now := time.Now()
	for _, d := range defaults {
		var existing database.User
		expectedHash := HashPassword(d.pass)
		if err := db.Where("username = ?", d.username).First(&existing).Error; err != nil {
			_ = db.Create(&database.User{
				ID:           d.id,
				Username:     d.username,
				Email:        d.email,
				PasswordHash: expectedHash,
				FullName:     d.fullName,
				Role:         d.role,
				Agency:       d.agency,
				CreatedAt:    now,
				UpdatedAt:    now,
			}).Error
		} else if existing.PasswordHash != expectedHash {
			db.Model(&existing).Update("password_hash", expectedHash)
		}
	}
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	ID       string            `json:"id"`
	Username string            `json:"username"`
	FullName string            `json:"full_name"`
	Role     database.UserRole `json:"role"`
	Agency   string            `json:"agency"`
	Token    string            `json:"token"`
	MFACode  string            `json:"mfa_code"`
}

// HandleLogin memverifikasi kredensial dengan proteksi Anti-Brute Force Lockout (maks 5x gagal)
func HandleLogin(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		EnsureDefaultUsers(db)

		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Format login tidak valid", http.StatusBadRequest)
			return
		}

		clientIP, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			clientIP = r.RemoteAddr
		}
		username := strings.ToLower(strings.TrimSpace(req.Username))
		lockKey := fmt.Sprintf("%s|%s", clientIP, username)

		// 1. Cek apakah akun/IP sedang dalam masa Lockout Anti-Brute Force
		if locked, remaining := checkLoginLockout(lockKey); locked {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": fmt.Sprintf(
					"PROTEKSI BRUTE-FORCE: Akun '%s' dikunci sementara karena 5x gagal login. Coba lagi dalam %d detik.",
					username, int(remaining.Seconds())+1,
				),
			})
			return
		}

		var user database.User
		if err := db.Where("LOWER(username) = ?", username).First(&user).Error; err != nil {
			rem, lockedNow := recordFailedLogin(lockKey)
			msg := fmt.Sprintf("Username atau password salah. Sisa percobaan sebelum terkunci: %d kali.", rem)
			if lockedNow {
				msg = "PROTEKSI BRUTE-FORCE: Percobaan gagal mencapai 5 kali! Akun dikunci selama 5 menit."
			}
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
			return
		}

		expectedHash := HashPassword(req.Password)
		if user.PasswordHash != expectedHash {
			rem, lockedNow := recordFailedLogin(lockKey)
			now := time.Now()
			if lockedNow {
				_ = db.Create(&database.AuditLog{
					ID:        fmt.Sprintf("LOG-%d", now.UnixNano()%1000000),
					TableName: "users",
					RecordID:  user.ID,
					Action:    "BRUTE_FORCE_LOCKOUT",
					ActorID:   clientIP,
					ActorName: username,
					ChangedAt: now,
					Reason:    fmt.Sprintf("Akun %s dikunci otomatis selama 5 menit setelah 5x gagal login dari IP %s", username, clientIP),
				}).Error
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusTooManyRequests)
				_ = json.NewEncoder(w).Encode(map[string]string{
					"error": "PROTEKSI BRUTE-FORCE: Anda telah gagal login 5 kali! Akun dikunci selama 5 menit dan insiden dicatat di Audit Log.",
				})
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": fmt.Sprintf("Password salah. Sisa percobaan sebelum akun dikunci: %d kali.", rem),
			})
			return
		}

		// Reset percobaan gagal jika login berhasil
		resetLoginAttempts(lockKey)

		token := generateSessionToken(user.Username, string(user.Role))
		mfaCode := GenerateMFACode("nusantara-admin-mfa-secret")

		now := time.Now()
		_ = db.Create(&database.AuditLog{
			ID:        fmt.Sprintf("LOG-%d", now.UnixNano()%1000000),
			TableName: "users",
			RecordID:  user.ID,
			Action:    "USER_LOGIN",
			ActorID:   string(user.Role),
			ActorName: user.FullName,
			NewData:   fmt.Sprintf(`{"username":%q,"role":%q}`, user.Username, user.Role),
			ChangedAt: now,
			Reason:    fmt.Sprintf("Login berhasil sebagai %s (%s)", user.FullName, user.Role),
		}).Error

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(LoginResponse{
			ID:       user.ID,
			Username: user.Username,
			FullName: user.FullName,
			Role:     user.Role,
			Agency:   user.Agency,
			Token:    token,
			MFACode:  mfaCode,
		})
	}
}
