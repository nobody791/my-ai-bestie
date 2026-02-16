let scene, camera, renderer, sprite;

function init3D(imagePath) {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ alpha: true }); // Transparent background
    renderer.setSize(window.innerWidth, window.innerHeight * 0.4); 
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    loader.load(imagePath, (texture) => {
        const material = new THREE.SpriteMaterial({ map: texture });
        sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 2, 1);
        scene.add(sprite);
    });

    camera.position.z = 5;
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if(sprite) {
        sprite.position.y = Math.sin(Date.now() * 0.002) * 0.1; // Floating effect
    }
    renderer.render(scene, camera);
}
