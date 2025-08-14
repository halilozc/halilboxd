// Firebase Authentication Functions
window.currentUser = null;

// Favorites storage - will be loaded from Firebase
let favorites = {
    movies: [],
    shows: [],
    watchlistMovies: [],
    watchlistShows: [],
    watchedMovies: [],
    watchedShows: [],
    userRatings: {}
};

// Auth state observer
const initAuth = () => {
    if (window.auth) {
        console.log('Auth initialized');
        window.auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User logged in:', user.uid);
                window.currentUser = user;
                updateUIForUser(user);
                // showNotification will be called after it's defined
                setTimeout(() => {
                    if (typeof showNotification === 'function') {
                        showNotification(`Hoş geldin, ${user.displayName || user.email}!`, 'success');
                    }
                }, 100);
            } else {
                console.log('User logged out');
                window.currentUser = null;
                updateUIForGuest();
            }
        });
    } else {
        console.error('Auth not available');
    }
};

// Firebase Authentication Functions
const handleEmailLogin = async () => {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Lütfen tüm alanları doldurun!', 'error');
        return;
    }
    
    try {
        await window.signInWithEmailAndPassword(window.auth, email, password);
        closeAuthModal();
        showNotification('Başarıyla giriş yapıldı!', 'success');
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Giriş yapılırken hata oluştu: ' + error.message, 'error');
    }
};

const handleEmailRegister = async () => {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (!email || !password) {
        showNotification('Lütfen tüm alanları doldurun!', 'error');
        return;
    }
    
    try {
        await window.createUserWithEmailAndPassword(window.auth, email, password);
        closeAuthModal();
        showNotification('Hesap başarıyla oluşturuldu!', 'success');
    } catch (error) {
        console.error('Register error:', error);
        showNotification('Kayıt olurken hata oluştu: ' + error.message, 'error');
    }
};

const handleGoogleAuth = async () => {
    try {
        await window.signInWithPopup(window.auth, window.provider);
        closeAuthModal();
        showNotification('Google ile giriş başarılı!', 'success');
    } catch (error) {
        console.error('Google auth error:', error);
        showNotification('Google ile giriş yapılırken hata oluştu: ' + error.message, 'error');
    }
};

const handleLogout = async () => {
    try {
        await window.signOut(window.auth);
        showNotification('Başarıyla çıkış yapıldı!', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Çıkış yapılırken hata oluştu!', 'error');
    }
};

// Global flag for filter button listeners
let filterListenersAdded = false;

// Calendar button click handler
const handleCalendarClick = async () => {
    await openCalendarModal();
    
    // Filter buttons event listeners - sadece bir kez ekle
    if (!filterListenersAdded) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                await renderMonthlyEvents();
            });
        });
        filterListenersAdded = true;
    }
};

// Calendar modal functions
const openCalendarModal = async () => {
    document.getElementById('calendarModal').style.display = 'block';
    await renderMonthlyEvents();
};

const closeCalendarModal = () => {
    document.getElementById('calendarModal').style.display = 'none';
};

// Diary data structure
let diaryEntries = [
    {
        id: 1,
        title: 'Batman',
        type: 'movie',
        date: '2024-01-15',
        rating: 4,
        review: 'Harika bir film! Christian Bale mükemmel bir Batman.',
        day: 15
    },
    {
        id: 2,
        title: 'Breaking Bad',
        type: 'show',
        date: '2024-01-22',
        rating: 5,
        review: 'Tüm zamanların en iyi dizisi. Bryan Cranston muhteşem.',
        day: 22
    },
    {
        id: 3,
        title: 'Inception',
        type: 'movie',
        date: '2024-01-28',
        rating: 5,
        review: 'Zihin bükücü bir deneyim. Christopher Nolan dehası.',
        day: 28
    }
];

// Global değişkenler
let isEditingDiary = false;
let currentEditingId = null;

const getMonthlyEvents = () => {
    // Ana sayfadaki izlenen filmler ve dizilerden bilgileri çek
    const watchedMovies = favorites.watchedMovies || [];
    const watchedShows = favorites.watchedShows || [];
    
    // Tüm izlenen içerikleri birleştir
    const allWatched = [
        ...watchedMovies.map(item => ({
            id: item.imdbID,
            title: item.Title,
            type: 'movie',
            date: item.watchedDate || new Date().toISOString().split('T')[0],
            rating: favorites.userRatings[item.imdbID] || 0,
            review: item.review || '',
            day: new Date(item.watchedDate || Date.now()).getDate(),
            poster: item.Poster,
            year: item.Year
        })),
        ...watchedShows.map(item => ({
            id: item.imdbID,
            title: item.Title,
            type: 'show',
            date: item.watchedDate || new Date().toISOString().split('T')[0],
            rating: favorites.userRatings[item.imdbID] || 0,
            review: item.review || '',
            day: new Date(item.watchedDate || Date.now()).getDate(),
            poster: item.Poster,
            year: item.Year
        }))
    ];
    
    // Tarihe göre sırala (en yeni önce)
    allWatched.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Eğer hiç izlenen içerik yoksa, örnek verileri göster
    if (allWatched.length === 0) {
        return diaryEntries;
    }
    
    return allWatched;
};

