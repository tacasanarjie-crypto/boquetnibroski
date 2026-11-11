// Romantic Audio Engine using Web Audio API
// Generates a soothing, emotional, romantic piano & harp melody without external audio asset dependencies.

class RomanticAudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.timer = null;
    this.step = 0;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);
  }

  // Play a soft, felted piano tone with realistic acoustic-style harmonics
  playPianoNote(freq, time, duration = 3.2, volume = 0.25) {
    if (!this.ctx || this.isMuted) return;

    const fundamental = this.ctx.createOscillator();
    const harmonic1 = this.ctx.createOscillator();
    const harmonic2 = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    fundamental.type = 'triangle';
    harmonic1.type = 'sine';
    harmonic2.type = 'sine';

    fundamental.frequency.setValueAtTime(freq, time);
    harmonic1.frequency.setValueAtTime(freq * 2, time);
    harmonic2.frequency.setValueAtTime(freq * 3, time);

    // Warm felt filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, time);
    filter.frequency.exponentialRampToValueAtTime(350, time + duration);

    // Natural piano attack & decay envelope
    noteGain.gain.setValueAtTime(0.0001, time);
    noteGain.gain.linearRampToValueAtTime(volume, time + 0.025);
    noteGain.gain.exponentialRampToValueAtTime(volume * 0.45, time + 0.4);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    fundamental.connect(filter);
    harmonic1.connect(filter);
    harmonic2.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.musicGain);

    fundamental.start(time);
    harmonic1.start(time);
    harmonic2.start(time);
    fundamental.stop(time + duration);
    harmonic1.stop(time + duration);
    harmonic2.stop(time + duration);
  }

  startMusic() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.isPlaying) return;
    this.isPlaying = true;

    // A dreamy romantic chord sequence (Ebmaj9 -> Cm9 -> Abmaj7 -> Bbadd9)
    // Frequencies (Hz)
    const chords = [
      // Ebmaj9
      [155.56, 233.08, 311.13, 392.00, 466.16, 587.33],
      // Gm7
      [196.00, 293.66, 392.00, 466.16, 587.33, 698.46],
      // Abmaj9
      [207.65, 261.63, 311.13, 392.00, 523.25, 622.25],
      // Bb9sus4 -> Bb
      [233.08, 349.23, 466.16, 523.25, 587.33, 783.99]
    ];

    const beatInterval = 650; // ms per arpeggiated note

    const schedulePattern = () => {
      if (!this.isPlaying) return;
      const chordIndex = Math.floor(this.step / 8) % chords.length;
      const chord = chords[chordIndex];
      const notePattern = [0, 2, 4, 3, 5, 4, 2, 1]; // gentle wave arpeggio
      const noteIdx = notePattern[this.step % 8];
      const freq = chord[noteIdx % chord.length];

      const now = this.ctx.currentTime;
      // Root bass note on beat 0
      if (this.step % 8 === 0) {
        this.playPianoNote(chord[0] / 2, now, 5.0, 0.28);
      }
      this.playPianoNote(freq, now, 3.8, 0.16 + (Math.sin(this.step) * 0.04));

      this.step++;
      this.timer = setTimeout(schedulePattern, beatInterval);
    };

    schedulePattern();
  }

  stopMusic() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
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
