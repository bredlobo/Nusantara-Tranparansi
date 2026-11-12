# Nusantara Transparan — Spesifikasi & Aturan Arsitektur Proyek

Dokumen ini adalah pedoman utama (single source of truth) untuk seluruh pengembangan proyek **Nusantara Transparan**. Semua implementasi kode, arsitektur, dan integrasi modul wajib mematuhi aturan di dalam file ini.

---

## 1. Fitur Utama

1. **Financial Dashboard** — Ringkasan pemasukan, pengeluaran, anggaran, dan realisasi.
2. **State Revenue** — Informasi penerimaan negara (pajak, PNBP, hibah, dll.).
3. **State Expenditure** — Informasi belanja negara (belanja kementerian/lembaga, subsidi, transfer ke daerah, dll.).
4. **Project Monitoring** — Pemantauan proyek pemerintah (status fisik, serapan anggaran, vendor, lokasi).
5. **Blockchain Verification** — Verifikasi integritas data dan jejak audit riwayat perubahan (immutability).
6. **AI Anomaly Detection** — Identifikasi anomali dan pola pengeluaran yang tidak biasa atau mencurigakan.
7. **AI Financial Assistant** — Asisten berbasis LLM & RAG agar masyarakat dapat bertanya secara interaktif tentang data keuangan negara.
8. **Public Search** — Fitur pencarian data publik komprehensif berdasarkan kategori, periode waktu, instansi/kementerian, dan nama proyek.
9. **Admin Dashboard** — Panel pengelolaan, validasi, kurasi, dan publikasi data resmi.
10. **Audit & Review** — Alur kerja pemeriksaan dan persetujuan (approval) berjenjang oleh pihak berwenang/auditor.

---

## 2. Arsitektur Teknologi

| Bagian | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend** | React / Next.js, TypeScript | Antarmuka pengguna interaktif dan responsif |
| **Styling** | Tailwind CSS | Desain modern, konsisten, dan mudah dikustomisasi |
| **Grafik & Visualisasi** | Recharts | Visualisasi data interaktif (bar, line, pie, area chart) |
| **Backend** | Go (Golang), REST API | Layanan API performa tinggi, concurrency aman, clean architecture |
| **Database** | PostgreSQL | Penyimpanan relasional utama (ACID compliant) |
| **Blockchain** | Hyperledger Fabric | Private permissioned blockchain untuk audit trail dan verifikasi |
| **Smart Contract** | Go Chaincode | Logika pencatatan hash, verifikasi integritas, dan audit log di blockchain |
| **AI / ML** | Python, Pandas, Scikit-learn, LLM, RAG | Mesin analitik data, deteksi anomali, serta asisten tanya-jawab cerdas |

---

## 3. Aturan Arsitektur yang Tidak Boleh Dilanggar

Setiap perancangan dan penulisan kode wajib mematuhi 9 prinsip mutlak berikut:

1. **Backend Menjadi Sumber Utama Data:**  
   Seluruh data resmi harus diproses dan disajikan melalui backend Go. Tidak ada bypass data.
2. **Frontend Tidak Boleh Mengakses Database Secara Langsung:**  
   Frontend hanya berkomunikasi dengan backend melalui REST API yang terautentikasi dan tervalidasi.
3. **Blockchain Menyimpan Hash dan Metadata Saja:**  
   Blockchain **tidak menyimpan seluruh isi dokumen/file keuangan**, melainkan hanya cryptographic hash (misal SHA-256), timestamp, ID transaksi, dan metadata integritas untuk pembuktian keaslian (proof of integrity).
4. **AI Hanya Membaca Data yang Diizinkan:**  
   AI beroperasi secara *read-only* pada dataset publik atau data yang diizinkan. AI **dilarang keras** memiliki izin mengubah, menimpa, atau memperbarui catatan resmi keuangan negara.
5. **Resiliensi Dashboard (Graceful Degradation):**  
   Dashboard utama harus tetap dapat berjalan normal dan menampilkan data keuangan meskipun layanan AI atau jaringan blockchain sedang offline / tidak tersedia.
6. **Integritas Metadata Data Wajib Lengkap:**  
   Setiap data keuangan wajib mencantumkan:
   - Sumber data resmi
   - Periode anggaran (tahun/bulan/triwulan)
   - Waktu pembaruan terakhir (*last updated timestamp*)
   - Status validasi (misal: *draft*, *reviewed*, *approved*, *published*)
7. **Koreksi Data Mempertahankan Riwayat (Audit Trail):**  
   Tidak ada penghapusan data mutlak (*hard delete*) pada data yang telah dipublikasikan. Setiap koreksi/revisi harus membuat versi baru (*append-only / versioning*) dengan mempertahankan riwayat data sebelumnya.
8. **Pemisahan Anggaran, Realisasi, dan Transaksi:**  
   Harus ada pemisahan domain yang jelas antara:
   - **Anggaran (Budget/Pagu):** Alokasi dana yang direncanakan.
   - **Realisasi (Actual):** Serapan kumulatif dana yang telah digunakan.
   - **Transaksi (Transactions):** Catatan pengeluaran/penerimaan spesifik per kejadian.  
   Hal ini untuk mencegah penghitungan ganda (*double counting*).
9. **Klasifikasi Hak Akses & Kerahasiaan Data:**  
   Sistem harus memisahkan secara ketat 3 tingkat aksesibilitas informasi:
   - **Publik:** Dapat diakses bebas oleh seluruh masyarakat.
   - **Terbatas:** Hanya dapat diakses oleh pihak berwenang / instansi terkait.
   - **Dikecualikan:** Rahasia negara / data sensitif yang dilindungi undang-undang.

---

## 4. Rencana Pengembangan

| Tahap | Pekerjaan | Fokus Utama |
| :---: | :--- | :--- |
| **1** | **Riset, SRS, ERD, API, UI/UX** | Pengumpulan kebutuhan, perancangan basis data, kontrak API, dan desain antarmuka. |
| **2** | **Frontend, Backend, Database, dan Impor Data** | Pembangunan core REST API (Go), database PostgreSQL, frontend dashboard, dan pipeline impor data awal. |
| **3** | **Blockchain dan Verifikasi** | Setup jaringan Hyperledger Fabric, penulisan Go chaincode, dan integrasi fungsi hash verification. |
| **4** | **AI, Machine Learning, dan AI Assistant** | Pembuatan modul deteksi anomali (Scikit-learn/Pandas) dan pipeline RAG/LLM untuk asisten keuangan. |
| **5** | **Integrasi, Keamanan, dan Pengujian** | Integrasi end-to-end antar modul, audit keamanan, rate limiting, role-based access, dan unit/integration testing. |
| **6** | **Pilot APBN Nasional dan Evaluasi** | Uji coba publik terbatas dengan data real APBN, pengumpulan umpan balik pengguna, dan evaluasi performa. |

