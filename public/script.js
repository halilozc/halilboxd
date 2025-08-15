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
    continuingShows: [],
    userRatings: {},
    watchedEpisodes: {}
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
                await filterCalendarEvents();
            });
        });
        filterListenersAdded = true;
    }
};

// Cube button click handler
const handleCubeClick = () => {
    const roomSection = document.getElementById('room-section');
    const favoritesSections = document.querySelectorAll('.favorites-section');
    const searchResultsSection = document.getElementById('search-results-section');
    
    if (roomSection.style.display === 'none') {
        // Room'u göster, diğerlerini gizle
        roomSection.style.display = 'flex';
        favoritesSections.forEach(section => {
            section.style.display = 'none';
        });
        if (searchResultsSection) {
            searchResultsSection.style.display = 'none';
        }
        
        // Film posterlerini yükle (güncel watchlist verilerini kullan)
        setTimeout(() => {
            insertImagesIntoDivs();
            adjustContentSize();
        }, 100);
        
        // Otomatik tam ekran yap
        setTimeout(() => {
            toggleFullscreen();
            
            // Mobilde tam ekran modu
            if (window.innerWidth <= 768) {
                document.body.classList.add('landscape-mode');
                showNotification('Mobil tam ekran modu aktif! 📱', 'info', 2000);
            }
        }, 500);
        
        showNotification('3D Film Odası açıldı! 🎬', 'success', 2000);
    } else {
        // Room'u gizle, favorileri göster
        roomSection.style.display = 'none';
        favoritesSections.forEach(section => {
            section.style.display = 'block';
        });
        
        showNotification('Ana sayfaya dönüldü! 🏠', 'info', 2000);
    }
    
    console.log('3D Cube button clicked!');
};

// Close room function
const closeRoom = () => {
    const roomSection = document.getElementById('room-section');
    const favoritesSections = document.querySelectorAll('.favorites-section');
    
    if (roomSection && roomSection.style.display !== 'none') {
        // Room'u gizle
        roomSection.style.display = 'none';
        
        // Favori bölümlerini geri göster
        favoritesSections.forEach(section => {
            section.style.display = 'block';
        });
        
        showNotification('3D Cube kapatıldı! 🎬', 'info', 2000);
    }
};

// Toggle fullscreen function
const toggleFullscreen = () => {
    const roomSection = document.getElementById('room-section');
    const fullscreenBtn = document.getElementById('close-room-btn');
    const fullscreenIcon = fullscreenBtn.querySelector('i');
    
    if (!document.fullscreenElement) {
        // Tam ekran yap
        if (roomSection.requestFullscreen) {
            roomSection.requestFullscreen();
        } else if (roomSection.webkitRequestFullscreen) {
            roomSection.webkitRequestFullscreen();
        } else if (roomSection.msRequestFullscreen) {
            roomSection.msRequestFullscreen();
        }
        
        // İkonu çarpı yap
        fullscreenIcon.className = 'fas fa-times';
        fullscreenBtn.title = 'Kapat';
        
        showNotification('Tam ekran modu açıldı! 🖥️', 'info', 2000);
    } else {
        // Tam ekrandan çık
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        // İkonu geri değiştir
        fullscreenIcon.className = 'fas fa-times';
        fullscreenBtn.title = 'Kapat';
        
        showNotification('Tam ekran modu kapatıldı! 🖥️', 'info', 2000);
    }
};

// Request landscape orientation function
const requestLandscapeOrientation = () => {
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').then(() => {
            showNotification('Yatay moda geçildi! 📱', 'info', 2000);
        }).catch(() => {
            // Yatay mod desteklenmiyorsa veya kullanıcı izin vermediyse
            showNotification('Yatay mod için cihazınızı döndürün! 📱', 'info', 3000);
        });
    } else if (screen.lockOrientation) {
        // Eski API desteği
        if (screen.lockOrientation('landscape')) {
            showNotification('Yatay moda geçildi! 📱', 'info', 2000);
        } else {
            showNotification('Yatay mod için cihazınızı döndürün! 📱', 'info', 3000);
        }
    } else if (screen.mozLockOrientation) {
        // Firefox desteği
        if (screen.mozLockOrientation('landscape')) {
            showNotification('Yatay moda geçildi! 📱', 'info', 2000);
        } else {
            showNotification('Yatay mod için cihazınızı döndürün! 📱', 'info', 3000);
        }
    } else if (screen.msLockOrientation) {
        // IE/Edge desteği
        if (screen.msLockOrientation('landscape')) {
            showNotification('Yatay moda geçildi! 📱', 'info', 2000);
        } else {
            showNotification('Yatay mod için cihazınızı döndürün! 📱', 'info', 3000);
        }
    } else {
        // API desteklenmiyorsa kullanıcıya talimat ver
        showNotification('Yatay mod için cihazınızı döndürün! 📱', 'info', 3000);
    }
};

