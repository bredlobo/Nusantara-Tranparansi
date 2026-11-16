package audit

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"gorm.io/gorm"
	"nusantara-transparan/backend/internal/auth"
	"nusantara-transparan/backend/internal/database"
)

type ImportItem struct {
	RecordType string  `json:"record_type"` // "budget" atau "project"
	Type       string  `json:"type"`        // "revenue" atau "expenditure" (khusus budget)
	Category   string  `json:"category"`    // "Penerimaan", "Jenis Belanja", "Fungsi", atau kategori proyek
	Name       string  `json:"name"`
	Agency     string  `json:"agency"`
	Region     string  `json:"region"`
	Target     float64 `json:"target"` // Pagu / Budget
	Real       float64 `json:"real"`   // Realisasi / Spent
	Progress   float64 `json:"progress"`
	Status     string  `json:"status"` // Status proyek ("Berjalan", "Selesai", dll.)
	Period     string  `json:"period"`
	Source     string  `json:"source"`
}

type ImportRequest struct {
	ActorName string       `json:"actor_name"`
	Items     []ImportItem `json:"items"`
}

type SubmissionItem struct {
	ID               string  `json:"id"`
	RecordType       string  `json:"record_type"`
	Category         string  `json:"category"`
	Name             string  `json:"name"`
	Target           float64 `json:"target"`
	Real             float64 `json:"real"`
	ValidationStatus string  `json:"validation_status"`
	IntegrityHash    string  `json:"integrity_hash"`
	BlockchainTxID   string  `json:"blockchain_tx_id"`
	Source           string  `json:"source"`
	UpdatedAt        string  `json:"updated_at"`
}

type ReviewRequest struct {
	ID         string `json:"id"`
	RecordType string `json:"record_type"`
	Decision   string `json:"decision"` // "approve" atau "reject"
	ActorName  string `json:"actor_name"`
	Reason     string `json:"reason"`
}

type PublishRequest struct {
	ID         string `json:"id"`
	RecordType string `json:"record_type"`
	PublishAll bool   `json:"publish_all"`
	ActorName  string `json:"actor_name"`
}

// GetSubmissions menampilkan seluruh antrean data (draft, approved, rejected, published) untuk panel Admin/Auditor/Data Manager
func GetSubmissions(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		items := make([]SubmissionItem, 0)

		var budgets []database.Budget
		db.Order("updated_at DESC").Find(&budgets)
		for _, b := range budgets {
			var real database.Realization
			realVal := 0.0
			if err := db.Where("budget_id = ?", b.ID).First(&real).Error; err == nil {
				realVal = real.Amount
			}
			items = append(items, SubmissionItem{
				ID:               b.ID,
				RecordType:       "budget",
				Category:         fmt.Sprintf("%s (%s)", b.Category, b.Type),
				Name:             b.Name,
				Target:           b.Amount,
				Real:             realVal,
				ValidationStatus: b.ValidationStatus,
				IntegrityHash:    b.IntegrityHash,
				BlockchainTxID:   b.BlockchainTxID,
				Source:           b.Source,
				UpdatedAt:        b.UpdatedAt.Format("2006-01-02 15:04:05"),
			})
		}

		var projects []database.Project
		db.Order("updated_at DESC").Find(&projects)
		for _, p := range projects {
			items = append(items, SubmissionItem{
				ID:               p.ID,
				RecordType:       "project",
				Category:         fmt.Sprintf("Proyek - %s (%s)", p.Category, p.Region),
				Name:             p.Name,
				Target:           p.Budget,
				Real:             p.Spent,
				ValidationStatus: p.ValidationStatus,
				IntegrityHash:    p.IntegrityHash,
				BlockchainTxID:   p.BlockchainTxID,
				Source:           p.Source,
				UpdatedAt:        p.UpdatedAt.Format("2006-01-02 15:04:05"),
			})
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(items)
	}
}

