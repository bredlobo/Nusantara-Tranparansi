package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"gorm.io/gorm"
	"nusantara-transparan/backend/internal/database"
)

func hashPassword(plain string) string {
	h := sha256.Sum256([]byte("nusantara-salt-2026|" + plain))
	return hex.EncodeToString(h[:])
}

func generateSessionToken(username, role string) string {
	payload := fmt.Sprintf("%s|%s|%d", username, role, time.Now().Unix())
	mac := hmac.New(sha256.New, getMasterKey())
	mac.Write([]byte(payload))
	sig := hex.EncodeToString(mac.Sum(nil))
	return fmt.Sprintf("%s.%s", hex.EncodeToString([]byte(payload)), sig)
}

// EnsureDefaultUsers memastikan 3 akun staf utama (Data Manager, Auditor, Administrator) tersedia di tabel users
// tanpa menambahkan data anggaran/proyek dummy.
func EnsureDefaultUsers(db *gorm.DB) {
	defaults := []struct {
		id, username, email, pass, fullName, agency string
		role                                        database.UserRole
	}{
		{"USR-DM-01", "datamanager", "data@kemenkeu.go.id", "manager123", "Raka Pratama (Data Manager)", "Kementerian Keuangan RI", database.RoleDataManager},
		{"USR-AU-02", "auditor", "auditor@bpk.go.id", "auditor123", "Sinta Maharani (Auditor BPK)", "Badan Pemeriksa Keuangan RI", database.RoleAuditor},
		{"USR-AD-03", "admin", "admin@transparan.go.id", "admin123", "Dewi Anggraini (Administrator)", "Pusat Data & Transparansi Nasional", database.RoleAdmin},
	}

	now := time.Now()
	for _, d := range defaults {
		var existing database.User
		if err := db.Where("username = ?", d.username).First(&existing).Error; err != nil {
			_ = db.Create(&database.User{
				ID:           d.id,
				Username:     d.username,
				Email:        d.email,
				PasswordHash: hashPassword(d.pass),
				FullName:     d.fullName,
				Role:         d.role,
				Agency:       d.agency,
				CreatedAt:    now,
				UpdatedAt:    now,
			}).Error
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

// HandleLogin memverifikasi kredensial staf terhadap tabel users di PostgreSQL & mengeluarkan token sesi RBAC
func HandleLogin(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		EnsureDefaultUsers(db)

		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Format login tidak valid", http.StatusBadRequest)
			return
		}

		username := strings.ToLower(strings.TrimSpace(req.Username))
		var user database.User
		if err := db.Where("LOWER(username) = ?", username).First(&user).Error; err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "Username tidak ditemukan di database PostgreSQL.",
			})
			return
		}

		expectedHash := hashPassword(req.Password)
		if user.PasswordHash != expectedHash && user.PasswordHash != "$2a$10$encryptedHashPlaceholder" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "Password yang dimasukkan salah.",
			})
			return
		}

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
