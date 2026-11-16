package auth

import (
	"encoding/json"
	"log"
	"net"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"nusantara-transparan/backend/internal/database"
)

type ipVisitor struct {
	count     int
	windowEnd time.Time
	strikes   int
	bannedTil time.Time
}

var (
	visitors = make(map[string]*ipVisitor)
	mu       sync.Mutex
)

const (
	rateLimitMaxRequests = 120             // Maksimal 120 request per menit per IP
	rateLimitWindow      = time.Minute     // Jendela waktu 1 menit
	maxBodyBytes         = 1 << 20         // Maksimal ukuran body 1 MB (Mitigasi CWE-400)
	maxWAFStrikes        = 3               // 3x terdeteksi kirim payload serangan -> Auto-Ban IP!
	ipBanDuration        = 15 * time.Minute
)

// Daftar pola serangan berbahaya yang dicegat oleh In-App WAF (SQLi, XSS, Path Traversal)
var maliciousPatterns = []string{
	"union select",
	"drop table",
	"insert into",
	"delete from",
	"update users",
	"' or '1'='1",
	"\" or \"1\"=\"1",
	"--",
	"<script",
	"javascript:",
	"onerror=",
	"onload=",
	"../",
	"..\\",
	"/etc/passwd",
	"cmd.exe",
	"powershell",
}

// Daftar User-Agent scanner peretas otomatis yang langsung diblokir
var blockedScanners = []string{
	"sqlmap",
	"nikto",
	"nmap",
	"masscan",
	"acunetix",
	"dirbuster",
	"gobuster",
	"nuclei",
	"zgrab",
}

// checkAndRecordIP memeriksa apakah IP di-ban atau melampaui rate limit
func checkAndRecordIP(ip string) (allowed bool, isBanned bool) {
	mu.Lock()
	defer mu.Unlock()

	now := time.Now()
	v, exists := visitors[ip]
	if !exists {
		visitors[ip] = &ipVisitor{
			count:     1,
			windowEnd: now.Add(rateLimitWindow),
		}
		return true, false
	}

	// Cek apakah IP sedang dalam masa Auto-Ban akibat serangan WAF
	if !v.bannedTil.IsZero() && now.Before(v.bannedTil) {
		return false, true
	}

	if now.After(v.windowEnd) {
		v.count = 1
		v.windowEnd = now.Add(rateLimitWindow)
		return true, false
	}

	v.count++
	return v.count <= rateLimitMaxRequests, false
}

// recordWAFStrike mencatat pelanggaran keamanan (SQLi/XSS/Scanner); jika >= 3 strike, IP otomatis di-ban 15 menit
func recordWAFStrike(ip string) bool {
	mu.Lock()
	defer mu.Unlock()

	v, exists := visitors[ip]
	if !exists {
		v = &ipVisitor{windowEnd: time.Now().Add(rateLimitWindow)}
		visitors[ip] = v
	}
	v.strikes++
	if v.strikes >= maxWAFStrikes {
		v.bannedTil = time.Now().Add(ipBanDuration)
		return true
	}
	return false
}

// InspectMaliciousRequest memeriksa URL, Query, dan User-Agent terhadap serangan SQLi, XSS, Path Traversal, & Scanner
func InspectMaliciousRequest(r *http.Request) (bool, string) {
	ua := strings.ToLower(r.Header.Get("User-Agent"))
	for _, scanner := range blockedScanners {
		if strings.Contains(ua, scanner) {
			return true, "Blocked Automated Vulnerability Scanner (" + scanner + ")"
		}
	}

	rawTarget, _ := url.QueryUnescape(r.URL.RequestURI())
	lowerTarget := strings.ToLower(rawTarget)
	for _, pattern := range maliciousPatterns {
		if strings.Contains(lowerTarget, pattern) {
			return true, "Blocked Malicious Payload Pattern (" + pattern + ")"
		}
	}

	return false, ""
}

