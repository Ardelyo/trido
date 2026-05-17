// utils/sounds.ts
class SoundManager {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.activeOscillators = new Set();
        this.thinkingOsc = null;
        this.thinkingGain = null;
    }
    initContext() {
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }
    play(name) {
        if (!this.enabled)
            return;
        this.initContext();
        const ctx = this.context;
        switch (name) {
            case 'mic_on':
                this.playTone(440, 0.1, 'sine', 0.1);
                this.playTone(880, 0.1, 'sine', 0.1, 0.1);
                break;
            case 'mic_off':
                this.playTone(880, 0.1, 'sine', 0.1);
                this.playTone(440, 0.1, 'sine', 0.1, 0.1);
                break;
            case 'success':
                this.playTone(523.25, 0.1, 'sine', 0.1); // C5
                this.playTone(659.25, 0.1, 'sine', 0.1, 0.1); // E5
                this.playTone(783.99, 0.2, 'sine', 0.1, 0.2); // G5
                break;
            case 'pop':
                this.playTone(600, 0.05, 'sine', 0.1);
                break;
            case 'thinking':
                this.startThinking();
                break;
        }
    }
    playTone(freq, duration, type, volume, delay = 0) {
        const ctx = this.context;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
    }
    startThinking() {
        if (this.thinkingOsc)
            return;
        const ctx = this.context;
        this.thinkingOsc = ctx.createOscillator();
        this.thinkingGain = ctx.createGain();
        this.thinkingOsc.type = 'sine';
        this.thinkingOsc.frequency.setValueAtTime(110, ctx.currentTime); // Low hum
        // Add subtle frequency modulation
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 2;
        lfoGain.gain.value = 5;
        lfo.connect(lfoGain);
        lfoGain.connect(this.thinkingOsc.frequency);
        lfo.start();
        this.thinkingGain.gain.setValueAtTime(0, ctx.currentTime);
        this.thinkingGain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.5);
        this.thinkingOsc.connect(this.thinkingGain);
        this.thinkingGain.connect(ctx.destination);
        this.thinkingOsc.start();
    }
    stop(name) {
        if (name === 'thinking' && this.thinkingOsc) {
            const ctx = this.context;
            this.thinkingGain?.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
            setTimeout(() => {
                this.thinkingOsc?.stop();
                this.thinkingOsc = null;
                this.thinkingGain = null;
            }, 600);
        }
    }
    toggle(enabled) {
        this.enabled = enabled;
    }
}
export const sounds = new SoundManager();
