-- =============================================================================
-- NUSANTARA TRANSPARAN - INITIAL DATABASE SCHEMA (PostgreSQL)
-- Single Source of Truth sesuai aturan di GEMINI.md
-- =============================================================================

-- Extension untuk UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL PENGGUNA & PERAN (AUTH)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'public', -- admin, auditor, data_manager, public
    agency VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL KEMENTERIAN / LEMBAGA (MINISTRIES / AGENCIES)
CREATE TABLE IF NOT EXISTS ministries (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100), -- Pendidikan, Kesehatan, Pertahanan, dll.
    -- Metadata Wajib
    source VARCHAR(255) NOT NULL,
    fiscal_year INT NOT NULL,
    period VARCHAR(50) NOT NULL,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'published',
    classification VARCHAR(50) NOT NULL DEFAULT 'public',
    integrity_hash VARCHAR(66),
    blockchain_tx_id VARCHAR(100),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. DOMAIN 1: ANGGARAN / PAGU (BUDGETS) - PERENCANAAN
CREATE TABLE IF NOT EXISTS budgets (
    id VARCHAR(36) PRIMARY KEY,
    ministry_id VARCHAR(36) REFERENCES ministries(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- revenue (penerimaan), expenditure (pengeluaran)
    category VARCHAR(100) NOT NULL, -- Pajak, PNBP, Belanja Pemerintah Pusat, TKD, Fungsi, dll.
    name VARCHAR(255) NOT NULL,
    amount NUMERIC(20, 2) NOT NULL, -- Nilai Pagu
    description TEXT,
    -- Metadata Wajib
    source VARCHAR(255) NOT NULL,
    fiscal_year INT NOT NULL,
    period VARCHAR(50) NOT NULL,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'published',
    classification VARCHAR(50) NOT NULL DEFAULT 'public',
    integrity_hash VARCHAR(66),
    blockchain_tx_id VARCHAR(100),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. DOMAIN 2: REALISASI ANGGARAN (REALIZATIONS) - SERAPAN KUMULATIF
CREATE TABLE IF NOT EXISTS realizations (
    id VARCHAR(36) PRIMARY KEY,
    budget_id VARCHAR(36) NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    amount NUMERIC(20, 2) NOT NULL, -- Realisasi kumulatif
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00, -- % serapan terhadap pagu
    realization_date DATE NOT NULL,
    notes TEXT,
    -- Metadata Wajib
    source VARCHAR(255) NOT NULL,
    fiscal_year INT NOT NULL,
    period VARCHAR(50) NOT NULL,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'published',
    classification VARCHAR(50) NOT NULL DEFAULT 'public',
    integrity_hash VARCHAR(66),
    blockchain_tx_id VARCHAR(100),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. DOMAIN 3: TRANSAKSI (TRANSACTIONS) - CATATAN PER KEJADIAN
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    transaction_no VARCHAR(100) UNIQUE NOT NULL, -- Nomor SP2D / Kuitansi
    budget_id VARCHAR(36) NOT NULL REFERENCES budgets(id) ON DELETE RESTRICT,
    project_id VARCHAR(36),
    type VARCHAR(50) NOT NULL, -- income, expense
    amount NUMERIC(20, 2) NOT NULL,
    recipient VARCHAR(255) NOT NULL, -- Vendor / Lembaga penerima
    description TEXT,
    transaction_date DATE NOT NULL,
    -- Metadata Wajib
    source VARCHAR(255) NOT NULL,
    fiscal_year INT NOT NULL,
    period VARCHAR(50) NOT NULL,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'published',
    classification VARCHAR(50) NOT NULL DEFAULT 'public',
    integrity_hash VARCHAR(66),
    blockchain_tx_id VARCHAR(100),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. PEMANTAUAN PROYEK PEMERINTAH (PROJECTS)
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY, -- PRJ-100
    project_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    agency VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL, -- Infrastruktur, Kesehatan, Pendidikan, dll.
    budget NUMERIC(20, 2) NOT NULL,
    spent NUMERIC(20, 2) NOT NULL DEFAULT 0.00,
    progress NUMERIC(5, 2) NOT NULL DEFAULT 0.00, -- 0 - 100%
    status VARCHAR(50) NOT NULL DEFAULT 'Perencanaan', -- Perencanaan, Berjalan, Tertunda, Selesai
    start_year INT NOT NULL,
    end_year INT NOT NULL,
    -- Metadata Wajib
    source VARCHAR(255) NOT NULL,
    fiscal_year INT NOT NULL,
    period VARCHAR(50) NOT NULL,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'published',
    classification VARCHAR(50) NOT NULL DEFAULT 'public',
    integrity_hash VARCHAR(66),
    blockchain_tx_id VARCHAR(100),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. AUDIT TRAIL BLOCKCHAIN (BLOCKCHAIN_RECORDS)
CREATE TABLE IF NOT EXISTS blockchain_records (
    id VARCHAR(36) PRIMARY KEY, -- REC-2000
    tx_id VARCHAR(100) UNIQUE NOT NULL,
    hash VARCHAR(66) NOT NULL,
    record_type VARCHAR(50) NOT NULL, -- budget, transaction, project
    reference_id VARCHAR(36) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending Review', -- Verified, Pending Review, Not Verified
    signer_agency VARCHAR(255) NOT NULL,
    review_history JSONB DEFAULT '[]'::jsonb,
    -- Metadata Wajib
    source VARCHAR(255) NOT NULL,
    fiscal_year INT NOT NULL,
    period VARCHAR(50) NOT NULL,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'published',
    classification VARCHAR(50) NOT NULL DEFAULT 'public',
    integrity_hash VARCHAR(66),
    blockchain_tx_id VARCHAR(100),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. JEJAK AUDIT & REVISI REKURSIP (AUDIT_LOGS) - APPEND-ONLY
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(36) NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, APPROVE, PUBLISH
    actor_id VARCHAR(36) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    hash_proof VARCHAR(66)
);

-- 9. TEMUAN ANOMALI AI (AI_ANOMALIES) - READ ONLY FROM AI ENGINE
CREATE TABLE IF NOT EXISTS ai_anomalies (
    id VARCHAR(36) PRIMARY KEY, -- AN-1
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    evidence_data TEXT,
    priority VARCHAR(50) NOT NULL, -- Tinggi, Sedang, Rendah
    period VARCHAR(50) NOT NULL,
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Metadata Wajib
    source VARCHAR(255) NOT NULL,
    fiscal_year INT NOT NULL,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'reviewed',
    classification VARCHAR(50) NOT NULL DEFAULT 'public',
    integrity_hash VARCHAR(66),
    blockchain_tx_id VARCHAR(100),
    version INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES UNTUK KINERJA QUERY TINGGI
CREATE INDEX IF NOT EXISTS idx_budgets_fiscal_year ON budgets(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budgets_type ON budgets(type);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category);
CREATE INDEX IF NOT EXISTS idx_realizations_budget_id ON realizations(budget_id);
CREATE INDEX IF NOT EXISTS idx_transactions_budget_id ON transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_region ON projects(region);
CREATE INDEX IF NOT EXISTS idx_blockchain_records_hash ON blockchain_records(hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_records_status ON blockchain_records(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_ai_anomalies_priority ON ai_anomalies(priority);
