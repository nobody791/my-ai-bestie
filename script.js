// App State
let appState = {
    userName: '',
    selectedModel: '',
    friendName: '',
    isVoiceOn: true,
    chatHistory: [],
    speechSynthesis: window.speechSynthesis,
    recognition: null,
    isRecognizing: false,
    renderer: null // For 3D
};

// DOM Elements
let elements = {};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App initializing...');
    
    // Get all DOM elements
    initializeElements();
    
    setupEventListeners();
    setupSpeechRecognition();
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
        threeContainer: document.getElementById('threeContainer'),
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
        micBtn: document.getElementById('micBtn'),
        funModeBtn: document.getElementById('funModeBtn')
    };
    
    console.log('Elements initialized:', Object.keys(elements).length);
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
    
    // Mic
    elements.micBtn.addEventListener('click', toggleSpeechRecognition);
    
    // Fun mode
    elements.funModeBtn.addEventListener('click', triggerFunMode);
    
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
    
    if (model === 'model4') {
        elements.modelImage.classList.add('hidden');
        elements.threeContainer.classList.remove('hidden');
        init3D();
    } else {
        elements.modelImage.src = `public/${model}.png`;
        elements.modelImage.classList.remove('hidden');
        elements.threeContainer.classList.add('hidden');
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
        showNotification('Please name your friend', 'error');
        return;
    }
    
    appState.friendName = name;
    
    // Update chat UI
    if (appState.selectedModel === 'model4') {
        setTimeout(() => {
            elements.chatFriendImage.src = appState.renderer.domElement.toDataURL('image/png');
        }, 500); // Wait for render
    } else {
        elements.chatFriendImage.src = `public/${appState.selectedModel}.png`;
    }
    elements.chatFriendNameDisplay.textContent = name;
    
    // Show chat section
    elements.namingSection.classList.add('hidden');
    elements.chatSection.classList.remove('hidden');
    
    // Load chat history if exists
    const storedHistory = localStorage.getItem(`chat_${name}`);
    if (storedHistory) {
        appState.chatHistory = JSON.parse(storedHistory);
        appState.chatHistory.forEach(msg => {
            if (msg.role === 'user') addMessage(msg.parts[0].text, 'user');
            else addMessage(msg.parts[0].text, 'friend');
        });
    } else {
        // Welcome message
        const welcomeMsg = `Hi ${appState.userName}! I'm ${name}, your chilling companion! How can I help you today? 😊`;
        addMessage(welcomeMsg, 'friend');
        
        appState.chatHistory = [
            {
                role: "user",
                parts: [{ text: `You are ${name}, a friendly chilling companion. The user's name is ${appState.userName}. Be warm and friendly. If the user asks to show or send an image, reply exactly with [IMAGE: list of tags for the image, comma separated, e.g. waifu,uniform]. Choose tags from waifu.im API, and randomly decide to include NSFW tags like ecchi,hentai or SFW like maid,marin-kitagawa. Do not add any other text. Else, respond normally with fun emojis where appropriate.` }]
            },
            {
                role: "model",
                parts: [{ text: welcomeMsg }]
            }
        ];
    }
    
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
    
    saveChatHistory();
    
    // Show typing
    showTypingIndicator();
    
    try {
        const response = await getAIResponse();
        removeTypingIndicator();
        
        if (response.startsWith('[IMAGE:') && response.endsWith(']')) {
            const tagsStr = response.slice(8, -1);
            const tags = tagsStr.split(',').map(t => t.trim());
            const imgUrl = await fetchWaifuImage(tags);
            addImageMessage(imgUrl, 'friend');
        } else {
            addMessage(response, 'friend');
            if (appState.isVoiceOn) {
                speakText(response);
            }
        }
        
        appState.chatHistory.push({
            role: "model",
            parts: [{ text: response }]
        });
        saveChatHistory();
    } catch (error) {
        removeTypingIndicator();
        const fallback = getFallbackResponse();
        addMessage(fallback, 'friend');
    }
}

async function getAIResponse() {
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: appState.chatHistory })
        });
        const data = await res.json();
        if (data.error) throw new Error();
        return data.text;
    } catch {
        return getFallbackResponse();
    }
}

