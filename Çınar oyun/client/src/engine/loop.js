// ============================================================
//  Sabit zaman adımlı oyun döngüsü.
//  update(): sabit FIXED_STEP ile çağrılır (deterministik simülasyon).
//  render(): her karede bir kez, interpolasyon oranı (alpha) ile.
// ============================================================

import { FIXED_STEP, MAX_FRAME_DELTA } from '/shared/constants.js';

export function createLoop({ update, render }) {
  let running = false;
  let rafId = 0;
  let lastTime = 0;
  let accumulator = 0;

  function frame(now) {
    if (!running) return;

    let delta = (now - lastTime) / 1000;
    lastTime = now;
    if (!Number.isFinite(delta) || delta < 0) delta = 0;
    if (delta > MAX_FRAME_DELTA) delta = MAX_FRAME_DELTA;

    accumulator += delta;

    // Spiral of death koruması: bir karede en fazla 240 adım
    let steps = 0;
    while (accumulator >= FIXED_STEP && steps < 240) {
      update(FIXED_STEP);
      accumulator -= FIXED_STEP;
      steps++;
    }

    render(accumulator / FIXED_STEP, delta);
    rafId = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      lastTime = performance.now();
      accumulator = 0;
      rafId = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(rafId);
    },
  };
}
