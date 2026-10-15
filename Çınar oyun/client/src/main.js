// ============================================================
//  Pixel Futbol — istemci giriş noktası
//  Faz 3: sprint/stamina, top çalma, parçacıklar, sentez sesler.
//  Faz 4: online mod (lobby + WebSocket, sunucu otoritesi).
//  `?offline` ile sandbox (tek oyuncu) modu.
// ============================================================

import { RESOLUTION, PALETTE } from '/shared/constants.js';
import { createMatch, stepMatch, EMPTY_INPUT } from '/shared/simulation.js';
import { MSG } from '/shared/protocol.js';
import { Screen } from './render/screen.js';
import { drawPitch } from './render/pitch.js';
import { drawWorld } from './render/world.js';
import { drawHud } from './render/hud.js';
import { createSprites } from './render/sprites.js';
import { Effects } from './render/effects.js';
import { Input } from './input/input.js';
import { Sound } from './audio/sound.js';
import { createLoop } from './engine/loop.js';
import { DebugOverlay } from './engine/debug.js';
import { Connection } from './net/connection.js';
import { Lobby } from './net/lobby.js';
import { Sync } from './net/sync.js';

const canvas = document.getElementById('screen');
if (!canvas) throw new Error('Canvas (#screen) bulunamadı.');

const screen = new Screen(canvas);
const debug = new DebugOverlay(document.getElementById('debug'));
const sprites = createSprites();
const input = new Input(window, screen);
const effects = new Effects();
const sound = new Sound();

// Mod seçimi: ?offline → sandbox, yoksa online
const params = new URLSearchParams(window.location.search);
const OFFLINE = params.has('offline');

const LOCAL_ID = 0;
let localId = 0; // sunucunun atadığı oyuncu id (0 veya 1)
let state = createMatch();
let online = !OFFLINE;
let roleText = OFFLINE ? 'sandbox' : 'online';

// Ses kilidi
const unlockAudio = () => sound.resume();
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);

// HUD'da gösterilen geçici yazı (rövanş durumu, rakip ayrıldı vb.)
let notice = null; // { text, ttl }
function setNotice(text, ttl = 4) {
  notice = text ? { text, ttl } : null;
}

// R = yeniden başlat (sandbox) / rövanş (online), M = ses
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'r') {
    if (OFFLINE) {
      state = createMatch();
      effects.reset();
    } else if (state.phase === 'end' && conn && conn.connected) {
      // Online: maç bitti → rövanş isteği gönder
      conn.send(MSG.REMATCH);
      setNotice('RAKIP BEKLENIYOR...', 3600);
    }
  } else if (k === 'm') {
    sound.toggle();
  }
});

function buildInputs() {
  const move = input.moveVector;
  const aim = input.aimFrom(state.players[localId]);
  return {
    moveX: move.x,
    moveY: move.y,
    aimX: aim.x,
    aimY: aim.y,
    shoot: input.shootHeld,
    pass: input.passHeld,
    sprint: input.sprintHeld,
    tackle: input.tackleHeld,
  };
}

function update(dt) {
  if (OFFLINE) {
    stepMatch(state, [buildInputs(), EMPTY_INPUT], dt);
    return;
  }
  // Online: girdiyi sunucuya gönder; state sunucudan gelir
  if (conn && conn.connected) conn.send(MSG.INPUT, buildInputs());
}

function buildDebugInfo() {
  const speed = Math.hypot(state.ball.vx, state.ball.vy);
  const owner = state.ball.ownerId == null ? '-' : state.ball.ownerId;
  return `${roleText} ${state.phase} ${state.scores[0]}-${state.scores[1]} top:${speed.toFixed(0)} sahip:${owner}`;
}

function render(_alpha, delta) {
  const ctx = screen.sceneCtx;

  if (notice) {
    notice.ttl -= delta;
    if (notice.ttl <= 0) notice = null;
  }

  for (const ev of state.events) {
    effects.spawn(ev);
    sound.play(ev);
  }
  state.events.length = 0;
  effects.update(delta, state.ball);

  ctx.fillStyle = PALETTE.sky;
  ctx.fillRect(0, 0, RESOLUTION.width, RESOLUTION.height);

  drawPitch(ctx);
  effects.drawTrail(ctx);
  drawWorld(ctx, state, sprites, localId);
  effects.drawParticles(ctx);
  drawHud(ctx, state, localId, notice ? notice.text : null);

  screen.present();
  debug.update(delta, buildDebugInfo());
}

const loop = createLoop({ update, render });

// ---------------- Online (Faz 4) ----------------
let conn = null;
let lobby = null;
let sync = null;
if (online) {
  lobby = new Lobby(document.body);
  sync = new Sync();
  conn = new Connection((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host);

  lobby.setHandlers(
    () => { conn.send(MSG.CREATE); },
    (code) => { conn.send(MSG.JOIN, { code }); },
    () => { conn.send(MSG.LEAVE); }
  );

  conn.on(MSG.LOBBY, (m) => {
    localId = m.playerId;
    if (lobby.setCode) lobby.setCode(m.code);
    lobby.setInfo(`ODA KODU: ${m.code}`);
  });
  conn.on(MSG.JOINED, (m) => {
    localId = m.playerId;
    if (lobby.setCode) lobby.setCode(m.code);
    lobby.setInfo(`KATILDIN: ${m.code}`);
  });
  conn.on(MSG.START, () => {
    // İlk maç ve rövanş aynı yolu kullanır: temiz yerel durumla başla.
    lobby.hide();
    effects.reset();
    state = createMatch();
    setNotice(null);
    roleText = 'online';
  });
  conn.on(MSG.STATE, (m) => {
    sync.applyState(state, m);
  });
  conn.on(MSG.REMATCH_STATUS, (m) => {
    setNotice(m.waiting ? 'RAKIP BEKLENIYOR...' : 'YENI MAC BASLIYOR...', m.waiting ? 3600 : 3);
  });
  conn.on(MSG.NOTICE, (m) => {
    // lobby:true → rakip maç ortasında ayrıldı; lobiye dön ve bildir.
    if (m.lobby) {
      setNotice(null);
      lobby.setCode('');
      lobby.show();
      lobby.setInfo(m.message || 'RAKIP AYRILDI');
    } else {
      setNotice(m.message || '', 5);
    }
  });
  conn.on(MSG.ERROR, (m) => {
    lobby.setInfo(`Hata: ${m.message}`);
  });

  conn.connect()
    .then(() => {
      lobby.show();
      loop.start();
    })
    .catch(() => {
      // Lobi açık kalsın ki hata görünür olsun (eskiden ekran boş kalıyordu).
      lobby.show();
      lobby.setInfo('Bağlantı kurulamadı. Sunucu çalışıyor mu?');
      loop.start();
    });
} else {
  loop.start();
}
