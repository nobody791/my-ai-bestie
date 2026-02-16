const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('.')); // Serves your HTML/CSS/JS

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

app.post('/chat', async (req, res) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(req.body.prompt);
        res.json({ text: result.response.text() });
    } catch (e) {
        res.status(500).json({ text: "Error connecting to AI." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
