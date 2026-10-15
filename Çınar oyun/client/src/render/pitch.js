// ============================================================
//  Saha (pitch) çizimi — boş futbol sahası, kuş bakışı.
//  Kaleler sol ve sağda; orta çizgi dikey.
// ============================================================

import { RESOLUTION, PALETTE, GOAL } from '/shared/constants.js';
import { FIELD } from '/shared/pitch.js';
import { fillBox, rect, line, circle } from './pixel.js';

const STRIPE_WIDTH = 20; // biçme şeridi genişliği

export function drawPitch(ctx) {
  const { x, y, w, h } = FIELD;
  const cx = x + (w >> 1);
  const cy = y + (h >> 1);

  // 1) Saha dışı zemin
  fillBox(ctx, 0, 0, RESOLUTION.width, RESOLUTION.height, PALETTE.grassEdge);

  // 2) Biçme şeritleri (dikey)
  const count = Math.ceil(w / STRIPE_WIDTH);
  for (let i = 0; i < count; i++) {
    const sx = x + i * STRIPE_WIDTH;
    const sw = Math.min(STRIPE_WIDTH, x + w - sx);
    if (sw <= 0) break;
    fillBox(ctx, sx, y, sw, h, i % 2 === 0 ? PALETTE.grassLight : PALETTE.grassDark);
  }

  // 3) Çizgiler
  const L = PALETTE.line;
  rect(ctx, x, y, w, h, L); // dış sınır
  line(ctx, cx, y, cx, y + h - 1, L); // orta çizgi
  circle(ctx, cx, cy, 20, L); // orta yuvarlak
  fillBox(ctx, cx, cy, 1, 1, L); // orta nokta

  // 4) Ceza sahaları
  const boxW = 40;
  const boxH = 88;
  const by = cy - (boxH >> 1);
  rect(ctx, x, by, boxW, boxH, L); // sol
  rect(ctx, x + w - boxW, by, boxW, boxH, L); // sağ

  // 5) Kale sahaları (küçük)
  const gboxW = 16;
  const gboxH = 44;
  const gy = cy - (gboxH >> 1);
  rect(ctx, x, gy, gboxW, gboxH, L); // sol
  rect(ctx, x + w - gboxW, gy, gboxW, gboxH, L); // sağ

  // 6) Kaleler (direk + ağ)
  drawGoals(ctx);
}

// Sol ve sağ kaleyi çizer (ağız tarafı açık U biçiminde).
function drawGoals(ctx) {
  const { x, y, w, h } = FIELD;
  const cy = y + h / 2;
  const half = GOAL.height / 2;
  const top = Math.round(cy - half);
  const bot = Math.round(cy + half);
  drawGoalSide(ctx, x, top, bot, 'left');
  drawGoalSide(ctx, x + w, top, bot, 'right');
}

function drawGoalSide(ctx, lineX, top, bot, side) {
  const depth = GOAL.depth;
  const backX = side === 'left' ? lineX - depth : lineX + depth;
  const netLeft = Math.min(lineX, backX);

  // Ağ zemini
  fillBox(ctx, netLeft, top, depth, bot - top + 1, '#20242c');
  // Ağ dokusu
  for (let gx = netLeft; gx <= netLeft + depth; gx += 3) line(ctx, gx, top, gx, bot, '#39414f');
  for (let gy = top; gy <= bot; gy += 3) line(ctx, netLeft, gy, netLeft + depth - 1, gy, '#39414f');

  // Çerçeve (ağız tarafı açık)
  const L = PALETTE.line;
  line(ctx, lineX, top, backX, top, L);
  line(ctx, lineX, bot, backX, bot, L);
  line(ctx, backX, top, backX, bot, L);
}
