// ============================================================
//  Efektler — parçacıklar ve top izi.
//  Yalnızca görseldir; simülasyona etkisi yoktur. Simülasyonun ürettiği
//  olayları (state.events) tüketerek parçacık üretir.
// ============================================================

import { fillBox } from './pixel.js';

const CONFETTI_COLORS = ['#ffe86a', '#ff6a5a', '#7ee06a', '#6cc4ff', '#e08cff', '#ffffff'];
const MAX_PARTICLES = 240;
const TRAIL_LIFE = 0.18;
const MAX_TRAIL = 24;

export class Effects {
  constructor() {
    this.particles = [];
    this.trail = [];
  }

  reset() {
    this.particles.length = 0;
    this.trail.length = 0;
  }

  // Bir simülasyon olayından parçacık üretir.
  spawn(event) {
    switch (event.type) {
      case 'kick':
        this._burst(event.x, event.y, 5, '#e8e8e8', 40 + 70 * (event.power || 0), 0.3);
        break;
      case 'tackle':
        this._burst(event.x, event.y, 6, '#c8a878', 55, 0.35);
        break;
      case 'steal':
        this._burst(event.x, event.y, 7, '#ffe86a', 60, 0.35);
        break;
      case 'save':
        this._burst(event.x, event.y, 8, '#6cc4ff', 70, 0.4);
        break;
      case 'exhaust':
        this._burst(event.x, event.y - 6, 4, '#ff8a8a', 30, 0.4);
        break;
      case 'goal':
        this._confetti(event.side);
        break;
      default:
        break;
    }
  }

  _burst(x, y, count, color, speed, life) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.5 + Math.random() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: life * (0.6 + Math.random() * 0.7),
        max: life,
        color,
        size: Math.random() < 0.35 ? 2 : 1,
      });
    }
    this._cap();
  }

  _confetti(side) {
    // Gol olan kalenin önünde konfeti patlaması
    const x = side === 'left' ? 44 : 276;
    const y = 54;
    for (let i = 0; i < 26; i++) {
      this.particles.push({
        x: x + (Math.random() * 2 - 1) * 22,
        y: y + (Math.random() * 2 - 1) * 12,
        vx: (Math.random() * 2 - 1) * 60,
        vy: -30 - Math.random() * 70,
        gravity: 90,
        life: 0.7 + Math.random() * 0.5,
        max: 1.2,
        color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
        size: 2,
      });
    }
    this._cap();
  }

  _cap() {
    if (this.particles.length > MAX_PARTICLES) {
      this.particles.splice(0, this.particles.length - MAX_PARTICLES);
    }
  }

  // dt: kare süresi; ball: topun konum/hızı (iz için)
  update(dt, ball) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.gravity) {
        pt.vy += pt.gravity * dt;
      } else {
        pt.vx *= 0.96;
        pt.vy *= 0.96;
      }
    }

    // Hızlı top için iz
    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > 120) this.trail.push({ x: ball.x, y: ball.y, life: TRAIL_LIFE });
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
    if (this.trail.length > MAX_TRAIL) {
      this.trail.splice(0, this.trail.length - MAX_TRAIL);
    }
  }

  // Top izi — oyuncuların/topun ALTINA çizilir.
  drawTrail(ctx) {
    for (const t of this.trail) {
      const a = t.life / TRAIL_LIFE;
      ctx.fillStyle = a > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.22)';
      ctx.fillRect(Math.round(t.x) - 1, Math.round(t.y) - 1, 3, 3);
    }
  }

  // Parçacıklar — her şeyin ÜSTÜNE çizilir.
  drawParticles(ctx) {
    for (const pt of this.particles) {
      const a = pt.life / pt.max;
      if (a < 0.25) continue;
      fillBox(ctx, Math.round(pt.x), Math.round(pt.y), pt.size, pt.size, pt.color);
    }
  }
}
