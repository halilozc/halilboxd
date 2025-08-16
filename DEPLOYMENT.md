# 🚀 Vercel Deployment Rehberi

Bu rehber, halilboxd projenizi Vercel'e nasıl deploy edeceğinizi adım adım açıklar.

## 📋 Ön Gereksinimler

1. **GitHub hesabı** - Projeniz GitHub'da olmalı
2. **Vercel hesabı** - [vercel.com](https://vercel.com) üzerinden ücretsiz hesap oluşturun
3. **Trakt API anahtarı** - [Trakt API](https://trakt.tv/oauth/applications) sitesinden alın

## 🔧 Adım Adım Deployment

### 1. GitHub'a Yükleme

Eğer projeniz henüz GitHub'da değilse:

```bash
# Git repository'sini başlatın
git init

# Dosyaları ekleyin
git add .

# İlk commit'i yapın
git commit -m "Initial commit"

# GitHub'da yeni repository oluşturun ve remote ekleyin
git remote add origin https://github.com/kullaniciadi/halilboxd.git
git branch -M main
git push -u origin main
```

### 2. Vercel'e Bağlanma

1. [Vercel Dashboard](https://vercel.com/dashboard)'a gidin
2. "New Project" butonuna tıklayın
3. GitHub hesabınızı bağlayın (eğer bağlı değilse)
4. `halilboxd` repository'sini seçin

### 3. Proje Ayarları

Vercel otomatik olarak projenizi algılayacaktır. Ayarları şu şekilde yapılandırın:

- **Framework Preset**: `Node.js`
- **Root Directory**: `./` (varsayılan)
- **Build Command**: `npm run build` (otomatik algılanacak)
- **Output Directory**: `public` (otomatik algılanacak)
- **Install Command**: `npm install` (otomatik algılanacak)

### 4. Environment Variables Ekleme

**ÖNEMLİ**: Bu adımı deployment öncesinde yapın!

1. Vercel proje ayarlarında "Environment Variables" sekmesine gidin
2. Aşağıdaki değişkenleri ekleyin:

#### Trakt API Keys
- **Name**: `TRAKT_CLIENT_ID`
- **Value**: Trakt API Client ID'niz
- **Environment**: Production, Preview, Development (hepsini seçin)

- **Name**: `TRAKT_CLIENT_SECRET`
- **Value**: Trakt API Client Secret'ınız
- **Environment**: Production, Preview, Development (hepsini seçin)

#### Firebase Config (Opsiyonel)
Eğer Firebase kullanıyorsanız:

- **Name**: `FIREBASE_API_KEY`
- **Value**: Firebase API anahtarınız
- **Environment**: Production, Preview, Development

### 5. Deploy Etme

1. "Deploy" butonuna tıklayın
2. Vercel otomatik olarak projenizi build edecek ve deploy edecek
3. Deployment tamamlandığında size bir URL verilecek (örn: `https://halilboxd.vercel.app`)

## 🔍 Deployment Sonrası Kontroller

### 1. Ana Sayfa Kontrolü
- Verilen URL'yi ziyaret edin
- Ana sayfa yükleniyor mu kontrol edin
- Arama kutusu çalışıyor mu test edin

### 2. API Endpoint Kontrolü
- `https://your-app.vercel.app/api/search?query=batman` adresini test edin
- JSON response alıyor musunuz kontrol edin

### 3. Firebase Kontrolü
- Giriş yapma özelliği çalışıyor mu test edin
- Google ile giriş yapabiliyor musunuz kontrol edin

## 🛠️ Sorun Giderme

### Yaygın Hatalar ve Çözümleri

#### 1. "Module not found" Hatası
```
Error: Cannot find module 'express'
```
**Çözüm**: `package.json` dosyasında `dependencies` bölümünün doğru olduğundan emin olun.

#### 2. "TRAKT_CLIENT_ID is not defined" Hatası
```
Error: TRAKT_CLIENT_ID is not defined
```
**Çözüm**: Environment variable'ı doğru şekilde eklediğinizden emin olun.

#### 3. "Port already in use" Hatası
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Çözüm**: `server.js` dosyasında `process.env.PORT` kullandığınızdan emin olun.

#### 4. Static Files Not Found
```
Error: Cannot GET /style.css
```
**Çözüm**: `vercel.json` dosyasının doğru yapılandırıldığından emin olun.

## 🔄 Güncellemeler

### Yeni Versiyon Deploy Etme

1. Kodunuzu güncelleyin
2. GitHub'a push edin:
```bash
git add .
git commit -m "Update: yeni özellik eklendi"
git push origin main
```
3. Vercel otomatik olarak yeni deployment başlatacak

### Manuel Deploy

1. Vercel Dashboard'da projenizi açın
2. "Deployments" sekmesine gidin
3. "Redeploy" butonuna tıklayın

## 📊 Monitoring

### Vercel Analytics
- Vercel Dashboard'da "Analytics" sekmesini kullanın
- Ziyaretçi sayısı, performans metrikleri görüntüleyin

### Logs
- "Functions" sekmesinde serverless function loglarını görüntüleyin
- Hata ayıklama için kullanın

## 🔒 Güvenlik

### Environment Variables
- API anahtarlarınızı asla kod içinde tutmayın
- Vercel Environment Variables kullanın
- Production'da güvenli değerler kullanın

### Domain Ayarları
- Custom domain eklemek isterseniz Vercel Dashboard'dan yapabilirsiniz
- SSL sertifikası otomatik olarak sağlanır

## 📞 Destek

Sorun yaşarsanız:
1. Vercel dokümantasyonunu inceleyin
2. Vercel Discord topluluğuna katılın
3. GitHub Issues'da sorun bildirin

---

**Başarılı deployment!** 🎉 Projeniz artık canlıda! 🚀 