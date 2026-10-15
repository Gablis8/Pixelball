// ============================================================
//  Dünya çizimi — oyuncular, top, nişan oku ve güç barı.
// ============================================================

import { SHOOT, PASS } from '/shared/constants.js';
import { drawSprite } from './sprites.js';
import { fillBox, line, rect } from './pixel.js';

// Nişan yönüne göre 4 yönlü sprite yönü seçer.
function dirFromFacing(p) {
  if (Math.abs(p.facingX) >= Math.abs(p.facingY)) {
    return p.facingX >= 0 ? 'right' : 'left';
  }
  return p.facingY >= 0 ? 'down' : 'up';
}

function animFromState(p, time) {
  if (!p.moving) return 'idle';
  // ~8 adım/sn koşu animasyonu
  return Math.floor(time * 8) % 2 === 0 ? 'run1' : 'run2';
}

function drawPlayer(ctx, p, sprites, time) {
  const teamSprites = sprites.players[p.team];
  if (!teamSprites) return;
  const dir = dirFromFacing(p);
  let anim = animFromState(p, time);
  if (p.tackleTimer > 0) anim = 'run1'; // atılma pozu: bacaklar açık
  const canvas = (teamSprites[dir] && teamSprites[dir][anim]) || teamSprites.down.idle;

  // Tekme/atılma pozu (nişan yönüne hafif öne kayma)
  let ox = 0;
  let oy = 0;
  if (p.tackleTimer > 0) {
    ox = p.aimX * 2;
    oy = p.aimY * 2;
  } else if (p.kickTimer > 0) {
    ox = p.aimX;
    oy = p.aimY;
  }
  // Gol sevinci: zıplama
  if (p.celebrate) oy -= Math.abs(Math.sin(time * 9)) * 2;

  drawSprite(ctx, canvas, p.x + ox, p.y + oy);
}

// Oyuncunun önünde nişan oku + şarj güç barı (yalnızca yerel oyuncu için).
function drawArena(ctx, p) {
  const ax = p.aimX;
  const ay = p.aimY;

  // Nişan çizgisi
  const x0 = p.x + ax * 8;
  const y0 = p.y + ay * 8;
  const x1 = p.x + ax * 20;
  const y1 = p.y + ay * 20;
  line(ctx, x0, y0, x1, y1, '#f7f9ec');

  // Ok başı
  const px = -ay;
  const py = ax;
  line(ctx, x1, y1, x1 - ax * 3 + px * 2, y1 - ay * 3 + py * 2, '#f7f9ec');
  line(ctx, x1, y1, x1 - ax * 3 - px * 2, y1 - ay * 3 - py * 2, '#f7f9ec');

  // Güç barı (şut veya pas şarjı)
  const isShoot = p.shootCharge >= p.passCharge;
  const charge = isShoot ? p.shootCharge : p.passCharge;
  const cfg = isShoot ? SHOOT : PASS;
  if (charge <= 0) return;

  const t = Math.min(1, charge / cfg.chargeTime);
  const bw = 20;
  const bh = 4;
  const bx = Math.round(p.x - bw / 2);
  const by = Math.round(p.y - 15);

  fillBox(ctx, bx, by, bw, bh, '#12121a'); // zemin
  rect(ctx, bx, by, bw, bh, '#f7f9ec'); // kenarlık
  const fillW = Math.max(1, Math.round((bw - 2) * t));
  fillBox(ctx, bx + 1, by + 1, fillW, bh - 2, isShoot ? '#ff8a3c' : '#3ca0ff');
}

function drawKeeper(ctx, k, sprites) {
  // Sol kaleci sahaya döner (sağa bakar) → yazar yön; sağ kaleci aynası.
  const set = k.side === 'left' ? sprites.seal.right : sprites.seal.left;
  const canvas = set[k.state] || set.idle;
  drawSprite(ctx, canvas, k.x, k.y);
}

export function drawWorld(ctx, state, sprites, localId) {
  for (const p of state.players) {
    drawPlayer(ctx, p, sprites, state.time);
  }

  drawKeeper(ctx, state.keepers.left, sprites);
  drawKeeper(ctx, state.keepers.right, sprites);

  drawSprite(ctx, sprites.ball, state.ball.x, state.ball.y);

  for (const p of state.players) {
    if (p.id === localId) drawArena(ctx, p);
  }
}
