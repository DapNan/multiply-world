// ```javascript
import * as THREE from 'three';

const container = document.getElementById('landing-world-container');

if (container) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#8bd5f5');
    scene.fog = new THREE.Fog('#8bd5f5', 15, 35);

    const camera = new THREE.PerspectiveCamera(
        38,
        1,
        0.1,
        100
    );

    camera.position.set(8, 7, 11);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);

    // Pencahayaan
    scene.add(new THREE.HemisphereLight('#e0f7ff', '#467c48', 2.1));

    const sunlight = new THREE.DirectionalLight('#fff3d1', 3.2);
    sunlight.position.set(5, 10, 7);
    sunlight.castShadow = true;
    scene.add(sunlight);

    // Grup pulau
    const island = new THREE.Group();
    scene.add(island);

    const grassMaterial = new THREE.MeshStandardMaterial({
        color: '#65c957',
        roughness: 0.95
    });

    const soilMaterial = new THREE.MeshStandardMaterial({
        color: '#98613e',
        roughness: 1
    });

    const stoneMaterial = new THREE.MeshStandardMaterial({
        color: '#8ba4b0',
        roughness: 0.9
    });

    // Dasar pulau berlapis
    const grass = new THREE.Mesh(
        new THREE.CylinderGeometry(4.3, 3.5, 0.65, 9),
        grassMaterial
    );

    grass.position.y = 0.8;
    grass.scale.z = 0.78;
    grass.castShadow = true;
    grass.receiveShadow = true;
    island.add(grass);

    const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(3.6, 2.2, 1.0, 9),
        soilMaterial
    );

    soil.position.y = 0.05;
    soil.scale.z = 0.78;
    soil.castShadow = true;
    island.add(soil);

    // Permukaan rumput
    const ground = new THREE.Mesh(
        new THREE.CylinderGeometry(4.28, 4.28, 0.08, 9),
        grassMaterial
    );

    ground.position.y = 1.14;
    ground.scale.z = 0.78;
    island.add(ground);

    // Bukit kecil
    function makeHill(x, z, scale, color) {
        const hill = new THREE.Mesh(
            new THREE.IcosahedronGeometry(1, 1),
            new THREE.MeshStandardMaterial({ color, roughness: 1 })
        );

        hill.position.set(x, 1.05, z);
        hill.scale.set(scale, scale * 0.7, scale * 0.8);
        hill.castShadow = true;
        island.add(hill);
    }

    makeHill(-2.7, -1.8, 1.1, '#70d66a');
    makeHill(2.7, -1.8, 0.8, '#49b96b');
    makeHill(-2.8, 1.4, 0.65, '#a3e66e');

    // Pohon low-poly
    function makeTree(x, z, scale = 1) {
        const tree = new THREE.Group();
        tree.position.set(x, 1.15, z);
        tree.scale.setScalar(scale);

        const trunk = new THREE.Mesh(
            new THREE.CylinderGeometry(0.13, 0.2, 0.8, 6),
            new THREE.MeshStandardMaterial({ color: '#87502e' })
        );

        trunk.position.y = 0.4;
        trunk.castShadow = true;
        tree.add(trunk);

        const colors = ['#238b57', '#2fa968', '#48c774'];

        for (let i = 0; i < 3; i++) {
            const leaves = new THREE.Mesh(
                new THREE.IcosahedronGeometry(0.58, 1),
                new THREE.MeshStandardMaterial({
                    color: colors[i],
                    roughness: 0.85
                })
            );

            leaves.position.set(
                (i % 2) * 0.12,
                0.85 + i * 0.35,
                0
            );

            leaves.scale.set(
                1 - i * 0.12,
                0.95,
                1 - i * 0.12
            );

            leaves.castShadow = true;
            tree.add(leaves);
        }

        island.add(tree);
    }

    makeTree(-2.5, 0.1, 0.9);
    makeTree(2.5, 0.1, 0.8);
    makeTree(1.9, -2.0, 0.65);
    makeTree(-1.7, -2.1, 0.65);

    // Jalur batu
    for (let i = 0; i < 5; i++) {
        const stone = new THREE.Mesh(
            new THREE.BoxGeometry(0.48, 0.08, 0.38),
            stoneMaterial
        );

        stone.position.set(
            0.1 + i * 0.23,
            1.22,
            2.5 - i * 0.65
        );

        stone.rotation.y = 0.2;
        stone.receiveShadow = true;
        island.add(stone);
    }

    // Pilar misi bercahaya
    const beacon = new THREE.Group();
    beacon.position.set(0.4, 1.2, -0.2);
    island.add(beacon);

    const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.2, 1.45, 6),
        new THREE.MeshStandardMaterial({
            color: '#facc15',
            emissive: '#f59e0b',
            emissiveIntensity: 1.5,
            roughness: 0.35
        })
    );

    pillar.position.y = 0.75;
    pillar.castShadow = true;
    beacon.add(pillar);

    const beaconLight = new THREE.PointLight('#fde047', 4, 5);
    beaconLight.position.y = 1.4;
    beacon.add(beaconLight);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.045, 8, 32),
        new THREE.MeshStandardMaterial({
            color: '#fff2a8',
            emissive: '#facc15',
            emissiveIntensity: 1.5
        })
    );

    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.3;
    beacon.add(ring);

    // Koin emas
    const coins = [];

    for (let i = 0; i < 3; i++) {
        const coin = new THREE.Mesh(
            new THREE.CylinderGeometry(0.23, 0.23, 0.09, 24),
            new THREE.MeshStandardMaterial({
                color: '#facc15',
                metalness: 0.55,
                roughness: 0.25,
                emissive: '#a16207',
                emissiveIntensity: 0.3
            })
        );

        coin.rotation.x = Math.PI / 2;
        coin.position.set(
            -1.5 + i * 1.4,
            1.8 + (i % 2) * 0.35,
            0.5
        );

        island.add(coin);
        coins.push(coin);
    }

    // Awan dekoratif
    const clouds = [];

    function makeCloud(x, y, z, scale) {
        const cloud = new THREE.Group();
        cloud.position.set(x, y, z);
        cloud.scale.setScalar(scale);

        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            roughness: 1
        });

        [
            [-0.45, 0, 0],
            [0, 0.18, 0],
            [0.4, 0.02, 0]
        ].forEach(([cx, cy, cz]) => {
            const puff = new THREE.Mesh(
                new THREE.IcosahedronGeometry(0.4, 1),
                cloudMaterial
            );

            puff.position.set(cx, cy, cz);
            cloud.add(puff);
        });

        scene.add(cloud);
        clouds.push(cloud);
    }

    makeCloud(-5, 3.7, -2, 1.0);
    makeCloud(5, 4.3, -3, 0.75);
    makeCloud(-4, 2.8, 3, 0.65);

    // Bintang dekoratif
    const stars = [];

    for (let i = 0; i < 12; i++) {
        const star = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.09),
            new THREE.MeshBasicMaterial({ color: '#fff0a3' })
        );

        star.position.set(
            Math.sin(i * 2.4) * 4.6,
            1.8 + (i % 4) * 0.45,
            Math.cos(i * 1.7) * 3.5
        );

        scene.add(star);
        stars.push(star);
    }

    // Ukuran renderer mengikuti area landing
    function resize() {
        const width = container.clientWidth;
        const height = container.clientHeight;

        if (!width || !height) return;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height, false);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    // Animasi ringan
    const clock = new THREE.Clock();

    renderer.setAnimationLoop(() => {
        const t = clock.getElapsedTime();

        island.rotation.y = Math.sin(t * 0.22) * 0.09;
        island.position.y = Math.sin(t * 0.8) * 0.08;

        beacon.rotation.y = t * 0.55;
        ring.rotation.z = t * 0.8;

        coins.forEach((coin, i) => {
            coin.position.y =
                1.8 + (i % 2) * 0.35 +
                Math.sin(t * 2 + i) * 0.12;

            coin.rotation.y = t * 1.5 + i;
        });

        clouds.forEach((cloud, i) => {
            cloud.position.x += Math.sin(t * 0.15 + i) * 0.001;
        });

        stars.forEach((star, i) => {
            star.position.y =
                2 + (i % 4) * 0.45 +
                Math.sin(t * 1.5 + i) * 0.08;
        });

        renderer.render(scene, camera);
    });
}
