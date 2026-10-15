// ============================================================
//  Lobi (Faz 5) — pixel sanatlı çok oyunculu menü
//  - Arka plan (BG): koddan çizilen stadyum ışıkları + dev futbol topu
//    (ekran yüksekliğinin ~3/4'ünü kaplar).
//  - Görünümler: ANA MENÜ → ODA KODU (host) → KOD GİRİŞİ (katılan)
//  - Hiçbir oyun mantığı içermez; yalnızca arayüz + sunucu mesaj kabloları.
// ============================================================

const BG_H = 180; // arka plan tamponunun dahili yüksekliği (pixel)

// --- Pixel renk yardımcıları ---------------------------------------

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function mixHex(a, b, t) {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const r = Math.round(A[0] + (B[0] - A[0]) * k);
  const g = Math.round(A[1] + (B[1] - A[1]) * k);
  const bl = Math.round(A[2] + (B[2] - A[2]) * k);
  return `rgb(${r},${g},${bl})`;
}

// --- Pixel geometri yardımcıları -----------------------------------

function pentagonPts(cx, cy, r, rot) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const a = rot + (i * 2 * Math.PI) / 5;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

function inPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0];
    const yi = pts[i][1];
    const xj = pts[j][0];
    const yj = pts[j][1];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// Noktanın doğru parçasına uzaklığının karesi (seam çizgileri için)
function distToSegSq(px, py, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((px - x0) * dx + (py - y0) * dy) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const ex = px - (x0 + dx * t);
  const ey = py - (y0 + dy * t);
  return ex * ex + ey * ey;
}

// --- Arka plan çizimi (tek seferlik, resize'da yeniden) ------------

// Yumuşak ışık huzmesi + direk (pixel noktalarla)
function drawFloodlight(ctx, x, y, rnd) {
  // direk
  ctx.fillStyle = '#171b23';
  ctx.fillRect(x, y + 5, 2, 34);
  // lamba kafası
  ctx.fillStyle = '#e8dc9c';
  ctx.fillRect(x - 3, y, 8, 5);
  ctx.fillStyle = '#fff8cc';
  ctx.fillRect(x - 2, y + 1, 6, 3);
  // huzme (yoğunluk merkezden uzaklaştıkça azalır)
  ctx.fillStyle = 'rgba(255,240,180,0.45)';
  for (let ring = 1; ring <= 13; ring++) {
    const prob = 0.6 * (1 - ring / 14);
    const count = Math.round(26 * ring * prob);
    for (let i = 0; i < count; i++) {
      const a = rnd() * Math.PI * 2;
      const rr = ring + rnd() * 2;
      ctx.fillRect(Math.round(x + Math.cos(a) * rr), Math.round(y + 3 + Math.sin(a) * rr), 1, 1);
    }
  }
}

