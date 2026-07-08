// === src/core/AudioManager.js ===
// Synthesize âm thanh bằng Web Audio API (không cần file mp3)
export class AudioManager {
  constructor(game) {
    this.game = game;
    this.ctx = null;
    this.master = null;
    this.ambientNode = null;
    this.lastGunshot = 0;
    this.lastGroan = 0;
    this.enabled = false;
  }

  _ensureCtx() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.enabled = true;
    } catch (e) { this.enabled = false; }
  }

  resume() {
    this._ensureCtx();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  // Súng nổ: noise burst + low oscillator
  gunshot(type = 'revolver') {
    if (!this.enabled) return;
    const now = this.ctx.currentTime;
    if (now - this.lastGunshot < 0.05) return;
    this.lastGunshot = now;

    const noise = this.ctx.createBufferSource();
    const len = this.ctx.sampleRate * 0.2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = type === 'shotgun' ? 1200 : 2200;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(type === 'shotgun' ? 0.6 : 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    noise.connect(filter).connect(gain).connect(this.master);
    noise.start(now);
    noise.stop(now + 0.25);

    // Low thump
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(0.5, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(og).connect(this.master);
    osc.start(now); osc.stop(now + 0.25);
  }

  // Zombie rên rỉ
  groan() {
    if (!this.enabled) return;
    const now = this.ctx.currentTime;
    if (now - this.lastGroan < 1.0) return;
    this.lastGroan = now;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    const base = 60 + Math.random() * 40;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.linearRampToValueAtTime(base * 0.7, now + 0.5);
    osc.frequency.linearRampToValueAtTime(base, now + 0.9);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    osc.connect(filter).connect(gain).connect(this.master);
    osc.start(now); osc.stop(now + 1.1);
  }

  // Vampire shriek
  shriek() {
    if (!this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.4);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain).connect(this.master);
    osc.start(now); osc.stop(now + 0.5);
  }

  // Tiếng tàu chug
  chug() {
    if (!this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 50;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain).connect(this.master);
    osc.start(now); osc.stop(now + 0.2);
  }

  hit() {
    if (!this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain).connect(this.master);
    osc.start(now); osc.stop(now + 0.2);
  }

  pickup() {
    if (!this.enabled) return;
    const now = this.ctx.currentTime;
    [440, 660, 880].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
      osc.connect(gain).connect(this.master);
      osc.start(now + i * 0.06); osc.stop(now + i * 0.06 + 0.2);
    });
  }

  // Ambient nhẹ theo day/night
  updateAmbient(dt) {
    // Không cần ambient node liên tục; chỉ thỉnh thoảng chug
    if (this.game.train && this.game.train.speed > 0.1 && Math.random() < dt * 1.5) {
      this.chug();
    }
  }
}
