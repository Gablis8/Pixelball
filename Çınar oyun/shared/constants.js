// ============================================================
//  Paylaşılan sabitler — hem istemci (tarayıcı) hem sunucu kullanır.
//  Tek doğruluk kaynağı: ölçüler, hızlar, renkler burada tanımlanır.
// ============================================================

// Dahili (düşük çözünürlüklü) ekran boyutu. Tüm oyun bu çözünürlükte
// çizilir, sonra ekranda tam sayı katlarıyla büyütülür.
export const RESOLUTION = {
  width: 320,
  height: 180,
};

// Simülasyon ayarları
export const TICK_RATE = 60; // saniyedeki sabit simülasyon adımı (Hz)
export const SNAPSHOT_RATE = 30; // sunucunun durum yayın hızı (Hz) — Faz 4
export const FIXED_STEP = 1 / TICK_RATE; // tek adımın süresi (saniye)
export const MAX_FRAME_DELTA = 0.25; // büyük duraklamalarda sıçramayı önler (sn)

// Pixel-art renk paleti
export const PALETTE = {
  sky: '#0e0e14', // letterbox / arka plan
  grassEdge: '#3f7a33', // saha dışı çim (koyu)
  grassLight: '#72c85a', // biçme şeridi (açık)
  grassDark: '#5aa844', // biçme şeridi (koyu)
  line: '#f7f9ec', // saha çizgileri
  uiDark: '#1b1b24',
  uiLight: '#f7f9ec',
};

// Takım renkleri (forma). Aynı karakter sprite'ı bu palete göre renklenir.
export const TEAMS = {
  red: { jersey: '#e0483c', jerseyDark: '#a8322a' },
  blue: { jersey: '#4a7de0', jerseyDark: '#2f57a8' },
};

// Oyuncu hareket/denge değerleri
export const PLAYER = {
  radius: 6, // çarpışma yarıçapı (px)
  speed: 70, // normal hız (px/sn)
  sprintSpeed: 105, // sprint hızı (px/sn) — Faz 3
  accel: 600, // hedef hıza yaklaşma ivmesi (px/sn²)
  friction: 500, // girdi yokken yavaşlama (px/sn²)
};

// Top değerleri
export const BALL = {
  radius: 3, // çarpışma yarıçapı (px)
  friction: 55, // yerde yavaşlama (px/sn²)
  possessOffset: 9, // sahipteyken oyuncunun önünde durduğu mesafe (px)
  possessRadius: 9, // serbest topu alma yarıçapı (px)
  lockTime: 0.3, // şut/pas sonrası tekrar alma kilidi (sn)
};

// Şut değerleri
export const SHOOT = {
  chargeTime: 0.6, // tam güce ulaşma süresi (sn)
  minSpeed: 120, // en düşük şut hızı (px/sn)
  maxSpeed: 280, // en yüksek şut hızı (px/sn)
};

// Pas değerleri
export const PASS = {
  chargeTime: 0.5,
  minSpeed: 80,
  maxSpeed: 180,
};

// Kale geometrisi
export const GOAL = {
  height: 44, // ağız yüksekliği (px)
  depth: 8, // ağ derinliği (saha dışına doğru, px)
};

// Kaleci (fok balığı NPC) değerleri
export const KEEPER = {
  speed: 62, // yana kayma hızı (px/sn)
  range: 30, // kale merkezinden en fazla sapma (px)
  saveChance: 0.7, // kurtarma oranı (%70)
};

// Maç kuralları
export const MATCH = {
  goalsToWin: 3, // ilk 3 gol
  kickoffTime: 2.0, // kickoff dondurma süresi (sn)
  goalTime: 1.5, // gol kutlaması süresi (sn)
};

// Stamina (sprint enerjisi) — Faz 3
export const STAMINA = {
  max: 100,
  drain: 35, // sprint sırasında tükenme (birim/sn)
  regen: 22, // sprint dışında dolum (birim/sn)
  regenDelay: 0.5, // dolum başlamadan önce bekleme (sn)
  minStart: 20, // (yeniden) sprint başlatmak için gereken en az enerji
};

// Top çalma (F) — Faz 3
export const TACKLE = {
  range: 14, // etki menzili (px)
  cooldown: 0.9, // tekrar kullanma beklemesi (sn)
  duration: 0.25, // atılma pozu süresi (sn)
};

// Animasyon süreleri — Faz 3
export const ANIM = {
  kickTime: 0.16, // şut/pas sonrası tekme pozu (sn)
};
