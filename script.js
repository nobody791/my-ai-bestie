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
let loadingScreen, progressBar, nameModal, mainApp, userNameInput, startJourneyBtn;
let userGreeting, currentModel, friendCards, namingSection, friendNameInput;
let nameFriendBtn, chatSection, chatMessages, userMessage, sendMessage;
let chatFriendImg, chatFriendName, voiceToggle, floatingModel, themeToggle;
let settingsBtn, settingsModal, emojiPickerBtn, emojiPicker, clearChat;
let rotateLeft, rotateRight, resetRotation;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - initializing app');
    initializeDOMElements();
    loadConfig();
    initializeParticles();
    simulateLoading();
    setupEventListeners();
    initializeSpeechSynthesis();
});

// Initialize DOM elements
function initializeDOMElements() {
    console.log('Initializing DOM elements');
    
    loadingScreen = document.getElementById('loadingScreen');
    progressBar = document.getElementById('progressBar');
    nameModal = document.getElementById('nameModal');
    mainApp = document.getElementById('mainApp');
    userNameInput = document.getElementById('userNameInput');
    startJourneyBtn = document.getElementById('startJourneyBtn');
    userGreeting = document.getElementById('userGreeting');
    currentModel = document.getElementById('currentModel');
    friendCards = document.querySelectorAll('.friend-card');
    namingSection = document.getElementById('namingSection');
    friendNameInput = document.getElementById('friendNameInput');
    nameFriendBtn = document.getElementById('nameFriendBtn');
    chatSection = document.getElementById('chatSection');
    chatMessages = document.getElementById('chatMessages');
    userMessage = document.getElementById('userMessage');
    sendMessage = document.getElementById('sendMessage');
    chatFriendImg = document.getElementById('chatFriendImg');
    chatFriendName = document.getElementById('chatFriendName');
    voiceToggle = document.getElementById('voiceToggle');
    floatingModel = document.getElementById('floatingModel');
    themeToggle = document.getElementById('themeToggle');
    settingsBtn = document.getElementById('settingsBtn');
    settingsModal = document.getElementById('settingsModal');
    emojiPickerBtn = document.getElementById('emojiPickerBtn');
    emojiPicker = document.getElementById('emojiPicker');
    clearChat = document.getElementById('clearChat');
    rotateLeft = document.getElementById('rotateLeft');
    rotateRight = document.getElementById('rotateRight');
    resetRotation = document.getElementById('resetRotation');
    
    console.log('DOM elements initialized:', {
        startJourneyBtn: !!startJourneyBtn,
        userNameInput: !!userNameInput,
        nameModal: !!nameModal
    });
}

// Load configuration
async function loadConfig() {
    try {
        console.log('Loading config...');
        const response = await fetch('/api/config');
        const config = await response.json();
        GEMINI_KEY = config.geminiKey;
        console.log('Config loaded:', { hasKey: !!GEMINI_KEY });
        
        if (!GEMINI_KEY) {
            showNotification('AI features will be limited. Please configure API key.', 'warning');
        }
    } catch (error) {
        console.error('Failed to load config:', error);
        // Don't show error for missing config in development
        if (!window.location.hostname.includes('localhost')) {
            showNotification('Failed to load configuration', 'error');
        }
    }
}

// Simulate loading progress
function simulateLoading() {
    console.log('Simulating loading...');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                if (loadingScreen) {
                    loadingScreen.classList.add('hidden');
                }
                if (nameModal) {
                    nameModal.classList.add('active');
                }
                console.log('Loading complete - showing name modal');
            }, 500);
        }
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }, 200);
}

