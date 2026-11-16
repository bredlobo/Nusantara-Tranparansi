package blockchain

import (
	"encoding/json"
	"net/http"

	"gorm.io/gorm"
	"nusantara-transparan/backend/internal/database"
)

type BlockRecResponse struct {
	ID      string                      `json:"id"`
	Tx      string                      `json:"tx"`
	Hash    string                      `json:"hash"`
	Ts      string                      `json:"ts"`
	Status  database.VerificationStatus `json:"status"`
	Source  string                      `json:"source"`
	History []string                    `json:"history"`
}

// GetRecords menyajikan catatan verifikasi integritas hash blockchain dari PostgreSQL
func GetRecords(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var records []database.BlockchainRecord
		if err := db.Where("classification = ?", "public").
			Order("id ASC").
			Find(&records).Error; err != nil {
			http.Error(w, "Gagal membaca catatan blockchain", http.StatusInternalServerError)
			return
		}

		res := make([]BlockRecResponse, 0, len(records))
		for _, rec := range records {
			var history []string
			if err := json.Unmarshal([]byte(rec.ReviewHistory), &history); err != nil || len(history) == 0 {
				history = []string{"Dibuat oleh Data Manager", "Diverifikasi Node Hyperledger"}
			}

			res = append(res, BlockRecResponse{
				ID:      rec.ID,
				Tx:      rec.TxID,
				Hash:    rec.Hash,
				Ts:      rec.Timestamp.Format("2006-01-02 15:04:05"),
				Status:  rec.Status,
				Source:  rec.SignerAgency,
				History: history,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(res)
	}
}
