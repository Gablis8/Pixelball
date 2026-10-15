// ============================================================
//  Pixel-art SPRITE VERİSİ (DOM'suz, saf veri).
//  Her sprite = satır dizisi; her karakter bir renk indeksidir.
//  '.' saydam demektir. 'j'/'J' = takım forması (palet takası ile değişir).
//  Oyuncu sprite'ları 12x16, top sprite'ı 6x6 pikseldir.
// ============================================================

// Oyuncu sprite renk paleti (j/J hariç; onlar takımdan gelir)
export const PLAYER_PALETTE = {
  o: '#241c1c', // kontur
  h: '#3a2a1e', // saç
  s: '#f2c79a', // ten
  e: '#241c1c', // göz
  m: '#b9553f', // ağız
  k: '#f4f4f4', // şort
  l: '#f4f4f4', // tozluk/çorap
  b: '#2a2222', // krampon
  '.': null, // saydam
};

// Top sprite'ı ve paleti
export const BALL_SPRITE = [
  '.oooo.',
  'oWWWWo',
  'oWBWWo',
  'oWWBWo',
  'oWWWWo',
  '.oooo.',
];

export const BALL_PALETTE = {
  o: '#1a1a20',
  W: '#f6f6f2',
  B: '#1a1a20',
  '.': null,
};

// Yönler: down (bize bakar), up (sırtı), side (sağa bakar; sol = aynalanır)
// Her yön için: idle / run1 / run2 kareleri
export const PLAYER_SPRITES = {
  down: {
    idle: [
      '.oooooooooo.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohssssssho.',
      '.ossessesso.',
      '.osssssssso.',
      '.osssmmssso.',
      '.ojjjjjjjjo.',
      'sojjjjjjjjos',
      'sojjjjjjjjos',
      '.ojjjjjjjjo.',
      '.okkkkkkkko.',
      '.okkkkkkkko.',
      '.olll..lllo.',
      '.olll..lllo.',
      '.obbb..bbbo.',
    ],
    run1: [
      '.oooooooooo.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohssssssho.',
      '.ossessesso.',
      '.osssssssso.',
      '.osssmmssso.',
      '.ojjjjjjjjo.',
      'sojjjjjjjjos',
      'sojjjjjjjjos',
      '.ojjjjjjjjo.',
      '.okkkkkkkko.',
      '.okkkkkkkko.',
      '.olll...llo.',
      '.olll...llo.',
      '.obbb...bbo.',
    ],
    run2: [
      '.oooooooooo.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohssssssho.',
      '.ossessesso.',
      '.osssssssso.',
      '.osssmmssso.',
      '.ojjjjjjjjo.',
      'sojjjjjjjjos',
      'sojjjjjjjjos',
      '.ojjjjjjjjo.',
      '.okkkkkkkko.',
      '.okkkkkkkko.',
      '.oll...lllo.',
      '.oll...lllo.',
      '.obb...bbbo.',
    ],
  },

  up: {
    idle: [
      '.oooooooooo.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ojjjjjjjjo.',
      'sojjjjjjjjos',
      'sojjjjjjjjos',
      '.ojjjjjjjjo.',
      '.okkkkkkkko.',
      '.okkkkkkkko.',
      '.olll..lllo.',
      '.olll..lllo.',
      '.obbb..bbbo.',
    ],
    run1: [
      '.oooooooooo.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ojjjjjjjjo.',
      'sojjjjjjjjos',
      'sojjjjjjjjos',
      '.ojjjjjjjjo.',
      '.okkkkkkkko.',
      '.okkkkkkkko.',
      '.olll...llo.',
      '.olll...llo.',
      '.obbb...bbo.',
    ],
    run2: [
      '.oooooooooo.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ojjjjjjjjo.',
      'sojjjjjjjjos',
      'sojjjjjjjjos',
      '.ojjjjjjjjo.',
      '.okkkkkkkko.',
      '.okkkkkkkko.',
      '.oll...lllo.',
      '.oll...lllo.',
      '.obb...bbbo.',
    ],
  },

  side: {
    idle: [
      '.oooooooooo.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohhhhsssso.',
      '.ohhhssesso.',
      '.ohhhssssso.',
      '.ohhhssmsso.',
      '.ojjjjjjjjo.',
      'sojjjjjjjjos',
      'sojjjjjjjjos',
      '.ojjjjjjjjo.',
      '.okkkkkkkko.',
      '.okkkkkkkko.',
      '..olll.llo..',
      '..olll.llo..',
      '..obbb.bbo..',
    ],
    run1: [
      '.oooooooooo.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohhhhsssso.',
      '.ohhhssesso.',
      '.ohhhssssso.',
      '.ohhhssmsso.',
      '.ojjjjjjjjo.',
      'sojjjjjjjjos',
      'sojjjjjjjjos',
      '.ojjjjjjjjo.',
      '.okkkkkkkko.',
      '.okkkkkkkko.',
      '..olll..llo.',
      '..olll..llo.',
      '..obbb..bbo.',
    ],
    run2: [
      '.oooooooooo.',
      '.ohhhhhhhho.',
      '.ohhhhhhhho.',
      '.ohhhhsssso.',
      '.ohhhssesso.',
      '.ohhhssssso.',
      '.ohhhssmsso.',
      '.ojjjjjjjjo.',
      'sojjjjjjjjos',
      'sojjjjjjjjos',
      '.ojjjjjjjjo.',
      '.okkkkkkkko.',
      '.okkkkkkkko.',
      '...olll.llo.',
      '...olll.llo.',
      '...obbb.bbo.',
    ],
  },
};

// Fok balığı kaleci sprite'ı (16x12). Sağa bakar; sol yön aynalanır.
// idle: açık göz, dive: kapalı göz (dalmış), sad: gol yemiş (gözyaşı).
export const SEAL_PALETTE = {
  o: '#2a2f38', // kontur
  W: '#dbe6ee', // gövde (açık gri-mavi)
  s: '#2a2f38', // göz
  t: '#6cc4ff', // gözyaşı
  '.': null,
};

export const SEAL_SPRITES = {
  idle: [
    '................',
    '.........ooo....',
    '........oWWWo...',
    '.......oWsWsWo..',
    '..oo...oWWWWWo..',
    '.oWWooWWWWWWWo..',
    'oWWWWWWWWWWWWWo.',
    'oWWWWWWWWWWWWWo.',
    '.oWWWWWWWWWWWo..',
    '..oWWWWWWWWWo...',
    '...ooWWWWoo.....',
    '.....oooo.......',
  ],
  dive: [
    '................',
    '.........ooo....',
    '........oWWWo...',
    '.......oWWWWWo..',
    '..oo...oWWWWWo..',
    '.oWWooWWWWWWWo..',
    'oWWWWWWWWWWWWWo.',
    'oWWWWWWWWWWWWWo.',
    '.oWWWWWWWWWWWo..',
    '..oWWWWWWWWWo...',
    '...ooWWWWoo.....',
    '.....oooo.......',
  ],
  sad: [
    '................',
    '.........ooo....',
    '........oWWWo...',
    '.......oWsWsWo..',
    '..oo...oWtWWWo..',
    '.oWWooWWWWWWWo..',
    'oWWWWWWWWWWWWWo.',
    'oWWWWWWWWWWWWWo.',
    '.oWWWWWWWWWWWo..',
    '..oWWWWWWWWWo...',
    '...ooWWWWoo.....',
    '.....oooo.......',
  ],
};

