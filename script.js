// Global variables
let selectedModel = null;
let friendName = null;
let userName = null;
let mediaRecorder;
let audioChunks = [];
let isVoiceOn = true;
let chatHistory = [];

// DOM Elements
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

// Audio setup
let audio = new Audio();
let voiceAudio = new Audio('public/voice.mp3');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Check if Gemini API key is available
    if (!window.GEMINI_KEY) {
        console.error('Gemini API key not found');
        showErrorMessage('API configuration error. Please check your setup.');
    }
});

// Start journey button click
startJourneyBtn.addEventListener('click', () => {
    userName = userNameInput.value.trim();
    if (userName) {
        nameModal.classList.remove('active');
        mainApp.classList.add('visible');
        userGreeting.textContent = `Welcome, ${userName}! 👋`;
        playVoice('welcome');
    } else {
        alert('Please enter your name to continue!');
    }
});

// Friend selection
friendCards.forEach(card => {
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('select-friend-btn')) return;
        
        const model = card.dataset.model;
        const defaultName = card.dataset.name;
        
        selectedModel = model;
        currentModel.src = `public/${model}.png`;
        
        // Show naming section
        namingSection.classList.remove('hidden');
        
        // Scroll to naming section
        namingSection.scrollIntoView({ behavior: 'smooth' });
    });
});

// Name friend button
nameFriendBtn.addEventListener('click', () => {
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
        addMessage(`Hi ${userName}! I'm ${friendName}, your new AI friend! How can I make your day better today? 💫`, 'friend');
        
        // Play voice
        playVoice('friend-intro');
        
        // Scroll to chat
        chatSection.scrollIntoView({ behavior: 'smooth' });
        
        // Initialize chat history
        chatHistory = [
            {
                role: "user",
                parts: [{ text: `You are now ${friendName}, a friendly AI companion. The user's name is ${userName}. Be warm, friendly, and engaging. Keep responses concise but meaningful.` }]
            },
            {
                role: "model",
                parts: [{ text: `Hi ${userName}! I'm ${friendName}, your new AI friend! How can I make your day better today? 💫` }]
            }
        ];
    } else {
        alert('Please enter a name for your friend!');
    }
});

// Send message
sendMessage.addEventListener('click', async () => {
    const message = userMessage.value.trim();
    if (!message) return;
    
    // Clear input
    userMessage.value = '';
    
    // Add user message to chat
    addMessage(message, 'user');
    
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
        
        // Play voice if enabled
        if (isVoiceOn) {
            playVoice('response');
        }
        
    } catch (error) {
        console.error('Error getting AI response:', error);
        removeTypingIndicator();
        addMessage('Sorry, I\'m having trouble connecting. Please try again!', 'friend');
    }
});

// Voice toggle
voiceToggle.addEventListener('click', () => {
    isVoiceOn = !isVoiceOn;
    voiceToggle.textContent = isVoiceOn ? '🔊 Voice On' : '🔈 Voice Off';
});

// Enter key to send message
userMessage.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage.click();
    }
});

// Gemini API integration
async function getGeminiResponse(message) {
    const API_KEY = window.GEMINI_KEY; // This will be set from environment variable
    
    if (!API_KEY) {
        throw new Error('Gemini API key not configured');
    }
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
    
    const requestBody = {
        contents: chatHistory,
        generationConfig: {
            temperature: 0.9,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
        },
        safetySettings: [
            {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
        ]
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
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

// Helper functions
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message friend-message typing-indicator-container';
    indicator.id = 'typingIndicator';
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    
    indicator.appendChild(typingDiv);
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

function playVoice(type) {
    if (!isVoiceOn) return;
    
    // Simple voice feedback
    if (type === 'welcome') {
        // Play welcome sound or use Web Speech API
        speakText(`Welcome ${userName}!`);
    } else if (type === 'friend-intro') {
        speakText(`Hello! I'm ${friendName}`);
    } else if (type === 'response') {
        // Play a subtle notification sound
        voiceAudio.currentTime = 0;
        voiceAudio.play().catch(e => console.log('Audio play failed:', e));
    }
}

// Web Speech API for text-to-speech
function speakText(text) {
    if (!isVoiceOn) return;
    
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        window.speechSynthesis.speak(utterance);
    }
}

// 3D floating effect enhancement
floatingModel.addEventListener('mousemove', (e) => {
    const rect = floatingModel.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    floatingModel.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});

floatingModel.addEventListener('mouseleave', () => {
    floatingModel.style.transform = 'rotateX(0) rotateY(0)';
});

// Error message display
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(255, 68, 68, 0.9);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        backdrop-filter: blur(10px);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Add animation styles dynamically
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
    
    .error-message {
        box-shadow: 0 10px 30px rgba(255, 68, 68, 0.3);
        border-left: 4px solid #ff4444;
    }
    
    .typing-indicator-container {
        background: transparent !important;
    }
`;
document.head.appendChild(style);
