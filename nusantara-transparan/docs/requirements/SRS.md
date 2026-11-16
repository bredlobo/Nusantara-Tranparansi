# Software Requirements Specification (SRS) — Nusantara Transparan

## 1. Tujuan Sistem
Menyediakan portal transparansi anggaran negara (APBN) dan pemantauan proyek strategis yang terverifikasi secara kriptografis menggunakan rantai blok (SHA-256 + ECDSA P-256) serta dilengkapi analitik kecerdasan buatan (*Read-Only*).

## 2. Kebutuhan Fungsional Utama (Functional Requirements)
- **FR-01:** Menyajikan ringkasan statistik pemasukan, pengeluaran, dan realisasi anggaran dari PostgreSQL.
- **FR-02:** Memisahkan secara tegas antara tabel Anggaran (`budgets`), Realisasi (`realizations`), dan Transaksi (`transactions`).
- **FR-03:** Menyediakan alur kerja berjenjang (*Four-Eyes Principle*):
  1. **Data Manager** mengunggah draf data (`draft`).
  2. **Auditor / Reviewer** memverifikasi hash dan menyetujui data (`approved`).
  3. **Administrator** mempublikasikan data ke masyarakat (`published`).
- **FR-04:** Mencatat dan memverifikasi rantai hash (*Hash Chain* SHA-256) dan tanda tangan digital (*ECDSA P-256*).
- **FR-05:** Mendeteksi pola anomali anggaran dan menjawab pertanyaan publik melalui RAG secara *Read-Only*.

## 3. Kebutuhan Non-Fungsional (Non-Functional Requirements)
- **NFR-01 (Security):** Enkripsi AES-256-GCM at-rest, TOTP MFA, RBAC Middleware, Rate Limiting 120 req/menit per IP.
- **NFR-02 (Resilience):** *Graceful Degradation* saat modul AI atau node blockchain mengalami gangguan.
- **NFR-03 (Auditability):** Seluruh perubahan status tercatat secara *append-only* di tabel `audit_logs`.
