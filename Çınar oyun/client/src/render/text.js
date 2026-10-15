// ============================================================
//  Pixel görünümlü metin çizimi (düşük çözünürlüklü tampona yazar,
//  sonra sahne büyütülünce bloklu/pixel görünür).
// ============================================================

export function drawText(ctx, text, x, y, opts = {}) {
  const {
    color = '#f7f9ec',
    align = 'left',
    baseline = 'top',
    size = 8,
    outline = '#12121a',
  } = opts;

  ctx.font = `${size}px "Courier New", ui-monospace, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  const rx = Math.round(x);
  const ry = Math.round(y);

  if (outline) {
    ctx.fillStyle = outline;
    ctx.fillText(text, rx - 1, ry);
    ctx.fillText(text, rx + 1, ry);
    ctx.fillText(text, rx, ry - 1);
    ctx.fillText(text, rx, ry + 1);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, rx, ry);
}
