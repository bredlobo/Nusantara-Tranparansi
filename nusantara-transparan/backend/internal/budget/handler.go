package budget

import (
	"encoding/json"
	"net/http"

	"gorm.io/gorm"
	"nusantara-transparan/backend/internal/database"
)

type MonthlyRow struct {
	M       string  `json:"m"`
	Revenue float64 `json:"revenue"`
	Spend   float64 `json:"spend"`
	Budget  float64 `json:"budget"`
}

type MinistryRow struct {
	Name   string  `json:"name"`
	Budget float64 `json:"budget"`
	Real   float64 `json:"real"`
}

type DashboardResponse struct {
	Monthly    []MonthlyRow  `json:"monthly"`
	Ministries []MinistryRow `json:"ministries"`
}

type BudgetRowResponse struct {
	Group  string  `json:"group"`
	Name   string  `json:"name"`
	Target float64 `json:"target"`
	Real   float64 `json:"real"`
}

// GetDashboard menyajikan ringkasan statistik bulanan dan kementerian murni dari PostgreSQL
func GetDashboard(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		months := []string{"Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"}
		monthly := make([]MonthlyRow, len(months))

		// Hitung total dari database PostgreSQL (hanya data yang sudah 'published' & 'public')
		var revBudgets []database.Budget
		db.Where("type = ? AND validation_status = ? AND classification = ?", database.TypeRevenue, "published", "public").Find(&revBudgets)
		var totalRevReal float64
		for _, b := range revBudgets {
			var real database.Realization
			if err := db.Where("budget_id = ?", b.ID).First(&real).Error; err == nil {
				totalRevReal += real.Amount
			}
		}

		var expBudgets []database.Budget
		db.Where("type = ? AND validation_status = ? AND classification = ?", database.TypeExpenditure, "published", "public").Order("amount DESC").Find(&expBudgets)
		var totalExpBudget, totalExpReal float64
		ministries := make([]MinistryRow, 0)

		for _, b := range expBudgets {
			var real database.Realization
			realVal := 0.0
			if err := db.Where("budget_id = ?", b.ID).First(&real).Error; err == nil {
				realVal = real.Amount
			}

			if b.Category == "Jenis Belanja" {
				totalExpBudget += b.Amount
				totalExpReal += realVal
			} else if b.Category == "Fungsi" {
				ministries = append(ministries, MinistryRow{
					Name:   b.Name,
					Budget: b.Amount,
					Real:   realVal,
				})
			}
		}

		// Distribusikan nilai per bulan hanya jika ada data di database (jika DB kosong = 0 semua)
		for i, m := range months {
			if totalExpBudget == 0 && totalRevReal == 0 {
				monthly[i] = MonthlyRow{M: m, Revenue: 0, Spend: 0, Budget: 0}
			} else {
				monthly[i] = MonthlyRow{
					M:       m,
					Revenue: totalRevReal / 12.0,
					Spend:   totalExpReal / 12.0,
					Budget:  totalExpBudget / 12.0,
				}
			}
		}

		writeJSON(w, http.StatusOK, DashboardResponse{
			Monthly:    monthly,
			Ministries: ministries,
		})
	}
}

// GetRevenue mengambil daftar anggaran & realisasi penerimaan negara murni dari PostgreSQL
func GetRevenue(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var budgets []database.Budget
		if err := db.Where("type = ? AND validation_status = ? AND classification = ?", database.TypeRevenue, "published", "public").
			Order("id ASC").
			Find(&budgets).Error; err != nil {
			http.Error(w, "Gagal membaca data penerimaan", http.StatusInternalServerError)
			return
		}

		rows := make([]BudgetRowResponse, 0, len(budgets))
		for _, b := range budgets {
			var real database.Realization
			realAmount := 0.0
			if err := db.Where("budget_id = ?", b.ID).First(&real).Error; err == nil {
				realAmount = real.Amount
			}

			rows = append(rows, BudgetRowResponse{
				Group:  "Penerimaan",
				Name:   b.Name,
				Target: b.Amount,
				Real:   realAmount,
			})
		}

		writeJSON(w, http.StatusOK, rows)
	}
}

// GetExpenditure mengambil daftar anggaran & realisasi belanja negara murni dari PostgreSQL
func GetExpenditure(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var budgets []database.Budget
		if err := db.Where("type = ? AND validation_status = ? AND classification = ?", database.TypeExpenditure, "published", "public").
			Order("id ASC").
			Find(&budgets).Error; err != nil {
			http.Error(w, "Gagal membaca data belanja", http.StatusInternalServerError)
			return
		}

		rows := make([]BudgetRowResponse, 0, len(budgets))
		for _, b := range budgets {
			var real database.Realization
			realAmount := 0.0
			if err := db.Where("budget_id = ?", b.ID).First(&real).Error; err == nil {
				realAmount = real.Amount
			}

			rows = append(rows, BudgetRowResponse{
				Group:  b.Category,
				Name:   b.Name,
				Target: b.Amount,
				Real:   realAmount,
			})
		}

		writeJSON(w, http.StatusOK, rows)
	}
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