// Unlock orientation function
const unlockOrientation = () => {
    if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
    } else if (screen.unlockOrientation) {
        screen.unlockOrientation();
    } else if (screen.mozUnlockOrientation) {
        screen.mozUnlockOrientation();
    } else if (screen.msUnlockOrientation) {
        screen.msUnlockOrientation();
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

// New feature modal functions
const openNewModal = () => {
    document.getElementById('newModal').style.display = 'block';
    // Initialize 3D cube animation
    setTimeout(() => {
        insertImagesIntoDivs();
        adjustContentSize();
    }, 100);
};

const closeNewModal = () => {
    document.getElementById('newModal').style.display = 'none';
};

// 3D Cube Animation Functions
const filmPosters = [
    "room/film afişleri/MV5BMzQxNzQzOTQwM15BMl5BanBnXkFtZTgwMDQ2NTcwODM@._V1_SX300.jpg",
    "room/film afişleri/MV5BNzA3ZjZlNzYtMTdjMy00NjMzLTk5ZGYtMTkyYzNiOGM1YmM3XkEyXkFqcGc@._V1_SX300.jpg",
    "room/film afişleri/MV5BYmNhOWMyNTYtNTljNC00NTU3LWFiYmQtMDBhOGU5NWFhNGU5XkEyXkFqcGc@._V1_SX300.jpg",
    "room/film afişleri/MV5BMTU4NDg0MzkzNV5BMl5BanBnXkFtZTgwODA3Mzc1MDE@._V1_SX300.jpg",
    "room/film afişleri/MV5BZWMyZjkzMDItZWM1NS00ODA2LTg3NjYtMjgxMzY1ZjAzYTQwXkEyXkFqcGc@._V1_SX300.jpg",
    "room/film afişleri/MV5BYWFmMjdmNjctNzhhOC00ZmMzLTkwOGItMmVmZDU4MjE2MTYwXkEyXkFqcGc@._V1_SX300.jpg",
    "room/film afişleri/MV5BNzYyODQyODAyOV5BMl5BanBnXkFtZTgwMzc4MzczOTE@._V1_SX300.jpg",
    "room/film afişleri/MV5BNmQxMTI1YmEtOGY3Yi00NzVlLWEzMjAtYTI1NWZkNDFiMDg1XkEyXkFqcGc@._V1_SX300.jpg"
];

const createImageGallery = () => {
    let imageHTML = '<div class="image-container">';
    
    // Daha sonra izle listelerinden posterleri al
    const watchlistPosters = [];
    
    // Filmlerden posterleri ekle
    favorites.watchlistMovies.forEach(movie => {
        if (movie.Poster && movie.Poster !== 'N/A' && movie.Poster !== './yok.PNG') {
            watchlistPosters.push(movie.Poster);
        }
    });
    
    // Dizilerden posterleri ekle
    favorites.watchlistShows.forEach(show => {
        if (show.Poster && show.Poster !== 'N/A' && show.Poster !== './yok.PNG') {
            watchlistPosters.push(show.Poster);
        }
    });
    
    // Eğer watchlist boşsa, varsayılan posterleri kullan
    if (watchlistPosters.length === 0) {
        filmPosters.forEach(posterUrl => {
            watchlistPosters.push(posterUrl);
        });
    }
    
    // Poster sayısını sınırla (performans için)
    const maxPosters = Math.min(watchlistPosters.length, 50);
    
    // Posterleri tekrarlayarak galeri oluştur (çok daha az tekrar)
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < maxPosters; j++) {
            const posterUrl = watchlistPosters[j % watchlistPosters.length];
            imageHTML += `<img src="${posterUrl}" style="
                width: 180px; 
                height: 180px; 
                margin: 0; 
                object-fit: cover; 
                border-radius: 0; 
                box-shadow: none; 
                display: inline-block;
                opacity: 1;
                filter: none;
                loading: lazy;
                image-rendering: pixelated;
            " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='1'">`;
        }
    }
    
    imageHTML += '</div>';
    return imageHTML;
};

const insertImagesIntoDivs = () => {
    const textDivs = document.querySelectorAll(".text");
    textDivs.forEach((div) => {
        div.innerHTML = createImageGallery();
    });
};

const adjustContentSize = () => {
    const contentDiv = document.querySelector(".room-content");
    if (contentDiv) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Mobil cihazlar için özel boyutlandırma
        if (viewportWidth <= 768) {
            // Mobilde tam ekran boyutları
            contentDiv.style.width = '100vw';
            contentDiv.style.height = '100vh';
            contentDiv.style.borderRadius = '0';
            contentDiv.style.transform = 'scale(1)';
        } else {
            // Desktop için normal scale hesaplama
            const baseWidth = 1000;
            const scaleFactor = (viewportWidth * 0.9) / baseWidth;
            contentDiv.style.transform = `scale(${scaleFactor})`;
        }
    }
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

// Global değişken - sıralanmış eventleri sakla
let cachedSortedEvents = null;