// SecurityAndCORSMiddleware menerapkan pertahanan berlapis (Defense-in-Depth):
// 1. CORS & Metode HTTP Valid
// 2. HTTP Security Headers (HSTS, CSP, X-Frame-Options, Permissions-Policy)
// 3. In-App WAF & IPS (Mendeteksi & memblokir SQLi, XSS, Path Traversal, dan Scanner seperti sqlmap/nikto)
// 4. Auto-IP Banning (3x serangan WAF = Ban IP 15 menit)
// 5. Per-IP Rate Limiting Anti-DDoS (120 req/menit)
// 6. Request Body Size Limit (1 MB)
func SecurityAndCORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// 1. CORS Headers
		origin := r.Header.Get("Origin")
		if origin == "" {
			w.Header().Set("Access-Control-Allow-Origin", "*")
		} else {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-User-Role, X-MFA-Code")

		// 2. HTTP Security Headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// Tolak metode HTTP mencurigakan (TRACE / CONNECT)
		if r.Method == http.MethodTrace || r.Method == http.MethodConnect {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		clientIP, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			clientIP = r.RemoteAddr
		}

		// 3. Periksa Rate Limit & Status Auto-Ban IP
		allowed, isBanned := checkAndRecordIP(clientIP)
		if isBanned {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "WAF IPS BLOCK: Alamat IP Anda diblokir sementara selama 15 menit karena aktivitas serangan berulang.",
			})
			return
		}
		if !allowed {
			log.Printf("[SECURITY ALERT] Rate limit exceeded dari IP: %s pada %s", clientIP, r.URL.Path)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "Terlalu banyak permintaan (Rate Limit Exceeded). Silakan coba lagi dalam 1 menit.",
			})
			return
		}

		// 4. In-App WAF Inspection (SQLi, XSS, Path Traversal, Vulnerability Scanners)
		if isMalicious, reason := InspectMaliciousRequest(r); isMalicious {
			bannedNow := recordWAFStrike(clientIP)
			log.Printf("[WAF BLOCKED] Serangan dicegat dari IP %s: %s (Banned: %v)", clientIP, reason, bannedNow)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "WAF SECURITY BLOCK: Permintaan ditolak karena terdeteksi pola berbahaya (" + reason + ").",
			})
			return
		}

		// 5. Batasi ukuran body request maksimal 1 MB
		r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)

		// 6. Eksekusi Handler
		next.ServeHTTP(w, r)

		// 7. Real-Time Security & Access Logging
		log.Printf("[AUDIT-LOG] %s %s | %v | IP: %s | Role: %s",
			r.Method, r.URL.Path, time.Since(start), clientIP, getRoleFromRequest(r))
	})
}

// RequireRole menerapkan Role-Based Access Control (RBAC) dan opsional MFA
func RequireRole(requireMFA bool, allowedRoles ...database.UserRole) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			userRole := database.UserRole(getRoleFromRequest(r))

			authorized := false
			for _, allowed := range allowedRoles {
				if userRole == allowed {
					authorized = true
					break
				}
			}

			if !authorized {
				log.Printf("[RBAC DENIED] Akses ditolak untuk role '%s' pada %s", userRole, r.URL.Path)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusForbidden)
				_ = json.NewEncoder(w).Encode(map[string]string{
					"error": "Akses ditolak (RBAC): Peran Anda tidak memiliki izin untuk operasi ini.",
				})
				return
			}

			if requireMFA {
				mfaCode := r.Header.Get("X-MFA-Code")
				if !VerifyMFACode("nusantara-admin-mfa-secret", mfaCode) {
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusUnauthorized)
					_ = json.NewEncoder(w).Encode(map[string]string{
						"error": "Verifikasi Multi-Factor Authentication (MFA) diperlukan.",
					})
					return
				}
			}

			next(w, r)
		}
	}
}

func getRoleFromRequest(r *http.Request) string {
	role := strings.ToLower(strings.TrimSpace(r.Header.Get("X-User-Role")))
	if role == "" {
		return string(database.RolePublic)
	}
	return role
}
