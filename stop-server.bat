@echo off
title HalilBox Sunucu Durdurma
color 0C

echo.
echo ========================================
echo    HalilBox Sunucu Durdurma
echo ========================================
echo.

echo Node.js süreçleri durduruluyor...
taskkill /f /im node.exe >nul 2>&1

if %errorlevel% equ 0 (
    echo Sunucu başarıyla durduruldu.
) else (
    echo Çalışan sunucu bulunamadı.
)

echo.
echo İşlem tamamlandı.
pause 