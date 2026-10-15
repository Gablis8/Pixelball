// ============================================================
//  Paylaşılan simülasyon — oyunun fizik ve kural mantığı.
//  İstemci (yerel/antrenman) ve sunucu (Faz 4: otorite) AYNI kodu
//  çalıştırır. Bu yüzden tarayıcıya özel API kullanmaz.
//  Referans: PROJE-MANTIGI.md (top, şut, pas, sahiplik, sprint, top çalma,
//  kaleci, maç akışı)
// ============================================================

import { FIELD, FIELD_CENTER, isInGoalMouth } from './pitch.js';
import {
  PLAYER,
  BALL,
  SHOOT,
  PASS,
  KEEPER,
  MATCH,
  STAMINA,
  TACKLE,
  ANIM,
} from './constants.js';

// --- Yardımcılar ---------------------------------------------------------

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function clamp01(v) {
  return clamp(v, 0, 1);
}

// current'ı target'a en fazla maxDelta kadar yaklaştırır.
function approach(current, target, maxDelta) {
  const d = target - current;
  if (Math.abs(d) <= maxDelta) return target;
  return current + Math.sign(d) * maxDelta;
}

// --- Fabrikalar ----------------------------------------------------------

export function createPlayer(id, team, x, y) {
  return {
    id,
    team, // 'red' | 'blue'
    x,
    y,
    vx: 0,
    vy: 0,
    facingX: 1,
    facingY: 0,
    aimX: 1,
    aimY: 0,
    hasBall: false,
    moving: false,
    shootCharge: 0,
    passCharge: 0,
    prevShoot: false,
    prevPass: false,
    // Faz 3: sprint + top çalma
    stamina: STAMINA.max,
    sprinting: false,
    exhausted: false,
    regenTimer: 0,
    tackleTimer: 0,
    tackleCooldown: 0,
    kickTimer: 0,
    celebrate: false,
    prevTackle: false,
  };
}

export function createBall(x, y) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    ownerId: null,
    lockId: null,
    lockTimer: 0,
    saveCooldown: 0, // kurtarış sonrası tekrar kontrol gecikmesi
  };
}

export function createKeeper(side) {
  const x = side === 'left' ? FIELD.x + 8 : FIELD.x + FIELD.w - 8;
  return {
    side, // 'left' | 'right'
    x,
    y: FIELD_CENTER.y,
    state: 'idle', // 'idle' | 'dive' | 'sad'
    diveTimer: 0,
  };
}

export function createMatch() {
  const state = {
    players: [createPlayer(0, 'red', 0, 0), createPlayer(1, 'blue', 0, 0)],
    ball: createBall(FIELD_CENTER.x, FIELD_CENTER.y),
    keepers: { left: createKeeper('left'), right: createKeeper('right') },
    scores: [0, 0], // [kırmızı, mavi]
    phase: 'kickoff', // kickoff | play | goal | end
    phaseTimer: 0,
    winner: null,
    message: null, // { text, timer }
    events: [], // Faz 3: istemcinin görsel/ses için tükettiği tek seferlik olaylar
    time: 0,
  };
  setupKickoff(state);
  state.time = 0;
  return state;
}

// Boş girdi (girdisi olmayan oyuncular için). aim (0,0) => önceki yön korunur.
export const EMPTY_INPUT = {
  moveX: 0,
  moveY: 0,
  aimX: 0,
  aimY: 0,
  shoot: false,
  pass: false,
  sprint: false,
  tackle: false,
};

// --- Maç akışı -----------------------------------------------------------

function resetPlayer(p, x, y, aimX, aimY) {
  p.x = x;
  p.y = y;
  p.vx = 0;
  p.vy = 0;
  p.aimX = aimX;
  p.aimY = aimY;
  p.facingX = aimX;
  p.facingY = aimY;
  p.hasBall = false;
  p.moving = false;
  p.shootCharge = 0;
  p.passCharge = 0;
  p.prevShoot = false;
  p.prevPass = false;
  p.stamina = STAMINA.max;
  p.sprinting = false;
  p.exhausted = false;
  p.regenTimer = 0;
  p.tackleTimer = 0;
  p.tackleCooldown = 0;
  p.kickTimer = 0;
  p.celebrate = false;
  p.prevTackle = false;
}

function resetBall(b, x, y) {
  b.x = x;
  b.y = y;
  b.vx = 0;
  b.vy = 0;
  b.ownerId = null;
  b.lockId = null;
  b.lockTimer = 0;
  b.saveCooldown = 0;
}

