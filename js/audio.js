export class AudioManager {
    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.isStepPlaying = false;
        this.stepInterval = null;
    }

    resume() {
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    }

    startBGM() {
        this.resume();
        const notes = [261.63, 329.63, 392.00, 523.25];
        let noteIndex = 0;

        setInterval(() => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(notes[noteIndex], this.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.2);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 1.2);
            noteIndex = (noteIndex + 1) % notes.length;
        }, 1600);
    }

    startFootsteps(speed) {
        if (this.isStepPlaying) return;
        this.isStepPlaying = true;
        this.stepInterval = setInterval(() => this.playStep(), speed > 5 ? 260 : 400);
    }

    stopFootsteps() {
        this.isStepPlaying = false;
        if (this.stepInterval) {
            clearInterval(this.stepInterval);
            this.stepInterval = null;
        }
    }

    playStep() {
        this.resume();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.08);
    }
}