import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { World3D } from './world3d.js';
import { AudioManager } from './audio.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

// Inisialisasi Modul World & Audio
const world = new World3D('game-container');
const audio = new AudioManager();

// Elemen UI
const startBtn = document.getElementById('start-btn');
const landingScreen = document.getElementById('landing-screen');
const statusElement = document.getElementById('status');
const scoreValEl = document.getElementById('score-val');
const missionDistEl = document.getElementById('mission-dist');

const playerLevelEl = document.getElementById('player-level');
const xpTextEl = document.getElementById('xp-text');
const xpBarFillEl = document.getElementById('xp-bar-fill');
const hudMissionNameEl = document.getElementById('hud-mission-name');

// CEK SANGAT AWAL: Sembunyikan landing screen langsung jika kembali dari perkalian.html
// CEK SANGAT AWAL: Sembunyikan landing screen & ubah teks transisi jika kembali dari perkalian.html
// CEK SANGAT AWAL: Set teks & aktifkan overlay sebelum HTML selesai di-render
// CEK SANGAT AWAL: Sembunyikan landing screen, banner paman sam, dan petunjuk jika kembali dari perkalian.html
// CEK SANGAT AWAL: Sembunyikan landing screen & ubah teks transisi sesuai misi yang dikunjungi
if (localStorage.getItem('multiply_from_mission') === 'true') {
    if (landingScreen) {
        landingScreen.style.display = 'none';
    }

    // Sembunyikan banner cerita & modal kontrol
    const storyBanner = document.getElementById('story-banner');
    if (storyBanner) {
        storyBanner.style.display = 'none';
    }
    const controlsModalOverlay = document.getElementById('controls-modal-overlay');
    if (controlsModalOverlay) {
        controlsModalOverlay.classList.add('hidden');
    }

    const transitionOverlay = document.getElementById('world-transition-overlay');
    if (transitionOverlay) {
        const transitionText = transitionOverlay.querySelector('h3') || document.getElementById('transition-title');
        if (transitionText) {
            // Dapatkan nama lokasi misi terakhir (default ke Kebun jika tidak ada)
            const missionName = localStorage.getItem('last_visited_mission_name') || 'Kebun Perkalian... 🌾';
            transitionText.textContent = 'Kembali dari ' + missionName;
        }
        transitionOverlay.classList.add('active');
    }
}
// KONTROL SENTUH UNTUK HP
let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 0) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    
    const diffX = touchX - touchStartX;
    const diffY = touchY - touchStartY;
    
    keys.w = keys.s = keys.a = keys.d = false;

    if (Math.abs(diffY) > 20) {
        if (diffY < 0) keys.w = true;
        else keys.s = true;
    }
    if (Math.abs(diffX) > 20) {
        if (diffX < 0) keys.a = true;
        else keys.d = true;
    }
}, { passive: true });

window.addEventListener('touchend', () => {
    keys.w = keys.s = keys.a = keys.d = false;
});

// ========================================
// 1. SISTEM POIN, XP, DAN PROGRES (LOCALSTORAGE)
// ========================================
let playerScore = 0;
let playerXP = 0;
let isQuizActive = false;
let isReturningFromMission = false;

