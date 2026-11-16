# Skema & Entity Relationship Diagram (ERD) — Nusantara Transparan

Dokumen ini menjelaskan struktur lengkap database PostgreSQL untuk proyek **Nusantara Transparan** yang telah dibuat melalui GORM AutoMigrate.

---

## 1. Visual Diagram Relasi (Mermaid ERD)

```mermaid
erDiagram
    users {
        string id PK
        string username UK
        string email UK
        string password_hash
        string full_name
        string role
        string agency
        timestamp created_at
        timestamp updated_at
    }

    ministries {
        string id PK
        string code UK
        string name
        string sector
        string source
        int fiscal_year
        string period
        string validation_status
        string classification
        string integrity_hash
        string blockchain_tx_id
        int version
        timestamp created_at
        timestamp updated_at
    }

    budgets {
        string id PK
        string ministry_id FK
        string type
        string category
        string name
        decimal amount
        text description
        string source
        int fiscal_year
        string period
        string validation_status
        string classification
        string integrity_hash
        string blockchain_tx_id
        int version
        timestamp created_at
        timestamp updated_at
    }

    realizations {
        string id PK
        string budget_id FK
        decimal amount
        decimal percentage
        date realization_date
        text notes
        string source
        int fiscal_year
        string period
        string validation_status
        string classification
        string integrity_hash
        string blockchain_tx_id
        int version
        timestamp created_at
        timestamp updated_at
    }

    transactions {
        string id PK
        string transaction_no UK
        string budget_id FK
        string project_id
        string type
        decimal amount
        string recipient
        text description
        date transaction_date
        string source
        int fiscal_year
        string period
        string validation_status
        string classification
        string integrity_hash
        string blockchain_tx_id
        int version
        timestamp created_at
        timestamp updated_at
    }

    projects {
        string id PK
        string project_code UK
        string name
        string agency
        string region
        string category
        decimal budget
        decimal spent
        decimal progress
        string status
        int start_year
        int end_year
        string source
        int fiscal_year
        string period
        string validation_status
        string classification
        string integrity_hash
        string blockchain_tx_id
        int version
        timestamp created_at
        timestamp updated_at
    }

    blockchain_records {
        string id PK
        string tx_id UK
        string hash
        string record_type
        string reference_id
        timestamp timestamp
        string status
        string signer_agency
        jsonb review_history
        string source
        int fiscal_year
        string period
        string validation_status
        string classification
        string integrity_hash
        string blockchain_tx_id
        int version
        timestamp created_at
        timestamp updated_at
    }

    audit_logs {
        string id PK
        string table_name
        string record_id
        string action
        string actor_id
        string actor_name
        jsonb old_data
        jsonb new_data
        timestamp changed_at
        text reason
        string hash_proof
    }

    ai_anomalies {
        string id PK
        string title
        text description
        text evidence_data
        string priority
        string period
        text recommendation
        string source
        int fiscal_year
        string validation_status
        string classification
        string integrity_hash
        string blockchain_tx_id
        int version
        timestamp created_at
        timestamp updated_at
    }

    ministries ||--o{ budgets : "mengalokasikan"
    budgets ||--o{ realizations : "memiliki riwayat serapan"
    budgets ||--o{ transactions : "memiliki catatan SP2D"
    projects ||--o{ transactions : "didanai oleh"
```

---

## 2. Rincian Tabel & Fungsinya

| Nama Tabel | Domain | Keterangan & Kepatuhan Aturan |
| :--- | :--- | :--- |
| **`users`** | Autentikasi | Pengelolaan hak akses berjenjang (*Admin, Auditor, Data Manager, Public*). |
| **`ministries`** | Organisasi | Master data Kementerian / Lembaga negara (Kemenkeu, Kemenkes, PUPR, dll.). |
| **`budgets`** | **Anggaran (Pagu)** | **Aturan 8 (Pemisahan Domain):** Alokasi dana yang direncanakan (Revenue / Expenditure). |
| **`realizations`** | **Realisasi** | **Aturan 8 (Pemisahan Domain):** Serapan kumulatif dana yang telah digunakan (% serapan). |
| **`transactions`** | **Transaksi** | **Aturan 8 (Pemisahan Domain):** Transaksi per kejadian spesifik (nomor SP2D, kuitansi, vendor penerima). |
| **`projects`** | Proyek Fisik | Pemantauan progres fisik (%), anggaran terpakai, lokasi wilayah, dan status. |
| **`blockchain_records`** | Integritas | **Aturan 3 (Hash Only):** Bukti kriptografi (SHA-256) dan ID transaksi Hyperledger Fabric. |
| **`audit_logs`** | Jejak Audit | **Aturan 7 (Append-Only):** Riwayat perubahan data tanpa *hard delete*. |
| **`ai_anomalies`** | Kecerdasan Buatan | **Aturan 4 (Read-Only AI):** Temuan pola anomali dan rekomendasi dari mesin analitik. |

---

## 3. Metadata Wajib di Setiap Tabel Finansial (Aturan 6 & 9)

Setiap entitas data keuangan wajib memiliki kolom metadata berikut:
- **`source`**: Instansi resmi penerbit data (misal: `"Kemenkeu RI (APBN 2026)"`).
- **`fiscal_year`**: Tahun anggaran (misal: `2026`).
- **`period`**: Periode data (misal: `"Jan - Nov 2026"` atau `"Q3"`).
- **`validation_status`**: Status kurasi (`draft`, `reviewed`, `approved`, `published`).
- **`classification`**: Tingkat kerahasiaan (`public`, `restricted`, `confidential`).
- **`integrity_hash`**: Hash SHA-256 data untuk diverifikasi dengan ledger blockchain.
- **`blockchain_tx_id`**: Nomor transaksi pencatatan di konsorsium blockchain.
- **`version`**: Nomor versi data untuk mendukung *audit trail*.