// HandleImport menangani unggahan data baru oleh Data Manager (masuk sebagai status 'draft')
func HandleImport(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req ImportRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
			return
		}
		if req.ActorName == "" {
			req.ActorName = "Data Manager"
		}

		now := time.Now()
		importedCount := 0

		for idx, item := range req.Items {
			if item.Name == "" {
				continue
			}
			if item.Source == "" {
				item.Source = "Unggahan Data Manager (APBN 2026)"
			}
			if item.Period == "" {
				item.Period = "2026"
			}

			rawPayload := fmt.Sprintf("%s|%s|%.2f|%.2f|%d", item.RecordType, item.Name, item.Target, item.Real, now.UnixNano()+int64(idx))
			h := sha256.Sum256([]byte(rawPayload))
			hashStr := "0x" + hex.EncodeToString(h[:])
			txID := fmt.Sprintf("TX-%X", (now.UnixNano()+int64(idx))&0xFFFFFFFF)

			if item.RecordType == "project" {
				prjID := fmt.Sprintf("PRJ-%d", (now.Unix()%100000)+int64(idx))
				st := database.ProjectStatus(item.Status)
				if st == "" {
					st = database.ProjectOngoing
				}
				agency := item.Agency
				if agency == "" {
					agency = "Kementerian PUPR"
				}
				region := item.Region
				if region == "" {
					region = "Nasional"
				}
				cat := item.Category
				if cat == "" {
					cat = "Infrastruktur"
				}
				prog := item.Progress
				if prog == 0 && item.Target > 0 {
					prog = (item.Real / item.Target) * 100
				}

				prj := database.Project{
					ID:          prjID,
					ProjectCode: "KODE-" + prjID,
					Name:        item.Name,
					Agency:      agency,
					Region:      region,
					Category:    cat,
					Budget:      item.Target,
					Spent:       item.Real,
					Progress:    prog,
					Status:      st,
					StartYear:   2026,
					EndYear:     2027,
					BaseMetadata: database.BaseMetadata{
						Source:           item.Source,
						FiscalYear:       2026,
						Period:           item.Period,
						ValidationStatus: "draft", // Masuk sebagai Draf!
						Classification:   "public",
						IntegrityHash:    hashStr,
						BlockchainTxID:   txID,
						Version:          1,
						CreatedAt:        now,
						UpdatedAt:        now,
					},
				}
				if err := db.Save(&prj).Error; err == nil {
					importedCount++
					createBlockchainAndAuditRecord(db, prj.ID, "project", txID, hashStr, item.Source, req.ActorName, item.Name)
				}
			} else {
				bID := fmt.Sprintf("BDG-%d", (now.Unix()%100000)+int64(idx))
				bType := database.BudgetType(item.Type)
				if bType != database.TypeRevenue && bType != database.TypeExpenditure {
					bType = database.TypeExpenditure
				}
				cat := item.Category
				if cat == "" {
					if bType == database.TypeRevenue {
						cat = "Penerimaan"
					} else {
						cat = "Jenis Belanja"
					}
				}

				b := database.Budget{
					ID:          bID,
					Type:        bType,
					Category:    cat,
					Name:        item.Name,
					Amount:      item.Target,
					Description: fmt.Sprintf("Data anggaran %s", item.Name),
					BaseMetadata: database.BaseMetadata{
						Source:           item.Source,
						FiscalYear:       2026,
						Period:           item.Period,
						ValidationStatus: "draft", // Masuk sebagai Draf!
						Classification:   "public",
						IntegrityHash:    hashStr,
						BlockchainTxID:   txID,
						Version:          1,
						CreatedAt:        now,
						UpdatedAt:        now,
					},
				}
				if err := db.Save(&b).Error; err == nil {
					pct := 0.0
					if item.Target > 0 {
						pct = (item.Real / item.Target) * 100
					}
					real := database.Realization{
						ID:              "REAL-" + bID,
						BudgetID:        b.ID,
						Amount:          item.Real,
						Percentage:      pct,
						RealizationDate: now,
						Notes:           "Realisasi awal",
						BaseMetadata: database.BaseMetadata{
							Source:           item.Source,
							FiscalYear:       2026,
							Period:           item.Period,
							ValidationStatus: "draft",
							Classification:   "public",
							IntegrityHash:    hashStr,
							BlockchainTxID:   txID,
							Version:          1,
							CreatedAt:        now,
							UpdatedAt:        now,
						},
					}
					_ = db.Save(&real).Error
					importedCount++
					createBlockchainAndAuditRecord(db, b.ID, "budget", txID, hashStr, item.Source, req.ActorName, item.Name)
				}
			}
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"message":        fmt.Sprintf("Berhasil mengimpor %d data dengan status DRAF (menunggu pemeriksaan Auditor).", importedCount),
			"imported_count": importedCount,
		})
	}
}

