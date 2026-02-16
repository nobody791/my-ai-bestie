// Global variables
let GEMINI_KEY = '';
let selectedModel = null;
let friendName = null;
let userName = null;
let isVoiceOn = true;
let chatHistory = [];
let currentRotation = 0;
let voiceVolume = 0.8;
let voiceSpeed = 1;
let messageSound = true;
let autoScroll = true;

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const progressBar = document.getElementById('progressBar');
const nameModal = document.getElementById('nameModal');
const mainApp = document.getElementById('mainApp');
const userNameInput = document.getElementById('userNameInput');
const startJourneyBtn = document.getElementById('startJourneyBtn');
const userGreeting = document.getElementById('userGreeting');
const currentModel = document.getElementById('currentModel');
const friendCards = document.querySelectorAll('.friend-card');
const namingSection = document.getElementById('namingSection');
const friendNameInput = document.getElementById('friendNameInput');
const nameFriendBtn = document.getElementById('nameFriendBtn');
const chatSection = document.getElementById('chatSection');
const chatMessages = document.getElementById('chatMessages');
const userMessage = document.getElementById('userMessage');
const sendMessage = document.getElementById('sendMessage');
const chatFriendImg = document.getElementById('chatFriendImg');
const chatFriendName = document.getElementById('chatFriendName');
const voiceToggle = document.getElementById('voiceToggle');
const floatingModel = document.getElementById('floatingModel');
const themeToggle = document.getElementById('themeToggle');
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const emojiPickerBtn = document.getElementById('emojiPickerBtn');
const emojiPicker = document.getElementById('emojiPicker');
const clearChat = document.getElementById('clearChat');
const rotateLeft = document.getElementById('rotateLeft');
const rotateRight = document.getElementById('rotateRight');
const resetRotation = document.getElementById('resetRotation');

// Audio setup
const messageSoundAudio = new Audio();
messageSoundAudio.src = 'data:audio/wav;base64,UklGRlwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAAA8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    initializeParticles();
    simulateLoading();
    setupEventListeners();
    initializeSpeechSynthesis();
});

// Load configuration
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        GEMINI_KEY = config.geminiKey;
        
        if (!GEMINI_KEY) {
            showNotification('AI features will be limited. Please configure API key.', 'warning');
        }
    } catch (error) {
        console.error('Failed to load config:', error);
        showNotification('Failed to load configuration', 'error');
    }
}

// Simulate loading progress
function simulateLoading() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                nameModal.classList.add('active');
            }, 500);
        }
        progressBar.style.width = `${progress}%`;
    }, 200);
}

// Initialize particles.js
function initializeParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: '#667eea' },
                shape: { type: 'circle' },
                opacity: { value: 0.5, random: true },
                size: { value: 3, random: true },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: '#667eea',
                    opacity: 0.4,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 2,
                    direction: 'none',
                    random: true,
                    straight: false,
                    out_mode: 'out',
                    bounce: false
                }
            },
            interactivity: {
                detect_on: 'canvas',
                events: {
                    onhover: { enable: true, mode: 'repulse' },
                    onclick: { enable: true, mode: 'push' },
                    resize: true
                }
            },
            retina_detect: true
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Start journey
    startJourneyBtn.addEventListener('click', startJourney);
    
    // Friend selection
    document.querySelectorAll('.select-friend-btn').forEach(btn => {
        btn.addEventListener('click', selectFriend);
    });
    
    // Suggested names
    document.querySelectorAll('.suggested-name').forEach(btn => {
        btn.addEventListener('click', () => {
            friendNameInput.value = btn.textContent;
        });
    });
    
    // Name friend
    nameFriendBtn.addEventListener('click', nameFriend);
    
    // Send message
    sendMessage.addEventListener('click', sendUserMessage);
    userMessage.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendUserMessage();
        }
    });
    
    // Voice toggle
    voiceToggle.addEventListener('click', toggleVoice);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Settings
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });
    
    // Close settings
    document.querySelector('.close-btn').addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });
    
    // Emoji picker
    emojiPickerBtn.addEventListener('click', () => {
        emojiPicker.classList.toggle('hidden');
    });
    
    // Emoji selection
    document.querySelectorAll('.emoji-grid span').forEach(emoji => {
        emoji.addEventListener('click', () => {
            userMessage.value += emoji.textContent;
            emojiPicker.classList.add('hidden');
        });
    });
    
    // Clear chat
    clearChat.addEventListener('click', clearChatHistory);
    
    // Model rotation
    rotateLeft.addEventListener('click', () => rotateModel(-15));
    rotateRight.addEventListener('click', () => rotateModel(15));
    resetRotation.addEventListener('click', () => rotateModel(0, true));
    
    // 3D model interaction
    floatingModel.addEventListener('mousemove', handleModelHover);
    floatingModel.addEventListener('mouseleave', () => {
        floatingModel.style.transform = `rotateX(0) rotateY(${currentRotation}deg)`;
    });
    
    // Settings controls
    document.getElementById('voiceVolume').addEventListener('input', (e) => {
        voiceVolume = e.target.value / 100;
    });
    
    document.getElementById('voiceSpeed').addEventListener('input', (e) => {
        voiceSpeed = parseFloat(e.target.value);
    });
    
    document.getElementById('messageSound').addEventListener('change', (e) => {
        messageSound = e.target.checked;
    });
    
    document.getElementById('autoScroll').addEventListener('change', (e) => {
        autoScroll = e.target.checked;
    });
    
    // Theme options
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.documentElement.setAttribute('data-theme', btn.dataset.theme);
            document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update theme toggle icon
            const icon = themeToggle.querySelector('i');
            if (btn.dataset.theme === 'light') {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        });
    });
    
    // Click outside to close emoji picker
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && !emojiPickerBtn.contains(e.target)) {
            emojiPicker.classList.add('hidden');
        }
    });
}

