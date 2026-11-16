# 📋 Checklist Keamanan Siber & Kepatuhan — Nusantara Transparan

Dokumen ini memuat standar keamanan siber (*cybersecurity baseline*) yang telah disesuaikan khusus untuk arsitektur web **Nusantara Transparan** dan telah diimplementasikan secara nyata pada kode sistem.

---

## Ringkasan Status Kepatuhan Keamanan

| No | Komponen Keamanan Siber | Implementasi di Kode | Status |
| :-: | :--- | :--- | :-: |
| 1 | **Enkripsi Data Sensitif at Rest (AES-256-GCM)** | `internal/auth/security.go` (`EncryptAES256` / `DecryptAES256`) | ✅ Terpenuhi |
| 2 | **Multi-Factor Authentication (MFA - TOTP)** | `internal/auth/security.go` (`GenerateMFACode` / `VerifyMFACode`) | ✅ Terpenuhi |
| 3 | **Role-Based Access Control (RBAC)** | `internal/auth/middleware.go` (`RequireRole`) | ✅ Terpenuhi |
| 4 | **Digital Signature Transaksi (ECDSA P-256)** | `internal/blockchain/handler.go` (`SignPayload`) | ✅ Terpenuhi |
| 5 | **Hash Chain Integritas Blockchain (SHA-256)** | `internal/blockchain/handler.go` (`ComputeChainHash` & `/verify`) | ✅ Terpenuhi |
| 6 | **Keamanan Komunikasi Web (HSTS, CSP, Headers)** | `internal/auth/middleware.go` (`SecurityAndCORSMiddleware`) | ✅ Terpenuhi |
| 7 | **Proteksi Anti-DDoS & Brute Force (Rate Limiter)** | `internal/auth/middleware.go` (120 req/menit per IP + 1MB MaxBody) | ✅ Terpenuhi |
| 8 | **Logging & Audit Trail Real-Time** | `[AUDIT-LOG]` real-time & tabel `audit_logs` (*append-only*) | ✅ Terpenuhi |
| 9 | **Kepatuhan Regulasi (UU KIP, UU PDP, UU ITE)** | Filter `classification = 'public'`, `MaskPII`, Hash Signature | ✅ Terpenuhi |
| 10 | **Secure Coding Practices (CWE Top 25 / OWASP)** | Parameterized GORM query, HTML/XSS sanitization, Body Limit | ✅ Terpenuhi |
| 11 | **Audit Kerentanan & Integritas Dependensi** | Validasi kompilasi Go vendor & TypeScript strict mode | ✅ Terpenuhi |
| 12 | **Resiliensi Graceful Degradation & Self-Check** | Fallback di `frontend/src/services/api.ts` & `/api/v1/security/status` | ✅ Terpenuhi |

---

## Penyesuaian Ketentuan agar Sesuai Arsitektur Web

1. **Penghapusan RUU KKS ➔ Diganti dengan UU KIP No. 14 Tahun 2008:**
   - *Alasan:* RUU KKS belum disahkan menjadi undang-undang positif di Indonesia. Sebaliknya, **UU No. 14 Tahun 2008 tentang Keterbukaan Informasi Publik (UU KIP)** adalah landasan hukum wajib bagi portal transparansi publik untuk memisahkan *Informasi Publik*, *Terbatas*, dan *Dikecualikan*.
2. **Proteksi DDoS Eksternal ➔ Application-Level Per-IP Rate Limiter & Payload Limiter:**
   - *Alasan:* Agar tidak bergantung semata pada layanan berbayar pihak ketiga di luar kode, proteksi DDoS dan *brute force* ditanamkan langsung di layer middleware Go (`120 req/menit per IP` dan batas ukuran body `1 MB`).
3. **Incident Response Manual ➔ Automated Self-Audit & Graceful Degradation:**
   - *Alasan:* Sistem dilengkapi endpoint `/api/v1/security/status` dan `/api/v1/blockchain/verify` yang melakukan *self-test* kriptografi secara otomatis setiap saat, serta *Graceful Degradation* di sisi frontend agar dashboard tidak pernah lumpuh.
