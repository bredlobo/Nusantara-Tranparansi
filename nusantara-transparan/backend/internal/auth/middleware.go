package auth

import (
	"encoding/json"
	"log"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"nusantara-transparan/backend/internal/database"
)

type ipVisitor struct {
	count     int
	windowEnd time.Time
}

var (
	visitors = make(map[string]*ipVisitor)
	mu       sync.Mutex
)

const (
	rateLimitMaxRequests = 120 // Maksimal 120 request per menit per IP (Anti-DDoS & Brute Force)
	rateLimitWindow      = time.Minute
	maxBodyBytes         = 1 << 20 // Maksimal ukuran body 1 MB (Mitigasi CWE-400 Resource Exhaustion)
)

// allowIP memeriksa batas rate limit per alamat IP
func allowIP(ip string) bool {
	mu.Lock()
	defer mu.Unlock()

	now := time.Now()
	v, exists := visitors[ip]
	if !exists || now.After(v.windowEnd) {
		visitors[ip] = &ipVisitor{
			count:     1,
			windowEnd: now.Add(rateLimitWindow),
		}
		return true
	}

	v.count++
	return v.count <= rateLimitMaxRequests
}

// SecurityAndCORSMiddleware menerapkan standar keamanan siber web menyeluruh:
// - CORS Policy
// - HTTP Security Headers & HSTS (Checklist #6 & #10)
// - Per-IP Rate Limiting Anti-DDoS (Checklist #7)
// - Request Payload Size Limit (CWE Top 25)
// - Real-Time Audit & Access Logging (Checklist #8)
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

		// 2. HTTP Security Headers (Standar Keamanan Siber Web & OWASP)
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		// Preflight OPTIONS
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// 3. Rate Limiting per IP (Proteksi Anti-DDoS & Brute Force)
		clientIP, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			clientIP = r.RemoteAddr
		}
		if !allowIP(clientIP) {
			log.Printf("[SECURITY ALERT] Rate limit exceeded dari IP: %s pada %s", clientIP, r.URL.Path)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			_ = json.NewEncoder(w).Encode(map[string]string{
				"error": "Terlalu banyak permintaan (Rate Limit Exceeded). Silakan coba lagi dalam 1 menit.",
			})
			return
		}

		// 4. Batasi ukuran body request maksimal 1 MB (Mitigasi CWE-400)
		r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)

		// 5. Eksekusi Handler
		next.ServeHTTP(w, r)

		// 6. Real-Time Security & Access Logging
		log.Printf("[AUDIT-LOG] %s %s | %v | IP: %s | Role: %s",
			r.Method, r.URL.Path, time.Since(start), clientIP, getRoleFromRequest(r))
	})
}

// RequireRole menerapkan Role-Based Access Control (RBAC - Checklist #3) dan opsional MFA (Checklist #2)
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
