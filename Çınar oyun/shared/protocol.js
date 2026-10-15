// ============================================================
//  WebSocket mesaj protokolü (Faz 4)
//  İstemci <-> Sunucu mesaj tipleri
// ============================================================

export const MSG = {
  // İstemci -> Sunucu
  CREATE: 'create', // Lobi oluştur
  JOIN: 'join', // Lobiye katıl { code }
  INPUT: 'input', // Girdi anlık snapshot'ı { seq, moveX,moveY,aimX,aimY,shoot,pass,sprint,tackle }
  PING: 'ping',
  LEAVE: 'leave', // Odadan çık (lobi "GERİ" butonu)
  REMATCH: 'rematch', // Maç sonunda rövanş isteği

  // Sunucu -> İstemci
  LOBBY: 'lobby', // Lobi bilgisi { code, playerId, players }
  JOINED: 'joined', // Katılma onayı { code, playerId, players }
  STATE: 'state', // Oyun durumu { t, seq, state, events }
  ERROR: 'error', // Hata { message }
  PONG: 'pong',
  START: 'start', // Maç başlıyor (ilk maç + rövanş)
  END: 'end',
  REMATCH_STATUS: 'rematchStatus', // Rövanş durumu { waiting: true }
  NOTICE: 'notice', // Geçici bilgi { message } (ör. "RAKİP AYRILDI")
};

export function makeCode() {
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // O,0,I,1 hariç
  let c = '';
  for (let i = 0; i < 5; i++) c += ALPHA[(Math.random() * ALPHA.length) | 0];
  return c;
}
