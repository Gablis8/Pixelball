// ============================================================
//  Sprite pişirme (baking) katmanı.
//  Ham pixel verisini (sprite-data.js) offscreen canvas'lara çevirir.
//  Takım rengi "palet takası" ile uygulanır. Sol yön = sağ yön aynası.
// ============================================================

import { TEAMS } from '/shared/constants.js';
import {
  PLAYER_PALETTE,
  PLAYER_SPRITES,
  BALL_SPRITE,
  BALL_PALETTE,
  SEAL_SPRITES,
  SEAL_PALETTE,
} from './sprite-data.js';

const DIRS = ['down', 'up', 'side'];
const ANIMS = ['idle', 'run1', 'run2'];
const SEAL_ANIMS = ['idle', 'dive', 'sad'];

function bake(rows, palette) {
  const h = rows.length;
  const w = rows[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const color = palette[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return canvas;
}

function flipX(src) {
  const canvas = document.createElement('canvas');
  canvas.width = src.width;
  canvas.height = src.height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return canvas;
}

// Tüm sprite'ları (iki takım için) bir kez üretir.
export function createSprites() {
  const players = {};

  for (const teamName of Object.keys(TEAMS)) {
    const team = TEAMS[teamName];
    const palette = { ...PLAYER_PALETTE, j: team.jersey, J: team.jerseyDark };
    const set = {};

    for (const dir of DIRS) {
      set[dir] = {};
      for (const anim of ANIMS) {
        set[dir][anim] = bake(PLAYER_SPRITES[dir][anim], palette);
      }
    }

    // Sol yön = sağ yönün yatay aynası
    set.left = {};
    for (const anim of ANIMS) set.left[anim] = flipX(set.side[anim]);
    set.right = set.side;

    players[teamName] = set;
  }

  // Fok balığı kaleci (sağa bakar; sol = ayna)
  const seal = { right: {}, left: {} };
  for (const anim of SEAL_ANIMS) {
    const c = bake(SEAL_SPRITES[anim], SEAL_PALETTE);
    seal.right[anim] = c;
    seal.left[anim] = flipX(c);
  }

  return {
    players,
    ball: bake(BALL_SPRITE, BALL_PALETTE),
    seal,
  };
}

// Bir sprite canvas'ını, verilen merkeze ortalayarak çizer.
export function drawSprite(ctx, canvas, cx, cy) {
  const x = Math.round(cx - canvas.width / 2);
  const y = Math.round(cy - canvas.height / 2);
  ctx.drawImage(canvas, x, y);
}