// Dev futbol topu: gölge + beyaz gövde + siyah beşgenler + dikişler + parlama
function drawBall(ctx, cx, cy, r) {
  // 1) Zemin gölgesi (çim üzerinde)
  const srx = Math.round(r * 0.92);
  const sry = Math.max(3, Math.round(r * 0.16));
  const sy = cy + r + Math.round(sry * 0.5);
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  for (let y = -sry; y <= sry; y++) {
    for (let x = -srx; x <= srx; x++) {
      if ((x * x) / (srx * srx) + (y * y) / (sry * sry) <= 1) {
        ctx.fillRect(cx + x, sy + y, 1, 1);
      }
    }
  }

  // 2) Beşgen desen (1 merkez + 5 kenar) — köşeler dışa bakar
  const patches = [pentagonPts(cx, cy, r * 0.3, -Math.PI / 2)];
  const seams = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const d = r * 0.72;
    patches.push(pentagonPts(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * 0.3, a));
    // Merkez beşgenin köşesinden kenara uzanan dikiş
    seams.push([
      cx + Math.cos(a) * r * 0.3,
      cy + Math.sin(a) * r * 0.3,
      cx + Math.cos(a) * r,
      cy + Math.sin(a) * r,
    ]);
  }

  // 3) Gövde pikselleri
  const shades = [];
  for (let i = 0; i < 16; i++) shades.push(mixHex('#98a2b0', '#f7f9f8', i / 15));

  const specX = cx - r * 0.42;
  const specY = cy - r * 0.46;
  const specR = r * 0.17;
  const r2 = r * r;
  const inner = (r - 1.6) * (r - 1.6);

  for (let y = cy - r - 1; y <= cy + r + 1; y++) {
    for (let x = cx - r - 1; x <= cx + r + 1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;

      let color;
      if (d2 > inner) {
        color = '#141720'; // kontur
      } else if (inPoly(x + 0.5, y + 0.5, patches)) {
        color = '#191c24'; // siyah beşgen (hafif mavi tonlu)
      } else {
        // dikiş kontrolü (yalnızca beyaz bölgede)
        let seam = false;
        for (const s of seams) {
          if (distToSegSq(x + 0.5, y + 0.5, s[0], s[1], s[2], s[3]) <= 1.2) {
            seam = true;
            break;
          }
        }
        const sdx = x - specX;
        const sdy = y - specY;
        if (sdx * sdx + sdy * sdy <= specR * specR) {
          color = '#ffffff'; // parlama
        } else if (seam) {
          color = '#c6cedb'; // dikiş izi
        } else {
          // sol üstten ışık → küresel gölgeleme
          const t = 0.5 + ((-dx / r) * 0.5 + (-dy / r) * 0.75) * 0.55;
          color = shades[Math.round((t < 0 ? 0 : t > 1 ? 1 : t) * 15)];
        }
      }
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function drawBackground(canvas) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Deterministik sahte rastgele (her çizimde aynı görüntü)
  let seed = 20261015;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Parmak izi ölçüsü: küçük kenar (top ve oranlar buna göre)
  const base = Math.min(w, h);
  const cx = Math.round(w / 2);
  const cy = Math.round(h / 2);
  const r = Math.round(base * 0.375); // top: küçük kenarın ~3/4'ü (çap)

  // 1) Gece stadyum geçişi
  for (let y = 0; y < h; y++) {
    ctx.fillStyle = mixHex('#05070d', '#0c1a12', y / h);
    ctx.fillRect(0, y, w, 1);
  }

  // 2) Seyirci bandı (renkli piksel noktalar)
  const crowdTop = Math.round(h * 0.1);
  const crowdBottom = Math.round(h * 0.46);
  const crowdColors = ['#3b4a68', '#6a5a3a', '#4a6a4a', '#7a7a8a', '#5a4a6a', '#8a7a5a'];
  ctx.fillStyle = 'rgba(4,6,12,0.55)';
  ctx.fillRect(0, crowdTop, w, crowdBottom - crowdTop);
  const bandH = crowdBottom - crowdTop;
  const dots = Math.round((w * bandH) / 24);
  for (let i = 0; i < dots; i++) {
    const x = Math.floor(rnd() * w);
    const y = crowdTop + Math.floor(rnd() * bandH);
    ctx.fillStyle = crowdColors[Math.floor(rnd() * crowdColors.length)];
    ctx.fillRect(x, y, 1, 1);
  }

  // 3) Projeksiyon direkleri
  drawFloodlight(ctx, Math.round(w * 0.08), crowdTop + 3, rnd);
  drawFloodlight(ctx, Math.round(w * 0.92), crowdTop + 3, rnd);

  // 4) Çim: topun altına denk gelecek şekilde (dikey biçme şeritleri)
  const grassY = Math.max(crowdBottom + 4, cy + r - Math.round(base * 0.14));
  const stripe = Math.max(10, Math.round(base / 13));
  for (let x = 0; x < w; x += stripe) {
    const even = (x / stripe) % 2 === 0;
    ctx.fillStyle = even ? '#1d5c2c' : '#174a24';
    ctx.fillRect(x, grassY, Math.min(stripe, w - x), h - grassY);
  }
  ctx.fillStyle = '#e9efe0'; // yan çizgi
  ctx.fillRect(0, grassY, w, 1);
  ctx.fillStyle = 'rgba(233,239,224,0.5)'; // orta çizgi
  ctx.fillRect(cx, grassY, 1, h - grassY);

  // 5) Dev futbol topu (çim üzerinde durur)
  drawBall(ctx, cx, cy, r);
}

// --- Lobi arayüzü ---------------------------------------------------

export class Lobby {
  constructor(container) {
    this.container = container;
    this.root = document.createElement('div');
    this.root.className = 'lobby';
    this.root.innerHTML = `
      <canvas class="lobby-bg" id="lobby-bg"></canvas>
      <div class="lobby-scrim"></div>

      <div class="lobby-view" id="view-home">
        <div class="lobby-title">
          <div class="title-main">PIXEL FUTBOL</div>
          <div class="title-sub">ÇOK OYUNCULU</div>
        </div>
        <div class="home-actions">
          <button class="pixel-btn big" id="btn-create">LOBI OLUŞTUR</button>
          <button class="pixel-btn big" id="btn-join-show">LOBI KATIL</button>
        </div>
        <div class="lobby-tags">1V1 ONLINE <span>&bull;</span> İLK 3 GOL <span>&bull;</span> FOK KALECİ</div>
      </div>

      <div class="lobby-view lobby-panel" id="view-create" style="display:none">
        <div class="panel-card">
          <div class="panel-title">ODA KODU</div>
          <div class="code-big" id="code-big">-----</div>
          <button class="pixel-btn small" id="btn-copy">PANOLARA KOPYALA</button>
          <div class="panel-text blink" id="create-msg">İKİNCİ OYUNCU BEKLENİYOR...</div>
          <button class="pixel-btn small ghost" id="btn-back-create">GERİ</button>
        </div>
      </div>

      <div class="lobby-view lobby-panel" id="view-join" style="display:none">
        <div class="panel-card">
          <div class="panel-title">ODA KODUNU GİR</div>
          <input class="code-input-big" id="code-input-big" maxlength="5" autocomplete="off" spellcheck="false" placeholder="-----" />
          <div class="panel-row">
            <button class="pixel-btn" id="btn-join">KATIL</button>
            <button class="pixel-btn small ghost" id="btn-back-join">GERİ</button>
          </div>
          <div class="panel-text" id="join-msg"></div>
        </div>
      </div>

      <div class="lobby-status" id="lobby-status"></div>
    `;
    this.container.appendChild(this.root);

    this.bg = this.root.querySelector('#lobby-bg');
    this.viewHome = this.root.querySelector('#view-home');
    this.viewCreate = this.root.querySelector('#view-create');
    this.viewJoin = this.root.querySelector('#view-join');

    this.status = this.root.querySelector('#lobby-status');
    this.codeBig = this.root.querySelector('#code-big');
    this.codeInput = this.root.querySelector('#code-input-big');
    this.joinMsg = this.root.querySelector('#join-msg');

    this.btnCreate = this.root.querySelector('#btn-create');
    this.btnJoinShow = this.root.querySelector('#btn-join-show');
    this.btnCopy = this.root.querySelector('#btn-copy');
    this.btnJoin = this.root.querySelector('#btn-join');
    this.btnBackCreate = this.root.querySelector('#btn-back-create');
    this.btnBackJoin = this.root.querySelector('#btn-back-join');

    this._onCreate = null;
    this._onJoin = null;
    this._onLeave = null;
    this._pending = false;
    this.currentCode = '';

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);

    this._wireEvents();
    this.resize();
  }

  _wireEvents() {
    this.btnCreate.onclick = () => {
      this._show('create');
      this._onCreate && this._onCreate();
    };

    this.btnJoinShow.onclick = () => {
      this._show('join');
      this.joinMsg.textContent = '';
      setTimeout(() => this.codeInput.focus(), 20);
    };

    this.btnCopy.onclick = async () => {
      const label = this.btnCopy.textContent;
      try {
        await navigator.clipboard.writeText(this.currentCode);
        this.btnCopy.textContent = 'KOPYALANDI!';
      } catch (e) {
        this.btnCopy.textContent = 'KOPYALANAMADI';
      }
      setTimeout(() => (this.btnCopy.textContent = label), 900);
    };

    this.btnJoin.onclick = () => {
      if (this._pending) return;
      const code = (this.codeInput.value || '').trim().toUpperCase();
      if (code.length !== 5) {
        this.joinMsg.textContent = '5 HARFLİ KOD GİRİN';
        return;
      }
      this._pending = true;
      this.btnJoin.disabled = true;
      this.btnJoin.textContent = 'KATILINIYOR...';
      this.joinMsg.textContent = '';
      this._onJoin && this._onJoin(code);
    };

    this.btnBackCreate.onclick = () => {
      this._show('home');
      this.status.textContent = '';
      this._onLeave && this._onLeave(); // sunucudaki odayı bırak
    };

    this.btnBackJoin.onclick = () => {
      this._show('home');
      this._resetJoinButton();
    };

    this.codeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.btnJoin.click();
      }
    });
  }

  _resetJoinButton() {
    this._pending = false;
    this.btnJoin.disabled = false;
    this.btnJoin.textContent = 'KATIL';
  }

  _show(name) {
    this.viewHome.style.display = name === 'home' ? 'flex' : 'none';
    this.viewCreate.style.display = name === 'create' ? 'flex' : 'none';
    this.viewJoin.style.display = name === 'join' ? 'flex' : 'none';
  }

  resize() {
    if (!this.bg) return;
    // Tampon, ekranın oranını korur → top her ekranda tam daire kalır.
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    let w;
    let h;
    if (aspect >= 1) {
      h = BG_H;
      w = Math.round(BG_H * aspect);
      if (w > 640) {
        w = 640;
        h = Math.round(640 / aspect);
      }
    } else {
      w = BG_H;
      h = Math.round(BG_H / aspect);
      if (h > 720) {
        h = 720;
        w = Math.round(720 * aspect);
      }
    }
    this.bg.width = Math.max(64, w);
    this.bg.height = Math.max(64, h);
    drawBackground(this.bg);
  }

  setHandlers(onCreate, onJoin, onLeave) {
    this._onCreate = onCreate;
    this._onJoin = onJoin;
    this._onLeave = onLeave;
  }

  show() {
    this.root.style.display = 'flex';
  }

  hide() {
    this.root.style.display = 'none';
    this._show('home');
    this._resetJoinButton();
    this.joinMsg.textContent = '';
  }

  setCode(code) {
    this.currentCode = (code || '').toUpperCase();
    if (this.codeBig) this.codeBig.textContent = this.currentCode || '-----';
  }

  // Sunucudan gelen bilgi/hata metnini görünür şekilde gösterir.
  setInfo(text) {
    const t = text || '';
    if (this.status) {
      const isError = /^(hata|bağlantı)/i.test(t);
      this.status.textContent = t;
      this.status.classList.toggle('error', isError);
      this.status.classList.toggle('ok', /^katildin/i.test(t));
      if (isError && this.viewJoin.style.display !== 'none') {
        this.joinMsg.textContent = t;
      }
    }
    // Yalnızca "ODA KODU: XXXXX" / "KATILDIN: XXXXX" biçiminden kod çıkar
    // (öbür türlü "KURULAMADI" gibi kelimeler yanlışlıkla kod sayılırdı).
    const m = t.match(/(?:ODA KODU|KATILDIN):\s*([A-Z0-9]{5})/);
    if (m) this.setCode(m[1]);
    this._resetJoinButton();
  }
}