const getMonthlyEvents = () => {
    // Eğer cache'lenmiş veri varsa ve favorites değişmemişse, onu kullan
    if (cachedSortedEvents) {
        return cachedSortedEvents;
    }
    
    // Ana sayfadaki izlenen filmler ve dizilerden bilgileri çek
    const watchedMovies = favorites.watchedMovies || [];
    const watchedShows = favorites.watchedShows || [];
    const watchedEpisodes = favorites.watchedEpisodes || {};
    
    // Filmler için event'ler oluştur
    const movieEvents = watchedMovies.map(item => ({
        id: item.imdbID,
        title: item.Title,
        type: 'movie',
        date: item.watchedDate || new Date().toISOString().split('T')[0],
        rating: favorites.userRatings[item.imdbID] || 0,
        review: item.review || '',
        day: new Date(item.watchedDate || Date.now()).getDate(),
        poster: item.Poster,
        year: item.Year
    }));
    
    // Diziler için bölüm izleme tarihlerini oluştur
    const showEvents = [];
    
    // Her dizi için izlenen bölümleri kontrol et
    watchedShows.forEach(show => {
        const showEpisodes = Object.keys(watchedEpisodes).filter(key => key.startsWith(show.imdbID));
        
        if (showEpisodes.length > 0) {
            // Her izlenen bölüm için ayrı event oluştur
            showEpisodes.forEach(episodeKey => {
                const [imdbID, seasonEpisode] = episodeKey.split('_S');
                const [season, episode] = seasonEpisode.split('_E');
                
                // Bölüm izleme tarihini al (tam tarih ve saat)
                const episodeData = watchedEpisodes[episodeKey];
                let episodeDate;
                if (episodeData && episodeData.watchedDateTime) {
                    // Tam tarih ve saat varsa onu kullan
                    episodeDate = episodeData.watchedDateTime;
                } else if (episodeData && episodeData.watchedDate) {
                    // Sadece tarih varsa onu kullan
                    episodeDate = episodeData.watchedDate;
                } else {
                    // Hiçbiri yoksa bugün
                    episodeDate = new Date().toISOString();
                }
                
                showEvents.push({
                    id: `${show.imdbID}_S${season}_E${episode}`,
                    title: show.Title,
                    type: 'show',
                    date: episodeDate,
                    rating: favorites.userRatings[show.imdbID] || 0,
                    review: '',
                    day: new Date(episodeDate).getDate(),
                    poster: show.Poster,
                    year: show.Year,
                    originalShow: show,
                    season: parseInt(season),
                    episode: parseInt(episode)
                });
            });
        } else {
            // Hiç bölüm izlenmemişse dizi izleme tarihini kullan
            showEvents.push({
                id: show.imdbID,
                title: show.Title,
                type: 'show',
                date: show.watchedDate || new Date().toISOString().split('T')[0],
                rating: favorites.userRatings[show.imdbID] || 0,
                review: show.review || '',
                day: new Date(show.watchedDate || Date.now()).getDate(),
                poster: show.Poster,
                year: show.Year
            });
        }
    });
    
    // Devam eden diziler için de bölüm izleme tarihlerini ekle
    const continuingShows = favorites.continuingShows || [];
    continuingShows.forEach(show => {
        const showEpisodes = Object.keys(watchedEpisodes).filter(key => key.startsWith(show.imdbID));
        
        if (showEpisodes.length > 0) {
            // Her izlenen bölüm için ayrı event oluştur
            showEpisodes.forEach(episodeKey => {
                const [imdbID, seasonEpisode] = episodeKey.split('_S');
                const [season, episode] = seasonEpisode.split('_E');
                
                // Bölüm izleme tarihini al (tam tarih ve saat)
                const episodeData = watchedEpisodes[episodeKey];
                let episodeDate;
                if (episodeData && episodeData.watchedDateTime) {
                    // Tam tarih ve saat varsa onu kullan
                    episodeDate = episodeData.watchedDateTime;
                } else if (episodeData && episodeData.watchedDate) {
                    // Sadece tarih varsa onu kullan
                    episodeDate = episodeData.watchedDate;
                } else {
                    // Hiçbiri yoksa bugün
                    episodeDate = new Date().toISOString();
                }
                
                showEvents.push({
                    id: `${show.imdbID}_S${season}_E${episode}`,
                    title: show.Title,
                    type: 'show',
                    date: episodeDate,
                    rating: favorites.userRatings[show.imdbID] || 0,
                    review: '',
                    day: new Date(episodeDate).getDate(),
                    poster: show.Poster,
                    year: show.Year,
                    originalShow: show,
                    season: parseInt(season),
                    episode: parseInt(episode)
                });
            });
        }
    });
    
    // Tüm event'leri birleştir
    const allWatched = [...movieEvents, ...showEvents];
    

    
    // Tarihe göre sırala (en yeni önce) - sadece bir kez
    allWatched.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        // En yeni tarih önce gelsin
        return dateB.getTime() - dateA.getTime();
    });
    
    // Eğer hiç izlenen içerik yoksa, örnek verileri göster
    if (allWatched.length === 0) {
        cachedSortedEvents = diaryEntries;
        return diaryEntries;
    }
    
    // Cache'le ve döndür
    cachedSortedEvents = allWatched;
    return allWatched;
};

// Global değişken - tüm eventleri sakla
let allCalendarEvents = null;

const renderMonthlyEvents = async () => {
    const eventsContainer = document.getElementById('monthlyEvents');
    
    // Cache'i zorla temizle
    cachedSortedEvents = null;
    allCalendarEvents = null;
    const events = getMonthlyEvents();
    
    // Tüm eventleri global değişkende sakla
    allCalendarEvents = events;
    
    eventsContainer.innerHTML = '';
    
    // İlk render'da tüm eventleri göster
    await renderFilteredEvents(events);
};