function setupKickoff(state) {
  const cy = FIELD_CENTER.y;
  resetPlayer(state.players[0], FIELD_CENTER.x - 40, cy, 1, 0);
  resetPlayer(state.players[1], FIELD_CENTER.x + 40, cy, -1, 0);
  resetBall(state.ball, FIELD_CENTER.x, cy);
  for (const k of [state.keepers.left, state.keepers.right]) {
    k.y = cy;
    k.state = 'idle';
    k.diveTimer = 0;
  }
  state.phase = 'kickoff';
  state.phaseTimer = MATCH.kickoffTime;
}

function setMessage(state, text, timer) {
  state.message = { text, timer };
}

function updateMessage(state, dt) {
  if (!state.message) return;
  state.message.timer -= dt;
  if (state.message.timer <= 0) state.message = null;
}

// Oyuncu zamanlayıcıları her fazda azalır (kickoff/gol sırasında da takılmasın).
function decayPlayerTimers(state, dt) {
  for (const p of state.players) {
    if (p.tackleTimer > 0) p.tackleTimer -= dt;
    if (p.tackleCooldown > 0) p.tackleCooldown -= dt;
    if (p.kickTimer > 0) p.kickTimer -= dt;
  }
}

// --- Ana adım ------------------------------------------------------------

export function stepMatch(state, inputs, dt) {
  state.time += dt;
  updateMessage(state, dt);
  decayPlayerTimers(state, dt);

  if (state.phase === 'kickoff') {
    stepKeepers(state, dt);
    state.phaseTimer -= dt;
    if (state.phaseTimer <= 0) state.phase = 'play';
    return;
  }

  if (state.phase === 'goal') {
    stepKeepers(state, dt);
    state.phaseTimer -= dt;
    if (state.phaseTimer <= 0) {
      if (state.scores[0] >= MATCH.goalsToWin || state.scores[1] >= MATCH.goalsToWin) {
        state.phase = 'end';
        state.winner = state.scores[0] > state.scores[1] ? 0 : 1;
      } else {
        setupKickoff(state);
      }
    }
    return;
  }

  if (state.phase === 'end') {
    return; // her şey donuk
  }

  // --- play ---
  for (let i = 0; i < state.players.length; i++) {
    stepPlayer(state, state.players[i], inputs[i] || EMPTY_INPUT, dt);
  }
  stepKeepers(state, dt);
  updatePossession(state);
  stepBall(state, dt);
  if (state.ball.saveCooldown > 0) state.ball.saveCooldown -= dt;
  checkGoal(state);
}

function getPlayer(state, id) {
  for (const p of state.players) if (p.id === id) return p;
  return null;
}