// Start journey
function startJourney() {
    userName = userNameInput.value.trim();
    if (userName) {
        nameModal.classList.remove('active');
        mainApp.classList.add('visible');
        userGreeting.textContent = `Welcome, ${userName}! 👋`;
        speakText(`Welcome ${userName}!`);
        showNotification(`Nice to meet you, ${userName}!`, 'success');
    } else {
        shakeElement(userNameInput);
        showNotification('Please enter your name!', 'error');
    }
}

// Select friend
function selectFriend(e) {
    const btn = e.currentTarget;
    const card = btn.closest('.friend-card');
    const model = card.dataset.model;
    const defaultName = card.dataset.name;
    
    selectedModel = model;
    currentModel.src = `public/${model}.png`;
    
    // Animate selection
    card.style.transform = 'scale(0.95)';
    setTimeout(() => {
        card.style.transform = '';
    }, 200);
    
    // Show naming section
    namingSection.classList.remove('hidden');
    namingSection.scrollIntoView({ behavior: 'smooth' });
    
    // Pre-fill with default name
    friendNameInput.value = defaultName;
    
    showNotification(`Great choice! Now give your friend a name!`, 'info');
}

// Name friend
function nameFriend() {
    friendName = friendNameInput.value.trim();
    
    if (friendName && selectedModel) {
        // Hide naming section
        namingSection.classList.add('hidden');
        
        // Update chat header
        chatFriendImg.src = `public/${selectedModel}.png`;
        chatFriendName.textContent = friendName;
        
        // Show chat section
        chatSection.classList.remove('hidden');
        
        // Add welcome message
        const welcomeMessage = `Hi ${userName}! I'm ${friendName}, your new AI friend! How can I make your day better today? 💫`;
        addMessage(welcomeMessage, 'friend');
        
        // Speak welcome
        speakText(`Hello! I'm ${friendName}`);
        
        // Scroll to chat
        chatSection.scrollIntoView({ behavior: 'smooth' });
        
        // Initialize chat history
        chatHistory = [
            {
                role: "user",
                parts: [{ text: `You are now ${friendName}, a friendly AI companion. The user's name is ${userName}. Be warm, friendly, and engaging. Keep responses concise but meaningful. Use emojis occasionally.` }]
            },
            {
                role: "model",
                parts: [{ text: welcomeMessage }]
            }
        ];
        
        showNotification(`${friendName} is now your friend! 🎉`, 'success');
    } else {
        shakeElement(friendNameInput);
        showNotification('Please enter a name for your friend!', 'error');
    }
}

