# 📋 Checklist Keamanan & Kepatuhan — Nusantara Transparan

Dokumen ini memuat standar keamanan mendalam (*security baseline*) yang wajib dipatuhi dalam pengembangan frontend, backend Go, database PostgreSQL, integrasi blockchain Hyperledger Fabric, dan mesin analitik AI.

---

## Ringkasan Checklist Keamanan

| No | Komponen Keamanan | Target Implementasi | Status |
| :-: | :--- | :--- | :-: |
| 1 | **Enkripsi Data Sensitif at Rest (AES-256)** | Database PostgreSQL, file storage, backup | ⏳ Direncanakan |
| 2 | **Implementasi Multi-Factor Authentication (MFA)** | TOTP / Authenticator App untuk Admin & Auditor | ⏳ Direncanakan |
| 3 | **Role-Based Access Control (RBAC)** | Autorisasi endpoint Go (Admin, Auditor, Data Manager, Public) | ⏳ Direncanakan |
| 4 | **Digital Signature untuk Semua Transaksi** | ECDSA / RSA signature pada setiap payload rilis data | ⏳ Direncanakan |
| 5 | **Hash Chain untuk Integritas Blockchain** | SHA-256 immutable ledger di Hyperledger Fabric chaincode | ⏳ Direncanakan |
| 6 | **TLS 1.3 untuk Semua Komunikasi Web** | HTTPS / WSS / gRPC communication | ⏳ Direncanakan |
| 7 | **Proteksi terhadap DDoS** | Cloudflare / CDN, reverse proxy rate limiting | ⏳ Direncanakan |
| 8 | **Logging & Monitoring Real-Time** | Structured audit logging, Prometheus / Grafana alerts | ⏳ Direncanakan |
| 9 | **Compliance Hukum Indonesia** | UU ITE, UU No. 27/2022 (PDP), RUU KKS | ⏳ Direncanakan |
| 10 | **Secure Coding Practices** | Mitigasi OWASP Top 10 & CWE Top 25 | ⏳ Direncanakan |
| 11 | **Dependency Vulnerability Scanning** | `govulncheck`, `npm audit`, dependabot alerts | ⏳ Direncanakan |
| 12 | **Incident Response Plan** | Prosedur tanggap darurat insiden kebocoran/peretasan | ⏳ Direncanakan |

---

## Rincian Panduan Teknis

### 1. Enkripsi Data Sensitif at Rest (AES-256)
- Kolom sensitif (kredensial, data perorangan penerima tertentu) harus dienkripsi menggunakan AES-256-GCM.
- Kunci enkripsi disimpan terpisah menggunakan environment secret atau KMS (Key Management Service), tidak boleh di-*hardcode*.

### 2. Multi-Factor Authentication (MFA)
- Pengguna dengan hak istimewa (*Admin*, *Auditor*, *Data Manager*) wajib mengaktifkan MFA berbasis TOTP (Google Authenticator / Authy) sebelum diizinkan mengubah status data menjadi `approved` atau `published`.

### 3. Role-Based Access Control (RBAC)
- Setiap route backend Go wajib memiliki middleware otorisasi yang memvalidasi JWT token dan hak peran (*claims*).
- Klasifikasi data (*Public*, *Restricted*, *Confidential*) harus dicek sebelum mengembalikan respons API.

### 4. Digital Signature untuk Semua Transaksi
- Setiap rilis transaksi keuangan atau persetujuan audit harus ditandatangani secara kriptografis menggunakan *private key* instansi/auditor.
- Publik dapat memverifikasi keaslian data menggunakan *public key* resmi.

### 5. Hash Chain untuk Integritas Blockchain
- Setiap blok dan catatan audit keuangan memuat hash transaksi sebelumnya (*hash chain*).
- Jika ada upaya manipulasi data historis pada database utama, verifikasi hash chain di blockchain akan langsung mendeteksi ketidakcocokan (*tamper-evident*).

### 6. TLS 1.3 untuk Semua Komunikasi Web
- Nonaktifkan protokol lama (SSLv3, TLS 1.0, TLS 1.1, TLS 1.2 yang rentan).
- Enforce HSTS (*HTTP Strict Transport Security*) dengan `max-age` minimal 1 tahun dan `includeSubDomains`.

### 7. Proteksi DDoS & Rate Limiting
- Terapkan reverse proxy (Cloudflare / NGINX) di depan backend Go.
- Pasang rate limiter pada level API (misal 100 req/menit per IP) untuk mencegah brute force dan scraping berlebihan.

### 8. Logging & Monitoring Real-Time
- Catat semua event autentikasi, approval data, dan modifikasi ke tabel `audit_logs` (*append-only*).
- Masking informasi pribadi (PII) sebelum ditulis ke log file.

### 9. Kepatuhan Regulasi Indonesia
- **UU ITE No. 1/2024:** Keabsahan bukti elektronik dan tanda tangan digital.
- **UU PDP No. 27/2022:** Perlindungan data identitas perorangan masyarakat.
- **RUU KKS:** Kesiapan infrastruktur informasi vital nasional terhadap ancaman siber.

### 10. Secure Coding Practices (CWE Top 25 / OWASP Top 10)
- Cegah SQL Injection dengan selalu memakai parameterized query (GORM otomatis mendukung ini).
- Sanitasi input pencarian publik untuk mencegah Cross-Site Scripting (XSS).
- Validasi CORS header (*Cross-Origin Resource Sharing*) hanya untuk domain frontend yang sah.

### 11. Dependency Scanning
- Jalankan `npm audit` pada frontend secara berkala.
- Jalankan `govulncheck ./...` pada backend Go untuk mendeteksi kerentanan CVE pada library pihak ketiga.

### 12. Incident Response Plan
- SOP penanganan insiden:
  1. **Deteksi:** Notifikasi anomali atau intrusi.
  2. **Isolasi:** Mematikan sementara token yang terkompromi atau read-only mode pada dashboard publik.
  3. **Eradikasi:** Penambalan celah (*patching*).
  4. **Pemulihan:** Verifikasi integritas data menggunakan hash blockchain.
  5. **Pelaporan:** Dokumentasi pasca-insiden (*post-mortem*).