// Initialize particles.js
function initializeParticles() {
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
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
        console.log('Particles initialized');
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Start journey - FIXED: Using both click and touch events for mobile
    if (startJourneyBtn) {
        startJourneyBtn.addEventListener('click', (e) => {
            console.log('Start journey button clicked');
            e.preventDefault();
            startJourney();
        });
        
        // For mobile
        startJourneyBtn.addEventListener('touchstart', (e) => {
            console.log('Start journey button touched');
            e.preventDefault();
            startJourney();
        });
    } else {
        console.error('Start journey button not found!');
    }
    
    // Friend selection
    document.querySelectorAll('.select-friend-btn').forEach(btn => {
        btn.addEventListener('click', selectFriend);
    });
    
    // Suggested names
    document.querySelectorAll('.suggested-name').forEach(btn => {
        btn.addEventListener('click', () => {
            if (friendNameInput) {
                friendNameInput.value = btn.textContent;
            }
        });
    });
    
    // Name friend
    if (nameFriendBtn) {
        nameFriendBtn.addEventListener('click', nameFriend);
    }
    
    // Send message
    if (sendMessage) {
        sendMessage.addEventListener('click', sendUserMessage);
    }
    
    if (userMessage) {
        userMessage.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendUserMessage();
            }
        });
    }
    
    // Voice toggle
    if (voiceToggle) {
        voiceToggle.addEventListener('click', toggleVoice);
    }
    
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Settings
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('active');
        });
    }
    
    // Close settings
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn && settingsModal) {
        closeBtn.addEventListener('click', () => {
            settingsModal.classList.remove('active');
        });
    }
    
    // Emoji picker
    if (emojiPickerBtn && emojiPicker) {
        emojiPickerBtn.addEventListener('click', () => {
            emojiPicker.classList.toggle('hidden');
        });
    }
    
    // Emoji selection
    document.querySelectorAll('.emoji-grid span').forEach(emoji => {
        emoji.addEventListener('click', () => {
            if (userMessage) {
                userMessage.value += emoji.textContent;
            }
            if (emojiPicker) {
                emojiPicker.classList.add('hidden');
            }
        });
    });
    
    // Clear chat
    if (clearChat) {
        clearChat.addEventListener('click', clearChatHistory);
    }
    
    // Model rotation
    if (rotateLeft) {
        rotateLeft.addEventListener('click', () => rotateModel(-15));
    }
    if (rotateRight) {
        rotateRight.addEventListener('click', () => rotateModel(15));
    }
    if (resetRotation) {
        resetRotation.addEventListener('click', () => rotateModel(0, true));
    }
    
    // 3D model interaction
    if (floatingModel) {
        floatingModel.addEventListener('mousemove', handleModelHover);
        floatingModel.addEventListener('mouseleave', () => {
            floatingModel.style.transform = `rotateX(0) rotateY(${currentRotation}deg)`;
        });
    }
    
    // Settings controls
    const voiceVolumeInput = document.getElementById('voiceVolume');
    if (voiceVolumeInput) {
        voiceVolumeInput.addEventListener('input', (e) => {
            voiceVolume = e.target.value / 100;
        });
    }
    
    const voiceSpeedInput = document.getElementById('voiceSpeed');
    if (voiceSpeedInput) {
        voiceSpeedInput.addEventListener('input', (e) => {
            voiceSpeed = parseFloat(e.target.value);
        });
    }
    
    const messageSoundCheck = document.getElementById('messageSound');
    if (messageSoundCheck) {
        messageSoundCheck.addEventListener('change', (e) => {
            messageSound = e.target.checked;
        });
    }
    
    const autoScrollCheck = document.getElementById('autoScroll');
    if (autoScrollCheck) {
        autoScrollCheck.addEventListener('change', (e) => {
            autoScroll = e.target.checked;
        });
    }
    
    // Theme options
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.documentElement.setAttribute('data-theme', btn.dataset.theme);
            document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update theme toggle icon
            if (themeToggle) {
                const icon = themeToggle.querySelector('i');
                if (btn.dataset.theme === 'light') {
                    icon.className = 'fas fa-sun';
                } else {
                    icon.className = 'fas fa-moon';
                }
            }
        });
    });
    
    // Click outside to close emoji picker
    document.addEventListener('click', (e) => {
        if (emojiPicker && emojiPickerBtn && 
            !emojiPicker.contains(e.target) && 
            !emojiPickerBtn.contains(e.target)) {
            emojiPicker.classList.add('hidden');
        }
    });
    
    console.log('Event listeners setup complete');
}

// Start journey - FIXED: Added better validation and error handling
function startJourney() {
    console.log('startJourney function called');
    
    if (!userNameInput) {
        console.error('userNameInput not found');
        return;
    }
    
    userName = userNameInput.value.trim();
    console.log('Username entered:', userName);
    
    if (userName) {
        // Hide modal
        if (nameModal) {
            nameModal.classList.remove('active');
        }
        
        // Show main app
        if (mainApp) {
            mainApp.classList.add('visible');
        }
        
        // Update greeting
        if (userGreeting) {
            userGreeting.textContent = `Welcome, ${userName}! 👋`;
        }
        
        // Speak welcome
        speakText(`Welcome ${userName}!`);
        
        // Show success notification
        showNotification(`Nice to meet you, ${userName}!`, 'success');
        
        console.log('Journey started successfully for:', userName);
    } else {
        console.log('No username entered');
        if (userNameInput) {
            shakeElement(userNameInput);
        }
        showNotification('Please enter your name!', 'error');
    }
}

