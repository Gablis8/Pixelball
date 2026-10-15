// ============================================================
//  Girdi katmanı — klavye + fare.
//  - Hareket vektörü (WASD)
//  - Nişan yönü (fare → oyun koordinatı)
//  - Şut (sol tık), pas (Space), sprint (Sol Shift), top çalma (F)
// ============================================================

export class Input {
  constructor(target, screen) {
    this.target = target; // window
    this.screen = screen; // ölçek/offset bilgisi için
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, left: false, right: false };

    this._onKeyDown = (e) => this._keyDown(e);
    this._onKeyUp = (e) => this._keyUp(e);
    this._onMouseMove = (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    };
    this._onMouseDown = (e) => {
      if (e.button === 0) this.mouse.left = true;
      if (e.button === 2) this.mouse.right = true;
      if (e.button === 0) e.preventDefault();
    };
    this._onMouseUp = (e) => {
      if (e.button === 0) this.mouse.left = false;
      if (e.button === 2) this.mouse.right = false;
    };
    this._onBlur = () => this.clear();
    this._onContext = (e) => e.preventDefault();

    target.addEventListener('keydown', this._onKeyDown);
    target.addEventListener('keyup', this._onKeyUp);
    target.addEventListener('mousemove', this._onMouseMove);
    target.addEventListener('mousedown', this._onMouseDown);
    target.addEventListener('mouseup', this._onMouseUp);
    target.addEventListener('blur', this._onBlur);
    target.addEventListener('contextmenu', this._onContext);
  }

  _keyDown(e) {
    const k = this._normalizeKey(e.key);
    if (k === ' ' || k.startsWith('arrow')) e.preventDefault();
    this.keys.add(k);
  }

  _keyUp(e) {
    this.keys.delete(this._normalizeKey(e.key));
  }

  _normalizeKey(key) {
    const k = key.toLowerCase();
    if (k === 'spacebar' || k === 'space') return ' ';
    return k;
  }

  clear() {
    this.keys.clear();
    this.mouse.left = false;
    this.mouse.right = false;
  }

  // WASD → hareket vektörü (normalize edilmez; simülasyon normalize eder)
  get moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a')) x -= 1;
    if (this.keys.has('d')) x += 1;
    if (this.keys.has('w')) y -= 1;
    if (this.keys.has('s')) y += 1;
    return { x, y };
  }

  get shootHeld() {
    return this.mouse.left;
  }

  get passHeld() {
    return this.keys.has(' ');
  }

  get sprintHeld() {
    return this.keys.has('shift');
  }

  get tackleHeld() {
    return this.keys.has('f');
  }

  // Farenin oyun (dahili çözünürlük) koordinatı
  mouseGame() {
    const dpr = window.devicePixelRatio || 1;
    const deviceX = this.mouse.x * dpr;
    const deviceY = this.mouse.y * dpr;
    return {
      x: (deviceX - this.screen.offsetX) / this.screen.scale,
      y: (deviceY - this.screen.offsetY) / this.screen.scale,
    };
  }

  // Oyuncudan fareye doğru birim nişan vektörü
  aimFrom(player) {
    const m = this.mouseGame();
    const dx = m.x - player.x;
    const dy = m.y - player.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-4) return { x: 0, y: 0 };
    return { x: dx / len, y: dy / len };
  }

  destroy() {
    const t = this.target;
    t.removeEventListener('keydown', this._onKeyDown);
    t.removeEventListener('keyup', this._onKeyUp);
    t.removeEventListener('mousemove', this._onMouseMove);
    t.removeEventListener('mousedown', this._onMouseDown);
    t.removeEventListener('mouseup', this._onMouseUp);
    t.removeEventListener('blur', this._onBlur);
    t.removeEventListener('contextmenu', this._onContext);
  }
}
