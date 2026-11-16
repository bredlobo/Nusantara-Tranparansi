package project

import (
	"encoding/json"
	"math"
	"net/http"

	"gorm.io/gorm"
	"nusantara-transparan/backend/internal/database"
)

type ProjectResponse struct {
	ID       string                 `json:"id"`
	Name     string                 `json:"name"`
	Agency   string                 `json:"agency"`
	Region   string                 `json:"region"`
	Category string                 `json:"category"`
	Budget   float64                `json:"budget"`
	Spent    float64                `json:"spent"`
	Progress float64                `json:"progress"`
	Status   database.ProjectStatus `json:"status"`
	Period   string                 `json:"period"`
	Source   string                 `json:"source"`
}

// GetProjects mengambil seluruh daftar proyek pemerintah dari PostgreSQL (hanya klasifikasi publik)
func GetProjects(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var projects []database.Project
		if err := db.Where("validation_status = ? AND classification = ?", "published", "public").
			Order("id ASC").
			Find(&projects).Error; err != nil {
			http.Error(w, "Gagal membaca data proyek", http.StatusInternalServerError)
			return
		}

		res := make([]ProjectResponse, 0, len(projects))
		for _, p := range projects {
			res = append(res, ProjectResponse{
				ID:       p.ID,
				Name:     p.Name,
				Agency:   p.Agency,
				Region:   p.Region,
				Category: p.Category,
				Budget:   math.Round(p.Budget),
				Spent:    math.Round(p.Spent),
				Progress: math.Round(p.Progress),
				Status:   p.Status,
				Period:   p.Period,
				Source:   p.Source,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(res)
	}
}