// Send user message
async function sendUserMessage() {
    const message = userMessage.value.trim();
    if (!message) return;
    
    // Clear input
    userMessage.value = '';
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Play message sound
    if (messageSound) {
        playMessageSound();
    }
    
    // Add to history
    chatHistory.push({
        role: "user",
        parts: [{ text: message }]
    });
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Get AI response
        const response = await getGeminiResponse(message);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add AI response
        addMessage(response, 'friend');
        
        // Add to history
        chatHistory.push({
            role: "model",
            parts: [{ text: response }]
        });
        
        // Speak response if voice is on
        if (isVoiceOn) {
            speakText(response);
        }
        
    } catch (error) {
        console.error('Error getting AI response:', error);
        removeTypingIndicator();
        
        // Fallback response
        const fallbackResponse = "I'm having trouble connecting right now. But I'm still here with you! Tell me more about your day. 😊";
        addMessage(fallbackResponse, 'friend');
        
        showNotification('Connection issue. Using offline mode.', 'warning');
    }
}

// Get Gemini response
async function getGeminiResponse(message) {
    if (!GEMINI_KEY) {
        // Return a cute offline response
        const offlineResponses = [
            "That's interesting! Tell me more! 😊",
            "I love hearing that! What else is on your mind? 💭",
            "You're so fun to talk to! What should we chat about next? 🌟",
            "That reminds me of something cool! But I'm in offline mode right now. Can you tell me another story? 📚",
            "You're awesome! I wish I could respond properly right now! 💫"
        ];
        return offlineResponses[Math.floor(Math.random() * offlineResponses.length)];
    }
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: chatHistory,
                generationConfig: {
                    temperature: 0.9,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 2048,
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Invalid API response format');
        }
        
    } catch (error) {
        console.error('Gemini API error:', error);
        throw error;
    }
}

// Helper Functions
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message fade-in`;
    
    if (sender === 'friend') {
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = `<img src="public/${selectedModel}.png" alt="${friendName}">`;
        messageDiv.appendChild(avatarDiv);
    }
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Format text with emojis and line breaks
    const formattedText = text.replace(/\n/g, '<br>');
    contentDiv.innerHTML = formattedText;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    contentDiv.appendChild(timeSpan);
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    if (autoScroll) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message friend-message typing-indicator-container';
    indicator.id = 'typingIndicator';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = `<img src="public/${selectedModel}.png" alt="${friendName}">`;
    indicator.appendChild(avatarDiv);
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.appendChild(typingDiv);
    
    indicator.appendChild(contentDiv);
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function toggleVoice() {
    isVoiceOn = !isVoiceOn;
    const icon = voiceToggle.querySelector('i');
    icon.className = isVoiceOn ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    showNotification(`Voice ${isVoiceOn ? 'on' : 'off'}`, 'info');
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const themes = ['dark', 'light', 'purple', 'ocean'];
    const nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
    document.documentElement.setAttribute('data-theme', nextTheme);
    
    const icon = themeToggle.querySelector('i');
    icon.className = nextTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
}

function clearChatHistory() {
    if (confirm('Clear all messages?')) {
        chatMessages.innerHTML = '';
        chatHistory = [];
        addMessage(`Hi ${userName}! I'm ${friendName}. Let's start fresh! How are you? 💫`, 'friend');
        showNotification('Chat cleared!', 'info');
    }
}

function rotateModel(degrees, reset = false) {
    if (reset) {
        currentRotation = 0;
    } else {
        currentRotation += degrees;
    }
    floatingModel.style.transform = `rotateY(${currentRotation}deg)`;
}

function handleModelHover(e) {
    const rect = floatingModel.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    floatingModel.style.transform = `rotateX(${rotateX}deg) rotateY(${currentRotation + rotateY}deg)`;
}

function speakText(text) {
    if (!isVoiceOn || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceSpeed;
    utterance.volume = voiceVolume;
    utterance.pitch = 1;
    
    // Get available voices and try to select a nice one
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => voice.name.includes('Google') || voice.name.includes('Natural'));
    if (preferredVoice) {
        utterance.voice = preferredVoice;
    }
    
    window.speechSynthesis.speak(utterance);
}

function initializeSpeechSynthesis() {
    if (window.speechSynthesis) {
        window.speechSynthesis.getVoices();
    }
}

function playMessageSound() {
    if (messageSound) {
        messageSoundAudio.play().catch(() => {});
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--primary-color)'};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        box-shadow: var(--shadow-lg);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function shakeElement(element) {
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 300);
}

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
