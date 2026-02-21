const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config(); // Not needed on Render, but harmless

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API endpoint for generate content (proxied Gemini call with failover)
app.post('/api/generate', async (req, res) => {
    const { contents } = req.body;
    const keys = [
        process.env.GEMINI_KEY,
        process.env.GEMINI_KEY2,
        process.env.GEMINI_KEY3
    ].filter(Boolean);

    if (!keys.length) {
        return res.json({ error: true });
    }

    let tried = 0;
    while (tried < keys.length) {
        try {
            const key = keys[tried];
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 500,
                    }
                })
            });

            if (!response.ok) throw new Error(response.statusText);

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            return res.json({ text });
        } catch (error) {
            console.error(`Key ${tried + 1} failed:`, error);
            tried++;
        }
    }

    res.json({ error: true });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});