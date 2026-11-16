# Dokumentasi REST API — Nusantara Transparan (`v1`)

Base URL: `http://localhost:8080/api/v1`

Seluruh endpoint ini disajikan oleh Backend Go dan terhubung langsung ke PostgreSQL melalui GORM.

---

## Daftar Endpoint

| Method | Endpoint | Modul | Deskripsi |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | System | Pemeriksaan status server & koneksi PostgreSQL. |
| `GET` | `/api/v1/dashboard` | `budget` | Statistik bulanan & ringkasan alokasi kementerian/lembaga. |
| `GET` | `/api/v1/revenue` | `budget` | Daftar target (pagu) dan realisasi penerimaan negara. |
| `GET` | `/api/v1/expenditure` | `budget` | Daftar pagu dan realisasi belanja negara (Jenis Belanja & Fungsi). |
| `GET` | `/api/v1/projects` | `project` | Daftar pemantauan proyek strategis pemerintah (progres fisik & serapan). |
| `GET` | `/api/v1/transactions` | `transaction` | Daftar transaksi pencairan spesifik (SP2D). |
| `GET` | `/api/v1/blockchain/records` | `blockchain` | Catatan verifikasi cryptographic hash (SHA-256) & riwayat audit. |
| `GET` | `/api/v1/ai/anomalies` | `audit` | Daftar temuan pola anomali belanja negara (*Read-Only*). |
| `POST` | `/api/v1/ai/chat` | `audit` | Asisten tanya-jawab interaktif berbasis data resmi PostgreSQL (*Read-Only*). |

---

## Cara Menjalankan Server API

```bash
cd nusantara-transparan/backend
go run -mod=vendor ./cmd/api
```