function updateAdventureXP(totalXP) {
    const xpPerLevel = 100;
    const xp = Math.max(0, Number(totalXP) || 0);

    const level = Math.floor(xp / xpPerLevel) + 1;
    const currentXP = xp % xpPerLevel;
    const progress = (currentXP / xpPerLevel) * 100;

    if (playerLevelEl) playerLevelEl.textContent = level;
    if (xpTextEl) xpTextEl.textContent = `${currentXP} / ${xpPerLevel} XP`;
    if (xpBarFillEl) xpBarFillEl.style.width = `${progress}%`;
}
function checkCompletedMissions() {
    const multiplyStars = parseInt(localStorage.getItem('multiply_stars') || '0', 10);
    
    // Cek flag atau jika pemain sudah punya akumulasi bintang/koin
    const m1Done = localStorage.getItem('misi1_completed') === 'true' || multiplyStars >= 5;
    const m2Done = localStorage.getItem('misi2_completed') === 'true' || multiplyStars >= 10;

    const elM1 = document.getElementById('status-misi-1');
    const elM2 = document.getElementById('status-misi-2');

    if (elM1) {
        const badge1 = elM1.querySelector('.misi-badge');
        if (m1Done && badge1) {
            badge1.textContent = '✅ Selesai!';
            badge1.style.color = '#22c55e';
        }
    }

    if (elM2) {
        const badge2 = elM2.querySelector('.misi-badge');
        if (m2Done && badge2) {
            badge2.textContent = '✅ Selesai!';
            badge2.style.color = '#22c55e';
        }
    }

    if (m1Done && m2Done && hudMissionNameEl) {
        hudMissionNameEl.textContent = '🎉 Semua Misi Selesai!';
    }
}
function loadSavedProgressAndPosition() {
    const isFromMission = localStorage.getItem('multiply_from_mission') === 'true';

    if (isFromMission) {
        // === JIKA KEMBALI DARI MISI: MUAT PROGRES & STATUS ===
        const savedStars = localStorage.getItem('multiply_stars');
        const savedXP = localStorage.getItem('multiply_xp');

        if (savedStars !== null) {
            playerScore = parseInt(savedStars, 10);
            if (scoreValEl) scoreValEl.textContent = playerScore;
        }

        if (savedXP !== null) {
            playerXP = parseInt(savedXP, 10);
            updateAdventureXP(playerXP);
        }

        // Ambil posisi koordinat terakhir sebelum masuk portal
        const savedX = localStorage.getItem('multiply_player_x');
        const savedY = localStorage.getItem('multiply_player_y');
        const savedZ = localStorage.getItem('multiply_player_z');

        if (savedX !== null && savedY !== null && savedZ !== null) {
            player.position.set(parseFloat(savedX), parseFloat(savedY), parseFloat(savedZ));
            isReturningFromMission = true;
        }

        removeDroppedApples();
        // Hapus flag transisi setelah berhasil dimuat
        localStorage.removeItem('multiply_from_mission');

        // Update indikator status misi yang sudah selesai
        checkCompletedMissions();

    } else {
        // === JIKA DI-REFRESH / DIBUKA BARU: RESET TOTAL DARI 0 ===
        playerScore = 0;
        playerXP = 0;
        if (scoreValEl) scoreValEl.textContent = 0;
        updateAdventureXP(0);

        player.position.set(0, 0.1, 15);

        // Hapus semua data simpanan agar ulang dari awal
        localStorage.removeItem('multiply_stars');
        localStorage.removeItem('multiply_xp');
        localStorage.removeItem('multiply_player_x');
        localStorage.removeItem('multiply_player_y');
        localStorage.removeItem('multiply_player_z');
        localStorage.removeItem('multiply_from_mission');
        localStorage.removeItem('misi1_completed');
        localStorage.removeItem('misi2_completed');

        isReturningFromMission = false;

        // Reset tampilan badge di HUD ke "Belum Selesai"
        const badge1 = document.querySelector('#status-misi-1 .misi-badge');
        const badge2 = document.querySelector('#status-misi-2 .misi-badge');
        if (badge1) { badge1.textContent = 'Belum Selesai'; badge1.style.color = '#f59e0b'; }
        if (badge2) { badge2.textContent = 'Belum Selesai'; badge2.style.color = '#f59e0b'; }
        if (hudMissionNameEl) hudMissionNameEl.textContent = 'Kebun & Pasar Perkalian';
    }
}

function updateHUDStatus(message) {
    if (!statusElement) return;
    let dot = statusElement.querySelector('.hud-status-dot');
    if (!dot) {
        dot = document.createElement('span');
        dot.className = 'hud-status-dot';
    }
    statusElement.replaceChildren(dot, document.createTextNode(' ' + message));
}

if (hudMissionNameEl) {
    hudMissionNameEl.textContent = 'Kebun Perkalian';
}
// =========================================================
// DEKLARASI DEPO PORTAL MISI 1 (KEBUN PERKALIAN)
// =========================================================
const missionGroup = new THREE.Group();
missionGroup.position.set(-10.4, 0.1, 69.7);
world.scene.add(missionGroup);

let portalModel = null;
function createMissionPortal() {
    gltfLoader.load('./assets/portal.glb', (gltf) => {
        portalModel = gltf.scene;
        
        // 1. Skala portal diperbesar agar pasti kelihatan
        portalModel.scale.setScalar(1.5); 
        portalModel.position.set(0, 0.5, 0);

        // 2. Perbaiki material agar tetap terang & memancarkan cahaya
        portalModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.side = THREE.DoubleSide; // Render luar dalam
                }
            }
        });

        // 3. Cahaya neon biru di dalam portal
        const portalLight = new THREE.PointLight(0x38bdf8, 8, 15);
        portalLight.position.set(0, 3, 0);
        portalModel.add(portalLight);

        missionGroup.add(portalModel);
        console.log('✅ Model Portal GLB berhasil ditampilkan!');
    }, undefined, (error) => {
        console.warn('⚠️ File portal.glb belum ditemukan di folder assets. Menggunakan Pilar Cadangan.', error);
        
        // PILAR CADANGAN (Jika file GLB belum ada/gagal load)
        const fallbackGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 16);
        const fallbackMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6, wireframe: true });
        const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
        fallbackMesh.position.y = 4;
        missionGroup.add(fallbackMesh);
    });

    createPillarSign();
}
function createPillarSign() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    // Background Kapsul Biru Minimalis
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(20, 10, 216, 60, 30);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Teks MISI 1
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MISI 1 🎯', 128, 50);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(5, 1.8, 1);
    sprite.position.set(0, 8, 0); // Melayang rapi di atas gerbang portal

    missionGroup.add(sprite);
}
createPillarSign();


