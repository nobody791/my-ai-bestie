let scene, camera, renderer, sprite;

function startApp() {
    const name = document.getElementById('user-name').value;
    if(!name) return alert("Enter your name!");
    document.getElementById('welcome-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    init3D('model1.png');
}

function init3D(imgFile) {
    const container = document.getElementById('canvas-container');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth/container.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const texture = new THREE.TextureLoader().load(`public/${imgFile}`);
    const material = new THREE.SpriteMaterial({ map: texture });
    sprite = new THREE.Sprite(material);
    sprite.scale.set(3, 3, 1);
    scene.add(sprite);
    camera.position.z = 5;
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if(sprite) {
        sprite.position.y = Math.sin(Date.now() * 0.002) * 0.15; // Float
        sprite.rotation.z = Math.sin(Date.now() * 0.001) * 0.05; // Wobble
    }
    renderer.render(scene, camera);
}

async function sendMessage() {
    const input = document.getElementById('chat-input');
    const log = document.getElementById('chat-log');
    if(!input.value) return;

    log.innerHTML += `<div><b>You:</b> ${input.value}</div>`;
    const userText = input.value;
    input.value = '';

    const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText })
    });
    const data = await response.json();
    log.innerHTML += `<div><b>Bestie:</b> ${data.text}</div>`;
    log.scrollTop = log.scrollHeight;
}
