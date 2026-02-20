// App State
let appState = {
    userName: '',
    selectedModel: '',
    friendName: '',
    geminiKeys: [],
    currentKeyIndex: 0,
    isVoiceOn: true,
    isImageGenerationOn: true,
    chatHistory: [],
    speechSynthesis: window.speechSynthesis,
    companionMood: 'happy',
    timeWithFriend: 0,
    theme: 'dark'
};

// DOM Elements
let elements = {};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Chilling Companion initializing...');
    
    initializeElements();
    await loadConfig();
    setupEventListeners();
    simulateLoading();
    initializeTheme();
});

function initializeElements() {
    elements = {
        loadingScreen: document.getElementById('loadingScreen'),
        progressBar: document.getElementById('progressBar'),
        welcomeModal: document.getElementById('welcomeModal'),
        mainApp: document.getElementById('mainApp'),
        userNameInput: document.getElementById('userNameInput'),
        startBtn: document.getElementById('startBtn'),
        greeting: document.getElementById('greeting'),
        modelImage: document.getElementById('modelImage'),
        modelContainer: document.getElementById('modelContainer'),
        selectionSection: document.getElementById('selectionSection'),
        selectBtns: document.querySelectorAll('.select-btn'),
        namingSection: document.getElementById('namingSection'),
        friendNameInput: document.getElementById('friendNameInput'),
        nameBtn: document.getElementById('nameBtn'),
        chatSection: document.getElementById('chatSection'),
        chatMessages: document.getElementById('chatMessages'),
        chatFriendImage: document.getElementById('chatFriendImage'),
        chatFriendNameDisplay: document.getElementById('chatFriendNameDisplay'),
        messageInput: document.getElementById('messageInput'),
        sendBtn: document.getElementById('sendBtn'),
        voiceToggleBtn: document.getElementById('voiceToggleBtn'),
        imageToggleBtn: document.getElementById('imageToggleBtn'),
        themeToggle: document.getElementById('themeToggle'),
        moodIndicator: document.getElementById('moodIndicator'),
        timeWithFriend: document.getElementById('timeWithFriend'),
        imageModal: document.getElementById('imageModal'),
        generatedImage: document.getElementById('generatedImage'),
        saveImageBtn: document.getElementById('saveImageBtn'),
        shareImageBtn: document.getElementById('shareImageBtn'),
        emojiBtn: document.getElementById('emojiBtn'),
        typingStatus: document.getElementById('typingStatus')
    };
    
    console.log('Elements initialized:', Object.keys(elements).length);
}

async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        appState.hasGeminiKeys = config.hasGeminiKeys;
        console.log('Config loaded:', config);
    } catch (error) {
        console.log('Using offline mode');
    }
}

function simulateLoading() {
    const quotes = [
        "Creating your perfect companion...",
        "Almost there...",
        "Adding personality...",
        "Making it special..."
    ];
    
    const quoteElement = document.querySelector('.loading-quote');
    let progress = 0;
    
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                elements.loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    elements.loadingScreen.style.display = 'none';
                    elements.welcomeModal.classList.add('active');
                }, 500);
            }, 500);
        }
        
        elements.progressBar.style.width = progress + '%';
        
        // Update quote based on progress
        if (progress < 25) {
            quoteElement.textContent = quotes[0];
        } else if (progress < 50) {
            quoteElement.textContent = quotes[1];
        } else if (progress < 75) {
            quoteElement.textContent = quotes[2];
        } else {
            quoteElement.textContent = quotes[3];
        }
    }, 200);
}

function setupEventListeners() {
    // Start journey
    elements.startBtn.addEventListener('click', startJourney);
    elements.userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startJourney();
    });
    
    // Select friend
    elements.selectBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectFriend(e.target.dataset.model);
        });
    });
    
    // Friend card click
    document.querySelectorAll('.friend-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('select-btn')) {
                const model = card.dataset.model;
                selectFriend(model);
            }
        });
    });
    
    // Name friend
    elements.nameBtn.addEventListener('click', nameFriend);
    elements.friendNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') nameFriend();
    });
    
    // Chat
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Voice toggle
    if (elements.voiceToggleBtn) {
        elements.voiceToggleBtn.addEventListener('click', toggleVoice);
    }
    
    // Image toggle
    if (elements.imageToggleBtn) {
        elements.imageToggleBtn.addEventListener('click', toggleImageGeneration);
    }
    
    // Theme toggle
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Auto-resize textarea
    elements.messageInput.addEventListener('input', autoResizeTextarea);
    
    // Close modal
    document.querySelector('.close-modal')?.addEventListener('click', () => {
        elements.imageModal.classList.remove('active');
    });
    
    // Save image
    elements.saveImageBtn?.addEventListener('click', saveGeneratedImage);
    
    // Share image
    elements.shareImageBtn?.addEventListener('click', shareGeneratedImage);
    
    // Emoji picker (simple version)
    elements.emojiBtn?.addEventListener('click', showEmojiPicker);
}

