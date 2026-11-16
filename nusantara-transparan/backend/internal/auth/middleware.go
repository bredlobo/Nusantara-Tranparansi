package auth

import (
	"log"
	"net/http"
	"time"
)

// SecurityAndCORSMiddleware menerapkan CORS, Security Headers (Checklist #6 & #10), dan Real-Time Logging (Checklist #8)
func SecurityAndCORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// 1. CORS Headers (Mengizinkan komunikasi dari Frontend React/Vite)
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-User-Role")

		// 2. Security Headers (CWE Top 25 / OWASP Mitigation)
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// Tangani preflight OPTIONS request
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		// 3. Eksekusi handler berikutnya
		next.ServeHTTP(w, r)

		// 4. Real-Time Request Logging
		log.Printf("[API] %s %s | %v | IP: %s", r.Method, r.URL.Path, time.Since(start), r.RemoteAddr)
	})
}
