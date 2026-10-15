// ============================================================
//  Oda (Room) sınıfı — Faz 4
//  - Oda kodu üretir
//  - 2 oyuncuyu yönetir (id: 0 = kırmızı, 1 = mavi)
//  - Paylaşılan simülasyonu 60Hz'de adımlar, 30Hz'de state broadcast eder
//  - Girişleri alıp uygun player'a uygular
// ============================================================

import { makeCode, MSG } from '../shared/protocol.js';
import { createMatch, stepMatch, EMPTY_INPUT } from '../shared/simulation.js';
import { FIXED_STEP, SNAPSHOT_RATE } from '../shared/constants.js';

export class Room {
  constructor() {
    this.code = makeCode();
    this.players = new Map(); // ws -> { id, ws, input, seq }
    this.match = null;
    this.running = false;
    this.tickAccumulator = 0;
    this.lastUpdateTime = 0;
    this.lastBroadcast = 0;
    this.broadcastInterval = 1 / SNAPSHOT_RATE;
    this.rematchVotes = new Set(); // maç sonunda rövanş isteyen ws'ler
  }

  addPlayer(ws) {
    if (this.players.size >= 2) throw new Error('Oda dolu');
    const id = this.players.size; // 0 ilk katılan (kırmızı)
    this.players.set(ws, { id, ws, input: { ...EMPTY_INPUT }, seq: 0 });
    return id;
  }

  removePlayer(ws) {
    this.rematchVotes.delete(ws);
    const had = this.players.delete(ws);
    // Maç sürerken bir oyuncu ayrılırsa kalan oyuncuya bildir.
    // lobby:true → istemci lobiye dönüp yeni maç kurabilsin.
    if (had && this.running && this.players.size === 1) {
      for (const p of this.players.values()) {
        try {
          p.ws.send(JSON.stringify({ type: MSG.NOTICE, message: 'RAKIP AYRILDI', lobby: true }));
        } catch {
          /* kapalı olabilir */
        }
      }
    }
  }

  count() {
    return this.players.size;
  }

  start() {
    if (this.players.size !== 2) return;
    this.beginMatch();
  }

  // Maçı (yeniden) kurar, temiz durumla iki oyuncuya da START gönderir.
  // Hem ilk maç hem rövanş bu yolu kullanır.
  beginMatch() {
    this.match = createMatch();
    this.running = true;
    this.rematchVotes.clear();
    this.tickAccumulator = 0;
    this.lastUpdateTime = Date.now();
    this.lastBroadcast = 0;
    this.broadcast();
    for (const p of this.players.values()) {
      try {
        p.ws.send(JSON.stringify({ type: MSG.START, code: this.code }));
      } catch {
        /* kapalı olabilir */
      }
    }
  }

  // Maç sonunda rövanş: iki oyuncu da isterse yeni maç başlar.
  requestRematch(ws) {
    if (!this.players.has(ws)) return { accepted: false };
    if (!this.running || !this.match || this.match.phase !== 'end') {
      return { accepted: false };
    }
    this.rematchVotes.add(ws);
    if (this.rematchVotes.size >= 2 && this.players.size >= 2) {
      this.beginMatch(); // START herkese gider
      return { accepted: true, start: true };
    }
    return { accepted: true, start: false };
  }

  setInput(ws, input) {
    const p = this.players.get(ws);
    if (!p) return;
    p.input = { ...EMPTY_INPUT, ...input };
    p.seq = input.seq ?? p.seq;
  }

  update(dt) {
    if (!this.running || !this.match) return;
    const inputs = [EMPTY_INPUT, EMPTY_INPUT];
    for (const p of this.players.values()) inputs[p.id] = p.input;
    stepMatch(this.match, inputs, dt);
  }

  fixedUpdate(dt) {
    if (!this.running) return;
    this.tickAccumulator += dt;
    while (this.tickAccumulator >= FIXED_STEP) {
      this.update(FIXED_STEP);
      this.tickAccumulator -= FIXED_STEP;
    }
  }

  broadcast() {
    if (!this.running || !this.match) return;
    const payload = {
      type: MSG.STATE,
      t: Date.now(),
      seq: 0,
      state: this.match,
      events: this.match.events || [],
    };
    for (const p of this.players.values()) {
      try { p.ws.send(JSON.stringify(payload)); } catch { /* ignore */ }
    }
    if (this.match && this.match.events) this.match.events.length = 0;
  }

  tick() {
    const now = Date.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;
    this.fixedUpdate(dt);
    if (now - this.lastBroadcast >= 1000 / SNAPSHOT_RATE) {
      this.lastBroadcast = now;
      this.broadcast();
    }
  }

  isEmpty() {
    return this.players.size === 0;
  }

  getPlayersInfo() {
    const list = [];
    for (const p of this.players.values()) list.push({ id: p.id });
    return list;
  }
}
