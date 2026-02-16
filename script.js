// App State
let appState = {
    userName: '',
    selectedModel: '',
    friendName: '',
    geminiKey: '',
    isVoiceOn: true,
    chatHistory: [],
    speechSynthesis: window.speechSynthesis
};

// DOM Elements
let elements = {};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App initializing...');
    
    // Get all DOM elements
    initializeElements();
    
    // Load config and start
    await loadConfig();
    setupEventListeners();
    simulateLoading();
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
        voiceToggleBtn: document.getElementById('voiceToggleBtn')
    };
    
    console.log('Elements initialized:', Object.keys(elements).length);
}

async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        appState.geminiKey = config.geminiKey;
        console.log('Config loaded:', appState.geminiKey ? 'API key present' : 'No API key');
    } catch (error) {
        console.log('Using offline mode');
    }
}

function simulateLoading() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
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
    elements.voiceToggleBtn.addEventListener('click', toggleVoice);
    
    // Auto-resize textarea
    elements.messageInput.addEventListener('input', autoResizeTextarea);
}

function startJourney() {
    const name = elements.userNameInput.value.trim();
    if (!name) {
        showNotification('Please enter your name', 'error');
        return;
    }
    
    appState.userName = name;
    elements.greeting.textContent = `Welcome, ${name}!`;
    
    elements.welcomeModal.classList.remove('active');
    elements.mainApp.classList.remove('hidden');
    
    showNotification(`Nice to meet you, ${name}!`, 'success');
}

function selectFriend(model) {
    appState.selectedModel = model;
    
    // Update model image
    elements.modelImage.src = `public/${model}.png`;
    
    // Show naming section
    elements.selectionSection.classList.add('hidden');
    elements.namingSection.classList.remove('hidden');
    
    // Smooth scroll
    elements.namingSection.scrollIntoView({ behavior: 'smooth' });
}

function nameFriend() {
    const name = elements.friendNameInput.value.trim();
    if (!name) {
        showNotification('Please name your friend', 'error');
        return;
    }
    
    appState.friendName = name;
    
    // Update chat UI
    elements.chatFriendImage.src = `public/${appState.selectedModel}.png`;
    elements.chatFriendNameDisplay.textContent = name;
    
    // Show chat section
    elements.namingSection.classList.add('hidden');
    elements.chatSection.classList.remove('hidden');
    
    // Welcome message
    const welcomeMsg = `Hi ${appState.userName}! I'm ${name}, your AI companion! How can I help you today? 😊`;
    addMessage(welcomeMsg, 'friend');
    
    // Initialize chat history
    appState.chatHistory = [
        {
            role: "user",
            parts: [{ text: `You are ${name}, a friendly AI companion. The user's name is ${appState.userName}. Be warm and friendly.` }]
        },
        {
            role: "model",
            parts: [{ text: welcomeMsg }]
        }
    ];
    
    // Voice welcome
    speakText(`Hello! I'm ${name}`);
    
    showNotification(`${name} is now your friend! 🎉`, 'success');
}

async function sendMessage() {
    const message = elements.messageInput.value.trim();
    if (!message) return;
    
    // Clear input
    elements.messageInput.value = '';
    resetTextareaHeight();
    
    // Add user message
    addMessage(message, 'user');
    
    // Add to history
    appState.chatHistory.push({
        role: "user",
        parts: [{ text: message }]
    });
    
    // Show typing
    showTypingIndicator();
    
    try {
        const response = await getAIResponse(message);
        removeTypingIndicator();
        addMessage(response, 'friend');
        
        appState.chatHistory.push({
            role: "model",
            parts: [{ text: response }]
        });
        
        if (appState.isVoiceOn) {
            speakText(response);
        }
    } catch (error) {
        removeTypingIndicator();
        const fallback = getFallbackResponse();
        addMessage(fallback, 'friend');
    }
}

async function getAIResponse(message) {
    if (!appState.geminiKey) {
        return getFallbackResponse();
    }
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${appState.geminiKey}`, {
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
        return getFallbackResponse();
    }
}

function getFallbackResponse() {
    const responses = [
        "That's interesting! Tell me more! 😊",
        "I love hearing that! What else is on your mind? 💭",
        "You're amazing! Let's chat more! 🌟",
        "I'm here for you! What would you like to talk about? 💫",
        "That's great! How does that make you feel? 🎯"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
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

function speakText(text) {
    if (!appState.isVoiceOn || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
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
    notification.style.background = type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#6366f1';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
