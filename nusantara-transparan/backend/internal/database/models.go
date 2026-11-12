package database

import (
	"time"
)

// BaseMetadata menyimpan metadata wajib sesuai Aturan 6 & 7 di GEMINI.md
type BaseMetadata struct {
	Source           string    `gorm:"type:varchar(255);not null" json:"source"`                               // Sumber resmi (misal: "Kemenkeu RI (APBN)")
	FiscalYear       int       `gorm:"not null;index" json:"fiscal_year"`                                      // Tahun anggaran
	Period           string    `gorm:"type:varchar(50);not null" json:"period"`                                // Periode (2026, Q1, Jan-Nov)
	ValidationStatus string    `gorm:"type:varchar(50);default:'published';index" json:"validation_status"`   // draft, reviewed, approved, published
	Classification   string    `gorm:"type:varchar(50);default:'public';index" json:"classification"`         // public, restricted, confidential
	IntegrityHash    string    `gorm:"type:varchar(66)" json:"integrity_hash"`                                 // SHA-256 hash untuk proof of integrity
	BlockchainTxID   string    `gorm:"type:varchar(100)" json:"blockchain_tx_id"`                             // ID Tx Hyperledger Fabric
	Version          int       `gorm:"default:1;not null" json:"version"`                                      // Versi data (append-only)
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// User role & account
type UserRole string

const (
	RoleAdmin       UserRole = "admin"
	RoleAuditor     UserRole = "auditor"
	RoleDataManager UserRole = "data_manager"
	RolePublic      UserRole = "public"
)

type User struct {
	ID           string    `gorm:"type:varchar(36);primaryKey" json:"id"`
	Username     string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"username"`
	Email        string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash string    `gorm:"type:varchar(255);not null" json:"-"`
	FullName     string    `gorm:"type:varchar(255);not null" json:"full_name"`
	Role         UserRole  `gorm:"type:varchar(50);default:'public'" json:"role"`
	Agency       string    `gorm:"type:varchar(255)" json:"agency"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Ministry / Lembaga Negara
type Ministry struct {
	ID     string `gorm:"type:varchar(36);primaryKey" json:"id"`
	Code   string `gorm:"type:varchar(50);uniqueIndex;not null" json:"code"`
	Name   string `gorm:"type:varchar(255);not null" json:"name"`
	Sector string `gorm:"type:varchar(100)" json:"sector"`
	BaseMetadata
}

// Budget - Alokasi Dana / Pagu (Aturan 8: Pemisahan Domain)
type BudgetType string

const (
	TypeRevenue     BudgetType = "revenue"     // Penerimaan (Pajak, PNBP, Hibah)
	TypeExpenditure BudgetType = "expenditure" // Belanja Negara
)

type Budget struct {
	ID          string     `gorm:"type:varchar(36);primaryKey" json:"id"`
	MinistryID  *string    `gorm:"type:varchar(36);index" json:"ministry_id"`
	Ministry    *Ministry  `gorm:"foreignKey:MinistryID" json:"ministry,omitempty"`
	Type        BudgetType `gorm:"type:varchar(50);not null;index" json:"type"`
	Category    string     `gorm:"type:varchar(100);not null;index" json:"category"`
	Name        string     `gorm:"type:varchar(255);not null" json:"name"`
	Amount      float64    `gorm:"type:decimal(20,2);not null" json:"amount"` // Nilai Pagu
	Description string     `gorm:"type:text" json:"description"`
	BaseMetadata
}

// Realization - Serapan Kumulatif Aktual (Aturan 8: Pemisahan Domain)
type Realization struct {
	ID              string    `gorm:"type:varchar(36);primaryKey" json:"id"`
	BudgetID        string    `gorm:"type:varchar(36);not null;index" json:"budget_id"`
	Budget          *Budget   `gorm:"foreignKey:BudgetID" json:"budget,omitempty"`
	Amount          float64   `gorm:"type:decimal(20,2);not null" json:"amount"` // Realisasi kumulatif
	Percentage      float64   `gorm:"type:decimal(5,2);default:0.00" json:"percentage"`
	RealizationDate time.Time `gorm:"index;not null" json:"realization_date"`
	Notes           string    `gorm:"type:text" json:"notes"`
	BaseMetadata
}

// Transaction - Kejadian Pengeluaran/Penerimaan Spesifik (Aturan 8: Pemisahan Domain)
type TransactionType string

const (
	TxIncome  TransactionType = "income"
	TxExpense TransactionType = "expense"
)

type Transaction struct {
	ID              string          `gorm:"type:varchar(36);primaryKey" json:"id"`
	TransactionNo   string          `gorm:"type:varchar(100);uniqueIndex;not null" json:"transaction_no"`
	BudgetID        string          `gorm:"type:varchar(36);not null;index" json:"budget_id"`
	Budget          *Budget         `gorm:"foreignKey:BudgetID" json:"budget,omitempty"`
	ProjectID       *string         `gorm:"type:varchar(36);index" json:"project_id"`
	Type            TransactionType `gorm:"type:varchar(50);not null" json:"type"`
	Amount          float64         `gorm:"type:decimal(20,2);not null" json:"amount"`
	Recipient       string          `gorm:"type:varchar(255);not null" json:"recipient"`
	Description     string          `gorm:"type:text" json:"description"`
	TransactionDate time.Time       `gorm:"index;not null" json:"transaction_date"`
	BaseMetadata
}

// Project - Pemantauan Proyek Pemerintah
type ProjectStatus string

const (
	ProjectPlanning  ProjectStatus = "Perencanaan"
	ProjectOngoing   ProjectStatus = "Berjalan"
	ProjectDelayed   ProjectStatus = "Tertunda"
	ProjectCompleted ProjectStatus = "Selesai"
)

type Project struct {
	ID          string        `gorm:"type:varchar(36);primaryKey" json:"id"` // PRJ-100
	ProjectCode string        `gorm:"type:varchar(50);uniqueIndex;not null" json:"project_code"`
	Name        string        `gorm:"type:varchar(255);not null" json:"name"`
	Agency      string        `gorm:"type:varchar(255);not null" json:"agency"`
	Region      string        `gorm:"type:varchar(100);not null;index" json:"region"`
	Category    string        `gorm:"type:varchar(100);not null" json:"category"`
	Budget      float64       `gorm:"type:decimal(20,2);not null" json:"budget"`
	Spent       float64       `gorm:"type:decimal(20,2);default:0.00" json:"spent"`
	Progress    float64       `gorm:"type:decimal(5,2);default:0.00" json:"progress"`
	Status      ProjectStatus `gorm:"type:varchar(50);not null;index" json:"status"`
	StartYear   int           `json:"start_year"`
	EndYear     int           `json:"end_year"`
	BaseMetadata
}

// BlockchainRecord - Verifikasi Integritas & Immutability (Aturan 3: Hash dan Metadata Saja)
type VerificationStatus string

const (
	StatusVerified    VerificationStatus = "Verified"
	StatusPending     VerificationStatus = "Pending Review"
	StatusNotVerified VerificationStatus = "Not Verified"
)

type BlockchainRecord struct {
	ID            string             `gorm:"type:varchar(36);primaryKey" json:"id"` // REC-2000
	TxID          string             `gorm:"type:varchar(100);uniqueIndex;not null" json:"tx"`
	Hash          string             `gorm:"type:varchar(66);not null;index" json:"hash"`
	RecordType    string             `gorm:"type:varchar(50);not null" json:"record_type"`
	ReferenceID   string             `gorm:"type:varchar(36);not null;index" json:"reference_id"`
	Timestamp     time.Time          `json:"ts"`
	Status        VerificationStatus `gorm:"type:varchar(50);not null;index" json:"status"`
	SignerAgency  string             `gorm:"type:varchar(255);not null" json:"source"`
	ReviewHistory string             `gorm:"type:jsonb;default:'[]'" json:"history"`
	BaseMetadata
}

// AuditLog - Riwayat Perubahan & Audit Trail (Aturan 7: Append-Only)
type AuditLog struct {
	ID        string    `gorm:"type:varchar(36);primaryKey" json:"id"`
	TableName string    `gorm:"type:varchar(100);not null;index" json:"table_name"`
	RecordID  string    `gorm:"type:varchar(36);not null;index" json:"record_id"`
	Action    string    `gorm:"type:varchar(20);not null" json:"action"`
	ActorID   string    `gorm:"type:varchar(36);not null" json:"actor_id"`
	ActorName string    `gorm:"type:varchar(255);not null" json:"actor_name"`
	OldData   string    `gorm:"type:jsonb" json:"old_data"`
	NewData   string    `gorm:"type:jsonb" json:"new_data"`
	ChangedAt time.Time `gorm:"not null" json:"changed_at"`
	Reason    string    `gorm:"type:text" json:"reason"`
	HashProof string    `gorm:"type:varchar(66)" json:"hash_proof"`
}

// AnomalyFinding - Hasil Analisis Mesin AI (Aturan 4: Read-Only)
type AnomalyPriority string

const (
	PriorityHigh   AnomalyPriority = "Tinggi"
	PriorityMedium AnomalyPriority = "Sedang"
	PriorityLow    AnomalyPriority = "Rendah"
)

type AnomalyFinding struct {
	ID             string          `gorm:"type:varchar(36);primaryKey" json:"id"` // AN-1
	Title          string          `gorm:"type:varchar(255);not null" json:"title"`
	Description    string          `gorm:"type:text;not null" json:"desc"`
	EvidenceData   string          `gorm:"type:text" json:"data"`
	Priority       AnomalyPriority `gorm:"type:varchar(50);not null;index" json:"priority"`
	Period         string          `gorm:"type:varchar(50);not null" json:"period"`
	Recommendation string          `gorm:"type:text" json:"rec"`
	CreatedAt      time.Time       `json:"created_at"`
	BaseMetadata
}
