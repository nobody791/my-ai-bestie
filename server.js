const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Store API keys from environment variables
const GEMINI_KEYS = [
    process.env.GEMINI_KEY,
    process.env.GEMINI_KEY2,
    process.env.GEMINI_KEY3
].filter(key => key); // Remove undefined keys

const WAIFU_API = 'https://api.waifu.im';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API endpoint for config
app.get('/api/config', (req, res) => {
    res.json({
        hasGeminiKeys: GEMINI_KEYS.length > 0,
        waifuApiAvailable: true
    });
});

// Get random Gemini key (round-robin)
let currentKeyIndex = 0;
app.get('/api/gemini-key', (req, res) => {
    if (GEMINI_KEYS.length === 0) {
        return res.status(404).json({ error: 'No Gemini keys available' });
    }
    
    const key = GEMINI_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
    
    res.json({ key });
});

// Proxy for waifu.im API
app.post('/api/generate-image', async (req, res) => {
    try {
        const { tags, isNSFW = false } = req.body;
        
        const response = await axios.get('https://api.waifu.im/search', {
            params: {
                included_tags: tags || ['waifu'],
                is_nsfw: isNSFW,
                height: '>=2000'
            },
            headers: {
                'Accept-Version': 'v6'
            }
        });
        
        if (response.data.images && response.data.images.length > 0) {
            res.json({
                url: response.data.images[0].url,
                source: response.data.images[0].source,
                tags: response.data.images[0].tags
            });
        } else {
            res.status(404).json({ error: 'No images found' });
        }
    } catch (error) {
        console.error('Image API error:', error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

// Proxy for Gemini API (with key rotation)
app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;
    
    if (GEMINI_KEYS.length === 0) {
        return res.status(503).json({ error: 'No API keys available' });
    }
    
    // Try each key until one works
    for (let i = 0; i < GEMINI_KEYS.length; i++) {
        const keyIndex = (currentKeyIndex + i) % GEMINI_KEYS.length;
        const key = GEMINI_KEYS[keyIndex];
        
        try {
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${key}`,
                {
                    contents: messages,
                    generationConfig: {
                        temperature: 0.8,
                        maxOutputTokens: 500,
                    }
                }
            );
            
            // Update key index on success
            currentKeyIndex = (keyIndex + 1) % GEMINI_KEYS.length;
            
            return res.json(response.data);
        } catch (error) {
            console.log(`Key ${keyIndex + 1} failed, trying next...`);
            // Continue to next key
        }
    }
    
    // All keys failed
    res.status(500).json({ error: 'All API keys failed' });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        time: new Date().toISOString(),
        geminiKeys: GEMINI_KEYS.length,
        waifuApi: true
    });
});

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Gemini keys available: ${GEMINI_KEYS.length}`);
});