// Filtreleme fonksiyonu - sadece DOM elementlerini gizle/göster
const filterCalendarEvents = async () => {
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    const eventItems = document.querySelectorAll('.event-item');
    
    eventItems.forEach(item => {
        const type = item.querySelector('.event-content')?.getAttribute('data-type') || 'movie';
        
        if (activeFilter === 'all') {
            item.style.display = 'flex';
        } else if (activeFilter === 'movies') {
            if (type === 'movie') {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        } else if (activeFilter === 'shows') {
            if (type === 'show') {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        }
    });
    
    // Boş ay başlıklarını gizle
    const monthHeaders = document.querySelectorAll('.month-header');
    monthHeaders.forEach(header => {
        const nextElement = header.nextElementSibling;
        if (nextElement && nextElement.classList.contains('event-item')) {
            // Bu ayın altında event var mı kontrol et
            let hasVisibleEvents = false;
            let currentElement = nextElement;
            while (currentElement && currentElement.classList.contains('event-item')) {
                if (currentElement.style.visibility !== 'hidden') {
                    hasVisibleEvents = true;
                    break;
                }
                currentElement = currentElement.nextElementSibling;
            }
            if (hasVisibleEvents) {
                header.style.visibility = 'visible';
                header.style.opacity = '1';
                header.style.height = 'auto';
                header.style.margin = '';
                header.style.padding = '';
            } else {
                header.style.visibility = 'hidden';
                header.style.opacity = '0';
                header.style.height = '0';
                header.style.margin = '0';
                header.style.padding = '0';
                header.style.overflow = 'hidden';
            }
        }
    });
};

// Ortak render fonksiyonu
const renderFilteredEvents = async (events) => {
    const eventsContainer = document.getElementById('monthlyEvents');
    
    if (events.length === 0) {
        eventsContainer.innerHTML = '<p style="color: #666; text-align: center;">Bu ay henüz izlenen içerik yok.</p>';
        return;
    }
    
    eventsContainer.innerHTML = '';
    
    // Ayları grupla
    const eventsByMonth = {};
    events.forEach(event => {
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
        
        // Bu ayın eventlerini tarihe göre sırala (en yeni önce)
        monthData.events.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        });
        
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
                <div class="event-content" data-type="${event.type}">
                    <div class="event-poster">
                        ${posterContent}
                        <i class="${typeIcon}" style="${event.poster && event.poster !== 'N/A' ? 'display: none;' : 'display: flex;'}"></i>
                    </div>
                    <div class="event-details">
                        <div class="event-title">${event.title}</div>
                        <div class="event-meta">
                            ${event.type === 'show' && event.season && event.episode ? 
                                `<span>Sezon ${event.season} • Bölüm ${event.episode}</span>` : 
                                `<span>${event.year || year}</span>`
                            }
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
    let entry = null;
    let isEpisode = false;
    let episodeData = null;
    
    // Dizi bölümü ID'si kontrolü (format: imdbID_S1_E1)
    if (id.includes('_S') && id.includes('_E')) {
        const [imdbID, seasonEpisode] = id.split('_S');
        const [season, episode] = seasonEpisode.split('_E');
        const episodeKey = `${imdbID}_S${season}_E${episode}`;
        
        // Bölüm verilerini al
        episodeData = favorites.watchedEpisodes[episodeKey];
        if (episodeData) {
            // Ana dizi bilgilerini bul
            const showEntry = favorites.watchedShows.find(s => s.imdbID === imdbID) || 
                             favorites.continuingShows.find(s => s.imdbID === imdbID);
            if (showEntry) {
                entry = {
                    ...showEntry,
                    Title: `${showEntry.Title} - Sezon ${season} Bölüm ${episode}`,
                    watchedDate: episodeData.watchedDate || episodeData.watchedDateTime?.split('T')[0],
                    season: parseInt(season),
                    episode: parseInt(episode),
                    episodeKey: episodeKey
                };
                isEpisode = true;
            }
        }
    } else {
        // Film veya normal dizi kaydı
        const movieEntry = favorites.watchedMovies.find(m => m.imdbID === id);
        const showEntry = favorites.watchedShows.find(s => s.imdbID === id);
        entry = movieEntry || showEntry;
    }
    
    if (!entry) return;

    // Düzenleme modunu aktif et
    isEditingDiary = true;
    currentEditingId = id;

    // Populate form with entry data
    document.getElementById('diaryTitle').value = entry.Title;
    document.getElementById('diaryType').value = entry.Type === 'movie' ? 'movie' : 'show';
    document.getElementById('diaryDate').value = entry.watchedDate || new Date().toISOString().split('T')[0];

    // Set rating hearts - bölüm için dizi ID'sini kullan
    const ratingId = isEpisode ? entry.imdbID : id;
    const rating = favorites.userRatings[ratingId] || 0;
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

    // Dizi bölümü ID'si kontrolü (format: imdbID_S1_E1)
    if (id.includes('_S') && id.includes('_E')) {
        const [imdbID, seasonEpisode] = id.split('_S');
        const [season, episode] = seasonEpisode.split('_E');
        const episodeKey = `${imdbID}_S${season}_E${episode}`;
        
        // Bölüm izleme tarihini güncelle
        if (favorites.watchedEpisodes[episodeKey]) {
            const newDate = new Date(date);
            favorites.watchedEpisodes[episodeKey] = {
                watched: true,
                watchedDate: date,
                watchedDateTime: newDate.toISOString()
            };
        }
        
        // Kullanıcı puanını güncelle (dizi ID'si ile)
        if (rating > 0) {
            favorites.userRatings[imdbID] = rating;
        }
    } else {
        // Film veya normal dizi kaydı
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
        }
    }

    // Cache'i temizle ki yeni tarih hemen görünsün
    cachedSortedEvents = null;
    allCalendarEvents = null;
    
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
        // Dizi bölümü ID'si kontrolü (format: imdbID_S1_E1)
        if (id.includes('_S') && id.includes('_E')) {
            const [imdbID, seasonEpisode] = id.split('_S');
            const [season, episode] = seasonEpisode.split('_E');
            const episodeKey = `${imdbID}_S${season}_E${episode}`;
            
            // Bölüm izleme kaydını kaldır
            delete favorites.watchedEpisodes[episodeKey];
            
            // Dizi kategorilerini güncelle
            updateShowCategories(imdbID);
        } else {
            // Film veya normal dizi kaydı
            favorites.watchedMovies = favorites.watchedMovies.filter(m => m.imdbID !== id);
            favorites.watchedShows = favorites.watchedShows.filter(s => s.imdbID !== id);
            
            // Kullanıcı puanını da kaldır
            delete favorites.userRatings[id];
        }
        
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

// Sezon seçici oluştur
const createSeasonSelector = (details) => {
    const seasonSelector = document.getElementById('seasonSelector');
    const totalSeasons = details.totalSeasons || 1;
    
    seasonSelector.innerHTML = '';
    
    // Sezon seçici butonları
    const selectorContainer = document.createElement('div');
    selectorContainer.style.display = 'flex';
    selectorContainer.style.gap = '5px';
    selectorContainer.style.flexWrap = 'wrap';
    selectorContainer.style.marginBottom = '10px';
    
    // Mobil responsive
    if (window.innerWidth <= 768) {
        selectorContainer.style.justifyContent = 'center';
        selectorContainer.style.gap = '3px';
    }
    
    for (let i = 1; i <= totalSeasons; i++) {
        const seasonBtn = document.createElement('button');
        seasonBtn.textContent = `Sezon ${i}`;
        seasonBtn.style.padding = '5px 10px';
        seasonBtn.style.border = '1px solid rgba(255, 255, 255, 0.3)';
        seasonBtn.style.borderRadius = '5px';
        seasonBtn.style.background = i === details.currentSeason ? 'rgba(255, 255, 255, 0.2)' : 'transparent';
        seasonBtn.style.color = '#ffffff';
        seasonBtn.style.cursor = 'pointer';
        seasonBtn.style.fontSize = '0.9rem';
        seasonBtn.style.transition = 'all 0.2s ease';
        
        // Mobil responsive
        if (window.innerWidth <= 768) {
            seasonBtn.style.padding = '4px 8px';
            seasonBtn.style.fontSize = '0.8rem';
        }
        
        seasonBtn.addEventListener('click', () => {
            loadSeason(details.imdbID, i, details);
        });
        
        selectorContainer.appendChild(seasonBtn);
    }
    
    seasonSelector.appendChild(selectorContainer);
};

// Sezon yükle
const loadSeason = async (imdbID, seasonNumber, details) => {
    try {
        const seasonData = await fetchData(`/api/seasons?imdbID=${imdbID}&season=${seasonNumber}`);
        if (seasonData.Response === "True") {
            details.seasons = seasonData;
            details.currentSeason = seasonNumber;
            
            // Sezon seçiciyi güncelle
            createSeasonSelector(details);
            
            // Bölüm listesini güncelle
            displayEpisodesList(seasonData.Episodes, seasonNumber, imdbID);
            
            // Modal yüksekliğini yeni bölüm sayısına göre güncelle
            const modalContent = document.querySelector('.modal-content');
            const episodeCount = seasonData.Episodes.length;
            const baseHeight = 600;
            const episodeHeight = 3;
            const newHeight = Math.min(baseHeight + (episodeCount * episodeHeight), 800);
            
            modalContent.style.maxHeight = `${newHeight}px`;
        }
    } catch (error) {
        console.error('Error loading season:', error);
    }
};

// Bölüm listesini göster
const displayEpisodesList = (episodes, seasonNumber, imdbID) => {
    const episodesList = document.getElementById('episodesList');
    
    episodesList.innerHTML = '';
    
    // Sezon başlığı
    const seasonTitle = document.createElement('h4');
    seasonTitle.textContent = `Sezon ${seasonNumber} (${episodes.length} Bölüm)`;
    seasonTitle.style.margin = '0 0 10px 0';
    seasonTitle.style.color = '#ffffff';
    episodesList.appendChild(seasonTitle);
    
    // Bölüm sayısına göre yükseklik hesapla
    const episodeHeight = 60; // Her bölüm için yaklaşık yükseklik
    const maxHeight = Math.min(episodes.length * episodeHeight + 50, 400); // Maksimum 400px
    const minHeight = Math.max(episodes.length * episodeHeight + 50, 200); // Minimum 200px
    
    // Bölüm listesi
    const episodesContainer = document.createElement('div');
    episodesContainer.style.height = `${minHeight}px`;
    episodesContainer.style.maxHeight = `${maxHeight}px`;
    episodesContainer.style.overflowY = 'auto';
    episodesContainer.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    episodesContainer.style.borderRadius = '8px';
    episodesContainer.style.padding = '10px';
    episodesContainer.style.width = '100%';
    episodesContainer.style.minWidth = '450px';
    episodesContainer.style.maxWidth = '100%';
    
    // Mobil responsive
    if (window.innerWidth <= 768) {
        episodesContainer.style.minWidth = '100%';
        episodesContainer.style.maxWidth = '100%';
        episodesContainer.style.width = '100%';
        episodesContainer.style.boxSizing = 'border-box';
        // Mobilde daha küçük yükseklik
        const mobileMaxHeight = Math.min(episodes.length * 50 + 30, 300);
        const mobileMinHeight = Math.max(episodes.length * 50 + 30, 150);
        episodesContainer.style.height = `${mobileMinHeight}px`;
        episodesContainer.style.maxHeight = `${mobileMaxHeight}px`;
    }
    
    episodes.forEach((episode, index) => {
        const episodeDiv = document.createElement('div');
        episodeDiv.style.padding = '8px 0';
        episodeDiv.style.borderBottom = index < episodes.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none';
        episodeDiv.style.display = 'flex';
        episodeDiv.style.alignItems = 'flex-start';
        episodeDiv.style.gap = '10px';
        
        // Bölüm izlendi durumunu kontrol et
        const isWatched = isEpisodeWatched(imdbID, seasonNumber, episode.Episode);
            
            episodeDiv.innerHTML = `
                <div style="display: flex; align-items: center; margin-top: 2px;">
                    <input type="checkbox" 
                           class="episode-checkbox" 
                           data-imdbid="${imdbID}" 
                           data-season="${seasonNumber}" 
                           data-episode="${episode.Episode}"
                           ${isWatched ? 'checked' : ''}>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #ffffff; margin-bottom: 4px; word-wrap: break-word;">
                        ${episode.Episode}. ${episode.Title}
                    </div>
                    <div style="font-size: 0.9rem; color: #cccccc;">
                        ${episode.Released !== 'N/A' ? episode.Released : 'Tarih bilgisi yok'}
                        ${episode.imdbRating !== 'N/A' ? ` • ${episode.imdbRating}/10` : ''}
                    </div>
                </div>
            `;
            
            episodesContainer.appendChild(episodeDiv);
        });
    
    episodesList.appendChild(episodesContainer);
    
    // Bölüm checkbox event listener'larını ekle
    const checkboxes = episodesContainer.querySelectorAll('.episode-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const imdbID = e.target.dataset.imdbid;
            const season = parseInt(e.target.dataset.season);
            const episode = parseInt(e.target.dataset.episode);
            const isWatched = e.target.checked;
            
            toggleEpisodeWatched(imdbID, season, episode, isWatched);
        });
    });
};

