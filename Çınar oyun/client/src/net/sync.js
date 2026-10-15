// ============================================================
//  Sunucu state -> istemci state senkronizasyonu (basit)
//  30Hz snapshot; interpolation eklenebilir ama şimdilik doğrudan uyguluyoruz
// ============================================================

export class Sync {
  constructor() {
    this.lastT = 0;
  }

  applyState(localState, serverStateMsg) {
    if (!serverStateMsg || !serverStateMsg.state) return;
    const s = serverStateMsg.state;
    // Basit kopyalama (paylaşılan state nesneleri okunabilir)
    localState.players[0] = Object.assign(localState.players[0], s.players[0]);
    localState.players[1] = Object.assign(localState.players[1], s.players[1]);
    localState.ball = Object.assign(localState.ball, s.ball);
    localState.keepers.left = Object.assign(localState.keepers.left, s.keepers.left);
    localState.keepers.right = Object.assign(localState.keepers.right, s.keepers.right);
    localState.scores = s.scores.slice();
    localState.phase = s.phase;
    localState.phaseTimer = s.phaseTimer;
    localState.winner = s.winner;
    localState.message = s.message ? { ...s.message } : null;
    localState.time = s.time;
    // events sunucu tarafından tüketilir; istemci kendi events'ini temizler
    // Sunucudan gelen olayları istemciye yansıt
    localState.events = Array.isArray(serverStateMsg.events)
      ? serverStateMsg.events.map((e) => ({ ...e }))
      : [];
    this.lastT = serverStateMsg.t;
  }
}