// Navigasi ke Kebun (Misi 1)
function openMission1() {
    if (isQuizActive) return;
    isQuizActive = true;

    localStorage.setItem('multiply_player_x', player.position.x);
    localStorage.setItem('multiply_player_y', player.position.y);
    localStorage.setItem('multiply_player_z', player.position.z - 5);
    localStorage.setItem('multiply_from_mission', 'true');
    
    // TAMBAHKAN BARIS INI: Simpan nama misi yang dikunjungi
    localStorage.setItem('last_visited_mission_name', 'Kebun Perkalian... 🌾');

    const overlay = document.getElementById('world-transition-overlay');
    if (overlay) {
        const transitionText = overlay.querySelector('h3') || document.getElementById('transition-title');
        if (transitionText) {
            transitionText.textContent = 'Memasuki Kebun Perkalian... 🍎';
        }
        overlay.classList.add('active');
    }

    setTimeout(() => {
        window.location.href = 'perkalian.html';
    }, 600);
}

// Navigasi ke Pasar (Misi 2)
function openMission2() {
    if (isQuizActive) return;
    isQuizActive = true;

    localStorage.setItem('multiply_player_x', player.position.x);
    localStorage.setItem('multiply_player_y', player.position.y);
    localStorage.setItem('multiply_player_z', player.position.z - 5);
    localStorage.setItem('multiply_from_mission', 'true');

    // TAMBAHKAN BARIS INI: Simpan nama misi yang dikunjungi
    localStorage.setItem('last_visited_mission_name', 'Pasar Perkalian... 🛍️');

    const overlay = document.getElementById('world-transition-overlay');
    if (overlay) {
        const transitionText = overlay.querySelector('h3') || document.getElementById('transition-title');
        if (transitionText) {
            transitionText.textContent = 'Memasuki Pasar Perkalian... 🍎';
        }
        overlay.classList.add('active');
    }

    setTimeout(() => {
        window.location.href = 'pasar.html';
    }, 600);
}

// =========================================================
// DEKLARASI DEPO PORTAL MISI 2 (PASAR PERKALIAN)
// =========================================================
const mission2Group = new THREE.Group();
mission2Group.position.set(-96.8, -0.6, 111.9); // Berada di sebelah kanan Misi 1
world.scene.add(mission2Group);

function createMission2Portal() {
    gltfLoader.load('./assets/portal.glb', (gltf) => {
        const portal2Model = gltf.scene.clone();
        portal2Model.scale.setScalar(1.5);
        portal2Model.position.set(0, 0.5, 0);

        portal2Model.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.side = THREE.DoubleSide;
            }
        });

        // Cahaya neon oranye/kuning untuk Misi Pasar
        const portalLight = new THREE.PointLight(0xf59e0b, 8, 15);
        portalLight.position.set(0, 3, 0);
        portal2Model.add(portalLight);

        mission2Group.add(portal2Model);
    }, undefined, () => {
        // Fallback Pilar Oranye
        const fallbackGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 16);
        const fallbackMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.6, wireframe: true });
        const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
        fallbackMesh.position.y = 4;
        mission2Group.add(fallbackMesh);
    });

    createPillar2Sign();
}

function createPillar2Sign() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#d97706'; // Warna Oranye Pasar
    ctx.beginPath();
    ctx.roundRect(20, 10, 216, 60, 30);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MISI 2 🛍️', 128, 50);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(5, 1.8, 1);
    sprite.position.set(0, 8, 0);

    mission2Group.add(sprite);
}

// ========================================
// 2. LOAD KARAKTER & MAP 3D
// ========================================
const player = new THREE.Group();
world.scene.add(player);
player.position.set(0, 0.1, 5);

let mapModel = null;
let characterModel = null;
let mixer = null;

const actions = { idle: null, walk: null, jump: null };
let currentAction = null;
let isMoving = false;
let isRunning = false;
let isJumping = false;

let verticalVelocity = 0;
const GRAVITY = 22;
const JUMP_FORCE = 8;
let currentGroundY = 0;