// Bölüm izlendi durumunu kontrol et
const isEpisodeWatched = (imdbID, season, episode) => {
    if (!window.currentUser) return false;
    if (!favorites || !favorites.watchedEpisodes) return false;
    
    const key = `${imdbID}_S${season}_E${episode}`;
    const episodeData = favorites.watchedEpisodes[key];
    return episodeData && episodeData.watched === true;
};

// Bölüm izlendi durumunu değiştir
const toggleEpisodeWatched = (imdbID, season, episode, isWatched) => {
    if (!window.currentUser) return;
    if (!favorites || !favorites.watchedEpisodes) {
        favorites = {
            ...favorites,
            watchedEpisodes: {}
        };
    }
    
    const key = `${imdbID}_S${season}_E${episode}`;
    
    if (isWatched) {
        // Bölüm izleme tarihini kaydet (saat ve dakika dahil)
        const now = new Date();
        favorites.watchedEpisodes[key] = {
            watched: true,
            watchedDate: now.toISOString().split('T')[0],
            watchedDateTime: now.toISOString() // Tam tarih ve saat
        };
    } else {
        delete favorites.watchedEpisodes[key];
    }
    
    // Firebase'e kaydet
    saveFavorites();
    
    // Dizi durumunu kontrol et ve güncelle
    checkSeriesStatus(imdbID);
    
    // Dizi kategorilerini güncelle
    updateShowCategories(imdbID);
};

// Dizi durumunu kontrol et (tüm bölümler izlendi mi?)
const checkSeriesStatus = (imdbID) => {
    if (!window.currentUser) return;
    if (!favorites || !favorites.watchedEpisodes) return;
    
    // Bu dizi için izlenen bölümleri say
    const seriesEpisodes = Object.keys(favorites.watchedEpisodes).filter(key => key.startsWith(imdbID));
    
    // Eğer tüm bölümler izlendiyse diziyi "izlendi" kategorisine taşı
    // Bu kısım daha sonra tamamlanacak
    console.log(`Series ${imdbID} has ${seriesEpisodes.length} watched episodes`);
};

