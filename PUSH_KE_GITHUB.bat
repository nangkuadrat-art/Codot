@echo off
title Co. (Codot) RKPD - Unggah ke GitHub & Deploy Render
color 0B

echo ===============================================================================
echo       UNGGAH KODE KE GITHUB DAN DEPLOY 24/7 KE RENDER.COM
echo ===============================================================================
echo.
echo Langkah 1: Buat Repositori Baru di GitHub (jika belum):
echo   - Buka browser: https://github.com/new
echo   - Beri nama repository, misal: codot-rkpd
echo   - Pilih "Public" atau "Private"
echo   - JANGAN centang "Add a README" atau ".gitignore"
echo   - Klik tombol hijau "Create repository"
echo.
echo Langkah 2: Masukkan URL Repositori GitHub Anda di bawah ini
echo (Contoh: https://github.com/username-anda/codot-rkpd.git)
echo.
set /p REPO_URL="URL GitHub Anda: "

if "%REPO_URL%"=="" (
    echo.
    echo [ERROR] URL tidak boleh kosong! Silakan jalankan ulang script ini.
    pause
    exit /b
)

echo.
echo [*] Menghubungkan ke remote origin...
git remote remove origin > nul 2>&1
git remote add origin %REPO_URL%
git branch -M main

echo [*] Mengunggah kode dan database template ke GitHub...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ===============================================================================
    echo [SUKSES] KODE BERHASIL DIUNGGAH KE GITHUB!
    echo ===============================================================================
    echo.
    echo Sekarang lakukan langkah terakhir untuk Deploy 24/7 di Render.com:
    echo.
    echo 1. Buka https://dashboard.render.com
    echo 2. Klik tombol "New +" di pojok kanan atas, pilih "Web Service"
    echo 3. Pilih repositori GitHub yang baru saja Anda buat tadi
    echo 4. Pada pengaturan, pastikan:
    echo      - Region: Singapore (Tercepat untuk Indonesia)
    echo      - Branch: main
    echo      - Build Command: npm install ^&^& npm run build
    echo      - Start Command: node server/index.js
    echo      - Instance Type: Free
    echo 5. Klik "Create Web Service"
    echo.
    echo Dalam 2 menit aplikasi Co. (Codot) akan aktif 24 jam di internet!
    echo ===============================================================================
) else (
    echo.
    echo [PERIKSA] Gagal push ke GitHub. Pastikan:
    echo 1. Anda sudah login ke akun GitHub di komputer ini.
    echo 2. URL repository benar dan akun Anda memiliki izin akses.
)

echo.
pause
