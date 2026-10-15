import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export class World3D {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        
        // Rendering Bayangan Halus
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Tone Mapping Golden Hour
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15; // Kecerahan ditingkatkan agar tidak terlalu pekat
        
        this.container.appendChild(this.renderer.domElement);

        this.setupHDRISky();
        this.setupLights();
        
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupHDRISky() {
        const rgbeLoader = new RGBELoader();
        rgbeLoader.load('./assets/sky.hdr', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.background = texture;
            this.scene.environment = texture;
        }, undefined, () => {
            this.scene.background = new THREE.Color(0xfb923c); // Warm Sunset
            this.scene.fog = new THREE.FogExp2(0xfed7aa, 0.003);
        });
    }

    setupLights() {
        // 1. Hemisphere Light (Mengisi area jalan & bayangan bawah agar tidak pekat/hitam)
        const hemiLight = new THREE.HemisphereLight(0xf97316, 0x78350f, 1.8);
        this.scene.add(hemiLight);

        // 2. Ambient Light (Menerangi seluruh objek secara merata)
        const ambientLight = new THREE.AmbientLight(0xffedd5, 0.8);
        this.scene.add(ambientLight);

        // 3. Matahari Senja (Sinar Oranye Keemasan)
        this.sunlight = new THREE.DirectionalLight(0xff8c00, 2.5);
        this.sunlight.castShadow = true;

        this.sunlight.shadow.mapSize.width = 2048;
        this.sunlight.shadow.mapSize.height = 2048;

        const d = 50; 
        this.sunlight.shadow.camera.left = -d;
        this.sunlight.shadow.camera.right = d;
        this.sunlight.shadow.camera.top = d;
        this.sunlight.shadow.camera.bottom = -d;
        this.sunlight.shadow.camera.near = 1;
        this.sunlight.shadow.camera.far = 200;

        this.sunlight.shadow.bias = -0.0003;
        this.sunlight.shadow.normalBias = 0.02;

        this.scene.add(this.sunlight);
        this.scene.add(this.sunlight.target);
    }

    updateLightPosition(targetPosition) {
        if (!this.sunlight || !targetPosition) return;
        
        this.sunlight.position.set(
            targetPosition.x + 55,
            targetPosition.y + 30, 
            targetPosition.z + 35
        );
        this.sunlight.target.position.copy(targetPosition);
        this.sunlight.target.updateMatrixWorld();
    }

    update(dt) {}

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}