// Dizi kategorilerini güncelle
const updateShowCategories = (imdbID) => {
    if (!favorites || !favorites.watchedEpisodes) return;
    
    // Tüm gerekli property'lerin var olduğundan emin ol
    favorites.watchlistShows = favorites.watchlistShows || [];
    favorites.continuingShows = favorites.continuingShows || [];
    favorites.watchedShows = favorites.watchedShows || [];
    
    // Bu dizi için izlenen bölümleri say
    const seriesEpisodes = Object.keys(favorites.watchedEpisodes).filter(key => key.startsWith(imdbID));
    const hasWatchedEpisodes = seriesEpisodes.some(key => {
        const episodeData = favorites.watchedEpisodes[key];
        return episodeData && episodeData.watched === true;
    });
    
    // Diziyi bul
    let show = null;
    let showIndex = -1;
    
    // Watchlist'ten bul
    showIndex = favorites.watchlistShows.findIndex(s => s.imdbID === imdbID);
    if (showIndex !== -1) {
        show = favorites.watchlistShows[showIndex];
    }
    
    // Continuing'den bul
    if (!show) {
        showIndex = favorites.continuingShows.findIndex(s => s.imdbID === imdbID);
        if (showIndex !== -1) {
            show = favorites.continuingShows[showIndex];
        }
    }
    
    // Watched'dan bul
    if (!show) {
        showIndex = favorites.watchedShows.findIndex(s => s.imdbID === imdbID);
        if (showIndex !== -1) {
            show = favorites.watchedShows[showIndex];
        }
    }
    
    if (show) {
        // Eğer bölüm izlendiyse
        if (hasWatchedEpisodes) {
            // Watchlist'ten kaldır
            favorites.watchlistShows = favorites.watchlistShows.filter(s => s.imdbID !== imdbID);
            
            // Continuing'e ekle (eğer yoksa)
            if (!favorites.continuingShows.find(s => s.imdbID === imdbID)) {
                favorites.continuingShows.push(show);
            }
        } else {
            // Hiç bölüm izlenmemişse watchlist'e geri koy
            favorites.continuingShows = favorites.continuingShows.filter(s => s.imdbID !== imdbID);
            
            if (!favorites.watchlistShows.find(s => s.imdbID === imdbID)) {
                favorites.watchlistShows.push(show);
            }
        }
        
        // Firebase'e kaydet
        saveFavorites();
        renderFavorites();
    }
};

// Tab event listener'larını ayarla
const setupTabListeners = () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            // Aktif tab'ı değiştir
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Tab içeriğini değiştir
            const tabPanes = document.querySelectorAll('.tab-pane');
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            if (targetTab === 'info') {
                document.getElementById('infoTab').classList.add('active');
            } else if (targetTab === 'seasons') {
                document.getElementById('seasonsTab').classList.add('active');
            }
        });
    });
};

// Modal functions - defined early for other functions
const displayModal = (details) => {
    document.getElementById('modalTitle').textContent = details.Title;
    const modalPoster = document.getElementById('modalPoster');
    const modalPosterContainer = document.querySelector('.modal-poster');
    
    document.getElementById('modalYear').textContent = details.Year;
    document.getElementById('modalGenre').textContent = translateGenre(details.Genre);
    document.getElementById('modalRuntime').textContent = translateRuntime(details.Runtime);
    document.getElementById('modalDirector').textContent = details.Director !== 'N/A' ? details.Director : 'Bilinmiyor';
    document.getElementById('modalActors').textContent = details.Actors !== 'N/A' ? details.Actors : 'Bilinmiyor';
    document.getElementById('modalRating').textContent = translateRating(details.imdbRating);
    document.getElementById('modalPlot').textContent = translatePlot(details.Plot);

    // Tab sistemini ayarla
    const modalTabs = document.getElementById('modalTabs');
    const infoTab = document.getElementById('infoTab');
    const seasonsTab = document.getElementById('seasonsTab');
    const modalContent = document.querySelector('.modal-content');
    
    if ((details.Type === 'series' || details.Type === 'show' || details.Type === 'tv') && details.seasons && details.seasons.Episodes) {
        // Dizi ise poster'ı gizle ve tab'ları göster
        modalPosterContainer.style.display = 'none';
        modalTabs.style.display = 'flex';
        
        // Sezon seçici oluştur
        createSeasonSelector(details);
        
        // Bölüm listesini göster
        displayEpisodesList(details.seasons.Episodes, details.currentSeason, details.imdbID);
        
        // Modal yüksekliğini bölüm sayısına göre ayarla
        const episodeCount = details.seasons.Episodes.length;
        const baseHeight = 600; // Temel modal yüksekliği
        const episodeHeight = 3; // Her bölüm için ek yükseklik
        const newHeight = Math.min(baseHeight + (episodeCount * episodeHeight), 800); // Maksimum 800px
        
        modalContent.style.maxHeight = `${newHeight}px`;
        
        // Tab event listener'larını ekle
        setupTabListeners();
    } else {
        // Film ise poster'ı göster ve sadece genel bilgileri göster
        modalPosterContainer.style.display = 'block';
        modalPoster.src = details.Poster !== 'N/A' ? details.Poster : './yok.PNG';
        modalPoster.onerror = function() { this.src = './yok.PNG'; };
        
        modalTabs.style.display = 'none';
        infoTab.classList.add('active');
        seasonsTab.classList.remove('active');
        
        // Film için standart yükseklik
        modalContent.style.maxHeight = '600px';
    }

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
            // Eğer dizi ise sezon bilgilerini de çek
            if (details.Type === 'series' || details.Type === 'show' || details.Type === 'tv') {
                try {
                    // Önce 1. sezonu çek
                    const seasonData = await fetchData(`/api/seasons?imdbID=${imdbID}&season=1`);
                    if (seasonData.Response === "True") {
                        details.seasons = seasonData;
                        details.currentSeason = 1;
                        details.totalSeasons = parseInt(seasonData.totalSeasons) || 1;
                    }
                } catch (seasonError) {
                    console.error('Error fetching season data:', seasonError);
                }
            }
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
                        <button class="overlay-menu-item" onclick="addToFavoritesFromParams('${item.imdbID}', '${item.Title.replace(/'/g, "\\'")}', '${item.Year}', '${item.Poster}', '${type}')">
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