async function fetchWaifuImage(tags) {
    try {
        let url = 'https://api.waifu.im/search?';
        tags.forEach(tag => url += `tags=${tag}&`);
        const res = await fetch(url);
        const data = await res.json();
        return data.images[0].url;
    } catch {
        return ''; // Fallback empty
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
    contentDiv.innerHTML = text; // Support emojis
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    contentDiv.appendChild(timeSpan);
    
    messageDiv.appendChild(contentDiv);
    elements.chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function addImageMessage(url, sender) {
    if (!url) return addMessage('Sorry, couldn\'t load image.', 'friend');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '100%';
    img.style.borderRadius = '10px';
    contentDiv.appendChild(img);
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    contentDiv.appendChild(timeSpan);
    
    messageDiv.appendChild(contentDiv);
    elements.chatMessages.appendChild(messageDiv);
    
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

function setupSpeechRecognition() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        appState.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        appState.recognition.continuous = false;
        appState.recognition.interimResults = false;
        appState.recognition.onresult = (event) => {
            elements.messageInput.value = event.results[0][0].transcript;
        };
        appState.recognition.onend = () => {
            appState.isRecognizing = false;
            elements.micBtn.querySelector('i').className = 'fas fa-microphone';
        };
        appState.recognition.onerror = () => {
            showNotification('Speech recognition error', 'error');
            appState.isRecognizing = false;
            elements.micBtn.querySelector('i').className = 'fas fa-microphone';
        };
    }
}

function toggleSpeechRecognition() {
    if (!appState.recognition) return showNotification('Speech recognition not supported', 'error');
    
    if (appState.isRecognizing) {
        appState.recognition.stop();
    } else {
        appState.recognition.start();
        appState.isRecognizing = true;
        elements.micBtn.querySelector('i').className = 'fas fa-microphone-alt';
    }
}

function triggerFunMode() {
    const funPrompts = [
        'Tell me a funny joke!',
        'Let\'s play a quick text game. You start!',
        'Share a random fun fact!',
        'Recommend a chill activity!'
    ];
    const prompt = funPrompts[Math.floor(Math.random() * funPrompts.length)];
    elements.messageInput.value = prompt;
    sendMessage();
}

function autoResizeTextarea() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
}

function resetTextareaHeight() {
    elements.messageInput.style.height = 'auto';
}

function saveChatHistory() {
    localStorage.setItem(`chat_${appState.friendName}`, JSON.stringify(appState.chatHistory));
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

function init3D() {
    const container = elements.threeContainer;
    const scene = new THREE.Scene();
    scene.background = null; // Transparent

    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    appState.renderer = renderer;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(5, 5, 5);
    scene.add(directional);

    // Model group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Head
    const headGeo = new THREE.SphereGeometry(1, 32, 32);
    const headMat = new THREE.MeshPhongMaterial({ color: 0xffdbac }); // Skin
    const head = new THREE.Mesh(headGeo, headMat);
    modelGroup.add(head);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.1, 32, 32);
    const eyeMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.3, 0.3, 0.9);
    head.add(leftEye);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.3;
    head.add(rightEye);

    // Hair (multiple strands for beauty)
    const hairMat = new THREE.MeshPhongMaterial({ color: 0x663300 }); // Brown hair
    for (let i = 0; i < 5; i++) {
        const hairGeo = new THREE.CylinderGeometry(0.05, 0.05, 2 + Math.random(), 32);
        const hair = new THREE.Mesh(hairGeo, hairMat);
        hair.position.set(Math.sin(i) * 0.5, 0.5 + Math.random() * 0.5, -0.5 + Math.cos(i) * 0.5);
        hair.rotation.z = Math.random() * Math.PI / 4;
        head.add(hair);
    }

    // Body (dress)
    const bodyGeo = new THREE.CylinderGeometry(0.8, 0.6, 2, 32);
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0xff69b4 }); // Pink dress
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = -2;
    modelGroup.add(body);

    // Skirt
    const skirtGeo = new THREE.ConeGeometry(1.2, 1.5, 32);
    const skirtMat = new THREE.MeshPhongMaterial({ color: 0xff69b4 });
    const skirt = new THREE.Mesh(skirtGeo, skirtMat);
    skirt.position.y = -3.5;
    modelGroup.add(skirt);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 32);
    const armMat = new THREE.MeshPhongMaterial({ color: 0xffdbac });
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-1, -1.5, 0);
    leftArm.rotation.z = Math.PI / 4;
    modelGroup.add(leftArm);
    const rightArm = leftArm.clone();
    rightArm.position.x = 1;
    rightArm.rotation.z = -Math.PI / 4;
    modelGroup.add(rightArm);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.3, 0.2, 2, 32);
    const legMat = new THREE.MeshPhongMaterial({ color: 0x000000 }); // Black leggings
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.4, -4, 0);
    modelGroup.add(leftLeg);
    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.4;
    modelGroup.add(rightLeg);

    camera.position.z = 6;

    function animate() {
        requestAnimationFrame(animate);
        modelGroup.rotation.y += 0.005;
        modelGroup.position.y = Math.sin(Date.now() / 1000) * 0.2;
        renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}