function startJourney() {
    const name = elements.userNameInput.value.trim();
    if (!name) {
        showNotification('Please enter your name', 'error');
        return;
    }
    
    appState.userName = name;
    elements.greeting.textContent = `Welcome back, ${name}`;
    
    elements.welcomeModal.classList.remove('active');
    elements.mainApp.classList.remove('hidden');
    
    showNotification(`Nice to meet you, ${name}! ✨`, 'success');
}

function selectFriend(model) {
    appState.selectedModel = model;
    
    // Update model image (for non-3D models)
    if (model !== 'model4') {
        elements.modelImage.src = `public/${model}.png`;
        elements.modelImage.style.display = 'block';
        // Hide canvas if visible
        const canvas = document.getElementById('model3dCanvas');
        if (canvas) canvas.style.display = 'none';
    } else {
        // Show 3D model
        elements.modelImage.style.display = 'none';
        const canvas = document.getElementById('model3dCanvas');
        if (canvas) {
            canvas.style.display = 'block';
            canvas.width = 300;
            canvas.height = 300;
        }
    }
    
    // Show naming section
    elements.selectionSection.classList.add('hidden');
    elements.namingSection.classList.remove('hidden');
    
    // Smooth scroll
    elements.namingSection.scrollIntoView({ behavior: 'smooth' });
}

function nameFriend() {
    const name = elements.friendNameInput.value.trim();
    if (!name) {
        showNotification('Please name your companion', 'error');
        return;
    }
    
    appState.friendName = name;
    
    // Update chat UI
    if (appState.selectedModel !== 'model4') {
        elements.chatFriendImage.src = `public/${appState.selectedModel}.png`;
    } else {
        // For 3D model, use a generated avatar or keep the canvas
        elements.chatFriendImage.src = 'public/model3.png'; // Fallback
    }
    elements.chatFriendNameDisplay.textContent = name;
    
    // Show chat section
    elements.namingSection.classList.add('hidden');
    elements.chatSection.classList.remove('hidden');
    
    // Start time counter
    startTimeCounter();
    
    // Welcome message with personality
    const personalities = {
        model1: "wise and caring",
        model2: "energetic and fun",
        model3: "creative and artistic",
        model4: "mystical and interactive"
    };
    
    const personality = personalities[appState.selectedModel] || "wonderful";
    const welcomeMsg = `Hi ${appState.userName}! I'm ${name}, your ${personality} companion! I'm so happy to meet you! How are you feeling today? 🌟`;
    
    addMessage(welcomeMsg, 'friend');
    
    // Initialize chat history with context
    appState.chatHistory = [
        {
            role: "user",
            parts: [{ text: `You are ${name}, a ${personality} AI companion. The user's name is ${appState.userName}. Be warm, friendly, and engaging. You can generate images when users ask for them using the waifu.im API. Be creative and fun!` }]
        },
        {
            role: "model",
            parts: [{ text: welcomeMsg }]
        }
    ];
    
    // Voice welcome
    if (appState.isVoiceOn) {
        speakText(`Hello! I'm ${name}`);
    }
    
    showNotification(`${name} is now your companion! 🎉`, 'success');
}

function startTimeCounter() {
    setInterval(() => {
        appState.timeWithFriend++;
        const minutes = Math.floor(appState.timeWithFriend / 60);
        const seconds = appState.timeWithFriend % 60;
        
        if (elements.timeWithFriend) {
            if (minutes > 0) {
                elements.timeWithFriend.textContent = `${minutes}m ${seconds}s`;
            } else {
                elements.timeWithFriend.textContent = `${seconds}s`;
            }
        }
    }, 1000);
}

