# 🎬 halilboxd

**Letterboxd bizi kıskanıyor!** 

halilboxd, film ve dizi arama, favori listesi oluşturma ve izleme geçmişi takibi yapabileceğiniz modern bir web uygulamasıdır. Trakt API kullanarak film/dizi bilgilerini çeker ve Firebase ile kullanıcı kimlik doğrulaması sağlar.

## ✨ Özellikler

### 🎯 Temel Özellikler
- **Film ve Dizi Arama**: Trakt API ile gerçek zamanlı arama
- **Detaylı Bilgiler**: Poster, yıl, tür, süre, yönetmen, oyuncular, puan ve özet
- **Kullanıcı Kimlik Doğrulaması**: Firebase Authentication ile güvenli giriş
- **Favori Listeleri**: Film ve dizileri favorilere ekleme
- **İzleme Geçmişi**: İzlenen içerikleri takip etme
- **Daha Sonra İzle**: İzleme listesi oluşturma

### 🔐 Kimlik Doğrulama
- E-posta/şifre ile kayıt olma ve giriş yapma
- Google ile tek tıkla giriş yapma
- Güvenli oturum yönetimi
- Kullanıcı profil bilgileri

### 📱 Kullanıcı Arayüzü
- Modern ve responsive tasarım
- Tailwind CSS ile şık görünüm
- Koyu tema
- Mobil uyumlu arayüz
- Bildirim sistemi

## 🚀 Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn
- Firebase hesabı
- Trakt API anahtarı

### Adım Adım Kurulum

1. **Projeyi klonlayın**
```bash
git clone https://github.com/halilozc/halilboxd.git
cd halilboxd
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Firebase kurulumu**
   - [Firebase Console](https://console.firebase.google.com/)'a gidin
   - Yeni proje oluşturun
   - Web uygulaması ekleyin
   - `FIREBASE_SETUP.md` dosyasındaki adımları takip edin

4. **Trakt API anahtarı alın**
   - [Trakt API](https://trakt.tv/oauth/applications) sitesine gidin
   - Yeni uygulama oluşturun
   - Client ID ve Client Secret alın
   - `server.js` dosyasında `TRAKT_CLIENT_ID` ve `TRAKT_CLIENT_SECRET` değişkenlerini güncelleyin

5. **Uygulamayı başlatın**
```bash
npm start
```

6. **Tarayıcıda açın**
```
http://localhost:8000
```

## 🛠️ Teknolojiler

### Frontend
- **HTML5**: Semantik yapı
- **CSS3**: Modern stillendirme
- **Tailwind CSS**: Utility-first CSS framework
- **JavaScript (ES6+)**: Dinamik etkileşimler
- **Font Awesome**: İkonlar

### Backend
- **Node.js**: Server-side JavaScript
- **Express.js**: Web framework
- **node-fetch**: HTTP istekleri

### Veritabanı & Kimlik Doğrulama
- **Firebase Authentication**: Kullanıcı kimlik doğrulaması
- **Firebase Firestore**: Veri depolama (opsiyonel)
- **Trakt API**: Film/dizi verileri

## 📁 Proje Yapısı

```
halilboxd/
├── public/                 # Statik dosyalar
│   ├── index.html         # Ana HTML dosyası
│   ├── style.css          # CSS stilleri
│   ├── script.js          # JavaScript kodu
│   └── yok.PNG           # Görsel dosyalar
├── server.js              # Express sunucu
├── package.json           # Proje bağımlılıkları
├── FIREBASE_SETUP.md      # Firebase kurulum rehberi
├── start-server.bat       # Windows başlatma scripti
├── stop-server.bat        # Windows durdurma scripti
└── README.md              # Bu dosya
```

## 🔧 API Endpoints

### Arama API
```
GET /api/search?query={arama_terimi}
```
Film ve dizi arama yapar.

### Detay API
```
GET /api/details?imdbID={imdb_id}
```
Belirli bir film/dizinin detaylı bilgilerini getirir.

## 🎨 Kullanım

### Film/Dizi Arama
1. Ana sayfada arama kutusuna film/dizi adını yazın
2. "Ara" butonuna tıklayın
3. Sonuçlar arasından istediğinizi seçin

### Kullanıcı İşlemleri
1. Sağ üst köşedeki "Giriş Yap" butonuna tıklayın
2. E-posta/şifre ile kayıt olun veya Google ile giriş yapın
3. Giriş yaptıktan sonra favori listelerinizi yönetebilirsiniz

### Liste Yönetimi
- **Favori Filmler**: Beğendiğiniz filmleri kaydedin
- **Favori Diziler**: Beğendiğiniz dizileri kaydedin
- **İzlendi**: İzlediğiniz içerikleri işaretleyin
- **Daha Sonra İzle**: İzlemek istediğiniz içerikleri listeleyin

## 🔒 Güvenlik

- Firebase Authentication ile güvenli kimlik doğrulama
- API anahtarları server-side'da saklanır
- HTTPS kullanımı (production'da)
- Kullanıcı verileri şifrelenir

## 🚀 Deployment

### Vercel ile Deployment
1. Vercel hesabı oluşturun
2. GitHub reponuzu bağlayın
3. Environment variables ekleyin:
   - `TRAKT_CLIENT_ID`
   - `TRAKT_CLIENT_SECRET`
   - Firebase config bilgileri
4. Deploy edin

### Heroku ile Deployment
1. Heroku hesabı oluşturun
2. Heroku CLI ile bağlanın
3. Environment variables ekleyin
4. Deploy edin

## 🤝 Katkıda Bulunma

1. Bu repository'yi fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 🙏 Teşekkürler

- [Trakt API](https://trakt.tv/oauth/applications) - Film/dizi verileri için
- [Firebase](https://firebase.google.com/) - Kimlik doğrulama ve veritabanı için
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework için
- [Font Awesome](https://fontawesome.com/) - İkonlar için

## 📞 İletişim

- **GitHub**: [@halilozcc](https://github.com/halilozcc)
- **E-posta**: halilozccc@gmail.com

## 🔄 Güncellemeler

### v1.0.1
- Takvim özelliği eklendi
- Temel film/dizi arama özelliği
- Firebase kimlik doğrulaması
- Favori listesi yönetimi