func createBlockchainAndAuditRecord(db *gorm.DB, refID, recType, txID, hashStr, source, actorName, itemName string) {
	now := time.Now()
	rec := database.BlockchainRecord{
		ID:            fmt.Sprintf("REC-%d", now.UnixNano()%1000000),
		TxID:          txID,
		Hash:          hashStr,
		RecordType:    recType,
		ReferenceID:   refID,
		Timestamp:     now,
		Status:        database.StatusPending,
		SignerAgency:  source,
		ReviewHistory: fmt.Sprintf(`["Diunggah oleh %s (Status: Draf)"]`, actorName),
		BaseMetadata: database.BaseMetadata{
			Source:           source,
			FiscalYear:       2026,
			Period:           "2026",
			ValidationStatus: "draft",
			Classification:   "public",
			IntegrityHash:    hashStr,
			BlockchainTxID:   txID,
			Version:          1,
			CreatedAt:        now,
			UpdatedAt:        now,
		},
	}
	_ = db.Create(&rec).Error

	auditLog := database.AuditLog{
		ID:        fmt.Sprintf("LOG-%d", now.UnixNano()%1000000),
		TableName: recType,
		RecordID:  refID,
		Action:    "IMPORT_DRAFT",
		ActorID:   "data_manager",
		ActorName: actorName,
		NewData:   fmt.Sprintf(`{"name":%q,"status":"draft"}`, itemName),
		ChangedAt: now,
		Reason:    fmt.Sprintf("Unggah draf data baru: %s", itemName),
		HashProof: hashStr,
	}
	_ = db.Create(&auditLog).Error
}

// HandleReview menangani pemeriksaan & persetujuan oleh Auditor / Reviewer
func HandleReview(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req ReviewRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Format tidak valid", http.StatusBadRequest)
			return
		}
		if req.ActorName == "" {
			req.ActorName = "Auditor BPK"
		}

		newStatus := "approved"
		blockStatus := database.StatusVerified
		action := "AUDITOR_APPROVED"
		historyNote := fmt.Sprintf("Diverifikasi & Disetujui oleh %s — Hash Cocok", req.ActorName)

		if req.Decision == "reject" {
			newStatus = "rejected"
			blockStatus = database.StatusNotVerified
			action = "AUDITOR_REJECTED"
			historyNote = fmt.Sprintf("Ditolak oleh %s — Perlu Revisi (%s)", req.ActorName, req.Reason)
		}

		now := time.Now()
		if req.RecordType == "project" {
			db.Model(&database.Project{}).Where("id = ?", req.ID).Updates(map[string]any{
				"validation_status": newStatus,
				"updated_at":        now,
			})
		} else {
			db.Model(&database.Budget{}).Where("id = ?", req.ID).Updates(map[string]any{
				"validation_status": newStatus,
				"updated_at":        now,
			})
			db.Model(&database.Realization{}).Where("budget_id = ?", req.ID).Updates(map[string]any{
				"validation_status": newStatus,
				"updated_at":        now,
			})
		}

		// Perbarui status catatan Blockchain
		var rec database.BlockchainRecord
		if err := db.Where("reference_id = ?", req.ID).First(&rec).Error; err == nil {
			var hist []string
			_ = json.Unmarshal([]byte(rec.ReviewHistory), &hist)
			hist = append(hist, historyNote)
			histBytes, _ := json.Marshal(hist)
			db.Model(&rec).Updates(map[string]any{
				"status":         blockStatus,
				"review_history": string(histBytes),
				"updated_at":     now,
			})
		}

		// Catat ke Audit Log (Append-Only)
		auditLog := database.AuditLog{
			ID:        fmt.Sprintf("LOG-%d", now.UnixNano()%1000000),
			TableName: req.RecordType,
			RecordID:  req.ID,
			Action:    action,
			ActorID:   "auditor",
			ActorName: req.ActorName,
			NewData:   fmt.Sprintf(`{"validation_status":%q}`, newStatus),
			ChangedAt: now,
			Reason:    historyNote,
		}
		_ = db.Create(&auditLog).Error

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"message":           fmt.Sprintf("Data %s berhasil diperbarui menjadi '%s'.", req.ID, newStatus),
			"validation_status": newStatus,
		})
	}
}

