const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = process.env.PORT || 8000;

const TRAKT_CLIENT_ID = process.env.TRAKT_CLIENT_ID || '3d14c311169c5b7e60fcc83a6c1e20e6c141f5f7fa2e8ae5b8ee74459ce90d81';
const TRAKT_CLIENT_SECRET = process.env.TRAKT_CLIENT_SECRET || '6bfe5de2595cce98e180215a6829e87c2de793d607ff4bd31e330ee395960da4';

// Statik dosyaları sunmak için (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const response = await fetch(`https://api.trakt.tv/search/movie,show?query=${encodeURIComponent(query)}&limit=20`, {
            headers: {
                'Content-Type': 'application/json',
                'trakt-api-version': '2',
                'trakt-api-key': TRAKT_CLIENT_ID
            }
        });
        
        const data = await response.json();
        
        // Trakt API response'unu OMDB formatına dönüştür
        const transformedData = {
            Response: "True",
            Search: data.map(item => {
                const content = item.movie || item.show;
                let posterUrl = 'N/A';
                
                // IMDB ID varsa OMDB'den poster çek
                if (content.ids.imdb) {
                    posterUrl = `https://img.omdbapi.com/?i=${content.ids.imdb}&apikey=dba94306`;
                }
                
                return {
                    imdbID: content.ids.imdb,
                    Title: content.title,
                    Year: content.year ? content.year.toString() : 'N/A',
                    Poster: posterUrl,
                    Type: item.type === 'movie' ? 'movie' : 'series'
                };
            }).filter(item => item.imdbID) // imdbID'si olmayanları filtrele
        };
        
        res.json(transformedData);
    } catch (error) {
        console.error('Error searching Trakt:', error);
        res.status(500).json({ error: 'Failed to fetch data from Trakt' });
    }
});

app.get('/api/details', async (req, res) => {
    const imdbID = req.query.imdbID;
    if (!imdbID) {
        return res.status(400).json({ error: 'imdbID parameter is required' });
    }

    try {
        // Önce movie ve show için ayrı ayrı arama yap
        const [movieResponse, showResponse] = await Promise.all([
            fetch(`https://api.trakt.tv/movies/${imdbID}?extended=full`, {
                headers: {
                    'Content-Type': 'application/json',
                    'trakt-api-version': '2',
                    'trakt-api-key': TRAKT_CLIENT_ID
                }
            }),
            fetch(`https://api.trakt.tv/shows/${imdbID}?extended=full`, {
                headers: {
                    'Content-Type': 'application/json',
                    'trakt-api-version': '2',
                    'trakt-api-key': TRAKT_CLIENT_ID
                }
            })
        ]);

        let data = null;
        let isMovie = false;

        if (movieResponse.ok) {
            data = await movieResponse.json();
            isMovie = true;
        } else if (showResponse.ok) {
            data = await showResponse.json();
            isMovie = false;
        } else {
            return res.status(404).json({ Response: "False", Error: "Content not found" });
        }

        // Trakt API response'unu OMDB formatına dönüştür
        let posterUrl = 'N/A';
        
        // IMDB ID varsa OMDB'den poster çek
        if (data.ids.imdb) {
            posterUrl = `https://img.omdbapi.com/?i=${data.ids.imdb}&apikey=dba94306`;
        }
        
        // Rating değerini kontrol et ve düzelt
        console.log(`Full Trakt data for ${data.title}:`, JSON.stringify(data, null, 2));
        
        let rating = 'N/A';
        // Trakt API'de rating farklı alanlarda olabilir
        const possibleRatingFields = ['rating', 'votes', 'score', 'average'];
        let rawRating = null;
        
        for (const field of possibleRatingFields) {
            if (data[field] !== undefined && data[field] !== null) {
                rawRating = data[field];
                console.log(`Found rating in field '${field}' for ${data.title}:`, rawRating);
                break;
            }
        }
        
        if (rawRating !== null) {
            // Rating değerini kontrol et ve uygun şekilde dönüştür
            if (rawRating <= 1) {
                rating = (rawRating * 10).toFixed(1);
            } else if (rawRating <= 10) {
                rating = rawRating.toFixed(1);
            } else {
                rating = (rawRating / 10).toFixed(1);
            }
            console.log(`Final rating for ${data.title}:`, rating);
        }
        
        const transformedData = {
            Response: "True",
            imdbID: data.ids.imdb,
            Title: data.title,
            Year: data.year ? data.year.toString() : 'N/A',
            Type: isMovie ? 'movie' : 'series',
            Poster: posterUrl,
            Plot: data.overview || 'N/A',
            Runtime: data.runtime ? `${data.runtime} min` : 'N/A',
            Genre: data.genres ? data.genres.join(', ') : 'N/A',
            Director: isMovie && data.director ? data.director : 'N/A',
            Actors: isMovie && data.cast ? data.cast.slice(0, 5).map(actor => actor.person.name).join(', ') : 'N/A',
            imdbRating: rating,
            totalSeasons: !isMovie && data.seasons ? data.seasons.length : undefined
        };

        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching details from Trakt:', error);
        res.status(500).json({ error: 'Failed to fetch details from Trakt' });
    }
});

app.get('/api/seasons', async (req, res) => {
    const imdbID = req.query.imdbID;
    const season = req.query.season || 1;
    
    if (!imdbID) {
        return res.status(400).json({ error: 'imdbID parameter is required' });
    }

    try {
        const response = await fetch(`https://api.trakt.tv/shows/${imdbID}/seasons/${season}?extended=episodes`, {
            headers: {
                'Content-Type': 'application/json',
                'trakt-api-version': '2',
                'trakt-api-key': TRAKT_CLIENT_ID
            }
        });

        if (!response.ok) {
            return res.status(404).json({ Response: "False", Error: "Season not found" });
        }

        const data = await response.json();
        
        // Trakt API response'unu OMDB formatına dönüştür
        const transformedData = {
            Response: "True",
            totalSeasons: data.length > 0 ? data[0].number : 1,
            Episodes: data.map(episode => {
                let rating = 'N/A';
                if (episode.rating !== undefined && episode.rating !== null) {
                    // Trakt API rating'i 0-1 arasında, 10 ile çarparak OMDB formatına çevir
                    rating = (episode.rating * 10).toFixed(1);
                }
                
                return {
                    Title: episode.title,
                    Released: episode.first_aired ? new Date(episode.first_aired).toISOString().split('T')[0] : 'N/A',
                    Episode: episode.number.toString(),
                    imdbRating: rating
                };
            })
        };

        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching season data from Trakt:', error);
        res.status(500).json({ error: 'Failed to fetch season data from Trakt' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});