async function sendMessage() {
    const message = elements.messageInput.value.trim();
    if (!message) return;
    
    // Clear input
    elements.messageInput.value = '';
    resetTextareaHeight();
    
    // Add user message
    addMessage(message, 'user');
    
    // Check for image requests
    if (appState.isImageGenerationOn && isImageRequest(message)) {
        showTypingIndicator();
        await handleImageRequest(message);
        removeTypingIndicator();
        return;
    }
    
    // Add to history
    appState.chatHistory.push({
        role: "user",
        parts: [{ text: message }]
    });
    
    // Show typing
    showTypingIndicator();
    if (elements.typingStatus) {
        elements.typingStatus.classList.remove('hidden');
    }
    
    try {
        const response = await getAIResponse(message);
        removeTypingIndicator();
        if (elements.typingStatus) {
            elements.typingStatus.classList.add('hidden');
        }
        addMessage(response, 'friend');
        
        appState.chatHistory.push({
            role: "model",
            parts: [{ text: response }]
        });
        
        if (appState.isVoiceOn) {
            speakText(response);
        }
        
        // Update mood based on conversation
        updateMood(response);
    } catch (error) {
        removeTypingIndicator();
        if (elements.typingStatus) {
            elements.typingStatus.classList.add('hidden');
        }
        const fallback = getFallbackResponse();
        addMessage(fallback, 'friend');
    }
}

function isImageRequest(message) {
    const keywords = ['image', 'picture', 'photo', 'show me', 'generate', 'create', 'draw', 'waifu', 'anime'];
    return keywords.some(keyword => message.toLowerCase().includes(keyword));
}

async function handleImageRequest(message) {
    try {
        // Determine if NSFW based on context
        const isNSFW = message.toLowerCase().includes('nsfw') || 
                       message.toLowerCase().includes('spicy') ||
                       message.toLowerCase().includes('mature');
        
        // Determine tags from message
        const tags = extractTags(message);
        
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tags, isNSFW })
        });
        
        const data = await response.json();
        
        if (data.url) {
            // Add image message
            addImageMessage(data.url, 'friend');
            
            // Add to chat history
            appState.chatHistory.push({
                role: "model",
                parts: [{ text: `Here's an image for you!` }]
            });
        } else {
            addMessage("I couldn't generate an image right now. Let's try something else!", 'friend');
        }
    } catch (error) {
        console.error('Image generation error:', error);
        addMessage("I'm having trouble generating images right now. Let's chat instead!", 'friend');
    }
}

function extractTags(message) {
    const tagKeywords = {
        'waifu': ['waifu', 'girl', 'anime'],
        'maid': ['maid'],
        'neko': ['cat', 'neko', 'kitten'],
        'selfie': ['selfie', 'self'],
        'uniform': ['uniform', 'school'],
        'gaming': ['game', 'gaming', 'gamer']
    };
    
    for (const [tag, keywords] of Object.entries(tagKeywords)) {
        if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
            return [tag];
        }
    }
    
    return ['waifu']; // Default
}

function addImageMessage(url, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const img = document.createElement('img');
    img.src = url;
    img.className = 'message-image';
    img.onclick = () => showImageModal(url);
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    contentDiv.appendChild(img);
    contentDiv.appendChild(timeSpan);
    messageDiv.appendChild(contentDiv);
    elements.chatMessages.appendChild(messageDiv);
    
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function showImageModal(url) {
    elements.generatedImage.src = url;
    elements.imageModal.classList.add('active');
}

function saveGeneratedImage() {
    const link = document.createElement('a');
    link.download = 'companion-image.jpg';
    link.href = elements.generatedImage.src;
    link.click();
    showNotification('Image saved!', 'success');
}

function shareGeneratedImage() {
    if (navigator.share) {
        navigator.share({
            title: 'AI Companion Image',
            text: 'Check out this image from my AI Companion!',
            url: elements.generatedImage.src
        });
    } else {
        navigator.clipboard.writeText(elements.generatedImage.src);
        showNotification('Image URL copied to clipboard!', 'success');
    }
}

function showEmojiPicker() {
    // Simple emoji picker (can be expanded)
    const emojis = ['😊', '😂', '🥰', '😍', '🤔', '😴', '🎉', '✨', '🌟', '💫'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    elements.messageInput.value += randomEmoji;
    elements.messageInput.focus();
}

async function getAIResponse(message) {
    try {
        // Try to get a Gemini key
        const keyResponse = await fetch('/api/gemini-key');
        const keyData = await keyResponse.json();
        
        if (!keyData.key) {
            return getFallbackResponse();
        }
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${keyData.key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: appState.chatHistory,
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 500,
                }
            })
        });
        
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || getFallbackResponse();
    } catch (error) {
        console.error('AI Error:', error);
        
        // Try using server proxy as fallback
        try {
            const proxyResponse = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: appState.chatHistory })
            });
            
            const data = await proxyResponse.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || getFallbackResponse();
        } catch (proxyError) {
            return getFallbackResponse();
        }
    }
}

