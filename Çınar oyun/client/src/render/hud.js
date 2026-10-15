// ============================================================
//  HUD — skor tabelası, geri sayım, mesajlar, stamina ve maç sonu ekranı.
// ============================================================

import { RESOLUTION, TEAMS, STAMINA } from '/shared/constants.js';
import { fillBox, rect } from './pixel.js';
import { drawText } from './text.js';

export function drawHud(ctx, state, localId, notice = null) {
  drawScoreboard(ctx, state);
  drawCountdown(ctx, state);
  drawMessage(ctx, state);
  drawStamina(ctx, state, localId);
  if (state.phase === 'end') drawResult(ctx, state, localId);
  drawNotice(ctx, notice);
}

// Geçici bilgi bandı (rövanş bekleniyor, rakip ayrıldı vb.)
function drawNotice(ctx, notice) {
  if (!notice) return;
  drawText(ctx, notice, RESOLUTION.width / 2, RESOLUTION.height - 30, {
    align: 'center',
    size: 8,
    color: '#ffe86a',
  });
}

function drawScoreboard(ctx, state) {
  const w = 72;
  const h = 16;
  const x = Math.round((RESOLUTION.width - w) / 2);
  const y = 3;

  fillBox(ctx, x, y, w, h, '#1b1b24');
  rect(ctx, x, y, w, h, '#f7f9ec');

  fillBox(ctx, x + 5, y + 5, 6, 6, TEAMS.red.jersey);
  fillBox(ctx, x + w - 11, y + 5, 6, 6, TEAMS.blue.jersey);

  drawText(ctx, `${state.scores[0]} - ${state.scores[1]}`, x + w / 2, y + 3, {
    align: 'center',
    size: 9,
  });
}

function drawCountdown(ctx, state) {
  if (state.phase !== 'kickoff') return;
  const n = Math.max(1, Math.ceil(state.phaseTimer));
  drawText(ctx, String(n), RESOLUTION.width / 2, RESOLUTION.height / 2 - 22, {
    align: 'center',
    size: 22,
    color: '#ffe86a',
  });
}

function drawMessage(ctx, state) {
  if (!state.message) return;
  const color = state.message.text === 'GOL!' ? '#ffe86a' : '#8fe0ff';
  drawText(ctx, state.message.text, RESOLUTION.width / 2, 24, {
    align: 'center',
    size: 12,
    color,
  });
}

// Sol altta yerel oyuncunun sprint enerjisi.
function drawStamina(ctx, state, localId) {
  const p = state.players.find((pl) => pl.id === localId);
  if (!p) return;

  const w = 60;
  const h = 6;
  const x = 6;
  const y = RESOLUTION.height - h - 5;

  drawText(ctx, 'ENERJİ', x, y - 8, { size: 7, color: '#c8c8d8' });

  fillBox(ctx, x, y, w, h, '#1b1b24');
  rect(ctx, x, y, w, h, '#f7f9ec');

  const t = Math.max(0, Math.min(1, p.stamina / STAMINA.max));
  const fillW = Math.round((w - 2) * t);
  if (fillW > 0) {
    const color = t > 0.5 ? '#7ee06a' : t > 0.22 ? '#ffd23c' : '#ff6a5a';
    fillBox(ctx, x + 1, y + 1, fillW, h - 2, color);
  }
}

function drawResult(ctx, state, localId) {
  ctx.globalAlpha = 0.62;
  fillBox(ctx, 0, 0, RESOLUTION.width, RESOLUTION.height, '#0e0e14');
  ctx.globalAlpha = 1;

  const win = state.winner === localId;
  drawText(ctx, win ? 'KAZANDIN!' : 'KAYBETTİN', RESOLUTION.width / 2, 66, {
    align: 'center',
    size: 16,
    color: win ? '#8fe870' : '#ff8a8a',
  });
  drawText(ctx, `Skor  ${state.scores[0]} - ${state.scores[1]}`, RESOLUTION.width / 2, 90, {
    align: 'center',
    size: 10,
  });
  drawText(ctx, 'R = yeniden oyna', RESOLUTION.width / 2, 108, {
    align: 'center',
    size: 8,
    color: '#a0a0b0',
  });
}
