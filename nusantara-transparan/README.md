# Nusantara Transparan

Platform keterbukaan data dan akuntabilitas publik berbasis web, AI, data pipeline, dan verifikasi blockchain.

## Struktur Proyek

```
nusantara-transparan/
│
├── frontend/                   # Web interface (React + Vite + Tailwind + TypeScript)
│   ├── src/                    # Source code frontend
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Halaman / Views aplikasi
│   │   ├── services/           # API service layer & mock fetcher
│   │   ├── data/               # Mock data (DEMO)
│   │   ├── hooks/              # Custom React hooks
│   │   └── types/              # TypeScript definitions
│
├── backend/                    # Core API service (Go)
│   ├── cmd/                    # Entrypoints aplikasi
│   ├── internal/               # Private application & business logic
│   │   ├── auth/               # Autentikasi dan otorisasi
│   │   ├── budget/             # Modul anggaran (penerimaan & pengeluaran)
│   │   ├── transaction/        # Modul transaksi keuangan
│   │   ├── project/            # Modul proyek publik
│   │   ├── blockchain/         # Integrasi blockchain
│   │   └── audit/              # Modul audit log & jejak transparansi
│   ├── migrations/             # Database migration files (SQL)
│   └── go.mod                  # Go module definition
│
├── ai-engine/                  # Mesin analitik cerdas & AI
│   ├── anomaly_detection/      # Deteksi kejanggalan transaksi / anggaran
│   ├── forecasting/            # Peramalan tren & realisasi anggaran
│   ├── document_intelligence/  # Analisis dokumen & ekstraksi teks / OCR
│   └── assistant/              # Tanya-jawab AI & conversational interface
│
├── blockchain/                 # Ledger tidak dapat diubah (immutability & proof)
│   ├── chaincode/              # Smart contract / chaincode
│   ├── network/                # Konfigurasi & skrip node network
│   └── config/                 # Konfigurasi konsensus & kriptografi
│
├── data-pipeline/              # Alur ETL / ELT data pemerintah & publik
│   ├── ingestion/              # Pengumpulan & scraping/import data
│   ├── validation/             # Validasi integritas & skema data
│   └── transformation/         # Pembersihan & standardisasi data
│
├── docs/                       # Dokumentasi arsitektur dan spesifikasi
│   ├── architecture/           # Dokumen arsitektur sistem
│   ├── database/               # Skema basis data & ERD
│   ├── api/                    # Spesifikasi OpenAPI / REST API
│   └── requirements/           # PRD & kebutuhan fungsional
│
└── README.md
```

## Memulai Cepat

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
go run ./cmd/...
```

