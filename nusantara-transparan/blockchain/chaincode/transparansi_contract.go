package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

// =============================================================================
// NUSANTARA TRANSPARAN — GO SMART CONTRACT (HYPERLEDGER FABRIC CHAINCODE)
// Mematuhi Aturan Arsitektur #3 & #7 di GEMINI.md:
// - Hanya menyimpan Cryptographic Hash (SHA-256) & Metadata Integritas (bukan dokumen mentah)
// - Bersifat Append-Only (mempertahankan seluruh riwayat audit / immutability)
// =============================================================================

// LedgerRecord merepresentasikan struktur bukti integritas yang disimpan di World State Blockchain
type LedgerRecord struct {
	RecordID         string   `json:"record_id"`         // Contoh: REC-2001
	TxID             string   `json:"tx_id"`             // Contoh: TX-9A3F...
	RecordType       string   `json:"record_type"`       // "budget" | "project" | "transaction"
	ReferenceID      string   `json:"reference_id"`      // ID entitas di PostgreSQL
	DataHash         string   `json:"data_hash"`         // SHA-256 Hash dari data asli
	PrevChainHash    string   `json:"prev_chain_hash"`   // Hash dari blok sebelumnya (Hash Chain)
	ChainHash        string   `json:"chain_hash"`        // SHA-256(PrevChainHash | DataHash | TxID)
	DigitalSignature string   `json:"digital_signature"` // ECDSA P-256 Signature
	SignerAgency     string   `json:"signer_agency"`     // Instansi penandatangan (Kemenkeu / BPK)
	Status           string   `json:"status"`            // "Pending Review" | "Verified" | "Not Verified"
	FiscalYear       int      `json:"fiscal_year"`       // Tahun anggaran
	Timestamp        string   `json:"timestamp"`         // Waktu pencatatan ISO-8601
	AuditHistory     []string `json:"audit_history"`     // Jejak riwayat perubahan (Append-Only)
}

// TransparansiSmartContract mendefinisikan kontrak pintar verifikasi anggaran negara
type TransparansiSmartContract struct {
	ledger map[string]LedgerRecord
	head   string
}

// NewTransparansiSmartContract menginisialisasi instance chaincode dengan Genesis Hash
func NewTransparansiSmartContract() *TransparansiSmartContract {
	return &TransparansiSmartContract{
		ledger: make(map[string]LedgerRecord),
		head:   "0x0000000000000000000000000000000000000000000000000000000000000000",
	}
}

// RecordFinancialHash mencatat hash SHA-256 dan metadata transaksi ke dalam ledger blockchain (Aturan 3)
func (s *TransparansiSmartContract) RecordFinancialHash(
	recordID, txID, recordType, referenceID, dataHash, signerAgency, signature string,
	fiscalYear int,
) (*LedgerRecord, error) {
	if recordID == "" || dataHash == "" {
		return nil, errors.New("record_id dan data_hash wajib diisi")
	}

	if _, exists := s.ledger[recordID]; exists {
		return nil, fmt.Errorf("record %s sudah tercatat di ledger (immutable)", recordID)
	}

	prevHash := s.head
	chainInput := fmt.Sprintf("%s|%s|%s", prevHash, dataHash, txID)
	sum := sha256.Sum256([]byte(chainInput))
	chainHash := "0x" + hex.EncodeToString(sum[:])

	now := time.Now().Format(time.RFC3339)
	rec := LedgerRecord{
		RecordID:         recordID,
		TxID:             txID,
		RecordType:       recordType,
		ReferenceID:      referenceID,
		DataHash:         dataHash,
		PrevChainHash:    prevHash,
		ChainHash:        chainHash,
		DigitalSignature: signature,
		SignerAgency:     signerAgency,
		Status:           "Pending Review",
		FiscalYear:       fiscalYear,
		Timestamp:        now,
		AuditHistory: []string{
			fmt.Sprintf("[%s] Hash tercatat di Ledger oleh %s (Tx: %s)", now, signerAgency, txID),
		},
	}

	s.ledger[recordID] = rec
	s.head = chainHash
	return &rec, nil
}

// VerifyHashIntegrity memverifikasi apakah hash dari database cocok dengan hash di ledger blockchain
func (s *TransparansiSmartContract) VerifyHashIntegrity(recordID, candidateHash string) (bool, string, error) {
	rec, exists := s.ledger[recordID]
	if !exists {
		return false, "Record tidak ditemukan di Ledger Blockchain", errors.New("record not found")
	}

	if rec.DataHash != candidateHash {
		return false, "PERINGATAN TAMPERING: Hash data tidak cocok dengan catatan Blockchain!", nil
	}

	return true, "VALID: Hash data cocok 100% dengan bukti di Ledger Blockchain.", nil
}

// AppendAuditReview menambahkan keputusan Auditor ke riwayat blok tanpa menghapus riwayat lama (Aturan 7)
func (s *TransparansiSmartContract) AppendAuditReview(recordID, newStatus, auditorAgency, note string) (*LedgerRecord, error) {
	rec, exists := s.ledger[recordID]
	if !exists {
		return nil, errors.New("record tidak ditemukan di ledger")
	}

	now := time.Now().Format(time.RFC3339)
	entry := fmt.Sprintf("[%s] Status diubah ke '%s' oleh %s: %s", now, newStatus, auditorAgency, note)
	rec.Status = newStatus
	rec.AuditHistory = append(rec.AuditHistory, entry)

	s.ledger[recordID] = rec
	return &rec, nil
}

// ExportJSON mengekspor representasi JSON dari record di ledger
func (r *LedgerRecord) ExportJSON() string {
	b, _ := json.MarshalIndent(r, "", "  ")
	return string(b)
}

func main() {
	contract := NewTransparansiSmartContract()
	rec, _ := contract.RecordFinancialHash(
		"REC-GENESIS-01",
		"TX-0001",
		"budget",
		"BDG-001",
		"0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
		"Kemenkeu RI",
		"ECDSA-SIG-P256-VERIFIED",
		2026,
	)
	fmt.Println("Chaincode Nusantara Transparan siap dijalankan:")
	fmt.Println(rec.ExportJSON())
}
