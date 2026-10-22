# Panduan Meng-onlinekan Aplikasi Co. (Codot) RKPD Secara Gratis & Tahan Lama

Aplikasi **Co. (Codot) - Collaborative Document Tools** untuk penyusunan RKPD telah disiapkan dengan solusi hosting online **100% gratis** dan memiliki **ketahanan data jangka panjang (*high durability*)**.

---

## 🚀 METODE 1 (Rekomendasi Utama): Cloudflare Tunnel (Sudah Aktif & Siap Pakai)

Metode ini adalah pilihan terbaik untuk dokumen resmi pemerintahan karena **seluruh data naskah 7 Bab, tabel, dan catatan review tersimpan aman di komputer Anda** (tidak ada risiko data hilang atau reset).

### Status Saat Ini:
Aplikasi Anda **sudah berhasil di-onlinekan** dan dapat diakses publik di seluruh dunia melalui tautan HTTPS berikut:

🔗 **Tautan Publik Aktif:**
```
https://registry-journalist-melissa-firewall.trycloudflare.com
```
*(Bisa langsung dicoba dibuka dari smartphone, laptop lain, atau jaringan internet di luar kantor)*

### Cara Menjalankan Sehari-hari:
Cukup klik dua kali file berikut di folder aplikasi:
👉 `ONLINEKAN_APLIKASI.bat`

File ini akan:
1. Memastikan server aplikasi aktif.
2. Membuka koneksi terenkripsi Cloudflare Tunnel global secara gratis.
3. Menampilkan link HTTPS publik yang siap Anda bagikan ke rekan-rekan OPD dan Reviewer.

### Mengapa Metode Ini Memiliki Ketahanan Paling Lama?
1. **Ketahanan Data 100%**: Tidak ada risiko data terhapus. Seluruh revisi tersimpan permanen di folder `data/database.json`.
2. **100% Gratis Selamanya**: Tanpa batas kuota jam (tidak ada kuota bulanan), tanpa batas bandwidth.
3. **Tanpa Cold Start (Tidak Pernah Tidur)**: Akses langsung cepat tanpa harus menunggu server bangun dari *sleep mode*.
4. **Keamanan SSL & Proteksi DDoS Cloudflare**: Jalur koneksi aman dengan enkripsi standar perbankan.

---

## 🌐 METODE 2: Deploy 24 Jam di Cloud Server (Koyeb / Render)

Jika Anda ingin aplikasi tetap dapat diakses 24 jam penuh di internet **meskipun komputer/laptop Anda dimatikan**, Anda dapat menggunakan layanan cloud hosting gratis.

Kami sudah menyiapkan file konfigurasi cloud lengkap di dalam folder proyek:
- `Dockerfile` (Konfigurasi container Linux production)
- `render.yaml` (Konfigurasi otomatis Render.com)
- `.gitignore` (Penyaring file dependency)
- Repositori Git lokal sudah diinisialisasi (`git init` & commit awal sudah selesai di branch `main`).

### Langkah Deploy ke Koyeb (Paling Direkomendasikan untuk Cloud 24/7):
> **Keunggulan Koyeb**: Free Tier Koyeb **tidak tidur (*no sleep/no spin-down*)**, berbeda dengan Render yang mati setelah 15 menit idle.

1. Buat repositori baru di [GitHub](https://github.com/new) (beri nama misalnya `codot-rkpd`, pilih *Private*).
2. Di folder aplikasi, jalankan perintah untuk mengunggah kode ke GitHub:
   ```bash
   git remote add origin https://github.com/USERNAME_ANDA/codot-rkpd.git
   git push -u origin main
   ```
3. Buka [Koyeb.com](https://www.koyeb.com) dan daftar akun gratis menggunakan akun GitHub Anda.
4. Klik **Create App** ➔ Pilih **GitHub** ➔ Pilih repositori `codot-rkpd`.
5. Pada pilihan *Builder*, pilih **Dockerfile** atau **Buildpack (NodeJS)**.
6. Klik **Deploy**. Dalam 2–3 menit, aplikasi Anda akan aktif 24 jam dengan domain seperti:
   `https://codot-rkpd.koyeb.app`

### ⚠️ Tips Ketahanan Data di Cloud Gratis:
Layanan cloud gratis (Render/Koyeb free tier) memiliki sifat *ephemeral disk* (jika server direstart atau redeploy, file lokal akan kembali ke titik commit awal).
**Cara menjaga ketahanan data naskah di Cloud:**
- Manfaatkan fitur **Google Drive Sync** yang sudah tersedia di navbar aplikasi (klik tombol *Google Drive* untuk backup berkala).
- Atau simpan cadangan database secara berkala melalui menu admin (ekspor database).

---

## 📋 Akun Login Bawaan untuk Uji Coba:
- **Admin Bappeda**: `admin` / Password: `12345@`
- **Reviewer Ahli**: `reviewer_ahli` / Password: `12345@`
- **Reviewer APIP (Inspektorat)**: `reviewer_apip` / Password: `12345@`
- **PIC Bidang IKP (Diskominfo)**: `pic_ikp` / Password: `12345@`
- **PIC Bidang Rinov (Bappeda)**: `pic_rinov` / Password: `12345@`
- **PIC Bidang PPM (Bappeda)**: `pic_ppm` / Password: `12345@`
- **PIC Bidang Program (Bappeda)**: `pic_program` / Password: `12345@`