// Create continuing show item
const createContinuingItem = (item, type) => {
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
                <button class="overlay-menu-item" onclick="toggleFavoriteFromContinuing('${item.imdbID}', '${item.Title}', '${item.Year}', '${item.Poster}', '${type}')">
                    <i class="fa-solid fa-heart ${isFav ? 'text-red-500' : 'text-gray-400'}"></i>
                    <span>${isFav ? 'Favoriden Kaldır' : 'Favoriye Ekle'}</span>
                </button>
                <button class="overlay-menu-item" onclick="removeFromContinuing('${item.imdbID}', '${type}')">
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
    const continuingShows = document.getElementById('continuing-shows');
    
    if (!favoriteMovies || !favoriteShows || !watchlistMovies || !watchlistShows || !watchedMovies || !watchedShows || !continuingShows) {
        console.log('DOM elements not ready for renderFavorites');
        return;
    }
    
    // Favorites objesinin güvenli olduğundan emin ol
    if (!favorites) {
        console.log('Favorites object is not ready');
        return;
    }
    
    // Tüm gerekli property'lerin var olduğundan emin ol
    favorites.movies = favorites.movies || [];
    favorites.shows = favorites.shows || [];
    favorites.watchlistMovies = favorites.watchlistMovies || [];
    favorites.watchlistShows = favorites.watchlistShows || [];
    favorites.watchedMovies = favorites.watchedMovies || [];
    favorites.watchedShows = favorites.watchedShows || [];
    favorites.continuingShows = favorites.continuingShows || [];
    favorites.userRatings = favorites.userRatings || {};
    favorites.watchedEpisodes = favorites.watchedEpisodes || {};
    
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

    // Render continuing shows
    continuingShows.innerHTML = '';
    if (favorites.continuingShows.length === 0) {
        continuingShows.innerHTML = '<p class="info-message">Devam ettiğiniz dizi yok.</p>';
    } else {
        favorites.continuingShows.slice().reverse().forEach(item => {
            const itemElement = createContinuingItem(item, 'show');
            continuingShows.appendChild(itemElement);
        });
    }
};