const raycaster = new THREE.Raycaster();
const rayOrigin = new THREE.Vector3();
const rayDirection = new THREE.Vector3(0, -1, 0);

const gltfLoader = new GLTFLoader();
const fbxLoader = new FBXLoader();
// Array untuk menyimpan mesh/model apel tercecer
const droppedApples = [];
// Array untuk menampung data burung
const activeBirds = [];



function loadAnimatedBirds() {
    gltfLoader.load('./assets/bird.glb', (gltf) => {
        const birdModel = gltf.scene;
        const animations = gltf.animations;

        // Tentukan lintasan terbang di sekitar spawn player (0, 0, 15)
        const birdRoutes = [
            { centerX: 0,   centerZ: 15, radius: 20, height: 16, speed: 1.0, scale: 2.0 },
            { centerX: -10, centerZ: 25, radius: 25, height: 18, speed: 0.8, scale: 2.2 },
            { centerX: 10,  centerZ: 10, radius: 18, height: 15, speed: 1.2, scale: 1.8 }
        ];

        birdRoutes.forEach((route, index) => {
            const bird = SkeletonUtils.clone(birdModel);
            
            // Perbesar sementara ukurannya (scale: 2.0) agar mudah terlihat di layar
            bird.scale.setScalar(route.scale);

            world.scene.add(bird);
// Tempelkan & putar audio burung pada burung pertama
            if (index === 0 && audio && typeof audio.attachBirdAudio === 'function') {
                audio.attachBirdAudio(bird);
            }
            // Mixer Animasi Kepakan Sayap
            let birdMixer = null;
            if (animations && animations.length > 0) {
                birdMixer = new THREE.AnimationMixer(bird);
                const flyAction = birdMixer.clipAction(animations[0]);
                flyAction.startAt(Math.random() * 2);
                flyAction.play();
            }

            activeBirds.push({
                mesh: bird,
                mixer: birdMixer,
                route: route,
                angle: index * (Math.PI / 2)
            });
        });

        console.log('Burung berhasil dimuat & ditambahkan ke scene!');
    }, undefined, (error) => {
        console.error('Gagal load bird.glb:', error);
    });
}

function updateBirds(dt) {
    activeBirds.forEach((birdObj) => {
        // 1. Update animasi kepak sayap
        if (birdObj.mixer) {
            birdObj.mixer.update(dt);
        }

        // 2. Tambah sudut putaran
        birdObj.angle += birdObj.route.speed * dt * 0.4;

        // 3. Hitung posisi melingkar di sekitar player
        const x = birdObj.route.centerX + Math.cos(birdObj.angle) * birdObj.route.radius;
        const z = birdObj.route.centerZ + Math.sin(birdObj.angle) * birdObj.route.radius;

        birdObj.mesh.position.set(x, birdObj.route.height, z);

        // 4. Arahkan burung ke titik lintasan berikutnya
        const nextX = birdObj.route.centerX + Math.cos(birdObj.angle + 0.1) * birdObj.route.radius;
        const nextZ = birdObj.route.centerZ + Math.sin(birdObj.angle + 0.1) * birdObj.route.radius;
        
        // Buat burung menghadap ke arah terbang
        birdObj.mesh.lookAt(nextX, birdObj.route.height, nextZ);

        // =========================================================================
        // KOREKSI ORIENTASI (PILIH SALAH SATU JIKA POSISI BURUNG MASIH ANEH):
        // Jika burung terbalik (perut di atas), aktifkan SATU baris di bawah ini:
        // =========================================================================
        // birdObj.mesh.rotateY(Math.PI); // Jika burung terbang mundur (pantat di depan)
        // birdObj.mesh.rotateZ(Math.PI); // Jika burung terbalik (kepala di bawah)
        // birdObj.mesh.rotateX(Math.PI); // Jika burung terbang menukik tajam
    });
}
// ========================================
// EFEK PARTIKEL DAUN MELAYANG
// ========================================
let leafParticles = null;

function createLeafParticles() {
    const particleCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 80;     // Sebaran X
        positions[i + 1] = Math.random() * 15 + 1;      // Sebaran Y (ketinggian)
        positions[i + 2] = (Math.random() - 0.5) * 80;   // Sebaran Z
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Tekstur/Warna partikel hijau daun/keemasan
    const material = new THREE.PointsMaterial({
        color: 0x86efac,
        size: 0.4,
        transparent: true,
        opacity: 0.7
    });

    leafParticles = new THREE.Points(geometry, material);
    world.scene.add(leafParticles);
}

