# 📋 Katalog Lengkap Keamanan Siber & Kepatuhan — Nusantara Transparan

Dokumen ini mencatat seluruh **18 Jenis Keamanan Siber Berlapis (*Defense-in-Depth*)** yang digunakan dalam arsitektur **Nusantara Transparan**, lengkap dengan lokasi implementasi kodenya.

---

## Ringkasan 18 Lapisan Keamanan Siber

| No | Kategori | Jenis Keamanan Siber | Lokasi Implementasi Kode / File | Status |
| :-: | :--- | :--- | :--- | :-: |
| **1** | **Kriptografi** | **Enkripsi Data Sensitif at Rest (AES-256-GCM)** | `internal/auth/security.go` (`EncryptAES256` / `DecryptAES256`) | ✅ Aktif |
| **2** | **Kriptografi** | **Salted SHA-256 Password Hashing** | `internal/auth/handler.go` (`HashPassword`) | ✅ Aktif |
| **3** | **Kriptografi** | **Digital Signature Transaksi (ECDSA P-256)** | `internal/blockchain/handler.go` (`SignPayload`) | ✅ Aktif |
| **4** | **Blockchain** | **SHA-256 Hash Chain & DB Cross-Verification** | `internal/blockchain/handler.go` (`ComputeChainHash`, `inspectDatabaseMatch`) | ✅ Aktif |
| **5** | **Autentikasi** | **Kebijakan Kompleksitas Password Ketat (NIST/OWASP)** | `internal/auth/handler.go` (`ValidatePasswordStrength`) & `Admin.tsx` | ✅ Aktif |
| **6** | **Autentikasi** | **Anti-Brute Force Login Lockout (5x Gagal = Kunci 5 Menit)** | `internal/auth/handler.go` (`checkLoginLockout`, `recordFailedLogin`) | ✅ Aktif |
| **7** | **Autentikasi** | **Multi-Factor Authentication (MFA - TOTP 6-Digit)** | `internal/auth/security.go` (`GenerateMFACode` / `VerifyMFACode`) | ✅ Aktif |
| **8** | **Autentikasi** | **HMAC-SHA256 Signed Session Token** | `internal/auth/handler.go` (`generateSessionToken`) | ✅ Aktif |
| **9** | **Otorisasi** | **Role-Based Access Control (RBAC) & Four-Eyes Principle** | `internal/auth/middleware.go` (`RequireRole`) & `cmd/api/main.go` | ✅ Aktif |
| **10** | **In-App WAF** | **SQL Injection, XSS, & Path Traversal Payload Blocker** | `internal/auth/middleware.go` (`InspectMaliciousRequest`) | ✅ Aktif |
| **11** | **In-App WAF** | **Anti-Scanner & Exploit Bot Blocker (`sqlmap`, `nikto`, `nmap`)** | `internal/auth/middleware.go` (`blockedScanners`) | ✅ Aktif |
| **12** | **IPS** | **Intrusion Prevention System (3-Strikes Auto-Ban IP 15 Menit)** | `internal/auth/middleware.go` (`recordWAFStrike`) | ✅ Aktif |
| **13** | **Anti-DDoS** | **Per-IP Rate Limiter (120 req/mnt), 1MB Body Limit, & Anti-Slowloris** | `internal/auth/middleware.go` & `cmd/api/main.go` (`ReadHeaderTimeout: 5s`) | ✅ Aktif |
| **14** | **Web Security** | **Strict HTTP Security Headers (HSTS, CSP, X-Frame-Options, CORS)** | `internal/auth/middleware.go` (`SecurityAndCORSMiddleware`) | ✅ Aktif |
| **15** | **Jaringan** | **Network Firewall Port Isolation (UFW / iptables)** | `docs/architecture/firewall-ufw.sh` (Kunci port 5432, 7051, 9051, 5000, 8080) | ✅ Siap |
| **16** | **Reverse Proxy** | **Nginx Reverse Proxy, TLS 1.3, & Connection Limiter** | `docs/architecture/nginx-waf.conf` | ✅ Siap |
| **17** | **Auditability** | **Real-Time Security Logging & Append-Only Audit Trail** | `[AUDIT-LOG]` & tabel `audit_logs` PostgreSQL (tanpa *hard delete*) | ✅ Aktif |
| **18** | **Kepatuhan** | **Kepatuhan UU KIP No. 14/2008, UU PDP No. 27/2022, UU ITE, & AI Read-Only** | Filter `validation_status = 'published'`, `MaskPII`, & isolasi AI *Read-Only* | ✅ Aktif |

---

## Verifikasi Unit Test Keamanan Otomatis

Seluruh lapisan pertahanan kode diuji otomatis melalui [`backend/internal/auth/security_test.go`](file:///c:/bred/Nusantara%20Tranparansi/nusantara-transparan/backend/internal/auth/security_test.go):
1. `TestAES256EncryptionDecryption` — Uji enkripsi & dekripsi AES-256-GCM.
2. `TestMFATOTPGenerationAndVerification` — Uji kode OTP 6-digit TOTP.
3. `TestRBACMiddlewareEnforcement` — Uji penolakan akses ilegal (`403 Forbidden`) dan izin akses sah.
4. `TestPIIMaskingCompliance` — Uji penyamaran identitas pribadi (UU PDP).
5. `TestPasswordPolicyValidation` — Uji penolakan password lemah & penerimaan password kuat ($\ge 10$ karakter, huruf besar, kecil, angka, simbol).
6. `TestLoginBruteForceLockout` — Uji penguncian otomatis setelah 5x gagal login.
7. `TestInAppWAFBlocksAttacksAndScanners` — Uji pemblokiran serangan SQL Injection (`UNION SELECT`), XSS (`<script>`), dan scanner (`sqlmap`).
