// ============================================================
//  Sesler — dosya gerektirmeyen, Web Audio ile sentezlenen efektler.
//  Tarayıcı politikası gereği ilk kullanıcı etkileşiminden sonra açılır
//  (resume()). M tuşu ile aç/kapat.
// ============================================================

export class Sound {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.master = 0.22; // genel ses seviyesi
  }

  // İlk tıklama/tuşta çağrılır: AudioContext'i oluşturur/açar.
  resume() {
    if (!this.enabled) return;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) {
          this.enabled = false;
          return;
        }
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch {
      this.enabled = false;
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.resume();
    return this.enabled;
  }

  _tone(freq, dur, type = 'square', vol = 1, slideTo = null) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    }
    const peak = Math.max(0.0002, this.master * vol);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noise(dur, vol = 0.5) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const gain = this.ctx.createGain();
    gain.gain.value = this.master * vol;
    src.connect(gain).connect(this.ctx.destination);
    src.start(t0);
  }

  play(event) {
    if (!this.enabled || !this.ctx) return;
    switch (event.type) {
      case 'kick': {
        const p = event.power || 0;
        this._tone(170 + p * 260, 0.09, 'square', 0.5, 90);
        break;
      }
      case 'tackle':
        this._tone(120, 0.1, 'sawtooth', 0.5, 60);
        break;
      case 'steal':
        this._tone(520, 0.08, 'square', 0.4, 780);
        break;
      case 'save':
        this._noise(0.16, 0.5);
        this._tone(300, 0.1, 'triangle', 0.3, 520);
        break;
      case 'exhaust':
        this._tone(240, 0.16, 'sine', 0.35, 120);
        break;
      case 'goal':
        this._goalJingle();
        break;
      default:
        break;
    }
  }

  _goalJingle() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.16, 'square', 0.45), i * 90);
    });
  }
}
