// 3D Model for Elysia
class Model4Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            alpha: true,
            antialias: true 
        });
        
        this.renderer.setSize(150, 150);
        this.renderer.setClearColor(0x000000, 0);
        
        this.setupLights();
        this.createModel();
        this.setupAnimation();
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(ambientLight);
        
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(1, 2, 1);
        this.scene.add(dirLight);
        
        const backLight = new THREE.PointLight(0x8b5cf6, 0.5);
        backLight.position.set(-1, 0, -2);
        this.scene.add(backLight);
        
        const fillLight = new THREE.PointLight(0xec4899, 0.3);
        fillLight.position.set(2, 1, 1);
        this.scene.add(fillLight);
    }
    
    createModel() {
        const group = new THREE.Group();
        
        // Head with gradient effect using multiple materials
        const headGeometry = new THREE.SphereGeometry(0.8, 32, 32);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0xffddbb,
            emissive: 0x221100,
            shininess: 30,
            transparent: true,
            opacity: 0.95
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.2;
        group.add(head);
        
        // Hair (using a torus for stylized effect)
        const hairGeometry = new THREE.TorusGeometry(0.85, 0.15, 16, 100, Math.PI);
        const hairMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b5cf6,
            emissive: 0x331166,
            shininess: 60
        });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.rotation.x = Math.PI / 2;
        hair.rotation.z = Math.PI / 4;
        hair.position.y = 0.4;
        group.add(hair);
        
        // Eyes with glow
        const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const eyeMaterial = new THREE.MeshPhongMaterial({
            color: 0xec4899,
            emissive: 0x440022
        });
        
        const eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eyeLeft.position.set(-0.3, 0.35, 0.7);
        group.add(eyeLeft);
        
        const eyeRight = new THREE.Mesh(eyeGeometry, eyeMaterial);
        eyeRight.position.set(0.3, 0.35, 0.7);
        group.add(eyeRight);
        
        // Pupils
        const pupilGeometry = new THREE.SphereGeometry(0.07, 8, 8);
        const pupilMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
        
        const pupilLeft = new THREE.Mesh(pupilGeometry, pupilMaterial);
        pupilLeft.position.set(-0.3, 0.3, 0.85);
        group.add(pupilLeft);
        
        const pupilRight = new THREE.Mesh(pupilGeometry, pupilMaterial);
        pupilRight.position.set(0.3, 0.3, 0.85);
        group.add(pupilRight);
        
        // Body with gradient
        const bodyGeometry = new THREE.CylinderGeometry(0.6, 0.8, 1.2, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b5cf6,
            emissive: 0x221144,
            shininess: 40,
            transparent: true,
            opacity: 0.9
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = -0.8;
        group.add(body);
        
        // Decorative elements
        const starGeometry = new THREE.OctahedronGeometry(0.1);
        const starMaterial = new THREE.MeshPhongMaterial({
            color: 0xffaa00,
            emissive: 0x442200
        });
        
        for (let i = 0; i < 5; i++) {
            const star = new THREE.Mesh(starGeometry, starMaterial);
            star.position.set(
                Math.sin(i * Math.PI * 0.4) * 0.5,
                -0.5 + i * 0.2,
                Math.cos(i * Math.PI * 0.4) * 0.3
            );
            group.add(star);
        }
        
        this.scene.add(group);
        this.model = group;
        this.camera.position.z = 3;
    }
    
    setupAnimation() {
        const animate = () => {
            requestAnimationFrame(animate.bind(this));
            
            if (this.model) {
                // Gentle floating animation
                this.model.rotation.y += 0.005;
                this.model.position.y = Math.sin(Date.now() * 0.002) * 0.1;
            }
            
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if canvas exists before initializing
    if (document.getElementById('model3dCanvas')) {
        new Model4Renderer('model3dCanvas');
    }
});