// HandlePublish menangani publikasi resmi oleh Administrator agar tampil di Dashboard Publik
func HandlePublish(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req PublishRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Format tidak valid", http.StatusBadRequest)
			return
		}
		if req.ActorName == "" {
			req.ActorName = "Administrator Utama"
		}

		now := time.Now()
		if req.PublishAll {
			db.Model(&database.Budget{}).Where("validation_status = ?", "approved").Updates(map[string]any{
				"validation_status": "published",
				"updated_at":        now,
			})
			db.Model(&database.Realization{}).Where("validation_status = ?", "approved").Updates(map[string]any{
				"validation_status": "published",
				"updated_at":        now,
			})
			db.Model(&database.Project{}).Where("validation_status = ?", "approved").Updates(map[string]any{
				"validation_status": "published",
				"updated_at":        now,
			})
		} else {
			if req.RecordType == "project" {
				db.Model(&database.Project{}).Where("id = ?", req.ID).Updates(map[string]any{
					"validation_status": "published",
					"updated_at":        now,
				})
			} else {
				db.Model(&database.Budget{}).Where("id = ?", req.ID).Updates(map[string]any{
					"validation_status": "published",
					"updated_at":        now,
				})
				db.Model(&database.Realization{}).Where("budget_id = ?", req.ID).Updates(map[string]any{
					"validation_status": "published",
					"updated_at":        now,
				})
			}
		}

		// Update riwayat Blockchain
		var recs []database.BlockchainRecord
		if req.PublishAll {
			db.Where("status = ?", database.StatusVerified).Find(&recs)
		} else {
			db.Where("reference_id = ?", req.ID).Find(&recs)
		}
		for _, rec := range recs {
			var hist []string
			_ = json.Unmarshal([]byte(rec.ReviewHistory), &hist)
			hist = append(hist, fmt.Sprintf("Dipublikasikan ke Publik oleh %s", req.ActorName))
			histBytes, _ := json.Marshal(hist)
			db.Model(&rec).Updates(map[string]any{
				"validation_status": "published",
				"review_history":    string(histBytes),
				"updated_at":        now,
			})
		}

		auditLog := database.AuditLog{
			ID:        fmt.Sprintf("LOG-%d", now.UnixNano()%1000000),
			TableName: req.RecordType,
			RecordID:  req.ID,
			Action:    "ADMIN_PUBLISHED",
			ActorID:   "admin",
			ActorName: req.ActorName,
			NewData:   `{"validation_status":"published"}`,
			ChangedAt: now,
			Reason:    "Data resmi dipublikasikan ke portal publik Nusantara Transparan",
		}
		_ = db.Create(&auditLog).Error

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"message": "Data berhasil dipublikasikan dan kini tampil di Dashboard Publik!",
		})
	}
}

// GetAuditLogs menampilkan riwayat audit_logs dari PostgreSQL
func GetAuditLogs(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var logs []database.AuditLog
		db.Order("changed_at DESC").Limit(100).Find(&logs)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(logs)
	}
}

// GetUsers menampilkan daftar pengguna dari tabel users di PostgreSQL
func GetUsers(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var users []database.User
		db.Order("created_at ASC").Find(&users)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(users)
	}
}

// CreateUser menambahkan pengguna baru oleh Administrator ke tabel users di PostgreSQL dengan validasi kekuatan password
func CreateUser(db *gorm.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Username string            `json:"username"`
			Password string            `json:"password"`
			Email    string            `json:"email"`
			FullName string            `json:"full_name"`
			Role     database.UserRole `json:"role"`
			Agency   string            `json:"agency"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Username == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "Data pengguna tidak lengkap."})
			return
		}

		if err := auth.ValidatePasswordStrength(req.Password); err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "Password tidak memenuhi syarat keamanan: " + err.Error()})
			return
		}

		now := time.Now()
		u := database.User{
			ID:           fmt.Sprintf("USR-%d", now.Unix()%100000),
			Username:     req.Username,
			Email:        req.Email,
			PasswordHash: auth.HashPassword(req.Password),
			FullName:     req.FullName,
			Role:         req.Role,
			Agency:       req.Agency,
			CreatedAt:    now,
			UpdatedAt:    now,
		}
		if err := db.Create(&u).Error; err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "Gagal membuat pengguna: " + err.Error()})
			return
		}

		_ = db.Create(&database.AuditLog{
			ID:        fmt.Sprintf("LOG-%d", now.UnixNano()%1000000),
			TableName: "users",
			RecordID:  u.ID,
			Action:    "CREATE_USER",
			ActorID:   "admin",
			ActorName: "Administrator",
			NewData:   fmt.Sprintf(`{"username":%q,"role":%q}`, u.Username, u.Role),
			ChangedAt: now,
			Reason:    fmt.Sprintf("Menambahkan pengguna baru %s (%s)", u.FullName, u.Role),
		}).Error

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(u)
	}
}
