package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"nusantara-transparan/backend/internal/audit"
	"nusantara-transparan/backend/internal/auth"
	"nusantara-transparan/backend/internal/blockchain"
	"nusantara-transparan/backend/internal/budget"
	"nusantara-transparan/backend/internal/database"
	"nusantara-transparan/backend/internal/project"
	"nusantara-transparan/backend/internal/transaction"
)

func main() {
	log.Println("==================================================")
	log.Println("   NUSANTARA TRANSPARAN — CORE REST API SERVER    ")
	log.Println("==================================================")

	// 1. Inisialisasi Koneksi Database PostgreSQL (GORM)
	db, err := database.InitDB()
	if err != nil {
		log.Fatalf("❌ Gagal terhubung ke database: %v", err)
	}

	// 2. Pastikan Skema Tabel dan Data Awal Siap
	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("❌ Gagal AutoMigrate database: %v", err)
	}
	if err := database.SeedInitialData(db); err != nil {
		log.Printf("⚠️ Peringatan saat seeding: %v", err)
	}

	// 3. Setup HTTP Router (Go 1.22+ ServeMux)
	mux := http.NewServeMux()

	// Healthcheck Endpoint
	mux.HandleFunc("GET /api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"status":    "healthy",
			"service":   "nusantara-transparan-api",
			"database":  "connected (PostgreSQL)",
			"timestamp": time.Now().Format(time.RFC3339),
		})
	})

	// Core Financial & Public Transparency Endpoints (Aturan 1 & 2: Backend Sumber Utama Data)
	mux.HandleFunc("GET /api/v1/dashboard", budget.GetDashboard(db))
	mux.HandleFunc("GET /api/v1/revenue", budget.GetRevenue(db))
	mux.HandleFunc("GET /api/v1/expenditure", budget.GetExpenditure(db))
	mux.HandleFunc("GET /api/v1/projects", project.GetProjects(db))
	mux.HandleFunc("GET /api/v1/transactions", transaction.GetTransactions(db))
	mux.HandleFunc("GET /api/v1/blockchain/records", blockchain.GetRecords(db))
	mux.HandleFunc("GET /api/v1/blockchain/verify", blockchain.VerifyHashChain(db))
	mux.HandleFunc("GET /api/v1/ai/anomalies", audit.GetAnomalies(db))
	mux.HandleFunc("POST /api/v1/ai/chat", audit.HandleAIChat(db))
	mux.HandleFunc("GET /api/v1/security/status", audit.GetSecurityComplianceStatus(db))

	// 4. Bungkus dengan Middleware Keamanan, CORS, dan Real-time Logging
	handler := auth.SecurityAndCORSMiddleware(mux)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("🚀 Server REST API berjalan di http://localhost:%s/api/v1", port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("❌ Server berhenti: %v", err)
	}
}