function updateLeafParticles(dt) {
    if (!leafParticles) return;
    const positions = leafParticles.geometry.attributes.position.array;

    for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= dt * 1.5; // Turun perlahan seperti daun berguguran

        // Jika sampai tanah, kembalikan ke atas
        if (positions[i] < 0.2) {
            positions[i] = 15;
        }
    }
    leafParticles.geometry.attributes.position.needsUpdate = true;
}
function createDroppedApples() {
    gltfLoader.load('./assets/apple.glb', (gltf) => {
        const appleModel = gltf.scene;

        // Skala diperkecil drastis menjadi 0.005 - 0.008
        const applePath = [
            { x: 0,    z: 25, scale: 0.006 },
            { x: -2,   z: 35, scale: 0.008 },
            { x: -5,   z: 45, scale: 0.005 },
            { x: -8,   z: 55, scale: 0.007 },
            { x: -10,  z: 62, scale: 0.008 }
        ];

        applePath.forEach(pos => {
            const apple = SkeletonUtils.clone(appleModel);
            
            // Posisikan sedikit di atas jalan (y = 0.1 atau 0.2 agar tidak melayang / tenggelam)
            apple.position.set(pos.x, 0.1, pos.z);
            apple.scale.setScalar(pos.scale);
            
            // Variasi rotasi alami
            apple.rotation.y = Math.random() * Math.PI;
            apple.rotation.z = Math.PI / 8; 

            world.scene.add(apple);
            droppedApples.push(apple);
        });

        // Sembunyikan jika misi sudah pernah diselesaikan
        if (localStorage.getItem('multiply_stars') !== null && parseInt(localStorage.getItem('multiply_stars'), 10) > 0) {
            removeDroppedApples();
        }

    }, undefined, (error) => {
        console.warn('File apple.glb belum ada di folder assets:', error);
    });
}
function removeDroppedApples() {
    droppedApples.forEach(apple => {
        world.scene.remove(apple);
    });
    droppedApples.length = 0; // Kosongkan array
}

function loadFBX(path) {
    return new Promise((resolve, reject) => fbxLoader.load(path, resolve, undefined, reject));
}

function prepareMaterials(root) {
    root.traverse((object) => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach(m => { 
                if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                m.roughness = 0.7;
                m.metalness = 0.1;
            });
        }
    });
}
// Elemen Modal Petunjuk
const controlsModalOverlay = document.getElementById('controls-modal-overlay');
const closeControlsBtn = document.getElementById('close-controls-btn');

function showControlsModal() {
    if (controlsModalOverlay) {
        controlsModalOverlay.classList.remove('hidden');
    }
}

if (closeControlsBtn) {
    closeControlsBtn.addEventListener('click', () => {
        if (controlsModalOverlay) {
            controlsModalOverlay.classList.add('hidden');
        }
    });
}
function startGameDirectly() {
    document.body.classList.add('game-started');
    if (world.renderer && world.renderer.domElement) {
        world.renderer.domElement.style.filter = 'none';
        world.renderer.domElement.style.transform = 'none';
    }
    if (landingScreen) {
        landingScreen.style.display = 'none';
    }
    document.querySelectorAll('.hidden-game-ui').forEach(el => {
        el.style.opacity = '1';
    });

    // CEK APAKAH PEMAIN BARU KEMBALI DARI MISI PERKALIAN
    // Jika BUKAN kembali dari misi (berarti game baru dimulai), tampilkan banner & petunjuk
    if (!isReturningFromMission) {
        // Tampilkan Banner Paman Sam
        const storyBanner = document.getElementById('story-banner');
        if (storyBanner) {
            storyBanner.style.display = 'flex';
        }

        // Tampilkan Modal Petunjuk Kontrol
        if (typeof showControlsModal === 'function') {
            showControlsModal();
        }
    } else {
        // Jika KEMBALI dari misi, pastikan banner & modal tetap tersembunyi
        const storyBanner = document.getElementById('story-banner');
        if (storyBanner) {
            storyBanner.style.display = 'none';
        }
        if (controlsModalOverlay) {
            controlsModalOverlay.classList.add('hidden');
        }
    }

    if (audio && typeof audio.startBGM === 'function') {
        audio.startBGM();
    }
}