function stepPlayer(state, p, input, dt) {
  // 1) Nişan yönü
  const alen = Math.hypot(input.aimX, input.aimY);
  if (alen > 1e-4) {
    p.aimX = input.aimX / alen;
    p.aimY = input.aimY / alen;
  }
  p.facingX = p.aimX;
  p.facingY = p.aimY;

  // 2) Hareket
  let mx = input.moveX;
  let my = input.moveY;
  const mlen = Math.hypot(mx, my);
  const moving = mlen > 1e-4;
  if (mlen > 1) {
    mx /= mlen;
    my /= mlen;
  }

  // Sprint + stamina
  const wantsSprint = !!input.sprint && moving;
  if (wantsSprint && !p.exhausted && p.stamina > 0) {
    p.sprinting = true;
    p.stamina = Math.max(0, p.stamina - STAMINA.drain * dt);
    p.regenTimer = STAMINA.regenDelay;
    if (p.stamina <= 0) {
      p.sprinting = false;
      p.exhausted = true;
      state.events.push({ type: 'exhaust', x: p.x, y: p.y });
    }
  } else {
    p.sprinting = false;
    p.regenTimer -= dt;
    if (p.regenTimer <= 0) {
      p.stamina = Math.min(STAMINA.max, p.stamina + STAMINA.regen * dt);
    }
    // Tükenmeden çıkmak için sprint bırakılmalı ve enerji eşiğe ulaşmalı.
    if (p.exhausted && !wantsSprint && p.stamina >= STAMINA.minStart) p.exhausted = false;
  }

  const speed = p.sprinting ? PLAYER.sprintSpeed : PLAYER.speed;
  const targetVx = moving ? mx * speed : 0;
  const targetVy = moving ? my * speed : 0;
  const rate = (moving ? PLAYER.accel : PLAYER.friction) * dt;
  p.vx = approach(p.vx, targetVx, rate);
  p.vy = approach(p.vy, targetVy, rate);
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.moving = moving;
  clampPlayerToField(p);

  // 3) Top çalma (F) — basılma anında
  if (input.tackle && !p.prevTackle && p.tackleCooldown <= 0) {
    p.tackleCooldown = TACKLE.cooldown;
    p.tackleTimer = TACKLE.duration;
    state.events.push({ type: 'tackle', x: p.x, y: p.y });
    tryTackle(state, p);
  }

  // 4) Şut ve pas şarjı / bırakma
  if (state.ball.ownerId !== p.id) {
    p.shootCharge = 0;
    p.passCharge = 0;
  }

  if (input.shoot && state.ball.ownerId === p.id) {
    p.shootCharge = Math.min(SHOOT.chargeTime, p.shootCharge + dt);
  } else if (p.prevShoot && !input.shoot && state.ball.ownerId === p.id && p.shootCharge > 0) {
    kick(state, p, SHOOT, p.shootCharge / SHOOT.chargeTime);
    p.shootCharge = 0;
  } else if (!input.shoot) {
    p.shootCharge = 0;
  }

  if (input.pass && state.ball.ownerId === p.id) {
    p.passCharge = Math.min(PASS.chargeTime, p.passCharge + dt);
  } else if (p.prevPass && !input.pass && state.ball.ownerId === p.id && p.passCharge > 0) {
    kick(state, p, PASS, p.passCharge / PASS.chargeTime);
    p.passCharge = 0;
  } else if (!input.pass) {
    p.passCharge = 0;
  }

  p.prevShoot = !!input.shoot;
  p.prevPass = !!input.pass;
  p.prevTackle = !!input.tackle;
}

function clampPlayerToField(p) {
  const r = PLAYER.radius;
  p.x = clamp(p.x, FIELD.x + r, FIELD.x + FIELD.w - r);
  p.y = clamp(p.y, FIELD.y + r, FIELD.y + FIELD.h - r);
}

function kick(state, p, cfg, power01) {
  const b = state.ball;
  const t = clamp01(power01);
  const speed = cfg.minSpeed + (cfg.maxSpeed - cfg.minSpeed) * t;
  b.ownerId = null;
  b.x = p.x + p.aimX * BALL.possessOffset;
  b.y = p.y + p.aimY * BALL.possessOffset;
  b.vx = p.aimX * speed;
  b.vy = p.aimY * speed;
  b.lockId = p.id;
  b.lockTimer = BALL.lockTime;
  p.hasBall = false;
  p.kickTimer = ANIM.kickTime; // tekme pozu
  state.events.push({ type: 'kick', x: b.x, y: b.y, power: t });
}

// Top çalma: menzildeki rakip topa sahipse sahiplik el değiştirir.
function tryTackle(state, p) {
  const b = state.ball;
  if (b.ownerId == null || b.ownerId === p.id) return;

  const victim = getPlayer(state, b.ownerId);
  if (!victim) return;

  const d = Math.hypot(victim.x - p.x, victim.y - p.y);
  if (d > TACKLE.range) return;

  b.ownerId = p.id;
  for (const other of state.players) other.hasBall = other === p;
  b.x = p.x + p.aimX * BALL.possessOffset;
  b.y = p.y + p.aimY * BALL.possessOffset;
  b.vx = p.vx;
  b.vy = p.vy;
  b.lockId = victim.id; // kurban hemen geri çalamasın
  b.lockTimer = BALL.lockTime;
  state.events.push({ type: 'steal', x: b.x, y: b.y });
}

function updatePossession(state) {
  const b = state.ball;
  if (b.ownerId != null) return;

  let best = null;
  let bestD = Infinity;
  for (const p of state.players) {
    if (b.lockId === p.id && b.lockTimer > 0) continue;
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    if (d <= BALL.possessRadius && d < bestD) {
      bestD = d;
      best = p;
    }
  }

  if (best) {
    b.ownerId = best.id;
    for (const p of state.players) p.hasBall = p === best;
    b.x = best.x + best.aimX * BALL.possessOffset;
    b.y = best.y + best.aimY * BALL.possessOffset;
    b.vx = best.vx;
    b.vy = best.vy;
  }
}

