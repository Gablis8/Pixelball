// ============================================================
//  Keskin (anti-aliasing'siz) 1px pixel çizim yardımcıları.
//  Tüm koordinatlar tam sayıya yuvarlanır ki pikseller net kalsın.
// ============================================================

export function fillBox(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x | 0, y | 0, Math.max(0, w | 0), Math.max(0, h | 0));
}

export function pixel(ctx, x, y, color) {
  fillBox(ctx, x, y, 1, 1, color);
}

// Bresenham: keskin 1px çizgi
export function line(ctx, x0, y0, x1, y1, color) {
  x0 |= 0;
  y0 |= 0;
  x1 |= 0;
  y1 |= 0;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  ctx.fillStyle = color;
  for (;;) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

// İçi boş dikdörtgen (kenarlık)
export function rect(ctx, x, y, w, h, color) {
  line(ctx, x, y, x + w - 1, y, color);
  line(ctx, x, y + h - 1, x + w - 1, y + h - 1, color);
  line(ctx, x, y, x, y + h - 1, color);
  line(ctx, x + w - 1, y, x + w - 1, y + h - 1, color);
}

// İçi boş daire (midpoint algoritması) — keskin pixel çember
export function circle(ctx, cx, cy, r, color) {
  cx |= 0;
  cy |= 0;
  r |= 0;
  let x = r;
  let y = 0;
  let err = 1 - r;
  ctx.fillStyle = color;
  const plot = (px, py) => ctx.fillRect(px, py, 1, 1);
  while (x >= y) {
    plot(cx + x, cy + y);
    plot(cx + y, cy + x);
    plot(cx - y, cy + x);
    plot(cx - x, cy + y);
    plot(cx - x, cy - y);
    plot(cx - y, cy - x);
    plot(cx + y, cy - x);
    plot(cx + x, cy - y);
    y++;
    if (err < 0) {
      err += 2 * y + 1;
    } else {
      x--;
      err += 2 * (y - x) + 1;
    }
  }
}