async function initWorldAssets() {
    try {
        // Menempelkan camera ke audio listener agar spatial audio berfungsi
        if (audio && typeof audio.init === 'function') {
            audio.init(world.camera);
        } else if (audio && audio.listener) {
            world.camera.add(audio.listener);
        }

        await new Promise((resolve, reject) => {
            gltfLoader.load('./assets/map.glb', (gltf) => {
                mapModel = gltf.scene;
                mapModel.scale.setScalar(1);
                mapModel.position.set(0, 0, 0);

                mapModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                world.scene.add(mapModel);
                resolve();
            }, undefined, reject);
        });

loadAnimatedBirds();
createMissionPortal();
createMission2Portal();
        characterModel = await loadFBX('./assets/character.fbx');
        characterModel.scale.setScalar(0.03);
        prepareMaterials(characterModel);
        player.add(characterModel);

        // Pulihkan posisi & data progres
        loadSavedProgressAndPosition();

        mixer = new THREE.AnimationMixer(characterModel);

        const [idleFBX, walkFBX, jumpFBX] = await Promise.all([
            loadFBX('./assets/idle.fbx'),
            loadFBX('./assets/walking.fbx'),
            loadFBX('./assets/jump.fbx')
        ]);

        if (idleFBX.animations.length) actions.idle = mixer.clipAction(idleFBX.animations[0]);
        if (walkFBX.animations.length) actions.walk = mixer.clipAction(walkFBX.animations[0]);
        if (jumpFBX.animations.length) {
            actions.jump = mixer.clipAction(jumpFBX.animations[0]);
            actions.jump.setLoop(THREE.LoopOnce, 1);
            actions.jump.clampWhenFinished = true;
        }

        playAnimation('idle');
        setupAnimationEvents();
        setupMobileControls();
// Panggil pembuatan partikel & apel tercecer
createLeafParticles();
createDroppedApples();

        if (startBtn) {
            startBtn.textContent = 'Mulai Petualangan 🚀';
            startBtn.disabled = false;
        }

        // JIKA PEMAIN KEMBALI DARI MISI 2D: SKIPI LANDING SCREEN DENGAN TRANSISI MULUS
        if (isReturningFromMission) {
            startGameDirectly();
            const overlay = document.getElementById('world-transition-overlay');
            if (overlay) {
                setTimeout(() => {
                    overlay.classList.remove('active');
                }, 400);
            }
        }

    } catch (err) {
        console.error('Error memuat aset:', err);
        if (startBtn) startBtn.textContent = 'Gagal Memuat Aset';
    }
}

function setupMobileControls() {
    let startX = 0;
    let startY = 0;

    window.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!e.touches.length) return;
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;

        const deltaX = currentX - startX;
        const deltaY = currentY - startY;

        keys.w = keys.s = keys.a = keys.d = false;

        if (Math.abs(deltaY) > 15) {
            if (deltaY < 0) keys.w = true;
            else keys.s = true;
        }
        if (Math.abs(deltaX) > 15) {
            if (deltaX < 0) keys.a = true;
            else keys.d = true;
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        keys.w = keys.s = keys.a = keys.d = false;
    });
}

function playAnimation(name) {
    const nextAction = actions[name];
    if (!nextAction || (nextAction === currentAction && nextAction.isRunning())) return;

    nextAction.stopFading();
    nextAction.reset();
    nextAction.enabled = true;

    if (name === 'jump') {
        nextAction.setLoop(THREE.LoopOnce, 1);
        nextAction.clampWhenFinished = true;
    } else {
        nextAction.setLoop(THREE.LoopRepeat, Infinity);
    }

    nextAction.play();
    if (currentAction && currentAction !== nextAction) {
        nextAction.crossFadeFrom(currentAction, 0.2, true);
    }
    currentAction = nextAction;
}

function setupAnimationEvents() {
    if (!mixer) return;
    mixer.addEventListener('finished', (event) => {
        if (event.action !== actions.jump) return;
        isJumping = false;
        verticalVelocity = 0;
        playAnimation(isMoving ? 'walk' : 'idle');
    });
}

// ========================================
// 3. INPUT KONTROL (KEYBOARD & TOUCH)
// ========================================
const keys = {};

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift',' '].includes(key)) e.preventDefault();
    keys[key] = true;

    if (key === ' ' && !e.repeat && !isJumping && actions.jump) {
        isJumping = true;
        verticalVelocity = JUMP_FORCE;
        playAnimation('jump');
    }
});

window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

function bindTouchButton(elementId, keyName) {
    const btn = document.getElementById(elementId);
    if (!btn) return;
    const start = (e) => { e.preventDefault(); keys[keyName] = true; };
    const end = (e) => { e.preventDefault(); keys[keyName] = false; };
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', end, { passive: false });
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', end);
}

bindTouchButton('btn-up', 'w');
bindTouchButton('btn-down', 's');
bindTouchButton('btn-left', 'a');
bindTouchButton('btn-right', 'd');

const btnJump = document.getElementById('btn-jump');
if (btnJump) {
    const triggerJump = (e) => {
        e.preventDefault();
        if (!isJumping && actions.jump) {
            isJumping = true;
            verticalVelocity = JUMP_FORCE;
            playAnimation('jump');
        }
    };
    btnJump.addEventListener('touchstart', triggerJump, { passive: false });
    btnJump.addEventListener('mousedown', triggerJump);
}