function stepBall(state, dt) {
  const b = state.ball;

  if (b.lockTimer > 0) {
    b.lockTimer -= dt;
    if (b.lockTimer <= 0) b.lockId = null;
  }

  const owner = b.ownerId != null ? getPlayer(state, b.ownerId) : null;

  if (owner) {
    b.x = owner.x + owner.aimX * BALL.possessOffset;
    b.y = owner.y + owner.aimY * BALL.possessOffset;
    b.vx = owner.vx;
    b.vy = owner.vy;
    return;
  }

  const sp = Math.hypot(b.vx, b.vy);
  if (sp > 1e-3) {
    const ns = Math.max(0, sp - BALL.friction * dt);
    const k = ns / sp;
    b.vx *= k;
    b.vy *= k;
  } else {
    b.vx = 0;
    b.vy = 0;
  }

  b.x += b.vx * dt;
  b.y += b.vy * dt;
  bounceWalls(b);
}

function bounceWalls(b) {
  const r = BALL.radius;
  const left = FIELD.x;
  const right = FIELD.x + FIELD.w;
  const top = FIELD.y;
  const bottom = FIELD.y + FIELD.h;
  const inMouth = isInGoalMouth(b.y);

  // Kale ağzında yan duvar sekmez: top kaleye girebilsin.
  if (!inMouth) {
    if (b.x - r < left) {
      b.x = left + r;
      b.vx = -b.vx;
    } else if (b.x + r > right) {
      b.x = right - r;
      b.vx = -b.vx;
    }
  }

  if (b.y - r < top) {
    b.y = top + r;
    b.vy = -b.vy;
  } else if (b.y + r > bottom) {
    b.y = bottom - r;
    b.vy = -b.vy;
  }
}

// --- Kaleci --------------------------------------------------------------

function stepKeepers(state, dt) {
  stepKeeper(state, state.keepers.left, dt);
  stepKeeper(state, state.keepers.right, dt);
}

function stepKeeper(state, k, dt) {
  if (k.diveTimer > 0) {
    k.diveTimer -= dt;
    if (k.diveTimer <= 0) k.state = 'idle';
    return;
  }
  const cy = FIELD_CENTER.y;
  const targetY = clamp(state.ball.y, cy - KEEPER.range, cy + KEEPER.range);
  k.y = approach(k.y, targetY, KEEPER.speed * dt);
  k.state = 'idle';
}

// --- Gol / kurtarış ------------------------------------------------------

function checkGoal(state) {
  const b = state.ball;
  if (b.ownerId != null) return; // sahipteyken gol olmaz
  if (b.saveCooldown > 0) return;
  if (!isInGoalMouth(b.y)) return;

  const left = FIELD.x;
  const right = FIELD.x + FIELD.w;

  if (b.x - BALL.radius <= left + 1) {
    resolveShot(state, 'left');
  } else if (b.x + BALL.radius >= right - 1) {
    resolveShot(state, 'right');
  }
}

function resolveShot(state, side) {
  const b = state.ball;
  const keeper = side === 'left' ? state.keepers.left : state.keepers.right;
  keeper.state = 'dive';
  keeper.diveTimer = 0.5;

  if (Math.random() < KEEPER.saveChance) {
    // Kurtarış: topu sahaya geri savur
    const dir = side === 'left' ? 1 : -1; // içeri doğru
    b.x = side === 'left' ? FIELD.x + BALL.radius + 3 : FIELD.x + FIELD.w - BALL.radius - 3;
    b.vx = dir * (110 + Math.random() * 70);
    b.vy = (Math.random() * 2 - 1) * 70;
    b.saveCooldown = 0.4;
    setMessage(state, 'KURTARIŞ!', 1.0);
    state.events.push({ type: 'save', side });
  } else {
    // Gol
    const scorer = side === 'left' ? 1 : 0; // sol kale → mavi, sağ kale → kırmızı
    state.scores[scorer] += 1;
    b.x = side === 'left' ? FIELD.x - BALL.radius : FIELD.x + FIELD.w + BALL.radius;
    b.vx = 0;
    b.vy = 0;
    keeper.state = 'sad';
    keeper.diveTimer = MATCH.goalTime;
    state.phase = 'goal';
    state.phaseTimer = MATCH.goalTime;
    state.players[scorer].celebrate = true;
    setMessage(state, 'GOL!', 1.4);
    state.events.push({ type: 'goal', side, scorer });
  }
}