const renderMonthlyEvents = async () => {
    const eventsContainer = document.getElementById('monthlyEvents');
    const events = getMonthlyEvents();
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    
    eventsContainer.innerHTML = '';
    
    // Filter events based on active filter
    let filteredEvents = events;
    if (activeFilter === 'movies') {
        filteredEvents = events.filter(event => event.type === 'movie');
    } else if (activeFilter === 'shows') {
        filteredEvents = events.filter(event => event.type === 'show');
    }
    
    if (filteredEvents.length === 0) {
        eventsContainer.innerHTML = '<p style="color: #666; text-align: center;">Bu ay henüz izlenen içerik yok.</p>';
        return;
    }
    
    // Ayları grupla ve sırala
    const eventsByMonth = {};
    filteredEvents.forEach(event => {
        const eventDate = new Date(event.date);
        const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
        const monthName = eventDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
        
        if (!eventsByMonth[monthKey]) {
            eventsByMonth[monthKey] = {
                monthName: monthName,
                events: []
            };
        }
        eventsByMonth[monthKey].events.push(event);
    });
    
    // Ayları tarihe göre sırala (en yeni önce)
    const sortedMonths = Object.keys(eventsByMonth).sort((a, b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        return new Date(yearB, monthB) - new Date(yearA, monthA);
    });
    
    // Her ay için başlık ve kartları oluştur
    for (const monthKey of sortedMonths) {
        const monthData = eventsByMonth[monthKey];
        
        // Ay başlığını ekle
        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        monthHeader.innerHTML = `
            <h3 class="month-title">
                <i class="fas fa-calendar-alt"></i>
                ${monthData.monthName}
            </h3>
        `;
        eventsContainer.appendChild(monthHeader);
        
        // Bu ayın eventlerini ekle
        for (const event of monthData.events) {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        
        const typeText = event.type === 'movie' ? 'Film' : 'Dizi';
        const typeIcon = event.type === 'movie' ? 'fas fa-film' : 'fas fa-tv';
        
        // Poster varsa göster, yoksa ikon göster
        const posterContent = event.poster && event.poster !== 'N/A' ? 
            `<img src="${event.poster}" alt="${event.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
            '';
        
        // Tarih bilgilerini hazırla
        const eventDate = new Date(event.date);
        const month = eventDate.toLocaleDateString('tr-TR', { month: 'long' }).toUpperCase();
        const day = eventDate.getDate();
        const year = eventDate.getFullYear();
        
        // Kalp ikonları için rating - Font Awesome kalpleri kullan
        const heartRating = event.rating > 0 ? 
            '<i class="fa-solid fa-heart text-red-500"></i>'.repeat(event.rating) + 
            '<i class="fa-regular fa-heart text-red-500"></i>'.repeat(5 - event.rating) :
            '<i class="fa-regular fa-heart text-red-500"></i>'.repeat(5);
        
        eventElement.innerHTML = `
            <div class="event-content">
                <div class="event-poster">
                    ${posterContent}
                    <i class="${typeIcon}" style="${event.poster && event.poster !== 'N/A' ? 'display: none;' : 'display: flex;'}"></i>
                </div>
                <div class="event-details">
                    <div class="event-title">${event.title}</div>
                    <div class="event-meta">
                        <span>${event.year || year}</span>
                    </div>
                    <div class="event-rating">
                        ${heartRating}
                    </div>
                    ${event.review ? `<div class="event-review">"${event.review}"</div>` : ''}
                </div>
            </div>
            <div class="event-date-block">
                <p class="event-month">${month}</p>
                <p class="event-day">${day}</p>
                <p class="event-year">${year}</p>
            </div>
        `;
        
        // Kartın tıklanabilir olması için event listener ekle
        eventElement.style.cursor = 'pointer';
        eventElement.addEventListener('click', (e) => {
            // Eğer tıklanan element action butonu değilse düzenleme modalını aç
            if (!e.target.closest('.action-btn')) {
                editDiaryEntry(event.id);
            }
        });
        
        // DOM'a ekle
        eventsContainer.appendChild(eventElement);
        
        // Dominant renk uygula (eğer poster varsa)
        if (event.poster && event.poster !== 'N/A' && event.poster !== './yok.PNG') {
            try {
                const dominantColor = await getDominantColor(event.poster);
                const textColor = getContrastColor(dominantColor);
                
                // Koyu kenarlık rengi oluştur (dominant rengin %30 daha koyu versiyonu)
                const darkerColor = getDarkerColor(dominantColor, 0.3);
                
                // Kart arka planını ayarla
                eventElement.style.backgroundColor = dominantColor;
                
                // Kenarlık rengini ayarla
                eventElement.style.borderColor = darkerColor;
                
                // Metin renklerini ayarla
                const title = eventElement.querySelector('.event-title');
                const meta = eventElement.querySelector('.event-meta');
                const monthText = eventElement.querySelector('.event-month');
                const dayText = eventElement.querySelector('.event-day');
                const yearText = eventElement.querySelector('.event-year');
                
                if (title) title.style.color = textColor;
                if (meta) meta.style.color = textColor;
                if (monthText) monthText.style.color = textColor;
                if (dayText) dayText.style.color = textColor;
                if (yearText) yearText.style.color = textColor;
                
            } catch (error) {
                console.error('Takvim kartı renk uygulama hatası:', error);
            }
        }
    }
    }
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = getMonthName(date.getMonth());
    return `${day} ${month}`;
};

const getMonthName = (month) => {
    const monthNames = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return monthNames[month];
};

// Diary Modal Functions
const openDiaryModal = () => {
    document.getElementById('diaryModal').style.display = 'block';
    document.getElementById('diaryDate').value = new Date().toISOString().split('T')[0];
    setupRatingStars();
};

const closeDiaryModal = () => {
    document.getElementById('diaryModal').style.display = 'none';
    
    // Düzenleme modunu sıfırla
    isEditingDiary = false;
    currentEditingId = null;
    
    resetDiaryForm();
};

const setupRatingStars = () => {
    const stars = document.querySelectorAll('.stars i');
    const hearts = document.querySelectorAll('.hearts i');
    const ratingText = document.querySelector('.rating-text');
    let selectedRating = 0;

    // Yıldız ikonları için (eski sistem)
    if (stars.length > 0) {
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                selectedRating = index + 1;
                updateStars(selectedRating);
                updateRatingText(selectedRating);
            });

            star.addEventListener('mouseenter', () => {
                updateStars(index + 1);
            });

            star.addEventListener('mouseleave', () => {
                updateStars(selectedRating);
            });
        });

        function updateStars(rating) {
            stars.forEach((star, index) => {
                star.classList.toggle('active', index < rating);
            });
        }
    }

    // Kalp ikonları için (yeni sistem)
    if (hearts.length > 0) {
        hearts.forEach((heart, index) => {
            heart.addEventListener('click', () => {
                selectedRating = index + 1;
                updateHearts(selectedRating);
                updateRatingText(selectedRating);
            });

            heart.addEventListener('mouseenter', () => {
                updateHearts(index + 1);
            });

            heart.addEventListener('mouseleave', () => {
                updateHearts(selectedRating);
            });
        });

        function updateHearts(rating) {
            hearts.forEach((heart, index) => {
                heart.classList.toggle('active', index < rating);
            });
        }
    }

    function updateRatingText(rating) {
        const texts = ['Puan seçin', 'Çok kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'];
        ratingText.textContent = texts[rating] || 'Puan seçin';
    }
};

const resetDiaryForm = () => {
    document.getElementById('diaryType').value = 'movie';
    document.getElementById('diaryDate').value = new Date().toISOString().split('T')[0];
    
    // Reset stars and hearts
    document.querySelectorAll('.stars i').forEach(star => star.classList.remove('active'));
    document.querySelectorAll('.hearts i').forEach(heart => heart.classList.remove('active'));
    document.querySelector('.rating-text').textContent = 'Puan seçin';
};

const saveDiaryEntry = () => {
    const title = document.getElementById('diaryTitle').value.trim();
    const type = document.getElementById('diaryType').value;
    const date = document.getElementById('diaryDate').value;
    const rating = document.querySelectorAll('.stars i.active').length || document.querySelectorAll('.hearts i.active').length;

    if (!date || rating === 0) {
        showNotification('Lütfen izleme tarihini ve puanınızı seçin!', 'error');
        return;
    }

    // Eğer düzenleme modundaysa, mevcut kaydı güncelle
    if (isEditingDiary && currentEditingId) {
        updateDiaryEntry(currentEditingId);
        return;
    }

    // Yeni kayıt için benzersiz ID oluştur
    const newId = Date.now().toString();
    
    // Ana sayfadaki izlenen listelerine ekle
    const watchedItem = {
        imdbID: newId,
        Title: title,
        Poster: '', // Poster yoksa boş bırak
        Year: new Date(date).getFullYear().toString(),
        Type: type === 'movie' ? 'movie' : 'series',
        watchedDate: date
    };

    if (type === 'movie') {
        if (!favorites.watchedMovies.find(m => m.imdbID === newId)) {
            favorites.watchedMovies.push(watchedItem);
        }
    } else {
        if (!favorites.watchedShows.find(s => s.imdbID === newId)) {
            favorites.watchedShows.push(watchedItem);
        }
    }

    // Kullanıcı puanını kaydet
    if (rating > 0) {
        favorites.userRatings[newId] = rating;
    }

    // Favorileri kaydet ve yeniden render et
    saveFavorites();
    renderFavorites();
    
    closeDiaryModal();
    renderMonthlyEvents();
    showNotification('İzleme kaydı başarıyla eklendi!', 'success');
};

// Günlük kayıt düzenleme fonksiyonunu güncelle
const editDiaryEntry = (id) => {
    // Ana sayfadaki izlenen listelerinden kaydı bul
    const movieEntry = favorites.watchedMovies.find(m => m.imdbID === id);
    const showEntry = favorites.watchedShows.find(s => s.imdbID === id);
    const entry = movieEntry || showEntry;
    
    if (!entry) return;

    // Düzenleme modunu aktif et
    isEditingDiary = true;
    currentEditingId = id;

    // Populate form with entry data
    document.getElementById('diaryTitle').value = entry.Title;
    document.getElementById('diaryType').value = entry.Type === 'movie' ? 'movie' : 'show';
    document.getElementById('diaryDate').value = entry.watchedDate || new Date().toISOString().split('T')[0];

    // Set rating hearts
    const rating = favorites.userRatings[id] || 0;
    document.querySelectorAll('.hearts i').forEach((heart, index) => {
        heart.classList.toggle('active', index < rating);
    });
    document.querySelector('.rating-text').textContent = 
        ['Puan seçin', 'Çok kötü', 'Kötü', 'Orta', 'İyi', 'Mükemmel'][rating] || 'Puan seçin';

    openDiaryModal();
    
    // Kaydet butonunu güncelleme moduna çevir
    const saveBtn = document.getElementById('saveDiaryEntry');
    saveBtn.textContent = 'Güncelle';
};

// Günlük kayıt güncelleme fonksiyonu
const updateDiaryEntry = (id) => {
    const title = document.getElementById('diaryTitle').value.trim();
    const type = document.getElementById('diaryType').value;
    const date = document.getElementById('diaryDate').value;
    const rating = document.querySelectorAll('.hearts i.active').length;

    if (!date) {
        showNotification('Lütfen izleme tarihini seçin!', 'error');
        return;
    }

    // Mevcut kaydı bul
    const movieIndex = favorites.watchedMovies.findIndex(m => m.imdbID === id);
    const showIndex = favorites.watchedShows.findIndex(s => s.imdbID === id);
    
    if (movieIndex !== -1) {
        // Mevcut film kaydını güncelle (poster ve diğer bilgileri koru)
        favorites.watchedMovies[movieIndex].watchedDate = date;
        favorites.watchedMovies[movieIndex].Year = new Date(date).getFullYear().toString();
    } else if (showIndex !== -1) {
        // Mevcut dizi kaydını güncelle (poster ve diğer bilgileri koru)
        favorites.watchedShows[showIndex].watchedDate = date;
        favorites.watchedShows[showIndex].Year = new Date(date).getFullYear().toString();
    }

    // Kullanıcı puanını güncelle
    if (rating > 0) {
        favorites.userRatings[id] = rating;
    } else {
        // Puan seçilmemişse mevcut puanı koru (silme)
        // favorites.userRatings[id] zaten mevcut kalır
    }

    // Favorileri kaydet ve yeniden render et
    saveFavorites();
    renderFavorites();
    
    // Düzenleme modunu sıfırla
    isEditingDiary = false;
    currentEditingId = null;
    
    closeDiaryModal();
    renderMonthlyEvents();
    showNotification('İzleme kaydı başarıyla güncellendi!', 'success');
    
    // Kaydet butonunu normal moda çevir
    const saveBtn = document.getElementById('saveDiaryEntry');
    saveBtn.textContent = 'Kaydet';
};

/* editDiaryEntry function updated above */

const deleteDiaryEntry = (id) => {
    if (confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
        // Ana sayfadaki izlenen listelerinden de kaldır
        favorites.watchedMovies = favorites.watchedMovies.filter(m => m.imdbID !== id);
        favorites.watchedShows = favorites.watchedShows.filter(s => s.imdbID !== id);
        
        // Kullanıcı puanını da kaldır
        delete favorites.userRatings[id];
        
        // Favorileri kaydet ve yeniden render et
        saveFavorites();
        renderFavorites();
        
        renderMonthlyEvents();
        showNotification('Kayıt başarıyla silindi!', 'success');
    }
};

// Modal functions
const openAuthModal = () => {
    document.getElementById('authModal').style.display = 'block';
    switchToLogin();
};

const closeAuthModal = () => {
    document.getElementById('authModal').style.display = 'none';
};

const switchToLogin = () => {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('authModalTitle').textContent = 'Giriş Yap';
};

const switchToRegister = () => {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authModalTitle').textContent = 'Kayıt Ol';
};

// Update UI for logged in user
const updateUIForUser = (user) => {
    const authBox = document.querySelector('.auth-box');
    const userWelcome = document.getElementById('userWelcome');
    const userDisplayName = document.getElementById('userDisplayName');
    
    // Hide auth box
    authBox.style.display = 'none';
    
    // Show welcome message and make it clickable
    userDisplayName.textContent = user.displayName || user.email;
    userWelcome.style.display = 'block';
    userWelcome.onclick = toggleUserMenu;
    
    // Load user data from Firebase
    loadUserData();
};

// Toggle user menu
const toggleUserMenu = () => {
    const authBox = document.querySelector('.auth-box');
    const userWelcome = document.getElementById('userWelcome');
    const authBtn = document.getElementById('authBtn');
    
    if (authBox.style.display === 'none') {
        // Show auth box with logout button
        authBox.style.display = 'block';
        authBtn.textContent = 'Çıkış Yap';
        authBtn.onclick = handleLogout;
        userWelcome.style.display = 'none';
    }
};

// Update UI for guest user
const updateUIForGuest = () => {
    const authBtn = document.getElementById('authBtn');
    const authBox = document.querySelector('.auth-box');
    const userWelcome = document.getElementById('userWelcome');
    
    // Show auth box
    authBox.style.display = 'flex';
    authBtn.innerHTML = 'Giriş Yap';
    authBtn.onclick = openAuthModal;
    
    // Hide welcome message
    userWelcome.style.display = 'none';
    userWelcome.onclick = null;
    
    // Clear user data
    clearUserData();
};

// Clear auth errors
const clearAuthErrors = () => {
    const errors = document.querySelectorAll('.auth-error');
    errors.forEach(error => error.remove());
};

// Show auth error
const showAuthError = (message) => {
    clearAuthErrors();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'auth-error';
    errorDiv.textContent = message;
    
    const authForm = document.querySelector('.auth-form');
    authForm.insertBefore(errorDiv, authForm.firstChild);
};

// Helper functions - defined early for create functions
const isFavorite = (imdbID) => {
    return favorites.movies.find(m => m.imdbID === imdbID) || 
           favorites.shows.find(s => s.imdbID === imdbID);
};

const isInWatchlist = (imdbID) => {
    return favorites.watchlistMovies.find(m => m.imdbID === imdbID) || 
           favorites.watchlistShows.find(s => s.imdbID === imdbID);
};

const isWatched = (imdbID) => {
    return favorites.watchedMovies.find(m => m.imdbID === imdbID) || 
           favorites.watchedShows.find(s => s.imdbID === imdbID);
};

// Renk işlemleri - defined early for create functions
    const getDominantColor = (imageUrl) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                const colorCounts = {};

                for (let i = 0; i < imageData.length; i += 40) {
                    const r = imageData[i];
                    const g = imageData[i + 1];
                    const b = imageData[i + 2];
                    
                    const brightness = (r + g + b) / 3;
                    if (brightness > 30 && brightness < 220) {
                        const colorKey = `${Math.floor(r/10)*10},${Math.floor(g/10)*10},${Math.floor(b/10)*10}`;
                        colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
                    }
                }

                let dominantColor = 'rgb(198, 198, 198)';
                let maxCount = 0;

                for (const [color, count] of Object.entries(colorCounts)) {
                    if (count > maxCount) {
                        maxCount = count;
                        const [r, g, b] = color.split(',').map(Number);
                        dominantColor = `rgb(${r}, ${g}, ${b})`;
                    }
                }

                resolve(dominantColor);
            };
            img.onerror = () => resolve('rgb(198, 198, 198)');
            img.src = imageUrl;
        });
    };

    const getContrastColor = (backgroundColor) => {
        const rgb = backgroundColor.match(/\d+/g);
        if (!rgb) return '#000000';
        
        const [r, g, b] = rgb.map(Number);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#FFFFFF';
    };

    const getDarkerColor = (color, factor = 0.3) => {
        const rgb = color.match(/\d+/g);
        if (!rgb) return '#000000';
        
        const [r, g, b] = rgb.map(Number);
        const darkerR = Math.max(0, Math.floor(r * (1 - factor)));
        const darkerG = Math.max(0, Math.floor(g * (1 - factor)));
        const darkerB = Math.max(0, Math.floor(b * (1 - factor)));
        
        return `rgb(${darkerR}, ${darkerG}, ${darkerB})`;
    };

    const applyCardColors = async (element, imageUrl) => {
    if (imageUrl === './yok.PNG') return;
    
    try {
        const dominantColor = await getDominantColor(imageUrl);
        const textColor = getContrastColor(dominantColor);
        
        // Kart arka planını ayarla
        element.style.backgroundColor = dominantColor;
        
        // Metin renklerini ayarla
        const title = element.querySelector('h3');
        const year = element.querySelector('p');
        if (title) title.style.color = textColor;
        if (year) year.style.color = textColor;
        
    } catch (error) {
        console.error('Renk çıkarma hatası:', error);
    }
};

// Fetch data function - defined early for other functions
const fetchData = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return { Response: "False", Error: "Veri yüklenirken hata oluştu" };
    }
};

// Translation functions - defined early for modal functions
const translateGenre = (genre) => {
    const translations = {
        'Action': 'Aksiyon', 'Adventure': 'Macera', 'Animation': 'Animasyon',
        'Biography': 'Biyografi', 'Comedy': 'Komedi', 'Crime': 'Suç',
        'Documentary': 'Belgesel', 'Drama': 'Drama', 'Family': 'Aile',
        'Fantasy': 'Fantastik', 'Film-Noir': 'Kara Film', 'History': 'Tarih',
        'Horror': 'Korku', 'Music': 'Müzik', 'Musical': 'Müzikal',
        'Mystery': 'Gizem', 'Romance': 'Romantik', 'Sci-Fi': 'Bilim Kurgu',
        'Sport': 'Spor', 'Thriller': 'Gerilim', 'War': 'Savaş', 'Western': 'Vahşi Batı'
    };
    if (!genre) return 'Bilinmiyor';
    return genre.split(', ').map(g => translations[g.trim()] || g.trim()).join(', ');
};

const translateRuntime = (runtime) => {
    if (!runtime || runtime === 'N/A') return 'Bilinmiyor';
    const match = runtime.match(/(\d+)\s*min/);
    if (match) {
        const minutes = parseInt(match[1]);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (hours > 0 && remainingMinutes > 0) return `${hours} saat ${remainingMinutes} dakika`;
        if (hours > 0) return `${hours} saat`;
        return `${remainingMinutes} dakika`;
    }
    return runtime;
};

const translateRating = (rating) => !rating || rating === 'N/A' ? 'Puan yok' : `${rating}/10`;
const translatePlot = (plot) => !plot || plot === 'N/A' ? 'Özet bulunamadı.' : plot;

// Modal functions - defined early for other functions
const displayModal = (details) => {
    document.getElementById('modalTitle').textContent = details.Title;
    const modalPoster = document.getElementById('modalPoster');
    modalPoster.src = details.Poster !== 'N/A' ? details.Poster : './yok.PNG';
    modalPoster.onerror = function() { this.src = './yok.PNG'; };
    document.getElementById('modalYear').textContent = details.Year;
    document.getElementById('modalGenre').textContent = translateGenre(details.Genre);
    document.getElementById('modalRuntime').textContent = translateRuntime(details.Runtime);
    document.getElementById('modalDirector').textContent = details.Director !== 'N/A' ? details.Director : 'Bilinmiyor';
    document.getElementById('modalActors').textContent = details.Actors !== 'N/A' ? details.Actors : 'Bilinmiyor';
    document.getElementById('modalRating').textContent = translateRating(details.imdbRating);
    document.getElementById('modalPlot').textContent = translatePlot(details.Plot);

    const modal = document.getElementById('detailModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
};

const closeModal = () => {
    const modal = document.getElementById('detailModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
};

// Make closeModal globally available
window.closeModal = closeModal;

// Show details function - defined early for create functions
const showDetails = async (imdbID) => {
    try {
        const details = await fetchData(`/api/details?imdbID=${imdbID}`);
        if (details.Response === "True") {
            displayModal(details);
        } else {
            alert('Detaylar yüklenirken hata oluştu.');
        }
    } catch (error) {
        console.error('Error fetching details:', error);
        alert('Detaylar yüklenirken hata oluştu.');
    }
};

// Setup overlay events function - defined early for create functions
const setupOverlayEvents = (itemElement, item, type) => {
    // Overlay click event
    itemElement.addEventListener('click', (e) => {
        if (!e.target.closest('.top-right-controls')) {
            const overlay = itemElement.querySelector('.card-overlay');
            if (overlay) {
                if (overlay.classList.contains('active')) {
                    overlay.classList.remove('active');
                    
                    // Rating submenu'sünü de kapat
                    const watchedRatingSubmenu = itemElement.querySelector('.watched-rating-submenu');
                    if (watchedRatingSubmenu && !watchedRatingSubmenu.classList.contains('hidden')) {
                        watchedRatingSubmenu.classList.add('hidden');
                        watchedRatingSubmenu.classList.remove('flex');
                        
                        // Rating butonunu eski haline getir
                        const ratingBtn = itemElement.querySelector('.rating-btn');
                        if (ratingBtn) {
                            const ratingBtnIcon = ratingBtn.querySelector('i');
                            const ratingBtnText = ratingBtn.querySelector('span');
                            if (ratingBtnText) ratingBtnText.style.display = 'inline';
                            if (ratingBtnIcon) ratingBtnIcon.style.display = 'inline';
                            ratingBtn.style.background = '';
                        }
                        
                        // Diğer menü öğelerini geri göster
                        const otherMenuItems = itemElement.querySelectorAll('.overlay-menu-item:not(.rating-btn)');
                        otherMenuItems.forEach(item => {
                            item.style.display = 'flex';
                        });
                    }
                } else {
                    overlay.classList.add('active');
                    
                    const dominantColor = getComputedStyle(itemElement).backgroundColor;
                    if (dominantColor && dominantColor !== 'rgba(0, 0, 0, 0)') {
                        overlay.style.backgroundColor = dominantColor.replace(')', ', 0.8)').replace('rgb', 'rgba');
                    }
                }
            }
        }
    });
    
    // Overlay içinde boş alana tıklama ile kapatma
    const overlay = itemElement.querySelector('.card-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            // Eğer overlay'in kendisine tıklandıysa (boş alan)
            if (e.target === overlay) {
                overlay.classList.remove('active');
                
                // Rating submenu'sünü de kapat
                const watchedRatingSubmenu = itemElement.querySelector('.watched-rating-submenu');
                if (watchedRatingSubmenu && !watchedRatingSubmenu.classList.contains('hidden')) {
                    watchedRatingSubmenu.classList.add('hidden');
                    watchedRatingSubmenu.classList.remove('flex');
                    
                    // Rating butonunu eski haline getir
                    const ratingBtn = itemElement.querySelector('.rating-btn');
                    if (ratingBtn) {
                        const ratingBtnIcon = ratingBtn.querySelector('i');
                        const ratingBtnText = ratingBtn.querySelector('span');
                        if (ratingBtnText) ratingBtnText.style.display = 'inline';
                        if (ratingBtnIcon) ratingBtnIcon.style.display = 'inline';
                        ratingBtn.style.background = '';
                    }
                    
                    // Diğer menü öğelerini geri göster
                    const otherMenuItems = itemElement.querySelectorAll('.overlay-menu-item:not(.rating-btn)');
                    otherMenuItems.forEach(item => {
                        item.style.display = 'flex';
                    });
                }
            }
        });
    }

    // İzlendi & Puanlama butonları
    const watchedBtn = itemElement.querySelector('.watched-btn');
    const ratingBtn = itemElement.querySelector('.rating-btn');
    const watchedRatingSubmenu = itemElement.querySelector('.watched-rating-submenu');
    const hearts = itemElement.querySelectorAll('.heart-rating');
    
    if (watchedBtn) {
        watchedBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            // Doğrudan izlendi olarak işaretle (rating olmadan)
            if (type === 'search') {
                await markAsWatchedFromSearch(item.imdbID, item.Title, item.Year, item.Poster, item.Type === 'movie' ? 'movie' : 'show');
            } else {
                await markAsWatched(item.imdbID, item.Title, item.Year, item.Poster, type);
            }
            
            // Overlay'i anlık olarak güncelle
            const overlay = itemElement.querySelector('.card-overlay');
            if (overlay) {
                const overlayContent = overlay.querySelector('.overlay-content');
                if (overlayContent) {
                    // Favoriye Ekle butonunu ekle
                    const addToFavoritesBtn = document.createElement('button');
                    addToFavoritesBtn.className = 'overlay-menu-item';
                    addToFavoritesBtn.onclick = () => addToFavorites(item, type);
                    addToFavoritesBtn.innerHTML = `
                        <i class="fa-solid fa-heart text-red-500"></i>
                        <span>Favoriye Ekle</span>
                    `;
                    
                    // Rating butonunu ekle
                    const ratingBtn = document.createElement('button');
                    ratingBtn.className = 'overlay-menu-item rating-btn';
                    ratingBtn.setAttribute('data-imdbid', item.imdbID);
                    ratingBtn.innerHTML = `
                        <i class="fa-solid fa-heart text-red-500"></i>
                        <span>Puanla</span>
                    `;
                    
                    // Rating submenu'sünü ekle
                    const ratingSubmenu = document.createElement('div');
                    ratingSubmenu.className = 'watched-rating-submenu hidden';
                    ratingSubmenu.innerHTML = `
                        <div class="hearts-container">
                            <i class="fa-solid fa-heart heart-rating" data-value="1"></i>
                            <i class="fa-solid fa-heart heart-rating" data-value="2"></i>
                            <i class="fa-solid fa-heart heart-rating" data-value="3"></i>
                            <i class="fa-solid fa-heart heart-rating" data-value="4"></i>
                            <i class="fa-solid fa-heart heart-rating" data-value="5"></i>
                        </div>
                    `;
                    
                    overlayContent.appendChild(addToFavoritesBtn);
                    overlayContent.appendChild(ratingBtn);
                    overlayContent.appendChild(ratingSubmenu);
                    
                    // Rating event'lerini ekle
                    setupRatingEvents(ratingBtn, ratingSubmenu, item.imdbID);
                }
            }
        });
    }
    
    if (ratingBtn) {
        ratingBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const submenu = itemElement.querySelector('.watched-rating-submenu');
            if (submenu) {
                if (submenu.classList.contains('hidden')) {
                    submenu.classList.remove('hidden');
                    submenu.classList.add('flex');
                    
                    // Rating butonunu gizle
                    const ratingBtnIcon = ratingBtn.querySelector('i');
                    const ratingBtnText = ratingBtn.querySelector('span');
                    if (ratingBtnText) ratingBtnText.style.display = 'none';
                    if (ratingBtnIcon) ratingBtnIcon.style.display = 'none';
                    ratingBtn.style.background = 'rgba(255, 255, 255, 0.1)';
                    
                    // Diğer menü öğelerini gizle
                    const otherMenuItems = itemElement.querySelectorAll('.overlay-menu-item:not(.rating-btn)');
                    otherMenuItems.forEach(item => {
                        item.style.display = 'none';
                    });
                } else {
                    submenu.classList.add('hidden');
                    submenu.classList.remove('flex');
                    
                    // Rating butonunu geri göster
                    const ratingBtnIcon = ratingBtn.querySelector('i');
                    const ratingBtnText = ratingBtn.querySelector('span');
                    if (ratingBtnText) ratingBtnText.style.display = 'inline';
                    if (ratingBtnIcon) ratingBtnIcon.style.display = 'inline';
                    ratingBtn.style.background = '';
                    
                    // Diğer menü öğelerini geri göster
                    const otherMenuItems = itemElement.querySelectorAll('.overlay-menu-item:not(.rating-btn)');
                    otherMenuItems.forEach(item => {
                        item.style.display = 'flex';
                    });
                }
            }
        });
        
        // Rating submenu'sü için event'ler
        const submenu = itemElement.querySelector('.watched-rating-submenu');
        if (submenu) {
            setupRatingEvents(ratingBtn, submenu, item.imdbID);
        }
    }
};

// User rating function - defined early
const getUserRating = (imdbID) => {
    return favorites.userRatings[imdbID] || 0;
};

// Ortak HTML template'leri
const getAnimationContainers = () => `
    <div class="heart-burst-container absolute inset-0 overflow-visible pointer-events-none z-40"></div>
    <div class="thump-animation-container absolute inset-0 pointer-events-none z-40"></div>
    <div class="clock-animation-container hidden absolute inset-0 bg-black/30 backdrop-blur-sm z-50 items-center justify-center">
        <div class="w-40 h-40 border-8 border-blue-500 rounded-full flex items-center justify-center relative animate-clock">
            <div class="hour-hand w-1.5 h-12 bg-blue-500 absolute bottom-1/2 rounded-t-full animate-hour-hand" style="transform-origin: bottom center;"></div>
            <div class="minute-hand w-1 h-16 bg-blue-500 absolute bottom-1/2 rounded-t-full animate-minute-hand" style="transform-origin: bottom center;"></div>
            <div class="w-4 h-4 bg-blue-500 rounded-full absolute"></div>
        </div>
    </div>
    <div class="absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/60 to-transparent z-20 pointer-events-none"></div>
`;

const getWatchedRatingMenu = () => `
    <div class="watched-rating-submenu hidden">
        <div class="hearts-container">
            <i class="fa-solid fa-heart heart-rating" data-value="1"></i>
            <i class="fa-solid fa-heart heart-rating" data-value="2"></i>
            <i class="fa-solid fa-heart heart-rating" data-value="3"></i>
            <i class="fa-solid fa-heart heart-rating" data-value="4"></i>
            <i class="fa-solid fa-heart heart-rating" data-value="5"></i>
        </div>
    </div>
`;

const getTopRightControls = (rating, imdbID = '') => {
    const userRating = getUserRating(imdbID);
    const userRatingHTML = userRating > 0 ? `
        <div class="user-rating-container">
            <div class="user-rating-box">
                <i class="fa-solid fa-heart text-red-500"></i>
                <span class="user-rating-text">${userRating}</span>
            </div>
        </div>
    ` : '';
    
    return `
        <div class="top-right-controls">
            <div class="rating-box">
                <i class="fa-solid fa-star text-yellow-400"></i>
                <span>${rating}</span>
            </div>
            ${userRatingHTML}
        </div>
    `;
};

// Setup rating events function
const setupRatingEvents = (ratingBtn, submenu, imdbID) => {
    const hearts = submenu.querySelectorAll('.heart-rating');
    const currentRating = getUserRating(imdbID);
    
    // Mevcut puanı göster
    hearts.forEach((heart, index) => {
        if (index < currentRating) {
            heart.classList.add('active');
        }
    });
    
    // Heart click events
    hearts.forEach((heart, index) => {
        heart.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const rating = index + 1;
            
            // Tüm kalpleri sıfırla
            hearts.forEach(h => h.classList.remove('active'));
            
            // Seçilen kalbe kadar aktif et
            for (let i = 0; i <= index; i++) {
                hearts[i].classList.add('active');
            }
            
            // Puanı kaydet
            saveUserRating(imdbID, rating);
            
            // Animasyon efekti
            heart.style.animation = 'heart-glow 0.5s ease-out';
            setTimeout(() => {
                heart.style.animation = '';
            }, 500);
        });
    });
};

// Create item functions - defined early for renderFavorites
const createFavoriteItem = (item, type) => {
    const itemElement = document.createElement('div');
    itemElement.className = 'favorite-item';
    itemElement.setAttribute('data-imdbid', item.imdbID);

    const poster = (item.Poster && item.Poster !== 'N/A') ? item.Poster : './yok.PNG';
    const rating = item.imdbRating && item.imdbRating !== 'N/A' ? item.imdbRating : 'N/A';
    const hasWatched = isWatched(item.imdbID);

    itemElement.innerHTML = `
        ${getAnimationContainers()}
        <img src="${poster}" alt="${item.Title} Poster" onerror="this.src='./yok.PNG'">
        
        ${getTopRightControls(rating, item.imdbID)}

        <!-- Overlay Menü -->
        <div class="card-overlay">
            <div class="overlay-content">
                <button class="overlay-menu-item" onclick="removeFromFavorites('${item.imdbID}', '${type}')">
                    <i class="fa-solid fa-times text-red-500"></i>
                    <span>Favoriden Kaldır</span>
                </button>
                <button class="overlay-menu-item" onclick="showDetails('${item.imdbID}')">
                    <i class="fa-solid fa-info-circle text-blue-500"></i>
                    <span>Detaylar</span>
                </button>
                <button class="overlay-menu-item watched-btn" data-imdbid="${item.imdbID}">
                    <i class="fa-solid fa-check-circle text-green-500"></i>
                    <span>İzlendi</span>
                </button>
                ${hasWatched ? `
                    <button class="overlay-menu-item rating-btn" data-imdbid="${item.imdbID}">
                        <i class="fa-solid fa-heart text-red-500"></i>
                        <span>Puanla</span>
                    </button>
                    ${getWatchedRatingMenu()}
                ` : ''}
            </div>
        </div>

        <div class="favorite-item-info">
            <h3>${item.Title}</h3>
        </div>
    `;

    // Setup overlay events
    setupOverlayEvents(itemElement, item, type);
    
    // Apply card colors based on poster
    applyCardColors(itemElement, poster);
    
    return itemElement;
};

        const createWatchlistItem = (item, type) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'favorite-item';
        itemElement.setAttribute('data-imdbid', item.imdbID);

        const poster = (item.Poster && item.Poster !== 'N/A') ? item.Poster : './yok.PNG';
        const rating = item.imdbRating && item.imdbRating !== 'N/A' ? item.imdbRating : 'N/A';
        const hasWatched = isWatched(item.imdbID);

        itemElement.innerHTML = `
            ${getAnimationContainers()}
            <img src="${poster}" alt="${item.Title} Poster" onerror="this.src='./yok.PNG'">
            
            ${getTopRightControls(rating, item.imdbID)}

            <!-- Overlay Menü -->
            <div class="card-overlay">
                <div class="overlay-content">
                    <button class="overlay-menu-item" onclick="removeFromWatchlist('${item.imdbID}', '${type}')">
                        <i class="fa-solid fa-times text-red-500"></i>
                        <span>Kaldır</span>
                    </button>
                    <button class="overlay-menu-item" onclick="showDetails('${item.imdbID}')">
                        <i class="fa-solid fa-info-circle text-blue-500"></i>
                        <span>Detaylar</span>
                    </button>
                    <button class="overlay-menu-item watched-btn" data-imdbid="${item.imdbID}">
                        <i class="fa-solid fa-check-circle text-green-500"></i>
                        <span>İzlendi</span>
                    </button>
                    ${hasWatched ? `
                        <button class="overlay-menu-item" onclick="addToFavorites(${JSON.stringify(item)}, '${type}')">
                            <i class="fa-solid fa-heart text-red-500"></i>
                            <span>Favoriye Ekle</span>
                        </button>
                        <button class="overlay-menu-item rating-btn" data-imdbid="${item.imdbID}">
                            <i class="fa-solid fa-heart text-red-500"></i>
                            <span>Puanla</span>
                        </button>
                        ${getWatchedRatingMenu()}
                    ` : ''}
                </div>
            </div>

            <div class="favorite-item-info">
                <h3>${item.Title}</h3>
            </div>
        `;

        // Setup overlay events
        setupOverlayEvents(itemElement, item, type);
        
        // Apply card colors based on poster
        applyCardColors(itemElement, poster);
        
        return itemElement;
    };

    const createWatchedItem = (item, type) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'favorite-item';
        itemElement.setAttribute('data-imdbid', item.imdbID);

        const poster = (item.Poster && item.Poster !== 'N/A') ? item.Poster : './yok.PNG';
        const rating = item.imdbRating && item.imdbRating !== 'N/A' ? item.imdbRating : 'N/A';
        const isFav = isFavorite(item.imdbID);

        itemElement.innerHTML = `
            ${getAnimationContainers()}
            <img src="${poster}" alt="${item.Title} Poster" onerror="this.src='./yok.PNG'">
            
            ${getTopRightControls(rating, item.imdbID)}

            <!-- Overlay Menü -->
            <div class="card-overlay">
                <div class="overlay-content">
                    <button class="overlay-menu-item" onclick="toggleFavoriteFromWatched('${item.imdbID}', '${item.Title}', '${item.Year}', '${item.Poster}', '${type}')">
                        <i class="fa-solid fa-heart ${isFav ? 'text-red-500' : 'text-gray-400'}"></i>
                        <span>${isFav ? 'Favoriden Kaldır' : 'Favoriye Ekle'}</span>
                    </button>
                    <button class="overlay-menu-item" onclick="removeFromWatched('${item.imdbID}', '${type}')">
                        <i class="fa-solid fa-times text-red-500"></i>
                        <span>Kaldır</span>
                    </button>
                    <button class="overlay-menu-item" onclick="showDetails('${item.imdbID}')">
                        <i class="fa-solid fa-info-circle text-blue-500"></i>
                        <span>Detaylar</span>
                    </button>
                    <button class="overlay-menu-item rating-btn" data-imdbid="${item.imdbID}">
                        <i class="fa-solid fa-heart text-red-500"></i>
                        <span>Puanla</span>
                        ${getWatchedRatingMenu()}
                    </button>
                </div>
            </div>

            <div class="favorite-item-info">
                <h3>${item.Title}</h3>
            </div>
        `;

        // Setup overlay events
        setupOverlayEvents(itemElement, item, type);
        
        // Apply card colors based on poster
        applyCardColors(itemElement, poster);
        
        return itemElement;
    };

// Render favorites function - defined early to avoid reference errors
const renderFavorites = () => {
    // Get DOM elements
    const favoriteMovies = document.getElementById('favorite-movies');
    const favoriteShows = document.getElementById('favorite-shows');
    const watchlistMovies = document.getElementById('watchlist-movies');
    const watchlistShows = document.getElementById('watchlist-shows');
    const watchedMovies = document.getElementById('watched-movies');
    const watchedShows = document.getElementById('watched-shows');
    
    if (!favoriteMovies || !favoriteShows || !watchlistMovies || !watchlistShows || !watchedMovies || !watchedShows) {
        console.log('DOM elements not ready for renderFavorites');
        return;
    }
    
    // Render favorite movies
    favoriteMovies.innerHTML = '';
    if (favorites.movies.length === 0) {
        favoriteMovies.innerHTML = '<p class="info-message">Henüz favori filminiz yok.</p>';
    } else {
        favorites.movies.slice().reverse().forEach(item => {
            const itemElement = createFavoriteItem(item, 'movie');
            favoriteMovies.appendChild(itemElement);
        });
    }

    // Render favorite shows
    favoriteShows.innerHTML = '';
    if (favorites.shows.length === 0) {
        favoriteShows.innerHTML = '<p class="info-message">Henüz favori diziniz yok.</p>';
    } else {
        favorites.shows.slice().reverse().forEach(item => {
            const itemElement = createFavoriteItem(item, 'show');
            favoriteShows.appendChild(itemElement);
        });
    }

    // Render watchlist movies
    watchlistMovies.innerHTML = '';
    if (favorites.watchlistMovies.length === 0) {
        watchlistMovies.innerHTML = '<p class="info-message">Daha sonra izle listenizde film yok.</p>';
    } else {
        favorites.watchlistMovies.slice().reverse().forEach(item => {
            const itemElement = createWatchlistItem(item, 'movie');
            watchlistMovies.appendChild(itemElement);
        });
    }

    // Render watchlist shows
    watchlistShows.innerHTML = '';
    if (favorites.watchlistShows.length === 0) {
        watchlistShows.innerHTML = '<p class="info-message">Daha sonra izle listenizde dizi yok.</p>';
    } else {
        favorites.watchlistShows.slice().reverse().forEach(item => {
            const itemElement = createWatchlistItem(item, 'show');
            watchlistShows.appendChild(itemElement);
        });
    }

    // Render watched movies
    watchedMovies.innerHTML = '';
    if (favorites.watchedMovies.length === 0) {
        watchedMovies.innerHTML = '<p class="info-message">Henüz film izlemediniz.</p>';
    } else {
        favorites.watchedMovies.slice().reverse().forEach(item => {
            const itemElement = createWatchedItem(item, 'movie');
            watchedMovies.appendChild(itemElement);
        });
    }

    // Render watched shows
    watchedShows.innerHTML = '';
    if (favorites.watchedShows.length === 0) {
        watchedShows.innerHTML = '<p class="info-message">Henüz dizi izlemediniz.</p>';
    } else {
        favorites.watchedShows.slice().reverse().forEach(item => {
            const itemElement = createWatchedItem(item, 'show');
            watchedShows.appendChild(itemElement);
        });
    }
};

// Load user data from Firebase
const loadUserData = async () => {
    if (!window.currentUser) return;
    
    try {
        console.log('Loading user data from Firestore...', window.currentUser.uid);
        
        // Firebase Firestore'dan kullanıcı verilerini yükle
        const userDocRef = window.doc(window.db, 'users', window.currentUser.uid);
        const userDoc = await window.getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User data found in Firestore:', userData);
            console.log('Favorites data from Firestore:', userData.favorites);
            
            if (userData.favorites) {
                favorites = userData.favorites;
                console.log('Favorites loaded successfully:', favorites);
            } else {
                console.log('No favorites data found, using empty data');
                favorites = {
                    movies: [],
                    shows: [],
                    watchlistMovies: [],
                    watchlistShows: [],
                    watchedMovies: [],
                    watchedShows: [],
                    userRatings: {}
                };
            }
            
            // Call renderFavorites
            setTimeout(() => {
                renderFavorites();
            }, 100);
        } else {
            console.log('No user data found in Firestore, creating empty data');
            // Kullanıcı verisi yoksa boş veri oluştur
            favorites = {
                movies: [],
                shows: [],
                watchlistMovies: [],
                watchlistShows: [],
                watchedMovies: [],
                watchedShows: [],
                userRatings: {}
            };
            // Call renderFavorites
            setTimeout(() => {
                renderFavorites();
            }, 100);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Veriler yüklenirken hata oluştu!', 'error');
    }
};

// Save user data to Firebase
const saveUserData = async () => {
    if (!window.currentUser) return;
    
    try {
        console.log('Saving user data to Firestore...', window.currentUser.uid);
        console.log('Favorites data to save:', favorites);
        
        // Firebase Firestore'a kullanıcı verilerini kaydet
        const userDocRef = window.doc(window.db, 'users', window.currentUser.uid);
        await window.setDoc(userDocRef, {
            favorites: favorites,
            lastUpdated: new Date().toISOString(),
            email: window.currentUser.email,
            displayName: window.currentUser.displayName
        });
        
        console.log('Data saved successfully to Firestore!');
    } catch (error) {
        console.error('Error saving user data:', error);
        showNotification('Veriler kaydedilirken hata oluştu!', 'error');
    }
};

// Clear user data
const clearUserData = () => {
    favorites = {
        movies: [],
        shows: [],
        watchlistMovies: [],
        watchlistShows: [],
        watchedMovies: [],
        watchedShows: [],
        userRatings: {}
    };
    renderFavorites();
    
    // Clear from Firebase if user is logged in
    if (window.currentUser) {
        saveUserData();
    }
};



// Make functions globally available
window.closeAuthModal = closeAuthModal;
window.switchToLogin = switchToLogin;
window.switchToRegister = switchToRegister;
window.handleEmailLogin = handleEmailLogin;
window.handleEmailRegister = handleEmailRegister;
window.handleGoogleAuth = handleGoogleAuth;
window.handleLogout = handleLogout;

document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is loaded
    console.log('Firebase Auth:', window.auth);
    console.log('Firebase Firestore:', window.db);
    
    // Initialize auth
    initAuth();
    
    // Auth event listeners
    document.getElementById('loginBtn').addEventListener('click', handleEmailLogin);
    document.getElementById('registerBtn').addEventListener('click', handleEmailRegister);
    document.getElementById('googleLoginBtn').addEventListener('click', () => handleGoogleAuth(false));
    document.getElementById('googleRegisterBtn').addEventListener('click', () => handleGoogleAuth(true));
    
    // Calendar button event listener
    document.getElementById('calendar-btn').addEventListener('click', handleCalendarClick);
    
    // Diary modal event listeners
    document.getElementById('saveDiaryEntry').addEventListener('click', saveDiaryEntry);
    
    // Filter buttons event listeners moved to handleCalendarClick
    
    // Close auth modal when clicking outside
    document.getElementById('authModal').addEventListener('click', (e) => {
        if (e.target.id === 'authModal') {
            closeAuthModal();
        }
    });
    
    // Close calendar modal when clicking outside
    document.getElementById('calendarModal').addEventListener('click', (e) => {
        if (e.target.id === 'calendarModal') {
            closeCalendarModal();
        }
    });
    
    // Close diary modal when clicking outside
    document.getElementById('diaryModal').addEventListener('click', (e) => {
        if (e.target.id === 'diaryModal') {
            closeDiaryModal();
        }
    });
    
    // Close auth modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const authModal = document.getElementById('authModal');
            const calendarModal = document.getElementById('calendarModal');
            const diaryModal = document.getElementById('diaryModal');
            if (authModal.style.display === 'block') {
                closeAuthModal();
            } else if (calendarModal.style.display === 'block') {
                closeCalendarModal();
            } else if (diaryModal.style.display === 'block') {
                closeDiaryModal();
            }
        }
    });

    const content = document.getElementById('content');
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const favoriteMovies = document.getElementById('favorite-movies');
    const favoriteShows = document.getElementById('favorite-shows');
    const watchlistMovies = document.getElementById('watchlist-movies');
    const watchlistShows = document.getElementById('watchlist-shows');
    const watchedMovies = document.getElementById('watched-movies');
    const watchedShows = document.getElementById('watched-shows');
    const searchResultsSection = document.getElementById('search-results-section');
    const modal = document.getElementById('detailModal');
    
    // Sayfa dışında tıklama ile overlay'leri kapatma
    document.addEventListener('click', (e) => {
        // Eğer tıklanan element bir kart değilse
        if (!e.target.closest('.favorite-item') && !e.target.closest('.item')) {
            // Tüm açık overlay'leri kapat
            const openOverlays = document.querySelectorAll('.card-overlay.active');
            openOverlays.forEach(overlay => {
                const itemElement = overlay.closest('.favorite-item, .item');
                if (itemElement) {
                    overlay.classList.remove('active');
                    
                    // Rating submenu'sünü de kapat
                    const watchedRatingSubmenu = itemElement.querySelector('.watched-rating-submenu');
                    if (watchedRatingSubmenu && !watchedRatingSubmenu.classList.contains('hidden')) {
                        watchedRatingSubmenu.classList.add('hidden');
                        watchedRatingSubmenu.classList.remove('flex');
                        
                        // Rating butonunu eski haline getir
                        const ratingBtn = itemElement.querySelector('.rating-btn');
                        if (ratingBtn) {
                            const ratingBtnIcon = ratingBtn.querySelector('i');
                            const ratingBtnText = ratingBtn.querySelector('span');
                            if (ratingBtnText) ratingBtnText.style.display = 'inline';
                            if (ratingBtnIcon) ratingBtnIcon.style.display = 'inline';
                            ratingBtn.style.background = '';
                        }
                        
                        // Diğer menü öğelerini geri göster
                        const otherMenuItems = itemElement.querySelectorAll('.overlay-menu-item:not(.rating-btn)');
                        otherMenuItems.forEach(item => {
                            item.style.display = 'flex';
                        });
                    }
                }
            });
        }
    });

    // ===== ORTAK FONKSİYONLAR =====

// Puanlama sistemi - Global scope'a taşındı
window.saveUserRating = (imdbID, rating) => {
    favorites.userRatings[imdbID] = rating;
    saveFavorites(); // Save to Firebase
};





    // Animasyon fonksiyonları
    const createThumpAnimation = (element, count = 5) => {
        const thumpContainer = element.querySelector('.thump-animation-container');
        thumpContainer.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const heartIcon = document.createElement('i');
                heartIcon.className = 'fa-solid fa-heart text-red-500 text-6xl absolute thumping-heart';
                const randomX = Math.random() * (element.clientWidth - 60) + 30;
                const randomY = Math.random() * (element.clientHeight * 0.4) + (element.clientHeight * 0.3);
                heartIcon.style.left = `${randomX}px`;
                heartIcon.style.setProperty('--ty', `${randomY}px`);
                heartIcon.addEventListener('animationend', () => heartIcon.remove());
                thumpContainer.appendChild(heartIcon);
            }, i * 200);
        }
    };

    const addGlowEffect = (element, type = 'red') => {
        // Dış kenarlık animasyonu
        element.classList.add(type === 'red' ? 'animate-border-red' : 'animate-border-blue');
        
        // İç parlama katmanı oluştur
        const glowLayer = document.createElement('div');
        glowLayer.className = `inner-glow-layer ${type === 'red' ? 'animate-inner-glow-red' : 'animate-inner-glow-blue'}`;
        element.appendChild(glowLayer);
        
        setTimeout(() => {
            element.classList.remove('animate-border-red', 'animate-border-blue');
            if (glowLayer.parentNode) {
                glowLayer.parentNode.removeChild(glowLayer);
            }
        }, 2000);
    };

    const createClockAnimation = (element) => {
        const clockContainer = element.querySelector('.clock-animation-container');
        if (clockContainer) {
            clockContainer.classList.remove('hidden');
            clockContainer.classList.add('flex');
            
            setTimeout(() => {
                clockContainer.classList.add('hidden');
                clockContainer.classList.remove('flex');
            }, 1500);
        }
    };

    // Overlay ve puanlama event listener'ları
    const setupOverlayEvents = (itemElement, item, type) => {
        // Overlay click event
        itemElement.addEventListener('click', (e) => {
            if (!e.target.closest('.top-right-controls')) {
                const overlay = itemElement.querySelector('.card-overlay');
                if (overlay) {
                    if (overlay.classList.contains('active')) {
                        overlay.classList.remove('active');
                        
                        // Rating submenu'sünü de kapat
                        const watchedRatingSubmenu = itemElement.querySelector('.watched-rating-submenu');
                        if (watchedRatingSubmenu && !watchedRatingSubmenu.classList.contains('hidden')) {
                            watchedRatingSubmenu.classList.add('hidden');
                            watchedRatingSubmenu.classList.remove('flex');
                            
                            // Rating butonunu eski haline getir
                            const ratingBtn = itemElement.querySelector('.rating-btn');
                            if (ratingBtn) {
                                const ratingBtnIcon = ratingBtn.querySelector('i');
                                const ratingBtnText = ratingBtn.querySelector('span');
                                if (ratingBtnText) ratingBtnText.style.display = 'inline';
                                if (ratingBtnIcon) ratingBtnIcon.style.display = 'inline';
                                ratingBtn.style.background = '';
                            }
                            
                            // Diğer menü öğelerini geri göster
                            const otherMenuItems = itemElement.querySelectorAll('.overlay-menu-item:not(.rating-btn)');
                            otherMenuItems.forEach(item => {
                                item.style.display = 'flex';
                            });
                        }
                    } else {
                        overlay.classList.add('active');
                        
                        const dominantColor = getComputedStyle(itemElement).backgroundColor;
                        if (dominantColor && dominantColor !== 'rgba(0, 0, 0, 0)') {
                            overlay.style.backgroundColor = dominantColor.replace(')', ', 0.8)').replace('rgb', 'rgba');
                        }
                    }
                }
            }
        });
        
        // Overlay içinde boş alana tıklama ile kapatma
        const overlay = itemElement.querySelector('.card-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                // Eğer overlay'in kendisine tıklandıysa (boş alan)
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                    
                    // Rating submenu'sünü de kapat
                    const watchedRatingSubmenu = itemElement.querySelector('.watched-rating-submenu');
                    if (watchedRatingSubmenu && !watchedRatingSubmenu.classList.contains('hidden')) {
                        watchedRatingSubmenu.classList.add('hidden');
                        watchedRatingSubmenu.classList.remove('flex');
                        
                        // Rating butonunu eski haline getir
                        const ratingBtn = itemElement.querySelector('.rating-btn');
                        if (ratingBtn) {
                            const ratingBtnIcon = ratingBtn.querySelector('i');
                            const ratingBtnText = ratingBtn.querySelector('span');
                            if (ratingBtnText) ratingBtnText.style.display = 'inline';
                            if (ratingBtnIcon) ratingBtnIcon.style.display = 'inline';
                            ratingBtn.style.background = '';
                        }
                        
                        // Diğer menü öğelerini geri göster
                        const otherMenuItems = itemElement.querySelectorAll('.overlay-menu-item:not(.rating-btn)');
                        otherMenuItems.forEach(item => {
                            item.style.display = 'flex';
                        });
                    }
                }
            });
        }

        // İzlendi & Puanlama butonları
        const watchedBtn = itemElement.querySelector('.watched-btn');
        const ratingBtn = itemElement.querySelector('.rating-btn');
        const watchedRatingSubmenu = itemElement.querySelector('.watched-rating-submenu');
        const hearts = itemElement.querySelectorAll('.heart-rating');
        
        if (watchedBtn) {
            watchedBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                
                // Doğrudan izlendi olarak işaretle (rating olmadan)
                if (type === 'search') {
                    await markAsWatchedFromSearch(item.imdbID, item.Title, item.Year, item.Poster, item.Type === 'movie' ? 'movie' : 'show');
                } else {
                    await markAsWatched(item.imdbID, item.Title, item.Year, item.Poster, type);
                }
                
                // Overlay'i anlık olarak güncelle
                const overlay = itemElement.querySelector('.card-overlay');
                if (overlay) {
                    const overlayContent = overlay.querySelector('.overlay-content');
                    if (overlayContent) {
                        // Mevcut seçenekleri koru
                        const existingButtons = overlayContent.querySelectorAll('.overlay-menu-item:not([data-dynamic])');
                        let newContent = '';
                        
                        existingButtons.forEach(btn => {
                            newContent += btn.outerHTML;
                        });
                        
                        // İzlendi olduğu için Favoriye Ekle ve Puanla seçeneklerini ekle
                        const type = item.Type === 'movie' ? 'movie' : 'show';
                        newContent += `
                            <button class="overlay-menu-item" data-dynamic onclick="addToFavorites(${JSON.stringify(item)}, '${type}')">
                                <i class="fa-solid fa-heart text-red-500"></i>
                                <span>Favoriye Ekle</span>
                            </button>
                            <button class="overlay-menu-item rating-btn" data-dynamic data-imdbID="${item.imdbID}">
                                <i class="fa-solid fa-heart text-red-500"></i>
                                <span>Puanla</span>
                            </button>
                            ${getWatchedRatingMenu()}
                        `;
                        
                        overlayContent.innerHTML = newContent;
                        
                        // Yeni event listener'ları ekle
                        setupOverlayEvents(itemElement, item, type);
                    }
                }
                
                // Animasyon çalıştır
                addGlowEffect(itemElement, 'red');
                
                showNotification('Film izlendi olarak işaretlendi!', 'success');
            });
        }
        
        if (ratingBtn) {
            ratingBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Rating btn clicked!'); // Debug log
                
                // Rating butonunun içeriğini değiştir
                const ratingBtnIcon = ratingBtn.querySelector('i');
                const ratingBtnText = ratingBtn.querySelector('span');
                
                // Diğer menü öğelerini bul
                const otherMenuItems = itemElement.querySelectorAll('.overlay-menu-item:not(.rating-btn)');
                
                if (watchedRatingSubmenu.classList.contains('hidden')) {
                    console.log('Opening rating submenu'); // Debug log
                    watchedRatingSubmenu.classList.remove('hidden');
                    watchedRatingSubmenu.classList.add('flex');
                    
                    // Puanla yazısını gizle
                    if (ratingBtnText) ratingBtnText.style.display = 'none';
                    if (ratingBtnIcon) ratingBtnIcon.style.display = 'none';
                    
                    // Rating btn'nin arka planını şeffaf yap
                    ratingBtn.style.background = 'transparent';
                    
                    // Diğer menü öğelerini gizle
                    otherMenuItems.forEach(item => {
                        item.style.display = 'none';
                    });
                } else {
                    console.log('Closing rating submenu'); // Debug log
                    watchedRatingSubmenu.classList.add('hidden');
                    watchedRatingSubmenu.classList.remove('flex');
                    
                    // Puanla yazısını göster
                    if (ratingBtnText) ratingBtnText.style.display = 'inline';
                    if (ratingBtnIcon) ratingBtnIcon.style.display = 'inline';
                    
                    // Rating btn'nin arka planını geri getir
                    ratingBtn.style.background = '';
                    
                    // Diğer menü öğelerini göster
                    otherMenuItems.forEach(item => {
                        item.style.display = 'flex';
                    });
                }
            });
        }
        
        // Kalp tıklama olayları
        hearts.forEach((heart, index) => {
            const heartValue = index + 1;
            const currentRating = getUserRating(item.imdbID);
            
            heart.classList.remove('active');
            if (currentRating >= heartValue) {
                heart.classList.add('active');
            }
            
            heart.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Heart clicked! Value:', heart.dataset.value); // Debug log
                const newRating = parseInt(heart.dataset.value);
                
                hearts.forEach((h, hIndex) => {
                    const hValue = hIndex + 1;
                    h.classList.remove('active');
                    if (newRating >= hValue) {
                        h.classList.add('active');
                    }
                });
                
                saveUserRating(item.imdbID, newRating);
                
                // İzlendi olarak işaretle (farklı fonksiyonlar için)
                if (type === 'search') {
                    markAsWatchedFromSearch(item.imdbID, item.Title, item.Year, item.Poster, item.Type === 'movie' ? 'movie' : 'show');
                } else {
                    markAsWatched(item.imdbID, item.Title, item.Year, item.Poster, type);
                }
                
                // Hemen overlay'i kapat
                watchedRatingSubmenu.classList.add('hidden');
                watchedRatingSubmenu.classList.remove('flex');
                
                // Rating butonunu eski haline getir
                const ratingBtn = itemElement.querySelector('.rating-btn');
                if (ratingBtn) {
                    const ratingBtnIcon = ratingBtn.querySelector('i');
                    const ratingBtnText = ratingBtn.querySelector('span');
                    if (ratingBtnText) ratingBtnText.style.display = 'inline';
                    if (ratingBtnIcon) ratingBtnIcon.style.display = 'inline';
                    
                    // Rating btn'nin arka planını geri getir
                    ratingBtn.style.background = '';
                }
                
                // Diğer menü öğelerini geri göster
                const otherMenuItems = itemElement.querySelectorAll('.overlay-menu-item:not(.rating-btn)');
                otherMenuItems.forEach(item => {
                    item.style.display = 'flex';
                });
                
                const overlay = itemElement.querySelector('.card-overlay');
                if (overlay) {
                    overlay.classList.remove('active');
                }
                
                // Kalp sayısını güncelle
                const userRatingText = itemElement.querySelector('.user-rating-text');
                if (userRatingText) {
                    userRatingText.textContent = newRating.toString();
                }
                
                // Animasyonları çalıştır
                createThumpAnimation(itemElement, newRating);
                addGlowEffect(itemElement, 'red');
                
                showNotification(`Film izlendi ve ${newRating}/5 puanlandı!`, 'success');
            });
        });
    };





    const originalSaveFavorites = () => {
        localStorage.setItem('favoriteMovies', JSON.stringify(favorites.movies));
        localStorage.setItem('favoriteShows', JSON.stringify(favorites.shows));
        localStorage.setItem('watchlistMovies', JSON.stringify(favorites.watchlistMovies));
        localStorage.setItem('watchlistShows', JSON.stringify(favorites.watchlistShows));
        localStorage.setItem('watchedMovies', JSON.stringify(favorites.watchedMovies));
        localStorage.setItem('watchedShows', JSON.stringify(favorites.watchedShows));
    };

    // Save favorites function - Global scope'a taşındı
    window.saveFavorites = () => {
        // Save to Firebase only
        saveUserData();
    };



    const addToFavorites = async (item, type) => {
        // Önce izlenip izlenmediğini kontrol et
        if (!isWatched(item.imdbID)) {
            showNotification('Sadece izlenmiş film/diziler favoriye eklenebilir!', 'error', 3000);
            return;
        }

        // Önce detay bilgilerini çek
        try {
            const details = await fetchData(`/api/details?imdbID=${item.imdbID}`);
            if (details.Response === "True") {
                item = { ...item, ...details };
            }
        } catch (error) {
            console.error('Favori eklerken detay çekme hatası:', error);
            return;
        }

        const favoriteItem = {
            ...item,
            type: type,
            addedAt: new Date().toISOString()
        };

        if (type === 'movie') {
            if (!favorites.movies.find(m => m.imdbID === item.imdbID)) {
                favorites.movies.push(favoriteItem);
                
                // Animasyon efekti
                const currentElement = document.querySelector(`[data-imdbid="${item.imdbID}"]`);
                if (currentElement) {
                    createHeartBurst(currentElement);
                    addGlowEffect(currentElement, 'red');
                }
            } else {
                // Bu film zaten favorilerde
            }
        } else {
            if (!favorites.shows.find(s => s.imdbID === item.imdbID)) {
                favorites.shows.push(favoriteItem);
                
                // Animasyon efekti
                const currentElement = document.querySelector(`[data-imdbid="${item.imdbID}"]`);
                if (currentElement) {
                    createHeartBurst(currentElement);
                    addGlowEffect(currentElement, 'red');
                }
            } else {
                // Bu dizi zaten favorilerde
            }
        }

        saveFavorites();
        renderFavorites();
        
        // Arama sonuçlarında ise overlay'i yeniden render et
        const searchItemElement = document.querySelector(`[data-imdbid="${item.imdbID}"]`);
        if (searchItemElement && searchItemElement.classList.contains('item')) {
            // Overlay'i yeniden render et
            const overlay = searchItemElement.querySelector('.card-overlay');
            if (overlay) {
                const overlayContent = overlay.querySelector('.overlay-content');
                if (overlayContent) {
                    // Mevcut seçenekleri koru
                    const existingButtons = overlayContent.querySelectorAll('.overlay-menu-item:not([data-dynamic])');
                    let newContent = '';
                    
                    existingButtons.forEach(btn => {
                        newContent += btn.outerHTML;
                    });
                    
                    // Favoriye eklendiği için "Favoriye Ekle" butonunu "Favoriden Kaldır" olarak değiştir
                    const favoriteBtn = newContent.match(/<button[^>]*onclick="addToFavorites[^>]*>.*?<span>Favoriye Ekle<\/span>.*?<\/button>/);
                    if (favoriteBtn) {
                        newContent = newContent.replace(
                            /<button([^>]*)onclick="addToFavorites[^>]*>.*?<span>Favoriye Ekle<\/span>.*?<\/button>/,
                            `<button$1onclick="removeFromFavoritesFromSearch('${item.imdbID}', '${type}')">
                                <i class="fa-solid fa-heart text-red-500"></i>
                                <span>Favoriden Kaldır</span>
                            </button>`
                        );
                    }
                    
                    overlayContent.innerHTML = newContent;
                    
                    // Yeni event listener'ları ekle
                    setupOverlayEvents(searchItemElement, item, 'search');
                }
            }
        }
    };

    const removeFromFavorites = (imdbID, type) => {
        let removedItem = null;
        
        if (type === 'movie') {
            removedItem = favorites.movies.find(m => m.imdbID === imdbID);
            favorites.movies = favorites.movies.filter(m => m.imdbID !== imdbID);
        } else {
            removedItem = favorites.shows.find(s => s.imdbID === imdbID);
            favorites.shows = favorites.shows.filter(s => s.imdbID !== imdbID);
        }

        if (removedItem) {
            // Favoriden kaldırıldı
        }

        saveFavorites();
        renderFavorites();
    };

    const addToWatchlist = async (item, type) => {
        // Önce detay bilgilerini çek
        try {
            const details = await fetchData(`/api/details?imdbID=${item.imdbID}`);
            if (details.Response === "True") {
                item = { ...item, ...details };
            }
        } catch (error) {
            console.error('Watchlist eklerken detay çekme hatası:', error);
            return;
        }

        const watchlistItem = {
            ...item,
            type: type,
            addedAt: new Date().toISOString()
        };

        if (type === 'movie') {
            if (!favorites.watchlistMovies.find(m => m.imdbID === item.imdbID)) {
                favorites.watchlistMovies.push(watchlistItem);
                
                // Animasyon efekti
                const currentElement = document.querySelector(`[data-imdbid="${item.imdbID}"]`);
                if (currentElement) {
                    createClockAnimation(currentElement);
                    addGlowEffect(currentElement, 'blue');
                }
            } else {
                // Bu film zaten watchlist'te
            }
        } else {
            if (!favorites.watchlistShows.find(s => s.imdbID === item.imdbID)) {
                favorites.watchlistShows.push(watchlistItem);
                
                // Animasyon efekti
                const currentElement = document.querySelector(`[data-imdbid="${item.imdbID}"]`);
                if (currentElement) {
                    createClockAnimation(currentElement);
                    addGlowEffect(currentElement, 'blue');
                }
            } else {
                // Bu dizi zaten watchlist'te
            }
        }

        saveFavorites();
        renderFavorites();
        
        // Arama sonuçlarında ise overlay'i yeniden render et
        const searchItemElement = document.querySelector(`[data-imdbid="${item.imdbID}"]`);
        if (searchItemElement && searchItemElement.classList.contains('item')) {
            // Overlay'i yeniden render et
            const overlay = searchItemElement.querySelector('.card-overlay');
            if (overlay) {
                const overlayContent = overlay.querySelector('.overlay-content');
                if (overlayContent) {
                    // Mevcut seçenekleri koru
                    const existingButtons = overlayContent.querySelectorAll('.overlay-menu-item:not([data-dynamic])');
                    let newContent = '';
                    
                    existingButtons.forEach(btn => {
                        newContent += btn.outerHTML;
                    });
                    
                    // Watchlist'e eklendiği için "Daha Sonra İzle" butonunu "Listeden Kaldır" olarak değiştir
                    const watchlistBtn = newContent.match(/<button[^>]*onclick="addToWatchlistFromSearch[^>]*>.*?<span>Daha Sonra İzle<\/span>.*?<\/button>/);
                    if (watchlistBtn) {
                        newContent = newContent.replace(
                            /<button([^>]*)onclick="addToWatchlistFromSearch[^>]*>.*?<span>Daha Sonra İzle<\/span>.*?<\/button>/,
                            `<button$1onclick="removeFromWatchlistFromSearch('${item.imdbID}', '${type}')">
                                <i class="fa-solid fa-times text-red-500"></i>
                                <span>Kaldır</span>
                            </button>`
                        );
                    }
                    
                    overlayContent.innerHTML = newContent;
                    
                    // Yeni event listener'ları ekle
                    setupOverlayEvents(searchItemElement, item, 'search');
                }
            }
        }
    };

    const removeFromWatchlist = (imdbID, type) => {
        let removedItem = null;
        
        if (type === 'movie') {
            removedItem = favorites.watchlistMovies.find(m => m.imdbID === imdbID);
            favorites.watchlistMovies = favorites.watchlistMovies.filter(m => m.imdbID !== imdbID);
        } else {
            removedItem = favorites.watchlistShows.find(s => s.imdbID === imdbID);
            favorites.watchlistShows = favorites.watchlistShows.filter(s => s.imdbID !== imdbID);
        }

        if (removedItem) {
            // Watchlist'ten kaldırıldı
        }

        saveFavorites();
        renderFavorites();
    };

    const markAsWatched = async (imdbID, title, year, poster, type) => {
        let item = { imdbID, Title: title, Year: year, Poster: poster };
        
        // Önce detay bilgilerini çek
        try {
            const details = await fetchData(`/api/details?imdbID=${imdbID}`);
            if (details.Response === "True") {
                item = { ...item, ...details };
            }
        } catch (error) {
            console.error('İzlendi işaretlerken detay çekme hatası:', error);
            return;
        }

        const watchedItem = {
            ...item,
            type: type,
            watchedAt: new Date().toISOString(),
            watchedDate: new Date().toISOString()
        };

        // Watchlist'ten kaldır (renderFavorites çağırmadan)
        if (type === 'movie') {
            favorites.watchlistMovies = favorites.watchlistMovies.filter(m => m.imdbID !== imdbID);
        } else {
            favorites.watchlistShows = favorites.watchlistShows.filter(s => s.imdbID !== imdbID);
        }

        // İzlendi listesine ekle
        if (type === 'movie') {
            if (!favorites.watchedMovies.find(m => m.imdbID === imdbID)) {
                favorites.watchedMovies.push(watchedItem);
            }
        } else {
            if (!favorites.watchedShows.find(s => s.imdbID === imdbID)) {
                favorites.watchedShows.push(watchedItem);
            }
        }

        saveFavorites();
        
        // Arama sonuçlarında ise overlay'i yeniden render et
        const searchItemElement = document.querySelector(`[data-imdbid="${imdbID}"]`);
        if (searchItemElement && searchItemElement.classList.contains('item')) {
            // Overlay'i yeniden render et
            const overlay = searchItemElement.querySelector('.card-overlay');
            if (overlay) {
                const overlayContent = overlay.querySelector('.overlay-content');
                if (overlayContent) {
                    // Favoriye Ekle ve Puanla seçeneklerini ekle
                    const hasWatched = isWatched(imdbID);
                    const type = item.Type === 'movie' ? 'movie' : 'show';
                    
                    // Mevcut seçenekleri koru, sadece izlenmiş içerikler için yeni seçenekler ekle
                    const existingButtons = overlayContent.querySelectorAll('.overlay-menu-item:not([data-dynamic])');
                    let newContent = '';
                    
                    existingButtons.forEach(btn => {
                        newContent += btn.outerHTML;
                    });
                    
                    if (hasWatched) {
                        newContent += `
                            <button class="overlay-menu-item" data-dynamic onclick="addToFavorites(${JSON.stringify(item)}, '${type}')">
                                <i class="fa-solid fa-heart text-red-500"></i>
                                <span>Favoriye Ekle</span>
                            </button>
                            <button class="overlay-menu-item rating-btn" data-dynamic data-imdbID="${imdbID}">
                                <i class="fa-solid fa-heart text-red-500"></i>
                                <span>Puanla</span>
                            </button>
                            ${getWatchedRatingMenu()}
                        `;
                    }
                    
                    overlayContent.innerHTML = newContent;
                    
                    // Yeni event listener'ları ekle
                    setupOverlayEvents(searchItemElement, item, 'search');
                }
            }
        }
    };

    const removeFromWatched = (imdbID, type) => {
        let removedItem = null;
        
        if (type === 'movie') {
            removedItem = favorites.watchedMovies.find(m => m.imdbID === imdbID);
            favorites.watchedMovies = favorites.watchedMovies.filter(m => m.imdbID !== imdbID);
        } else {
            removedItem = favorites.watchedShows.find(s => s.imdbID === imdbID);
            favorites.watchedShows = favorites.watchedShows.filter(s => s.imdbID !== imdbID);
        }

        if (removedItem) {
            // İzlendi listesinden kaldırıldı
        }

        saveFavorites();
        renderFavorites();
    };

    const getItemCategory = (imdbID) => {
        if (isFavorite(imdbID)) return 'favorite';
        if (isInWatchlist(imdbID)) return 'watchlist';
        if (isWatched(imdbID)) return 'watched';
        return 'none';
    };

    // Ortak HTML template'leri


    const renderSearchItems = async (data) => {
        content.innerHTML = '';
        if (data.Response === "False") {
            content.innerHTML = `<p class="error-message">${data.Error}</p>`;
            return;
        }

        const items = data.Search;
        if (!items || items.length === 0) {
            content.innerHTML = `<p class="info-message">Sonuç bulunamadı. Başka bir arama deneyin!</p>`;
            return;
        }

        // Her öğe için detay bilgilerini çek
        const itemsWithDetails = await Promise.all(
            items.map(async (item) => {
                try {
                    const details = await fetchData(`/api/details?imdbID=${item.imdbID}`);
                    if (details.Response === "True") {
                        return { ...item, ...details };
                    }
                } catch (error) {
                    console.error('Detay çekme hatası:', error);
                }
                return item;
            })
        );

        itemsWithDetails.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item';
            itemElement.setAttribute('data-imdbid', item.imdbID);

            const poster = (item.Poster && item.Poster !== 'N/A') ? item.Poster : './yok.PNG';
            const isFav = isFavorite(item.imdbID);
            const type = item.Type === 'movie' ? 'movie' : 'show';
            const rating = item.imdbRating && item.imdbRating !== 'N/A' ? item.imdbRating : 'N/A';
            const hasWatched = isWatched(item.imdbID);

            itemElement.innerHTML = `
                ${getAnimationContainers()}
                <img src="${poster}" alt="${item.Title} Poster" onerror="this.src='./yok.PNG'">
                
                ${getTopRightControls(rating, item.imdbID)}

                <!-- Overlay Menü -->
                <div class="card-overlay">
                    <div class="overlay-content">
                        <button class="overlay-menu-item" onclick="addToWatchlistFromSearch('${item.imdbID}', '${item.Title}', '${item.Year}', '${item.Poster}', '${type}')">
                            <i class="fa-solid fa-clock text-orange-500"></i>
                            <span>Daha Sonra İzle</span>
                        </button>
                        <button class="overlay-menu-item" onclick="showDetails('${item.imdbID}')">
                            <i class="fa-solid fa-info-circle text-blue-500"></i>
                            <span>Detaylar</span>
                        </button>
                        <button class="overlay-menu-item watched-btn" data-imdbID="${item.imdbID}">
                            <i class="fa-solid fa-check-circle text-green-500"></i>
                            <span>İzlendi</span>
                        </button>
                        ${hasWatched ? `
                            <button class="overlay-menu-item" onclick="addToFavorites(${JSON.stringify(item)}, '${type}')">
                                <i class="fa-solid fa-heart text-red-500"></i>
                                <span>Favoriye Ekle</span>
                            </button>
                            <button class="overlay-menu-item rating-btn" data-imdbID="${item.imdbID}">
                                <i class="fa-solid fa-heart text-red-500"></i>
                                <span>Puanla</span>
                            </button>
                            ${getWatchedRatingMenu()}
                        ` : ''}
                    </div>
                </div>

                <div class="item-info">
                    <h3>${item.Title}</h3>
                </div>
            `;

            // Setup overlay events first
            setupOverlayEvents(itemElement, item, 'search');

            // Add to DOM first, then apply colors
            content.appendChild(itemElement);
            
            // Apply card colors after DOM insertion
            applyCardColors(itemElement, poster);
        });
    };





    const searchItems = async () => {
        const query = searchInput.value.trim();
        if (!query) return;
        
        // Show search results section and hide favorites sections
        searchResultsSection.style.display = 'block';
        document.querySelectorAll('.favorites-section').forEach(section => {
            section.style.display = 'none';
        });
        
        content.innerHTML = '<p class="info-message">Aranıyor...</p>';
        const results = await fetchData(`/api/search?query=${encodeURIComponent(query)}`);
        await renderSearchItems(results);
    };

    const clearSearch = () => {
        searchInput.value = '';
        searchResultsSection.style.display = 'none';
        document.querySelectorAll('.favorites-section').forEach(section => {
            section.style.display = 'block';
        });
    };

    // Global functions for onclick handlers
    window.toggleFavorite = async (imdbID, title, year, poster, type) => {
        const item = { imdbID, Title: title, Year: year, Poster: poster };
        const btn = event.target.closest('.favorite-btn');
        
        if (isFavorite(imdbID)) {
            removeFromFavorites(imdbID, type);
            // Update button appearance after removal
            if (btn) {
                btn.classList.remove('favorited');
            }
        } else {
            await addToFavorites(item, type);
            // Update button appearance after addition
            if (btn) {
                btn.classList.add('favorited');
            }
        }
    };

    window.removeFromFavorites = (imdbID, type) => {
        removeFromFavorites(imdbID, type);
    };

    window.removeFromWatchlist = (imdbID, type) => {
        removeFromWatchlist(imdbID, type);
    };

    window.markAsWatched = (imdbID, title, year, poster, type) => {
        markAsWatched(imdbID, title, year, poster, type);
    };

    window.removeFromWatched = (imdbID, type) => {
        removeFromWatched(imdbID, type);
    };

    window.addToWatchlistFromSearch = async (imdbID, title, year, poster, type) => {
        const item = { imdbID, Title: title, Year: year, Poster: poster };
        await addToWatchlist(item, type);
    };

    window.removeFromWatchlistFromSearch = async (imdbID, type) => {
        await removeFromWatchlist(imdbID, type);
        
        // Arama sonuçlarında ise overlay'i yeniden render et
        const searchItemElement = document.querySelector(`[data-imdbid="${imdbID}"]`);
        if (searchItemElement && searchItemElement.classList.contains('item')) {
            // Overlay'i yeniden render et
            const overlay = searchItemElement.querySelector('.card-overlay');
            if (overlay) {
                const overlayContent = overlay.querySelector('.overlay-content');
                if (overlayContent) {
                    // Mevcut seçenekleri koru
                    const existingButtons = overlayContent.querySelectorAll('.overlay-menu-item:not([data-dynamic])');
                    let newContent = '';
                    
                    existingButtons.forEach(btn => {
                        newContent += btn.outerHTML;
                    });
                    
                    // Watchlist'ten kaldırıldığı için "Listeden Kaldır" butonunu "Daha Sonra İzle" olarak değiştir
                    const removeBtn = newContent.match(/<button[^>]*onclick="removeFromWatchlistFromSearch[^>]*>.*?<span>Kaldır<\/span>.*?<\/button>/);
                    if (removeBtn) {
                        newContent = newContent.replace(
                            /<button([^>]*)onclick="removeFromWatchlistFromSearch[^>]*>.*?<span>Kaldır<\/span>.*?<\/button>/,
                            `<button$1onclick="addToWatchlistFromSearch('${imdbID}', '${item.Title}', '${item.Year}', '${item.Poster}', '${type}')">
                                <i class="fa-solid fa-clock text-orange-500"></i>
                                <span>Daha Sonra İzle</span>
                            </button>`
                        );
                    }
                    
                    overlayContent.innerHTML = newContent;
                    
                    // Yeni event listener'ları ekle
                    setupOverlayEvents(searchItemElement, item, 'search');
                }
            }
        }
    };

    window.removeFromFavoritesFromSearch = async (imdbID, type) => {
        await removeFromFavorites(imdbID, type);
        
        // Arama sonuçlarında ise overlay'i yeniden render et
        const searchItemElement = document.querySelector(`[data-imdbid="${imdbID}"]`);
        if (searchItemElement && searchItemElement.classList.contains('item')) {
            // Overlay'i yeniden render et
            const overlay = searchItemElement.querySelector('.card-overlay');
            if (overlay) {
                const overlayContent = overlay.querySelector('.overlay-content');
                if (overlayContent) {
                    // Mevcut seçenekleri koru
                    const existingButtons = overlayContent.querySelectorAll('.overlay-menu-item:not([data-dynamic])');
                    let newContent = '';
                    
                    existingButtons.forEach(btn => {
                        newContent += btn.outerHTML;
                    });
                    
                    // Favoriden kaldırıldığı için "Favoriden Kaldır" butonunu "Favoriye Ekle" olarak değiştir
                    const removeBtn = newContent.match(/<button[^>]*onclick="removeFromFavoritesFromSearch[^>]*>.*?<span>Favoriden Kaldır<\/span>.*?<\/button>/);
                    if (removeBtn) {
                        newContent = newContent.replace(
                            /<button([^>]*)onclick="removeFromFavoritesFromSearch[^>]*>.*?<span>Favoriden Kaldır<\/span>.*?<\/button>/,
                            `<button$1onclick="addToFavorites(${JSON.stringify(item)}, '${type}')">
                                <i class="fa-solid fa-heart text-red-500"></i>
                                <span>Favoriye Ekle</span>
                            </button>`
                        );
                    }
                    
                    overlayContent.innerHTML = newContent;
                    
                    // Yeni event listener'ları ekle
                    setupOverlayEvents(searchItemElement, item, 'search');
                }
            }
        }
    };

    window.markAsWatchedFromSearch = async (imdbID, title, year, poster, type) => {
        const item = { imdbID, Title: title, Year: year, Poster: poster };
        await markAsWatched(imdbID, title, year, poster, type);
    };

    window.toggleFavoriteFromWatched = async (imdbID, title, year, poster, type) => {
        const item = { imdbID, Title: title, Year: year, Poster: poster };
        
        if (isFavorite(imdbID)) {
            removeFromFavorites(imdbID, type);
        } else {
            // İzlenmiş içerikler zaten favoriye eklenebilir
            await addToFavorites(item, type);
        }
    };

    // Animasyon fonksiyonları
    const createHeartBurst = (element) => {
        const heartBurstContainer = element.querySelector('.heart-burst-container');
        const heartCount = 30;
        const burstDistance = 70;
        
        for (let i = 0; i < heartCount; i++) {
            const heart = document.createElement('i');
            const randomColor = ['text-red-500', 'text-pink-500', 'text-rose-500'][Math.floor(Math.random() * 3)];
            heart.className = `fa-solid fa-heart absolute bursting-heart ${randomColor}`;
            
            const edge = Math.floor(Math.random() * 4);
            let startX, startY;
            if (edge === 0) { startX = `${Math.random() * 100}%`; startY = `-5%`; }
            else if (edge === 1) { startX = `105%`; startY = `${Math.random() * 100}%`; }
            else if (edge === 2) { startX = `${Math.random() * 100}%`; startY = `105%`; }
            else { startX = `-5%`; startY = `${Math.random() * 100}%`; }
            
            heart.style.left = startX;
            heart.style.top = startY;
            const angle = Math.random() * Math.PI * 2;
            const tx = Math.cos(angle) * burstDistance;
            const ty = Math.sin(angle) * burstDistance;
            heart.style.setProperty('--tx', `${tx}px`);
            heart.style.setProperty('--ty', `${ty}px`);
            heart.style.fontSize = `${Math.random() * 15 + 15}px`;
            heart.style.animationDuration = `${Math.random() * 1 + 1.5}s`;
            heart.addEventListener('animationend', () => heart.remove());
            heartBurstContainer.appendChild(heart);
        }
    };



    // Layout toggle fonksiyonu
    window.toggleLayout = (containerId) => {
        const container = document.getElementById(containerId);
        const toggleBtn = container.previousElementSibling.querySelector('.layout-toggle');
        const icon = toggleBtn.querySelector('i');
        
        if (container.classList.contains('grid')) {
            // Grid düzenden yatay düzene geç
            container.classList.remove('grid');
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
            toggleBtn.classList.add('rotated');
        } else {
            // Yatay düzenden grid düzene geç
            container.classList.add('grid');
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
            toggleBtn.classList.remove('rotated');
        }
    };

    window.closeModal = closeModal;

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });

    // Event listeners
    searchBtn.addEventListener('click', searchItems);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchItems();
        }
    });

    // Logo click event - ana sayfaya dön
    document.getElementById('logo').addEventListener('click', () => {
        clearSearch();
        showNotification('Ana sayfaya dönüldü!', 'info', 2000);
    });

    // Menü açma/kapama fonksiyonları
    const toggleMenu = (menu) => {
        if (menu.classList.contains('show')) {
            menu.classList.remove('show');
        } else {
            menu.classList.add('show');
        }
    };

    // Menü event listener'ları
    document.addEventListener('click', (e) => {
        const menuBtn = e.target.closest('.menu-btn');
        const menuWrapper = e.target.closest('.menu-wrapper');
        const actionsMenu = e.target.closest('.actions-menu');
        const userRatingBox = e.target.closest('.user-rating-box');
        const ratingHeartsMenu = e.target.closest('.rating-hearts-menu');

        if (menuBtn) {
            e.stopPropagation();
            const menu = menuBtn.nextElementSibling;
            toggleMenu(menu);
        } else if (userRatingBox) {
            e.stopPropagation();
            const ratingMenu = userRatingBox.nextElementSibling;
            toggleMenu(ratingMenu);
        } else if (!menuWrapper && !actionsMenu && !ratingHeartsMenu) {
            // Dışarıya tıklandığında tüm menüleri kapat
            document.querySelectorAll('.actions-menu').forEach(menu => {
                menu.classList.remove('show');
            });
            document.querySelectorAll('.rating-hearts-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });

    // Clear search when clicking on favorite items
    document.addEventListener('click', (e) => {
        if (e.target.closest('.favorite-item')) {
            clearSearch();
        }
    });

    // Initial render
    renderFavorites();

    // Notification system - Global scope'a taşındı
    window.showNotification = (message, type = 'info', duration = 3000) => {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        const notificationIcon = document.getElementById('notification-icon');
        
        // Set message and icon
        notificationText.textContent = message;
        
        // Set icon based on type
        switch (type) {
            case 'success':
                notificationIcon.className = 'notification-icon fas fa-heart';
                break;
            case 'error':
                notificationIcon.className = 'notification-icon fas fa-times';
                break;
            case 'info':
            default:
                notificationIcon.className = 'notification-icon fas fa-info-circle';
                break;
        }
        
        // Remove existing classes and add new type
        notification.className = 'notification-popup ' + type;
        
        // Show notification
        notification.classList.add('show');
        
        // Auto hide after duration
        setTimeout(() => {
            notification.classList.remove('show');
        }, duration);
    };
    
    // Initialize Firebase Authentication when everything is loaded
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for Firebase to be loaded
        setTimeout(() => {
            if (window.auth) {
                initAuth();
                
                // Add event listeners to auth buttons
                const loginBtn = document.getElementById('loginBtn');
                const googleLoginBtn = document.getElementById('googleLoginBtn');
                const registerBtn = document.getElementById('registerBtn');
                const googleRegisterBtn = document.getElementById('googleRegisterBtn');
                const authBtn = document.getElementById('authBtn');
                const diaryBtn = document.getElementById('diaryBtn');
                
                if (loginBtn) loginBtn.onclick = handleEmailLogin;
                if (googleLoginBtn) googleLoginBtn.onclick = () => handleGoogleAuth(false);
                if (registerBtn) registerBtn.onclick = handleEmailRegister;
                if (googleRegisterBtn) googleRegisterBtn.onclick = () => handleGoogleAuth(true);
                if (authBtn) authBtn.onclick = openAuthModal;
                if (diaryBtn) diaryBtn.onclick = openDiaryModal;
                
                console.log('Auth event listeners added');
            } else {
                console.error('Firebase Auth not loaded');
            }
        }, 1000);
    });
});

// Film Günlüğü Fonksiyonları - Eski versiyon kaldırıldı

const renderDiaryContent = () => {
    const diaryContent = document.getElementById('diaryContent');
    
    // İzlenen film ve dizileri birleştir
    const allWatched = [
        ...favorites.watchedMovies.map(item => ({ ...item, type: 'movie' })),
        ...favorites.watchedShows.map(item => ({ ...item, type: 'show' }))
    ];
    
    // Tarihe göre sırala (en yeni önce)
    allWatched.sort((a, b) => {
        const dateA = new Date(a.watchedDate || Date.now());
        const dateB = new Date(b.watchedDate || Date.now());
        return dateB - dateA;
    });
    
    if (allWatched.length === 0) {
        diaryContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #888;">
                <i class="fas fa-calendar-alt" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                <h3>Henüz film günlüğünüz boş</h3>
                <p>Film izledikçe burada görünecek</p>
            </div>
        `;
        return;
    }
    
    const diaryHTML = allWatched.map(item => {
        const watchedDate = new Date(item.watchedDate || Date.now());
        const month = watchedDate.toLocaleDateString('tr-TR', { month: 'long' }).toUpperCase();
        const day = watchedDate.getDate();
        const year = watchedDate.getFullYear();
        
        // Kullanıcı puanını al
        const userRating = favorites.userRatings[item.imdbID] || 0;
        const stars = generateStars(userRating);
        
        // İkon belirleme (kalp veya retweet)
        let icon = '';
        if (favorites.movies.find(m => m.imdbID === item.imdbID) || 
            favorites.shows.find(s => s.imdbID === item.imdbID)) {
            icon = '<i class="fas fa-heart diary-icon heart"></i>';
        } else if (item.rewatch) {
            icon = '<i class="fas fa-retweet diary-icon retweet"></i>';
        }
        
        return `
            <div class="diary-entry">
                <div class="diary-poster">
                    <img src="${item.Poster}" alt="${item.Title}" onerror="this.src='https://placehold.co/100x150/1a1a1a/C6C6C6?text=Poster'">
                </div>
                <div class="diary-info">
                    <h3 class="diary-title">${item.Title}</h3>
                    <p class="diary-year">${item.Year}</p>
                    <div class="diary-rating">
                        <div class="diary-stars">
                            ${stars}
                        </div>
                        ${icon}
                    </div>
                </div>
                <div class="diary-date">
                    <p class="diary-month">${month}</p>
                    <p class="diary-day">${day}</p>
                    <p class="diary-year-text">${year}</p>
                </div>
            </div>
        `;
    }).join('');
    
    diaryContent.innerHTML = diaryHTML;
};

const generateStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHTML = '';
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            starsHTML += '<i class="fas fa-star diary-star"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt diary-star"></i>';
        } else {
            starsHTML += '<i class="far fa-star diary-star empty"></i>';
        }
    }
    
    return starsHTML;
};