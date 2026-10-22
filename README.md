# DocuCollab RKPD - Sistem Kolaboratif Penyusunan Naskah & Dokumen Daerah

Aplikasi web kolaboratif multi-user untuk menyusun dan mengedit dokumen tebal (seperti **BAB II RKPD**, Renstra, LPPD, atau Laporan Tahunan) dengan pembagian hak akses (*granular access control*) per BAB, Sub-Bab, narasi, dan tabel.

---

## Fitur Utama

1. **Import Dokumen Word (.docx) Otomatis**:
   - Mengurai file `.docx` menjadi struktur hierarki:
     - Level 1: `BAB ...`
     - Level 2: `Sub-Bab (2.1 ...)`
     - Level 3: `Sub-Sub-Bab (2.1.1 ...)`
     - Level 4: Poin Narasi / Tabel Data
   - Terdapat tombol khusus untuk langsung mengimpor arsip file naskah RKPD 2027 yang tersimpan di komputer Anda.

2. **Kontrol Hak Akses Berbasis Bagian (Section-Based RBAC)**:
   - Admin Bappeda dapat menentukan secara tepat: OPD atau User mana yang boleh menyunting Sub-Bab tertentu.
   - **Mode Editor**: Kontributor yang ditugaskan dapat mengedit narasi dan tabel dengan fitur auto-save real-time.
   - **Mode Read-Only**: Kontributor yang tidak ditugaskan atau bagian yang terkunci hanya dapat membaca naskah dan meninggalkan catatan review.
   - **Matriks Hak Akses Seluruh Bab**: Tampilan tabel grid untuk mengatur delegasi seluruh naskah dalam satu layar.

3. **Editor Teks Kaya (WYSIWYG)**:
   - Pemformatan teks (Tebal, Miring, Garis Bawah, Ukuran Judul).
   - Penyisipan **Tabel Indikator Kinerja / Capaian Makro**.
   - Penyisipan **Kotak Landasan Regulasi & Kebijakan**.
   - Penyimpanan otomatis (*Auto-save debounced*) agar data tidak hilang.

4. **Workflow & Validasi Mutu**:
   - Status pengerjaan: `🟡 Draft` ➔ `🔵 Dalam Pengerjaan` ➔ `🟣 Siap Direview` ➔ `🟢 Disetujui (Approved)`.
   - Thread catatan review per sub-bab untuk koordinasi perbaikan antara Reviewer dan OPD.
   - Kunci naskah (*Locking*) setelah disetujui untuk mencegah perubahan tidak disengaja.

5. **Ekspor Terpadu ke Microsoft Word (.docx)**:
   - Mengompilasi seluruh Bab, Sub-Bab, narasi, dan tabel yang telah selesai menjadi satu file `.docx` utuh siap cetak.

6. **Integrasi Google Drive & Pencadangan Otomatis (100% Gratis)**:
   - **Sinkronisasi Folder Google Drive**: Mengarahkan backup data dan file Word langsung ke folder Google Drive Anda (misal: `G:\My Drive\RKPD 2027` atau `D:\RKPD_GOOGLE_DRIVE_BACKUP`).
   - **Auto-Sync**: Setiap kali naskah disimpan oleh OPD, sistem otomatis mencadangkan file database JSON dan dokumen Word terbaru.
   - **Google Cloud Service Account API**: Mendukung upload langsung ke cloud Google Drive melalui REST API.
   - **Pemulihan Database (Restore)**: Mengembalikan draf naskah dari snapshot cadangan kapan saja hanya dengan 1 klik.

7. **Simulator Ganti Peran (Role Switcher)**:
   - Dropdown di bilah atas untuk beralih instan antar akun:
     - 👑 **Admin Bappeda (Koordinator)**
     - 🩺 **Dinas Kesehatan (dr. Siti Aminah)**
     - 🎓 **Dinas Pendidikan (Drs. Budi Santoso)**
     - 🏢 **Bidang PPM Bappeda (Rina Marlina)**
     - 📈 **Bidang Ekonomi Bappeda (Ir. Agus)**
     - 🔍 **Dr. Joko Susanto (Reviewer Ahli)**

---

## Cara Menjalankan Aplikasi

### Cara 1: Menggunakan File Batch (Paling Praktis)
Cukup klik dua kali file:
```
JALANKAN_APLIKASI.bat
```
Browser akan otomatis terbuka ke alamat `http://localhost:5000`.

### Cara 2: Melalui Terminal / Command Prompt
```bash
npm start
```
Buka browser di `http://localhost:5000`.

---

## Struktur Folder

```
APLIKASI/
├── server/
│   ├── index.js          # Express API server & static server
│   ├── db.js             # Database handler (users, sections, documents)
│   └── docxService.js    # Docx parser (mammoth) & compiler (docx)
├── client/
│   ├── src/
│   │   ├── components/   # Navbar, Workspace, Table of Contents, Editor, Matrix
│   │   ├── api.js        # API client
│   │   └── App.jsx       # Main application controller
│   └── dist/             # Frontend production build
├── data/
│   └── database.json     # Penyimpanan data naskah & riwayat (JSON Database)
├── uploads/              # Penyimpanan sementara file unggahan
├── JALANKAN_APLIKASI.bat # Shortcut peluncur aplikasi
└── package.json
```
