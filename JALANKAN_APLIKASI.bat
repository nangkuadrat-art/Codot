@echo off
title DocuCollab RKPD - Sistem Kolaborasi Penyusunan Naskah
color 0B

echo =====================================================================
echo       DOCUCOLLAB RKPD - SISTEM MULTI-USER EDITOR NASKAH
echo =====================================================================
echo.
echo Memulai Server Aplikasi...
echo Server Port: 5000
echo.

start "" "http://localhost:5000"
node server/index.js

pause