function getFallbackResponse() {
    const responses = [
        "That's so interesting! Tell me more about that! 😊",
        "I love how you think! What else is on your mind? 💭",
        "You're amazing, you know that? Let's keep chatting! 🌟",
        "I'm here for you! What would you like to explore today? 💫",
        "That's great! How does that make you feel? 🎯",
        "You make my day better just by talking to me! ✨",
        "I'm curious to hear more about that! 🧐",
        "That's fascinating! Tell me everything! 🎉"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

function updateMood(response) {
    // Simple mood detection based on response content
    if (response.includes('❤️') || response.includes('love') || response.includes('happy')) {
        appState.companionMood = 'happy';
    } else if (response.includes('😢') || response.includes('sad')) {
        appState.companionMood = 'caring';
    } else if (response.includes('🎉') || response.includes('excited')) {
        appState.companionMood = 'excited';
    }
    
    if (elements.moodIndicator) {
        elements.moodIndicator.textContent = appState.companionMood.charAt(0).toUpperCase() + appState.companionMood.slice(1);
    }
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    contentDiv.appendChild(timeSpan);
    messageDiv.appendChild(contentDiv);
    elements.chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message friend-message';
    indicator.id = 'typingIndicator';
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    
    indicator.appendChild(typingDiv);
    elements.chatMessages.appendChild(indicator);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

function toggleVoice() {
    appState.isVoiceOn = !appState.isVoiceOn;
    const icon = elements.voiceToggleBtn.querySelector('i');
    icon.className = appState.isVoiceOn ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    showNotification(`Voice ${appState.isVoiceOn ? 'on' : 'off'}`, 'info');
}

function toggleImageGeneration() {
    appState.isImageGenerationOn = !appState.isImageGenerationOn;
    const icon = elements.imageToggleBtn.querySelector('i');
    icon.className = appState.isImageGenerationOn ? 'fas fa-image' : 'fas fa-image';
    icon.style.opacity = appState.isImageGenerationOn ? '1' : '0.5';
    showNotification(`Image generation ${appState.isImageGenerationOn ? 'enabled' : 'disabled'}`, 'info');
}

function toggleTheme() {
    appState.theme = appState.theme === 'dark' ? 'light' : 'dark';
    const icon = elements.themeToggle.querySelector('i');
    
    if (appState.theme === 'light') {
        document.documentElement.style.setProperty('--dark', '#ffffff');
        document.documentElement.style.setProperty('--darker', '#f8fafc');
        document.documentElement.style.setProperty('--light', '#0f172a');
        document.documentElement.style.setProperty('--gray', '#64748b');
        icon.className = 'fas fa-sun';
    } else {
        document.documentElement.style.setProperty('--dark', '#0f172a');
        document.documentElement.style.setProperty('--darker', '#0b0f1a');
        document.documentElement.style.setProperty('--light', '#ffffff');
        document.documentElement.style.setProperty('--gray', '#94a3b8');
        icon.className = 'fas fa-moon';
    }
}

function initializeTheme() {
    // Set initial theme
    const icon = elements.themeToggle?.querySelector('i');
    if (icon) icon.className = 'fas fa-moon';
}

function speakText(text) {
    if (!appState.isVoiceOn || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to get a female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Google UK') || voice.name.includes('Samantha'));
    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }
    
    window.speechSynthesis.speak(utterance);
}

function autoResizeTextarea() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
}

function resetTextareaHeight() {
    elements.messageInput.style.height = 'auto';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.background = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#8b5cf6';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}