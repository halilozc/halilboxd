# Firebase Authentication Kurulum Rehberi

Bu rehber, sitenize Firebase Authentication'ı nasıl entegre edeceğinizi adım adım açıklar.

## 1. Firebase Projesi Oluşturma

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. "Proje Ekle" butonuna tıklayın
3. Proje adını girin (örn: "halilboxd-auth")
4. Google Analytics'i etkinleştirmeyi seçebilirsiniz (isteğe bağlı)
5. "Proje Oluştur" butonuna tıklayın

## 2. Web Uygulaması Ekleme

1. Firebase Console'da projenizi açın
2. "Web" simgesine tıklayın (</>)
3. Uygulama takma adı girin (örn: "halilboxd-web")
4. "Firebase Hosting'i de kur" seçeneğini işaretleyebilirsiniz
5. "Uygulama Kaydet" butonuna tıklayın

## 3. Firebase Yapılandırma Bilgilerini Alma

Firebase size aşağıdaki gibi bir yapılandırma kodu verecek:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## 4. Kodu Güncelleme

`public/index.html` dosyasındaki Firebase yapılandırmasını güncelleyin:

```javascript
const firebaseConfig = {
    apiKey: "BURAYA_API_KEY_YAZIN",
    authDomain: "BURAYA_AUTH_DOMAIN_YAZIN",
    projectId: "BURAYA_PROJECT_ID_YAZIN",
    storageBucket: "BURAYA_STORAGE_BUCKET_YAZIN",
    messagingSenderId: "BURAYA_MESSAGING_SENDER_ID_YAZIN",
    appId: "BURAYA_APP_ID_YAZIN"
};
```

## 5. Authentication'ı Etkinleştirme

1. Firebase Console'da "Authentication" bölümüne gidin
2. "Başlayın" butonuna tıklayın
3. "Sign-in method" sekmesine gidin
4. Aşağıdaki yöntemleri etkinleştirin:

### E-posta/Şifre
- "E-posta/Şifre" seçeneğini tıklayın
- "Etkinleştir" seçeneğini işaretleyin
- "Kaydet" butonuna tıklayın

### Google
- "Google" seçeneğini tıklayın
- "Etkinleştir" seçeneğini işaretleyin
- Proje destek e-postası seçin
- "Kaydet" butonuna tıklayın

## 6. Güvenlik Kuralları (İsteğe Bağlı)

Eğer Firebase Firestore kullanmak isterseniz, güvenlik kurallarını ayarlayın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 7. Test Etme

1. Sitenizi açın
2. Sağ üst köşedeki "Giriş Yap" butonuna tıklayın
3. E-posta/şifre ile kayıt olun veya Google ile giriş yapın
4. Giriş yaptıktan sonra kullanıcı menüsünün göründüğünü kontrol edin

## 8. Özellikler

✅ E-posta/Şifre ile kayıt olma ve giriş yapma
✅ Google ile giriş yapma
✅ Kullanıcı profil bilgileri
✅ Oturum durumu takibi
✅ Güvenli çıkış yapma
✅ Kullanıcı verilerini kaydetme (localStorage ile)
✅ Responsive tasarım

## 9. Gelişmiş Özellikler (İsteğe Bağlı)

### Firebase Firestore Entegrasyonu

Kullanıcı verilerini Firebase'de saklamak için:

1. Firebase Console'da "Firestore Database" bölümüne gidin
2. "Veritabanı oluştur" butonuna tıklayın
3. Test modunda başlatın
4. `script.js` dosyasındaki `loadUserData` ve `saveUserData` fonksiyonlarını güncelleyin

### Şifre Sıfırlama

Şifre sıfırlama özelliği eklemek için:
1. Firebase Console'da Authentication > Sign-in method > E-posta/Şifre
2. "Şifre sıfırlama e-postası" seçeneğini etkinleştirin

## 10. Sorun Giderme

### Yaygın Hatalar:

1. **"Firebase is not defined" hatası**
   - Firebase SDK'sının doğru yüklendiğinden emin olun
   - Config bilgilerinin doğru olduğunu kontrol edin

2. **"auth/unauthorized-domain" hatası**
   - Firebase Console'da Authentication > Settings > Authorized domains
   - Sitenizin domain'ini ekleyin

3. **Google girişi çalışmıyor**
   - Firebase Console'da Authentication > Sign-in method > Google
   - Proje destek e-postasının doğru olduğunu kontrol edin

## 11. Güvenlik Notları

- API anahtarlarınızı güvenli tutun
- Production'da environment variables kullanın
- Firebase güvenlik kurallarını düzenli olarak gözden geçirin
- Kullanıcı verilerini şifreleyin

## Destek

Herhangi bir sorunla karşılaşırsanız:
1. Firebase Console'da hata mesajlarını kontrol edin
2. Browser console'da hata mesajlarını kontrol edin
3. Firebase dokümantasyonunu inceleyin 