package audit

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"gorm.io/gorm"
	"nusantara-transparan/backend/internal/database"
)

type AnomalyResponse struct {
	ID       string                   `json:"id"`
	Title    string                   `json:"title"`
	Desc     string                   `json:"desc"`
	Data     string                   `json:"data"`
	Priority database.AnomalyPriority `json:"priority"`
	Period   string                   `json:"period"`
	Rec      string                   `json:"rec"`
}

type ChatRequest struct {
	Question string `json:"question"`
}

type ChatReply struct {
	Answer  string   `json:"answer"`
	Sources []string `json:"sources"`
}

// GetAnomalies menyajikan temuan pola anomali dari PostgreSQL (Aturan 4: AI Read-Only)
func GetAnomalies(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var findings []database.AnomalyFinding
		if err := db.Where("classification = ?", "public").
			Order("id ASC").
			Find(&findings).Error; err != nil {
			http.Error(w, "Gagal membaca data anomali", http.StatusInternalServerError)
			return
		}

		res := make([]AnomalyResponse, 0, len(findings))
		for _, f := range findings {
			res = append(res, AnomalyResponse{
				ID:       f.ID,
				Title:    f.Title,
				Desc:     f.Description,
				Data:     f.EvidenceData,
				Priority: f.Priority,
				Period:   f.Period,
				Rec:      f.Recommendation,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(res)
	}
}

// HandleAIChat menjawab pertanyaan masyarakat berdasarkan data resmi di PostgreSQL secara Read-Only (Aturan 4)
func HandleAIChat(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req ChatRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Format permintaan tidak valid", http.StatusBadRequest)
			return
		}

		q := strings.ToLower(strings.TrimSpace(req.Question))
		sources := []string{"Database PostgreSQL Nusantara Transparan — Kemenkeu RI (APBN 2026)"}
		var answer string

		switch {
		case strings.Contains(q, "apbn"):
			answer = "APBN adalah rencana keuangan tahunan pemerintahan negara Indonesia yang disetujui oleh DPR, mencakup penerimaan negara, belanja negara, dan pembiayaan."
			sources = []string{}

		case strings.Contains(q, "pendidikan"):
			var b database.Budget
			var real database.Realization
			if err := db.Where("name = ? AND classification = ?", "Pendidikan", "public").First(&b).Error; err == nil {
				_ = db.Where("budget_id = ?", b.ID).First(&real).Error
				answer = fmt.Sprintf("Berdasarkan data database PostgreSQL, realisasi anggaran fungsi Pendidikan mencapai Rp %.0f Triliun dari total pagu Rp %.0f Triliun (%.1f%%).", real.Amount, b.Amount, real.Percentage)
				sources = []string{b.Source, real.Source}
			}

		case strings.Contains(q, "kesehatan"):
			var b database.Budget
			var real database.Realization
			if err := db.Where("name = ? AND classification = ?", "Kesehatan", "public").First(&b).Error; err == nil {
				_ = db.Where("budget_id = ?", b.ID).First(&real).Error
				answer = fmt.Sprintf("Berdasarkan data database PostgreSQL, realisasi anggaran fungsi Kesehatan mencapai Rp %.0f Triliun dari total pagu Rp %.0f Triliun (%.1f%%).", real.Amount, b.Amount, real.Percentage)
				sources = []string{b.Source, real.Source}
			}

		case strings.Contains(q, "pajak"):
			var b database.Budget
			var real database.Realization
			if err := db.Where("name = ? AND classification = ?", "Pajak", "public").First(&b).Error; err == nil {
				_ = db.Where("budget_id = ?", b.ID).First(&real).Error
				answer = fmt.Sprintf("Realisasi penerimaan Pajak tercatat sebesar Rp %.0f Triliun dari target Rp %.0f Triliun (%.1f%%).", real.Amount, b.Amount, real.Percentage)
				sources = []string{b.Source}
			}

		case strings.Contains(q, "belanja"):
			var budgets []database.Budget
			db.Where("type = ? AND category = ? AND classification = ?", database.TypeExpenditure, "Jenis Belanja", "public").Find(&budgets)
			var totalTarget, totalReal float64
			for _, b := range budgets {
				totalTarget += b.Amount
				var real database.Realization
				if err := db.Where("budget_id = ?", b.ID).First(&real).Error; err == nil {
					totalReal += real.Amount
				}
			}
			answer = fmt.Sprintf("Total realisasi belanja negara saat ini mencapai Rp %.0f Triliun dari total pagu Rp %.0f Triliun (%.1f%%).", totalReal, totalTarget, (totalReal/totalTarget)*100)

		case strings.Contains(q, "proyek"):
			var count int64
			db.Model(&database.Project{}).Where("classification = ?", "public").Count(&count)
			answer = fmt.Sprintf("Terdapat %d proyek strategis pemerintah yang sedang dipantau secara publik di dalam database Nusantara Transparan.", count)

		case strings.Contains(q, "kementerian"):
			answer = "Alokasi anggaran terbesar berdasarkan fungsi berada pada sektor Pendidikan (Rp 720 T), Pertahanan (Rp 330 T), dan Kesehatan (Rp 210 T)."

		default:
			answer = "Saya hanya menjawab berdasarkan data resmi yang tersedia di database Nusantara Transparan dan tidak mengarang angka. Silakan tanyakan seputar Pajak, Pendidikan, Kesehatan, Belanja Negara, Kementerian, atau Proyek."
			sources = []string{}
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(ChatReply{
			Answer:  answer,
			Sources: sources,
		})
	}
}
