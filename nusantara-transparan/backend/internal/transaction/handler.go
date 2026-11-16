package transaction

import (
	"encoding/json"
	"net/http"

	"gorm.io/gorm"
	"nusantara-transparan/backend/internal/database"
)

// GetTransactions menyajikan daftar transaksi per kejadian (SP2D) dari PostgreSQL
func GetTransactions(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var txs []database.Transaction
		if err := db.Where("classification = ?", "public").
			Order("transaction_date DESC").
			Find(&txs).Error; err != nil {
			http.Error(w, "Gagal membaca data transaksi", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(txs)
	}
}