const btnRun = document.getElementById('btn-run');
if (btnRun) {
    const toggleRun = (e) => {
        e.preventDefault();
        keys['shift'] = !keys['shift'];
        btnRun.classList.toggle('active', keys['shift']);
    };
    btnRun.addEventListener('touchstart', toggleRun, { passive: false });
    btnRun.addEventListener('click', toggleRun);
}

// Kontrol Kamera Orbit
let cameraYaw = 0;
let cameraPitch = 0.3;
let cameraDistance = 8;
let dragging = false;
let lastPointerX = 0, lastPointerY = 0;

world.renderer.domElement.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    world.renderer.domElement.setPointerCapture(e.pointerId);
});

world.renderer.domElement.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    cameraYaw -= (e.clientX - lastPointerX) * 0.005;
    cameraPitch = THREE.MathUtils.clamp(cameraPitch + (e.clientY - lastPointerY) * 0.003, -0.1, 1.2);
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
});

world.renderer.domElement.addEventListener('pointerup', () => dragging = false);
world.renderer.domElement.addEventListener('wheel', (e) => {
    cameraDistance = THREE.MathUtils.clamp(cameraDistance + e.deltaY * 0.01, 3, 25);
}, { passive: true });

// ========================================
// 4. LOGIKA PERGERAKAN & KAMERA
// ========================================
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const movement = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();

function updateGroundHeight() {
    if (!mapModel) return;
    rayOrigin.set(player.position.x, player.position.y + 10, player.position.z);
    raycaster.set(rayOrigin, rayDirection);
    const intersects = raycaster.intersectObject(mapModel, true);
    if (intersects.length > 0) {
        currentGroundY = intersects[0].point.y;
    }
}

function updatePlayer(dt) {
    const forwardInput = (keys['w'] || keys['arrowup'] ? 1 : 0) - (keys['s'] || keys['arrowdown'] ? 1 : 0);
    const sideInput = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);

    forward.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    right.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));

    movement.set(0, 0, 0);
    movement.addScaledVector(forward, forwardInput);
    movement.addScaledVector(right, sideInput);

    isMoving = movement.lengthSq() > 0;
    isRunning = isMoving && !!keys['shift'];

    if (isMoving) {
        movement.normalize();
        const speed = isRunning ? 10 : 5;
        player.position.x += movement.x * speed * dt;
        player.position.z += movement.z * speed * dt;

        const targetRotation = Math.atan2(movement.x, movement.z);
        const angleDiff = Math.atan2(
            Math.sin(targetRotation - player.rotation.y),
            Math.cos(targetRotation - player.rotation.y)
        );
        player.rotation.y += angleDiff * (1 - Math.exp(-12 * dt));

        if (!dragging) {
            if (sideInput !== 0) {
                cameraYaw -= sideInput * 1.5 * dt;
            } else if (forwardInput < 0) {
                const angleDiffCam = Math.atan2(
                    Math.sin(player.rotation.y - cameraYaw),
                    Math.cos(player.rotation.y - cameraYaw)
                );
                cameraYaw += angleDiffCam * (1 - Math.exp(-2.0 * dt));
            }
        }
    }

    updateGroundHeight();

    if (isJumping) {
        verticalVelocity -= GRAVITY * dt;
        player.position.y += verticalVelocity * dt;
        if (player.position.y <= currentGroundY) {
            player.position.y = currentGroundY;
            verticalVelocity = 0;
            isJumping = false;
        }
    } else {
        player.position.y = THREE.MathUtils.lerp(player.position.y, currentGroundY, 0.2);
    }

    if (isJumping) {
        updateHUDStatus('Melompat!');
        if (audio && typeof audio.stopFootsteps === 'function') audio.stopFootsteps();
    } else if (isMoving) {
        playAnimation('walk');
        if (actions.walk) actions.walk.setEffectiveTimeScale(isRunning ? 1.6 : 1.1);
        updateHUDStatus(isRunning ? 'Berlari' : 'Berjalan');
        if (audio && typeof audio.startFootsteps === 'function') audio.startFootsteps(isRunning ? 10 : 5);
    } else {
        playAnimation('idle');
        updateHUDStatus('Diam (Idle)');
        if (audio && typeof audio.stopFootsteps === 'function') audio.stopFootsteps();
    }

    // PEMICU MISI 1 -> DENGAN TRANSISI HALUS
   // Pemicu Misi 1 saat mendekati pilar
  // PEMICU MISI 1 -> DENGAN TRANSISI HALUS
    // PEMICU DAN INDIKATOR JARAK MISI
