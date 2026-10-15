// ============================================================
//  Screen — pixel-perfect ölçekleme katmanı.
//  Oyun 320x180 "sahne" tamponuna çizilir, sonra ekrana tam sayı
//  katlarıyla, yumuşatmasız (nearest-neighbor) büyütülür.
// ============================================================

import { RESOLUTION, PALETTE } from '/shared/constants.js';

export class Screen {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });

    // Düşük çözünürlüklü sahne tamponu
    this.scene = document.createElement('canvas');
    this.scene.width = RESOLUTION.width;
    this.scene.height = RESOLUTION.height;
    this.sceneCtx = this.scene.getContext('2d', { alpha: false });
    this.sceneCtx.imageSmoothingEnabled = false;

    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this.resize();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.max(1, window.innerWidth);
    const cssH = Math.max(1, window.innerHeight);

    this.canvas.width = Math.floor(cssW * dpr);
    this.canvas.height = Math.floor(cssH * dpr);
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;

    const scaleX = this.canvas.width / RESOLUTION.width;
    const scaleY = this.canvas.height / RESOLUTION.height;
    this.scale = Math.max(1, Math.floor(Math.min(scaleX, scaleY)));
    this.offsetX = Math.floor((this.canvas.width - RESOLUTION.width * this.scale) / 2);
    this.offsetY = Math.floor((this.canvas.height - RESOLUTION.height * this.scale) / 2);

    this.ctx.imageSmoothingEnabled = false;
  }

  // Sahne tamponunu ekrana (tam sayı ölçekle) kopyalar.
  present() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PALETTE.sky;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(
      this.scene,
      0,
      0,
      RESOLUTION.width,
      RESOLUTION.height,
      this.offsetX,
      this.offsetY,
      RESOLUTION.width * this.scale,
      RESOLUTION.height * this.scale,
    );
  }

  destroy() {
    window.removeEventListener('resize', this._onResize);
  }
}
