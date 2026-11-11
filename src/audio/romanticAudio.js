// Romantic Audio Engine
// Plays the custom Sunflower Lo-Fi background track and Web Audio API interactive flower chimes & sparkles.

const BGM_PATH = `${import.meta.env.BASE_URL || '/'}audio/sunflower-lofi.mp3`;

class RomanticAudioEngine {
  constructor() {
    this.ctx = null;
    this.bgm = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.masterGain = null;
    this.sfxGain = null;
    this.fadeTimer = null;
    this.targetVolume = 0.55;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);
      }
    }

    if (!this.bgm) {
      const audio = new Audio(BGM_PATH);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0;
      audio.muted = this.isMuted;
      this.bgm = audio;
    }
  }

  fadeInBgm() {
    if (!this.bgm) return;
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }

    this.bgm.volume = 0;
    const step = 0.03;
    this.fadeTimer = setInterval(() => {
      if (!this.bgm || !this.isPlaying) {
        clearInterval(this.fadeTimer);
        this.fadeTimer = null;
        return;
      }
      const nextVol = Math.min(this.targetVolume, this.bgm.volume + step);
      this.bgm.volume = nextVol;
      if (nextVol >= this.targetVolume) {
        clearInterval(this.fadeTimer);
        this.fadeTimer = null;
      }
    }, 80);
  }

  startMusic() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (!this.bgm) return;

    this.bgm.muted = this.isMuted;
    if (this.isPlaying && !this.bgm.paused) return;

    this.isPlaying = true;
    const playPromise = this.bgm.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          this.fadeInBgm();
        })
        .catch(() => {
          this.isPlaying = false;
        });
    } else {
      this.fadeInBgm();
    }
  }

  stopMusic() {
    this.isPlaying = false;
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
    if (this.bgm) {
      this.bgm.pause();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }

    if (this.bgm) {
      this.bgm.muted = this.isMuted;
      if (!this.isMuted) {
        if (this.bgm.paused) {
          this.isPlaying = true;
          this.bgm.volume = this.targetVolume;
          this.bgm.play().catch(() => {
            this.isPlaying = false;
          });
        } else if (this.bgm.volume === 0) {
          this.bgm.volume = this.targetVolume;
        }
      }
    }

    return this.isMuted;
  }

  // Soft romantic chime when hovering on a flower
  playFlowerChime(freq = 659.25) {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.15);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.85);
    } catch {
      // AudioContext suspended or not initialized
    }
  }

  // Magical sparkle sound for clicks and reveals
  playSparkle() {
    if (!this.ctx || this.isMuted) return;
    try {
      const notes = [587.33, 659.25, 783.99, 880.00, 1046.50];
      notes.forEach((freq, i) => {
        const time = this.ctx.currentTime + (i * 0.06);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.1, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(time);
        osc.stop(time + 0.65);
      });
    } catch {
      // AudioContext fallback
    }
  }

  // Enchanting grand harp sweep for special surprise reveal
  playSurpriseReveal() {
    if (!this.ctx || this.isMuted) return;
    try {
      const chord = [392.00, 466.16, 587.33, 698.46, 783.99, 932.33, 1174.66, 1396.91];
      chord.forEach((freq, idx) => {
        const time = this.ctx.currentTime + (idx * 0.07);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(time);
        osc.stop(time + 1.3);
      });
    } catch {
      // AudioContext fallback
    }
  }
}

export const romanticAudio = new RomanticAudioEngine();
