// ============================================================
//  DebugOverlay — geliştirme amaçlı bilgi kaplaması (şimdilik FPS).
//  İlerleyen fazlarda ping, tick, top hızı vb. eklenecek.
// ============================================================

export class DebugOverlay {
  constructor(el) {
    this.el = el;
    this.fps = 0;
    this._frames = 0;
    this._timer = 0;
  }

  update(delta, info) {
    if (!this.el) return;
    this._frames++;
    this._timer += delta;
    if (this._timer >= 0.25) {
      this.fps = Math.round(this._frames / this._timer);
      this._frames = 0;
      this._timer = 0;
      this.el.textContent = info ? `FPS ${this.fps}  ${info}` : `FPS ${this.fps}`;
    }
  }
}
