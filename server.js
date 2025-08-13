const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = process.env.PORT || 8000;

const OMDB_API_KEY = process.env.OMDB_API_KEY || 'dba94306';

// Statik dosyaları sunmak için (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/search', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const response = await fetch(`http://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error searching OMDb:', error);
        res.status(500).json({ error: 'Failed to fetch data from OMDb' });
    }
});

app.get('/api/details', async (req, res) => {
    const imdbID = req.query.imdbID;
    if (!imdbID) {
        return res.status(400).json({ error: 'imdbID parameter is required' });
    }

    try {
        const response = await fetch(`http://www.omdbapi.com/?i=${imdbID}&apikey=${OMDB_API_KEY}&plot=full`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching details from OMDb:', error);
        res.status(500).json({ error: 'Failed to fetch details from OMDb' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});