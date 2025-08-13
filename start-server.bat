@echo off
title HalilBox Film ve Dizi Sitesi
color 0A

echo.
echo ========================================
echo    HalilBox Film ve Dizi Sitesi
echo ========================================
echo.
echo Sunucu başlatılıyor...
echo.

:: Node.js'in yüklü olup olmadığını kontrol et
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo HATA: Node.js yüklü değil!
    echo Lütfen https://nodejs.org adresinden Node.js'i indirin ve yükleyin.
    echo.
    pause
    exit /b 1
)

:: package.json dosyasının varlığını kontrol et
if not exist "package.json" (
    echo HATA: package.json dosyası bulunamadı!
    echo Lütfen doğru dizinde olduğunuzdan emin olun.
    echo.
    pause
    exit /b 1
)

:: Bağımlılıkları kontrol et ve gerekirse yükle
if not exist "node_modules" (
    echo Bağımlılıklar yükleniyor...
    npm install
    if %errorlevel% neq 0 (
        echo HATA: Bağımlılıklar yüklenemedi!
        pause
        exit /b 1
    )
    echo Bağımlılıklar başarıyla yüklendi.
    echo.
)

:: Sunucuyu başlat
echo Sunucu başlatılıyor...
echo Tarayıcınızda http://localhost:8000 adresini açın
echo.
echo Sunucuyu durdurmak için Ctrl+C tuşlarına basın
echo.
echo ========================================
echo.

npm start

echo.
echo Sunucu durduruldu.
pause 