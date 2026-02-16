const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

app.post('/chat', async (req, res) => {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(req.body.prompt);
    res.json({ text: result.response.text() });
});

app.listen(3000, () => console.log("Server running on port 3000"));
