/**
 * VibeFlow Audio Engine
 * Lightweight, 100% offline procedural ambient sound generator using Web Audio API.
 * Keeps playing smoothly in the background across browser tabs with zero external requests.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.activeTrack = null;
    this.nodes = [];
    this.masterGain = null;
    this.volume = 0.5;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  stop() {
    this.nodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
        // Safe discard
      }
    });
    this.nodes = [];
    this.activeTrack = null;
  }

  play(trackName) {
    this.init();
    if (this.activeTrack === trackName) return;
    this.stop();

    if (!trackName || trackName === 'none') {
      return;
    }

    this.activeTrack = trackName;

    try {
      if (trackName === 'binaural') {
        this.playBinauralAlpha();
      } else if (trackName === 'brown') {
        this.playBrownNoise();
      } else if (trackName === 'rain') {
        this.playGentleRain();
      }
    } catch (err) {
      console.warn('VibeFlow Audio Engine notice:', err);
    }
  }

  playBinauralAlpha() {
    // 10Hz Alpha Waves (Base: 216Hz, Beat: 10Hz -> Left: 211Hz, Right: 221Hz)
    const baseFreq = 216;
    const diff = 10;

    const merger = this.ctx.createChannelMerger(2);

    // Left Ear
    const oscL = this.ctx.createOscillator();
    const gainL = this.ctx.createGain();
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(baseFreq - diff / 2, this.ctx.currentTime);
    gainL.gain.setValueAtTime(0.25, this.ctx.currentTime);
    oscL.connect(gainL);
    gainL.connect(merger, 0, 0);

    // Right Ear
    const oscR = this.ctx.createOscillator();
    const gainR = this.ctx.createGain();
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(baseFreq + diff / 2, this.ctx.currentTime);
    gainR.gain.setValueAtTime(0.25, this.ctx.currentTime);
    oscR.connect(gainR);
    gainR.connect(merger, 0, 1);

    // Subtle pink noise bed to cushion the tone
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2) * 0.03;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    merger.connect(this.masterGain);
    noiseSource.connect(this.masterGain);

    oscL.start();
    oscR.start();
    noiseSource.start();

    this.nodes.push(oscL, oscR, gainL, gainR, merger, noiseSource);
  }

  playBrownNoise() {
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 0.5; // gentle scaling
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(this.masterGain);

    noiseSource.start();
    this.nodes.push(noiseSource, filter);
  }

  playGentleRain() {
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.6, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.masterGain);

    noiseSource.start();
    this.nodes.push(noiseSource, filter, rainGain);
  }

  playCompletionChime() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.4); // A5

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }
}

export const audioEngine = new AudioEngine();