// Load user data from Firebase
const loadUserData = async () => {
    if (!window.currentUser) return;
    
    try {
        console.log('Loading user data from Firestore...', window.currentUser.uid);
        
            // Cache'i temizle çünkü yeni veriler yüklenecek
    cachedSortedEvents = null;
    allCalendarEvents = null;
        
        // Firebase Firestore'dan kullanıcı verilerini yükle
        const userDocRef = window.doc(window.db, 'users', window.currentUser.uid);
        const userDoc = await window.getDoc(userDocRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('User data found in Firestore:', userData);
            console.log('Favorites data from Firestore:', userData.favorites);
            
            if (userData.favorites) {
                favorites = userData.favorites;
                // Eksik property'leri ekle
                favorites.movies = favorites.movies || [];
                favorites.shows = favorites.shows || [];
                favorites.watchlistMovies = favorites.watchlistMovies || [];
                favorites.watchlistShows = favorites.watchlistShows || [];
                favorites.watchedMovies = favorites.watchedMovies || [];
                favorites.watchedShows = favorites.watchedShows || [];
                favorites.continuingShows = favorites.continuingShows || [];
                favorites.userRatings = favorites.userRatings || {};
                favorites.watchedEpisodes = favorites.watchedEpisodes || {};
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
                    continuingShows: [],
                    userRatings: {},
                    watchedEpisodes: {}
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
                continuingShows: [],
                userRatings: {},
                watchedEpisodes: {}
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
        continuingShows: [],
        userRatings: {},
        watchedEpisodes: {}
    };
    renderFavorites();
    
    // Clear from Firebase if user is logged in
    if (window.currentUser) {
        saveUserData();
    }
};



// Make functions globally available
window.closeAuthModal = closeAuthModal;
window.closeNewModal = closeNewModal;
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
    
    // Cube button event listener
    document.getElementById('cube-btn').addEventListener('click', handleCubeClick);
    
    // Window resize event listener for responsive design
    window.addEventListener('resize', () => {
        const roomSection = document.getElementById('room-section');
        if (roomSection && roomSection.style.display !== 'none') {
            adjustContentSize();
        }
    });
    
    // Close room button event listener
    document.addEventListener('click', (e) => {
        if (e.target.id === 'close-room-btn' || e.target.closest('#close-room-btn')) {
            // Eğer tam ekrandaysa, önce tam ekrandan çık
            if (document.fullscreenElement) {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
            
            // Mobil moddan çık
            document.body.classList.remove('landscape-mode');
            
            // Sonra room'u kapat
            closeRoom();
        }
    });
    
    // Fullscreen change event listener
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            // Tam ekrandan çıkıldığında room'u da kapat
            closeRoom();
        }
    });
    
    // New feature button event listener - element yoksa kaldır
    const newBtn = document.getElementById('new-btn');
    if (newBtn) {
        newBtn.addEventListener('click', openNewModal);
    }
    
    // Diary modal event listeners
    const saveDiaryEntryBtn = document.getElementById('saveDiaryEntry');
    if (saveDiaryEntryBtn) {
        saveDiaryEntryBtn.addEventListener('click', saveDiaryEntry);
    }
    
    // Filter buttons event listeners moved to handleCalendarClick
    
    // Close auth modal when clicking outside
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target.id === 'authModal') {
                closeAuthModal();
            }
        });
    }
    
    // Close calendar modal when clicking outside
    const calendarModal = document.getElementById('calendarModal');
    if (calendarModal) {
        calendarModal.addEventListener('click', (e) => {
            if (e.target.id === 'calendarModal') {
                closeCalendarModal();
            }
        });
    }
    
    // Close new modal when clicking outside
    const newModal = document.getElementById('newModal');
    if (newModal) {
        newModal.addEventListener('click', (e) => {
            if (e.target.id === 'newModal') {
                closeNewModal();
            }
        });
    }
    
    // Close diary modal when clicking outside
    const diaryModal = document.getElementById('diaryModal');
    if (diaryModal) {
        diaryModal.addEventListener('click', (e) => {
            if (e.target.id === 'diaryModal') {
                closeDiaryModal();
            }
        });
    }
    
    // Close auth modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const authModal = document.getElementById('authModal');
            const calendarModal = document.getElementById('calendarModal');
            const newModal = document.getElementById('newModal');
            const diaryModal = document.getElementById('diaryModal');
            if (authModal && authModal.style.display === 'block') {
                closeAuthModal();
            } else if (calendarModal && calendarModal.style.display === 'block') {
                closeCalendarModal();
            } else if (newModal && newModal.style.display === 'block') {
                closeNewModal();
            } else if (diaryModal && diaryModal.style.display === 'block') {
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
                            <button class="overlay-menu-item" data-dynamic onclick="addToFavoritesFromParams('${item.imdbID}', '${item.Title.replace(/'/g, "\\'")}', '${item.Year}', '${item.Poster}', '${type}')">
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
    // Cache'i temizle çünkü favorites değişti
    cachedSortedEvents = null;
    allCalendarEvents = null;
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
        
        // Eğer room açıksa, küpü güncelle
        const roomSection = document.getElementById('room-section');
        if (roomSection && roomSection.style.display !== 'none') {
            setTimeout(() => {
                insertImagesIntoDivs();
            }, 200);
        }
        
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
        
        // Eğer room açıksa, küpü güncelle
        const roomSection = document.getElementById('room-section');
        if (roomSection && roomSection.style.display !== 'none') {
            setTimeout(() => {
                insertImagesIntoDivs();
            }, 200);
        }
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
        
        // Eğer room açıksa, küpü güncelle (watchlist'ten kaldırıldığı için)
        const roomSection = document.getElementById('room-section');
        if (roomSection && roomSection.style.display !== 'none') {
            setTimeout(() => {
                insertImagesIntoDivs();
            }, 200);
        }
        
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
                            <button class="overlay-menu-item" data-dynamic onclick="addToFavoritesFromParams('${item.imdbID}', '${item.Title.replace(/'/g, "\\'")}', '${item.Year}', '${item.Poster}', '${type}')">
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
                            <button class="overlay-menu-item" onclick="addToFavoritesFromParams('${item.imdbID}', '${item.Title.replace(/'/g, "\\'")}', '${item.Year}', '${item.Poster}', '${type}')">
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
        
        // Room'u da kapat
        const roomSection = document.getElementById('room-section');
        if (roomSection) {
            roomSection.style.display = 'none';
        }
        
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

    window.addToFavoritesFromParams = async (imdbID, title, year, poster, type) => {
        const item = { imdbID, Title: title, Year: year, Poster: poster };
        await addToFavorites(item, type);
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
                        // Item bilgilerini DOM'dan al
                        const title = searchItemElement.querySelector('.item-info h3')?.textContent || '';
                        const year = searchItemElement.querySelector('.item-info p')?.textContent || '';
                        const poster = searchItemElement.querySelector('img')?.src || '';
                        
                        newContent = newContent.replace(
                            /<button([^>]*)onclick="removeFromWatchlistFromSearch[^>]*>.*?<span>Kaldır<\/span>.*?<\/button>/,
                            `<button$1onclick="addToWatchlistFromSearch('${imdbID}', '${title}', '${year}', '${poster}', '${type}')">
                                <i class="fa-solid fa-clock text-orange-500"></i>
                                <span>Daha Sonra İzle</span>
                            </button>`
                        );
                    }
                    
                    overlayContent.innerHTML = newContent;
                    
                    // Yeni event listener'ları ekle
                    const item = { imdbID, Title: title, Year: year, Poster: poster };
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
                        // Item bilgilerini DOM'dan al
                        const title = searchItemElement.querySelector('.item-info h3')?.textContent || '';
                        const year = searchItemElement.querySelector('.item-info p')?.textContent || '';
                        const poster = searchItemElement.querySelector('img')?.src || '';
                        const item = { imdbID, Title: title, Year: year, Poster: poster };
                        
                        newContent = newContent.replace(
                            /<button([^>]*)onclick="removeFromFavoritesFromSearch[^>]*>.*?<span>Favoriden Kaldır<\/span>.*?<\/button>/,
                            `<button$1onclick="addToFavoritesFromParams('${imdbID}', '${title.replace(/'/g, "\\'")}', '${year}', '${poster}', '${type}')">
                                <i class="fa-solid fa-heart text-red-500"></i>
                                <span>Favoriye Ekle</span>
                            </button>`
                        );
                    }
                    
                    overlayContent.innerHTML = newContent;
                    
                    // Yeni event listener'ları ekle
                    const item = { imdbID, Title: title, Year: year, Poster: poster };
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

    window.toggleFavoriteFromContinuing = async (imdbID, title, year, poster, type) => {
        const item = { imdbID, Title: title, Year: year, Poster: poster };
        
        if (isFavorite(imdbID)) {
            removeFromFavorites(imdbID, type);
        } else {
            // Devam eden içerikler zaten favoriye eklenebilir
            await addToFavorites(item, type);
        }
    };

    window.removeFromContinuing = (imdbID, type) => {
        if (!favorites || !favorites.continuingShows) return;
        
        let removedItem = null;
        
        if (type === 'show') {
            removedItem = favorites.continuingShows.find(s => s.imdbID === imdbID);
            favorites.continuingShows = favorites.continuingShows.filter(s => s.imdbID !== imdbID);
        }

        if (removedItem) {
            // Devam eden listesinden kaldırıldı
        }

        saveFavorites();
        renderFavorites();
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
        
        // Room'u da kapat
        const roomSection = document.getElementById('room-section');
        if (roomSection && roomSection.style.display !== 'none') {
            roomSection.style.display = 'none';
            const favoritesSections = document.querySelectorAll('.favorites-section');
            favoritesSections.forEach(section => {
                section.style.display = 'block';
            });
        }
        
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