// Select friend
function selectFriend(e) {
    const btn = e.currentTarget;
    const card = btn.closest('.friend-card');
    
    if (!card) return;
    
    const model = card.dataset.model;
    const defaultName = card.dataset.name;
    
    selectedModel = model;
    if (currentModel) {
        currentModel.src = `public/${model}.png`;
    }
    
    // Animate selection
    card.style.transform = 'scale(0.95)';
    setTimeout(() => {
        card.style.transform = '';
    }, 200);
    
    // Show naming section
    if (namingSection) {
        namingSection.classList.remove('hidden');
        namingSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Pre-fill with default name
    if (friendNameInput) {
        friendNameInput.value = defaultName;
    }
    
    showNotification(`Great choice! Now give your friend a name!`, 'info');
}

// Name friend
function nameFriend() {
    if (!friendNameInput) return;
    
    friendName = friendNameInput.value.trim();
    
    if (friendName && selectedModel) {
        // Hide naming section
        if (namingSection) {
            namingSection.classList.add('hidden');
        }
        
        // Update chat header
        if (chatFriendImg) {
            chatFriendImg.src = `public/${selectedModel}.png`;
        }
        if (chatFriendName) {
            chatFriendName.textContent = friendName;
        }
        
        // Show chat section
        if (chatSection) {
            chatSection.classList.remove('hidden');
        }
        
        // Add welcome message
        const welcomeMessage = `Hi ${userName}! I'm ${friendName}, your new AI friend! How can I make your day better today? 💫`;
        addMessage(welcomeMessage, 'friend');
        
        // Speak welcome
        speakText(`Hello! I'm ${friendName}`);
        
        // Scroll to chat
        if (chatSection) {
            chatSection.scrollIntoView({ behavior: 'smooth' });
        }
        
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
        if (friendNameInput) {
            shakeElement(friendNameInput);
        }
        showNotification('Please enter a name for your friend!', 'error');
    }
}

// Send user message
async function sendUserMessage() {
    if (!userMessage) return;
    
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
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message fade-in`;
    
    if (sender === 'friend' && selectedModel) {
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = `<img src="public/${selectedModel}.png" alt="${friendName || 'Friend'}">`;
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
    if (!chatMessages || !selectedModel) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'message friend-message typing-indicator-container';
    indicator.id = 'typingIndicator';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = `<img src="public/${selectedModel}.png" alt="${friendName || 'Friend'}">`;
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
    if (voiceToggle) {
        const icon = voiceToggle.querySelector('i');
        if (icon) {
            icon.className = isVoiceOn ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        }
    }
    showNotification(`Voice ${isVoiceOn ? 'on' : 'off'}`, 'info');
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const themes = ['dark', 'light', 'purple', 'ocean'];
    const nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
    document.documentElement.setAttribute('data-theme', nextTheme);
    
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = nextTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

function clearChatHistory() {
    if (!chatMessages) return;
    
    if (confirm('Clear all messages?')) {
        chatMessages.innerHTML = '';
        chatHistory = [];
        if (userName && friendName) {
            addMessage(`Hi ${userName}! I'm ${friendName}. Let's start fresh! How are you? 💫`, 'friend');
        }
        showNotification('Chat cleared!', 'info');
    }
}

function rotateModel(degrees, reset = false) {
    if (reset) {
        currentRotation = 0;
    } else {
        currentRotation += degrees;
    }
    if (floatingModel) {
        floatingModel.style.transform = `rotateY(${currentRotation}deg)`;
    }
}

function handleModelHover(e) {
    if (!floatingModel) return;
    
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
    // Simple beep sound using Web Audio API
    if (!messageSound) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.log('Audio play failed:', e);
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4ade80' : type === 'error' ? '#f87171' : type === 'warning' ? '#fbbf24' : '#667eea'};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function shakeElement(element) {
    if (!element) return;
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 300);
}

// Add slideOut animation if not exists
if (!document.querySelector('#animation-styles')) {
    const style = document.createElement('style');
    style.id = 'animation-styles';
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
}

// Debug function to check if everything loaded
console.log('Script loaded and initialized');