if (typeof missionGroup !== 'undefined' && typeof mission2Group !== 'undefined') {
    const distM1 = player.position.distanceTo(missionGroup.position);
    const distM2 = player.position.distanceTo(mission2Group.position);

    // Cek status penyelesaian dari localStorage
    const m1Done = localStorage.getItem('misi1_completed') === 'true';
    const m2Done = localStorage.getItem('misi2_completed') === 'true';

    // 1. Tentukan Misi mana yang sedang aktif untuk indikator jarak
    let targetDist = distM1;
    let activeMissionName = 'Kebun Perkalian';

    if (!m1Done) {
        // Misi 1 belum selesai -> Target jarak ke Misi 1
        targetDist = distM1;
        activeMissionName = 'Kebun Perkalian';
    } else if (!m2Done) {
        // Misi 1 sudah selesai, Misi 2 belum -> Target jarak otomatis pindah ke Misi 2
        targetDist = distM2;
        activeMissionName = 'Pasar Perkalian';
    } else {
        // Kedua Misi sudah selesai -> Ambil jarak ke portal terdekat
        targetDist = Math.min(distM1, distM2);
        activeMissionName = 'Semua Misi Selesai 🎉';
    }

    // Update Teks Nama Misi & Jarak di HUD
    if (hudMissionNameEl) {
        hudMissionNameEl.textContent = activeMissionName;
    }
    if (missionDistEl) {
        missionDistEl.textContent = Math.round(targetDist);
    }

    // 2. Pemicu otomatis saat mendekati portal (< 3.5 meter)
    if (distM1 < 3.5 && !isQuizActive) {
        openMission1(); 
    }
    if (distM2 < 3.5 && !isQuizActive) {
        openMission2();
    }
}

}

// Camera Breathing Effect
let cameraBreathingTime = 0;

function updateCamera(dt) {
    cameraBreathingTime += dt * 1.5;
    
    const breathY = Math.sin(cameraBreathingTime) * 0.08; 
    const breathX = Math.cos(cameraBreathingTime * 0.5) * 0.04; 

    cameraTarget.set(
        player.position.x + breathX, 
        player.position.y + 1.2 + breathY, 
        player.position.z
    );

    const horizontalDistance = cameraDistance * Math.cos(cameraPitch);
    desiredCameraPosition.set(
        player.position.x + horizontalDistance * Math.sin(cameraYaw) + breathX,
        player.position.y + 1.2 + cameraDistance * Math.sin(cameraPitch) + breathY,
        player.position.z + horizontalDistance * Math.cos(cameraYaw)
    );

    world.camera.position.lerp(desiredCameraPosition, 1 - Math.exp(-8 * dt));
    world.camera.lookAt(cameraTarget);
}

// Start Game Event (Awal Pertama Kali)
if (startBtn) {
    startBtn.addEventListener('click', startGameDirectly);
}

// Game Loop Utama
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);

    updatePlayer(dt);
    if (mixer) mixer.update(dt);
    
    // UPDATE PERGERAKAN & ANIMASI BURUNG DI SINI
    updateBirds(dt);
// Update pergerakan partikel di setiap frame
updateLeafParticles(dt);
    updateCamera(dt);
    
    world.updateLightPosition(player.position);
    world.update(dt);

    world.renderer.render(world.scene, world.camera);
}

initWorldAssets();
animate();

// =========================================================
// EVENT KLIK MISI AKTIF -> TAMPILKAN MODAL PAMAN SAM
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    const missionTracker = document.getElementById('mission-tracker');
    const pamanSamModal = document.getElementById('paman-sam-modal');
    const closePamanSamBtn = document.getElementById('close-paman-sam-btn');

    // Buka Modal Dialog Paman Sam saat Misi Aktif diklik
    if (missionTracker) {
        missionTracker.addEventListener('click', () => {
            if (pamanSamModal) {
                pamanSamModal.classList.remove('hidden');
            }
        });
    }

    // Tutup Modal Dialog saat tombol diklik
    if (closePamanSamBtn) {
        closePamanSamBtn.addEventListener('click', () => {
            if (pamanSamModal) {
                pamanSamModal.classList.add('hidden');
            }
        });
    }

    // =========================================================
// KONTROL TOMBOL MUTE / UNMUTE AUDIO HUD
// =========================================================
// Kontrol Tombol Mute / Unmute Audio HUD
const audioToggleBtn = document.getElementById('audio-toggle-btn');
if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Mencegah klik tembus ke kontrol kamera 3D

        if (audio && typeof audio.toggleMute === 'function') {
            const isMuted = audio.toggleMute();
            audioToggleBtn.textContent = isMuted ? '🔇' : '🔊';
        }
    });
}
});
