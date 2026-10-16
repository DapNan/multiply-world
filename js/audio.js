import * as THREE from 'three';

export class AudioManager {
    constructor() {
        this.listener = null;
        this.soundBGM = null;
        this.soundBird = null;
        this.soundSteps = null;
        this.audioLoader = new THREE.AudioLoader();
    }

    init(camera) {
        if (!camera) return;
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);

        this.loadAudioFiles();
    }

    loadAudioFiles() {
        // 1. Backsound
        this.soundBGM = new THREE.Audio(this.listener);
        this.audioLoader.load('./assets/backsound.mp3', (buffer) => {
            this.soundBGM.setBuffer(buffer);
            this.soundBGM.setLoop(true);
            this.soundBGM.setVolume(0.3);
        }, undefined, (err) => console.warn("Missing backsound.mp3:", err));

        // 2. Suara Burung
        this.soundBird = new THREE.PositionalAudio(this.listener);
        this.audioLoader.load('./assets/bird.mp3', (buffer) => {
            this.soundBird.setBuffer(buffer);
            this.soundBird.setLoop(true);
            this.soundBird.setRefDistance(25);
            this.soundBird.setMaxDistance(100);
            this.soundBird.setVolume(1.0);
        }, undefined, (err) => console.warn("Missing bird.mp3:", err));

        // 3. Suara Langkah Kaki (Dibuat Looping Native)
        this.soundSteps = new THREE.Audio(this.listener);
        this.audioLoader.load('./assets/steps.mp3', (buffer) => {
            this.soundSteps.setBuffer(buffer);
            this.soundSteps.setLoop(true); // Memanfaatkan native WebAudio looping
            this.soundSteps.setVolume(0.8);
        }, undefined, (err) => console.warn("Missing steps.mp3:", err));
    }

    startBGM() {
        if (this.soundBGM && this.soundBGM.buffer && !this.soundBGM.isPlaying) {
            this.soundBGM.play();
        }
        if (this.soundBird && this.soundBird.buffer && !this.soundBird.isPlaying) {
            this.soundBird.play();
        }
    }

    stopBGM() {
        if (this.soundBGM && this.soundBGM.isPlaying) this.soundBGM.stop();
        if (this.soundBird && this.soundBird.isPlaying) this.soundBird.stop();
    }

    attachBirdAudio(birdMesh) {
        if (this.soundBird && birdMesh) {
            birdMesh.add(this.soundBird);
        }
    }

    /**
     * Memutar langkah kaki tanpa ada jeda/patahan
     */
    startFootsteps(speed = 5) {
        if (!this.soundSteps || !this.soundSteps.buffer) return;

        // Jika suara belum berjalan, mulai putar
        if (!this.soundSteps.isPlaying) {
            this.soundSteps.play();
        }

        // Adjust tempo langkah (berjalan vs berlari)
        const targetRate = speed > 7 ? 1.35 : 1.0;
        if (this.soundSteps.getPlaybackRate() !== targetRate) {
            this.soundSteps.setPlaybackRate(targetRate);
        }
    }

    /**
     * Menghentikan langkah kaki secara instan saat karakter berhenti
     */
    stopFootsteps() {
        if (this.soundSteps && this.soundSteps.isPlaying) {
            this.soundSteps.pause(); // Gunakan pause agar posisi buffer tetap terjaga
        }
    }
    /**
     * Menyalakan / mematikan seluruh audio master
     * @returns {boolean} Status mute saat ini
     */
    toggleMute() {
        if (!this.listener) return false;

        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            this.listener.setMasterVolume(0); // Matikan semua suara
        } else {
            this.listener.setMasterVolume(1); // Nyalakan kembali semua suara
        }

        return this.isMuted;
    }
}