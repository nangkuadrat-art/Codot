@echo off
title Co. (Codot) RKPD - Online Server (Cloudflare Tunnel)
color 0A

echo ===============================================================================
echo        Co. Codot - Kolaborasi Penyusunan Naskah RKPD Online (Gratis)
echo ===============================================================================
echo.
echo [1/2] Memastikan Server Lokal Berjalan di Port 5000...

:: Cek apakah server node sudah jalan
netstat -ano | findstr :5000 > nul
if %ERRORLEVEL% equ 0 (
    echo [OK] Server lokal sudah aktif di http://localhost:5000
) else (
    echo [*] Menjalankan server aplikasi di latar belakang...
    start /b "" node server/index.js > nul 2>&1
    timeout /t 3 > nul
)

echo.
echo [2/2] Menghubungkan ke Jaringan Global Cloudflare (HTTPS Aman & Gratis)...
echo.
echo -------------------------------------------------------------------------------
echo Link publik HTTPS Anda akan muncul di bawah ini (Cari baris *.trycloudflare.com):
echo Salin dan bagikan link tersebut kepada Kontributor OPD dan Reviewer.
echo -------------------------------------------------------------------------------
echo.

cloudflared.exe tunnel --url http://localhost:5000

pause
