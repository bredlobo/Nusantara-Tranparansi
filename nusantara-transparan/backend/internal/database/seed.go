package database

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"
)

// CleanAllData mengosongkan seluruh isi tabel di PostgreSQL agar database murni bersih (0 baris)
func CleanAllData(db *gorm.DB) error {
	log.Println("🧹 Mengosongkan seluruh data tabel di PostgreSQL...")
	tables := []string{
		"realizations",
		"transactions",
		"budgets",
		"ministries",
		"projects",
		"blockchain_records",
		"anomaly_findings",
		"audit_logs",
		"users",
	}
	for _, t := range tables {
		if err := db.Exec(fmt.Sprintf("TRUNCATE TABLE %s RESTART IDENTITY CASCADE", t)).Error; err != nil {
			return fmt.Errorf("gagal mengosongkan tabel %s: %w", t, err)
		}
	}
	log.Println("✅ Seluruh tabel di PostgreSQL sekarang 100% bersih dan kosong (0 baris)!")
	return nil
}

// SeedInitialData mengisi dataset awal (APBN demo) yang sinkron dengan frontend
func SeedInitialData(db *gorm.DB) error {
	log.Println("🌱 Memeriksa dan mengisi seed data awal...")

	// 1. Seed Users
	var userCount int64
	db.Model(&User{}).Count(&userCount)
	if userCount == 0 {
		users := []User{
			{
				ID:           "USR-001",
				Username:     "admin",
				Email:        "admin@transparan.go.id",
				PasswordHash: "$2a$10$demoHashedPasswordMockForAdmin123456",
				FullName:     "Administrator Sistem",
				Role:         RoleAdmin,
				Agency:       "Kementerian Keuangan",
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			},
			{
				ID:           "USR-002",
				Username:     "auditor",
				Email:        "auditor@bpk.go.id",
				PasswordHash: "$2a$10$demoHashedPasswordMockForAuditor123",
				FullName:     "Auditor Utama BPK",
				Role:         RoleAuditor,
				Agency:       "Badan Pemeriksa Keuangan",
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			},
			{
				ID:           "USR-003",
				Username:     "datamanager",
				Email:        "data@kemenkeu.go.id",
				PasswordHash: "$2a$10$demoHashedPasswordMockForManager12",
				FullName:     "Operator Data Kemenkeu",
				Role:         RoleDataManager,
				Agency:       "Kementerian Keuangan",
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			},
		}
		if err := db.Create(&users).Error; err != nil {
			return fmt.Errorf("gagal seed users: %w", err)
		}
		log.Println("  ✅ Seed Users berhasil.")
	}

	// 2. Seed Ministries
	var minCount int64
	db.Model(&Ministry{}).Count(&minCount)
	if minCount == 0 {
		mins := []struct {
			id, code, name, sector string
		}{
			{"MIN-01", "KEMENDIKDASMEN", "Kementerian Pendidikan Dasar dan Menengah", "Pendidikan"},
			{"MIN-02", "KEMENHAN", "Kementerian Pertahanan", "Pertahanan"},
			{"MIN-03", "KEMENKES", "Kementerian Kesehatan", "Kesehatan"},
			{"MIN-04", "KEMENPUPR", "Kementerian Pekerjaan Umum dan Perumahan Rakyat", "Infrastruktur"},
			{"MIN-05", "KEMENSOS", "Kementerian Sosial", "Sosial"},
		}
		for _, m := range mins {
			min := Ministry{
				ID:     m.id,
				Code:   m.code,
				Name:   m.name,
				Sector: m.sector,
				BaseMetadata: BaseMetadata{
					Source:           "Kemenkeu RI (APBN 2026)",
					FiscalYear:       2026,
					Period:           "2026",
					ValidationStatus: "published",
					Classification:   "public",
					IntegrityHash:    calculateHash(m.code + m.name),
					Version:          1,
					CreatedAt:        time.Now(),
					UpdatedAt:        time.Now(),
				},
			}
			if err := db.Create(&min).Error; err != nil {
				return fmt.Errorf("gagal seed ministry %s: %w", m.name, err)
			}
		}
		log.Println("  ✅ Seed Ministries berhasil.")
	}

	// 3. Seed Budgets & Realizations (Revenue & Expenditure)
	var budgetCount int64
	db.Model(&Budget{}).Count(&budgetCount)
	if budgetCount == 0 {
		type BudgetSeed struct {
			id, name, cat string
			bType         BudgetType
			target, real  float64
			minID         *string
		}

		minEdu := "MIN-01"
		minHealth := "MIN-03"
		minSocial := "MIN-05"

		seeds := []BudgetSeed{
			// Revenue
			{"B-REV-01", "Pajak", "Penerimaan Perpajakan", TypeRevenue, 2000.0, 1480.0, nil},
			{"B-REV-02", "Bea dan Cukai", "Kepabeanan & Cukai", TypeRevenue, 300.0, 231.0, nil},
			{"B-REV-03", "PNBP", "Penerimaan Negara Bukan Pajak", TypeRevenue, 480.0, 402.0, nil},
			{"B-REV-04", "Hibah", "Penerimaan Hibah", TypeRevenue, 5.0, 3.0, nil},

			// Expenditure
			{"B-EXP-01", "Belanja Pemerintah Pusat", "Jenis Belanja", TypeExpenditure, 3100.0, 2210.0, nil},
			{"B-EXP-02", "Belanja Kementerian/Lembaga", "Jenis Belanja", TypeExpenditure, 1250.0, 905.0, nil},
			{"B-EXP-03", "Transfer ke Daerah", "Jenis Belanja", TypeExpenditure, 880.0, 702.0, nil},
			{"B-EXP-04", "Pendidikan", "Fungsi", TypeExpenditure, 720.0, 510.0, &minEdu},
			{"B-EXP-05", "Kesehatan", "Fungsi", TypeExpenditure, 210.0, 148.0, &minHealth},
			{"B-EXP-06", "Perlindungan Sosial", "Fungsi", TypeExpenditure, 90.0, 71.0, &minSocial},
		}

		for _, s := range seeds {
			b := Budget{
				ID:          s.id,
				MinistryID:  s.minID,
				Type:        s.bType,
				Category:    s.cat,
				Name:        s.name,
				Amount:      s.target,
				Description: fmt.Sprintf("Alokasi pagu resmi anggaran %s tahun 2026", s.name),
				BaseMetadata: BaseMetadata{
					Source:           "Kemenkeu RI (APBN 2026)",
					FiscalYear:       2026,
					Period:           "Jan - Nov 2026",
					ValidationStatus: "published",
					Classification:   "public",
					IntegrityHash:    calculateHash(fmt.Sprintf("%s-%.2f", s.name, s.target)),
					BlockchainTxID:   fmt.Sprintf("TX-B-%s", s.id),
					Version:          1,
					CreatedAt:        time.Now(),
					UpdatedAt:        time.Now(),
				},
			}
			if err := db.Create(&b).Error; err != nil {
				return fmt.Errorf("gagal seed budget %s: %w", s.name, err)
			}

			// Buat relasi Realisasi (Pemisahan Domain: Aturan 8)
			pct := (s.real / s.target) * 100
			r := Realization{
				ID:              fmt.Sprintf("REAL-%s", s.id),
				BudgetID:        b.ID,
				Amount:          s.real,
				Percentage:      pct,
				RealizationDate: time.Now(),
				Notes:           fmt.Sprintf("Serapan kumulatif per November 2026 untuk %s", s.name),
				BaseMetadata: BaseMetadata{
					Source:           "Laporan Realisasi Semester II 2026",
					FiscalYear:       2026,
					Period:           "Jan - Nov 2026",
					ValidationStatus: "published",
					Classification:   "public",
					IntegrityHash:    calculateHash(fmt.Sprintf("REAL-%s-%.2f", s.name, s.real)),
					BlockchainTxID:   fmt.Sprintf("TX-R-%s", s.id),
					Version:          1,
					CreatedAt:        time.Now(),
					UpdatedAt:        time.Now(),
				},
			}
			if err := db.Create(&r).Error; err != nil {
				return fmt.Errorf("gagal seed realization %s: %w", s.name, err)
			}
		}
		log.Println("  ✅ Seed Budgets & Realizations berhasil.")
	}

	// 4. Seed Projects
	var prjCount int64
	db.Model(&Project{}).Count(&prjCount)
	if prjCount == 0 {
		agencies := []string{"Kemen PUPR", "Kemenkes", "Kemendikdasmen", "Kemenhub", "Kemensos"}
		regions := []string{"Jawa Barat", "Sumatera Utara", "Kalimantan Timur", "Sulawesi Selatan", "NTT", "Papua"}
		categories := []string{"Infrastruktur", "Kesehatan", "Pendidikan", "Transportasi"}
		statuses := []ProjectStatus{ProjectOngoing, ProjectCompleted, ProjectDelayed, ProjectPlanning}

		for i := 0; i < 14; i++ {
			bVal := float64(20 + i*13)
			st := statuses[i%4]
			var spent, prog float64

			if st == ProjectCompleted {
				spent = bVal * 0.97
				prog = 100.0
			} else if st == ProjectPlanning {
				spent = 0.0
				prog = 0.0
			} else {
				spent = bVal * (0.3 + float64(i%5)*0.1)
				prog = float64(25 + (i*11)%60)
			}

			prj := Project{
				ID:          fmt.Sprintf("PRJ-%d", 100+i),
				ProjectCode: fmt.Sprintf("KODE-PRJ-%d", 100+i),
				Name:        fmt.Sprintf("Proyek Strategis %s %s", categories[i%4], regions[i%6]),
				Agency:      agencies[i%5],
				Region:      regions[i%6],
				Category:    categories[i%4],
				Budget:      bVal,
				Spent:       spent,
				Progress:    prog,
				Status:      st,
				StartYear:   2026,
				EndYear:     2027 + (i % 2),
				BaseMetadata: BaseMetadata{
					Source:           "Sistem Monitoring Pengadaan Nasional",
					FiscalYear:       2026,
					Period:           fmt.Sprintf("2026 – %d", 2027+(i%2)),
					ValidationStatus: "published",
					Classification:   "public",
					IntegrityHash:    calculateHash(fmt.Sprintf("PRJ-%d-%s", 100+i, categories[i%4])),
					BlockchainTxID:   fmt.Sprintf("TX-PRJ-%d", 100+i),
					Version:          1,
					CreatedAt:        time.Now(),
					UpdatedAt:        time.Now(),
				},
			}
			if err := db.Create(&prj).Error; err != nil {
				return fmt.Errorf("gagal seed project %d: %w", i, err)
			}
		}
		log.Println("  ✅ Seed Projects berhasil.")
	}

	// 5. Seed Blockchain Records
	var recCount int64
	db.Model(&BlockchainRecord{}).Count(&recCount)
	if recCount == 0 {
		vStatuses := []VerificationStatus{
			StatusVerified, StatusVerified, StatusPending, StatusVerified, StatusNotVerified, StatusVerified,
		}
		agencies := []string{"Kemen PUPR", "Kemenkes", "Kemendikdasmen", "Kemenhub", "Kemensos", "Kemenkeu"}

		for i, st := range vStatuses {
			h := calculateHash(fmt.Sprintf("BLOCK-SEED-%d", i+1))
			rec := BlockchainRecord{
				ID:            fmt.Sprintf("REC-%d", 2000+i),
				TxID:          fmt.Sprintf("TX-%X", 9000+i*37),
				Hash:          "0x" + h,
				RecordType:    "budget",
				ReferenceID:   fmt.Sprintf("B-EXP-0%d", (i%6)+1),
				Timestamp:     time.Now().Add(-time.Duration(i*24) * time.Hour),
				Status:        st,
				SignerAgency:  "Dataset Resmi — " + agencies[i%len(agencies)],
				ReviewHistory: `["Dibuat oleh Data Manager", "Diverifikasi Node Hyperledger"]`,
				BaseMetadata: BaseMetadata{
					Source:           "Hyperledger Fabric Peer Node #1",
					FiscalYear:       2026,
					Period:           "2026",
					ValidationStatus: "published",
					Classification:   "public",
					IntegrityHash:    "0x" + h,
					BlockchainTxID:   fmt.Sprintf("TX-%X", 9000+i*37),
					Version:          1,
					CreatedAt:        time.Now(),
					UpdatedAt:        time.Now(),
				},
			}
			if err := db.Create(&rec).Error; err != nil {
				return fmt.Errorf("gagal seed blockchain record %d: %w", i, err)
			}
		}
		log.Println("  ✅ Seed Blockchain Records berhasil.")
	}

	// 6. Seed AI Anomalies
	var anomCount int64
	db.Model(&AnomalyFinding{}).Count(&anomCount)
	if anomCount == 0 {
		anomalies := []AnomalyFinding{
			{
				ID:             "AN-1",
				Title:          "Realisasi anggaran meningkat dibanding periode sebelumnya",
				Description:    "Realisasi belanja bulan ini 18% lebih tinggi dari periode sebelumnya.",
				EvidenceData:   "Okt: Rp 237 T vs Sep: Rp 201 T",
				Priority:       PriorityMedium,
				Period:         "Okt 2026",
				Recommendation: "Periksa apakah pembayaran menumpuk di akhir periode.",
				CreatedAt:      time.Now(),
				BaseMetadata: BaseMetadata{
					Source:           "AI Anomaly Engine (Scikit-Learn IsolationForest)",
					FiscalYear:       2026,
					Period:           "Okt 2026",
					ValidationStatus: "reviewed",
					Classification:   "public",
					IntegrityHash:    calculateHash("AN-1"),
					Version:          1,
					CreatedAt:        time.Now(),
					UpdatedAt:        time.Now(),
				},
			},
			{
				ID:             "AN-2",
				Title:          "Pola pengeluaran tidak biasa pada kategori Infrastruktur",
				Description:    "Anomali terdeteksi — memerlukan pemeriksaan lebih lanjut.",
				EvidenceData:   "3 transaksi bernilai mirip dalam 2 hari",
				Priority:       PriorityHigh,
				Period:         "Sep–Okt 2026",
				Recommendation: "Cocokkan dengan dokumen kontrak dan berita acara.",
				CreatedAt:      time.Now(),
				BaseMetadata: BaseMetadata{
					Source:           "AI Anomaly Engine (Pattern Cluster)",
					FiscalYear:       2026,
					Period:           "Sep–Okt 2026",
					ValidationStatus: "reviewed",
					Classification:   "public",
					IntegrityHash:    calculateHash("AN-2"),
					Version:          1,
					CreatedAt:        time.Now(),
					UpdatedAt:        time.Now(),
				},
			},
			{
				ID:             "AN-3",
				Title:          "Selisih signifikan antara anggaran dan realisasi",
				Description:    "Realisasi Kesehatan baru 70% dari pagu pada kuartal ketiga.",
				EvidenceData:   "Pagu 210 T, realisasi 148 T",
				Priority:       PriorityLow,
				Period:         "Q3 2026",
				Recommendation: "Tanyakan hambatan serapan ke instansi terkait.",
				CreatedAt:      time.Now(),
				BaseMetadata: BaseMetadata{
					Source:           "AI Variance Analyzer",
					FiscalYear:       2026,
					Period:           "Q3 2026",
					ValidationStatus: "reviewed",
					Classification:   "public",
					IntegrityHash:    calculateHash("AN-3"),
					Version:          1,
					CreatedAt:        time.Now(),
					UpdatedAt:        time.Now(),
				},
			},
		}
		if err := db.Create(&anomalies).Error; err != nil {
			return fmt.Errorf("gagal seed anomalies: %w", err)
		}
		log.Println("  ✅ Seed AI Anomalies berhasil.")
	}

	log.Println("🎉 Seluruh seed data awal berhasil dipasang!")
	return nil
}

func calculateHash(input string) string {
	h := sha256.Sum256([]byte(input))
	return hex.EncodeToString(h[:])
}

