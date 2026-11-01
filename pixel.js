/* ============================================================================
   PIXEL.JS - aset pixel art untuk Stasiun Transit
   Palet & gaya mengikuti referensi: stasiun bawah tanah top-down (lantai ungu,
   dinding grafiti, garis pengaman kuning) + karakter chibi ala Stardew Valley
   (template 16x22, 4 arah hadap, animasi jalan 3 frame, outline otomatis).
   Semua digambar prosedural (tanpa file gambar) supaya game tetap jalan offline.
   Teks di dalam dunia memakai font bitmap 3x5 yang digambar per-piksel.
   ============================================================================ */

/* ------------------------------------------------------------------- palet */
const PAL = {
  lantai: '#cfc3e0', lantaiGaris: '#b9abcf',
  lantai2: '#c4b7d8', lantaiBayang: '#a89ac0',
  dinding: '#4a4656', dinding2: '#565263', grafiti1: '#d46a9c', grafiti2: '#3fa8a0',
  grafiti3: '#e8e4ee', grafiti4: '#8a86a0',
  aman: '#f0b429', aman2: '#c98d1d',
  rel: '#2a2733', relTies: '#4a4656', relGaris: '#6b6580',
  kereta: '#eceaf2', keretaGaris: '#b9b4c6', keretaKaca: '#38506a',
  keretaTeal: '#4aa8b0', keretaTua: '#b8b4c0', karat: '#a06a7a',
  bangku: '#7a4a52', bangku2: '#96606a', bangkuBayang: '#5a343c',
  vending: '#c03848', vending2: '#e8e4ee', vendingAir: '#7ad0e8',
  meja: '#7a5a3a', meja2: '#9a7a54', mejaBayang: '#2e4a66',
  papan: '#12162a', papanText: '#ffd24a', papanText2: '#9fd8ff',
  pintu: '#2f6b45', pintu2: '#3f8a5c',
  gerbangTutup: '#e05563', gerbangBuka: '#4ade80', gerbangBukaTeks: '#8ef0b5',
  emas: '#ffd24a', emasTua: '#c9862a', bayang: 'rgba(0,0,0,.32)',
  outline: '#2a2438', teksGelap: '#413a55', teksRedup: '#6a6580',
  /* tambahan audit warna (dipakai world.js) */
  relBed: '#221d2e', relBed2: '#332c42',
  lantaiHall1: '#ccc1df', lantaiHall2: '#bfb3d4', lantaiPeron1: '#b9bdd1', lantaiPeron2: '#adb2c8',
  pilar: '#3a3548', awning: '#3a7a5a',
  poster1: '#3f6fa8', poster2: '#b8632f', poster3: '#7a4a8a',
  plafon: '#d8d4e0', plafonBayang: '#b8b4c4', lampu: '#fff7d8', lampuMati: '#8a86a0',
  dindingGer: '#c8b890', dindingGer2: '#b0a078', jendelaFrame: '#8a86a0',
  langit: '#0d1224', langitJendela: '#1a2030', kota1: '#1c2438', kota2: '#2a3450',
  kursi: '#6a3a42', kursi2: '#84505a', kursiBayang: '#4a2a32', dindingGerBawah: '#241d2c',
  lantaiGer: '#3a3344', lantaiGer2: '#464052', tiang: '#c8c4d0',
  pintuGer: '#7a4a52', pintuGer2: '#5a3840', gerbangMerahMuda: 'rgba(224,85,99,.12)',
  bayangNpc: 'rgba(0,0,0,.28)',
  teksPutih: '#e8e4ee', tintCap: 'rgba(120,240,180,.14)',
  pilar: '#8a8496', pilar2: '#9a94aa', pilarBayang: '#6a6578',
  potKayu: '#8a5a34', daun: '#3f8a5c', daun2: '#4ade80',
  pagarSita: 'rgba(224,85,99,.20)',
  kotakPrompt: 'rgba(9,15,26,.95)', kotakToast: 'rgba(9,15,26,.9)',
  mejaLoket: '#38bdf8', mejaPengaduan: '#f0a24a'
};

/* ---------------------------------------------------- font bitmap 3x5 */
/* Kamus glyph 3x5. Setiap glyph = 5 string 3 karakter ('X' = piksel).
   Huruf kapital + angka + tanda. Huruf kecil f g h k x (dari rumus) ikut disediakan
   supaya "f(x) = 3x + 1" tampil matematis benar. */
const FONT3 = {
  'A': ['.X.','X.X','XXX','X.X','X.X'],
  'B': ['XX.','X.X','XX.','X.X','XX.'],
  'C': ['.XX','X..','X..','X..','.XX'],
  'D': ['XX.','X.X','X.X','X.X','XX.'],
  'E': ['XXX','X..','XX.','X..','XXX'],
  'F': ['XXX','X..','XX.','X..','X..'],
  'G': ['.XX','X..','X.X','X.X','.XX'],
  'H': ['X.X','X.X','XXX','X.X','X.X'],
  'I': ['XXX','.X.','.X.','.X.','XXX'],
  'J': ['..X','..X','..X','X.X','.X.'],
  'K': ['X.X','X.X','XX.','X.X','X.X'],
  'L': ['X..','X..','X..','X..','XXX'],
  'M': ['X.X','XXX','X.X','X.X','X.X'],
  'N': ['XX.','X.X','X.X','X.X','X.X'],
  'O': ['XXX','X.X','X.X','X.X','XXX'],
  'P': ['XX.','X.X','XX.','X..','X..'],
  'Q': ['XXX','X.X','X.X','XXX','..X'],
  'R': ['XX.','X.X','XX.','X.X','X.X'],
  'S': ['.XX','X..','XXX','..X','XX.'],
  'T': ['XXX','.X.','.X.','.X.','.X.'],
  'U': ['X.X','X.X','X.X','X.X','XXX'],
  'V': ['X.X','X.X','X.X','X.X','.X.'],
  'W': ['X.X','X.X','X.X','XXX','X.X'],
  'X': ['X.X','X.X','.X.','X.X','X.X'],
  'Y': ['X.X','X.X','.X.','.X.','.X.'],
  'Z': ['XXX','..X','.X.','X..','XXX'],
  '0': ['XXX','X.X','X.X','X.X','XXX'],
  '1': ['.X.','XX.','.X.','.X.','XXX'],
  '2': ['XX.','..X','.X.','X..','XXX'],
  '3': ['XXX','..X','.XX','..X','XXX'],
  '4': ['X.X','X.X','XXX','..X','..X'],
  '5': ['XXX','X..','XXX','..X','XXX'],
  '6': ['.XX','X..','XXX','X.X','XXX'],
  '7': ['XXX','..X','..X','..X','..X'],
  '8': ['XXX','X.X','XXX','X.X','XXX'],
  '9': ['XXX','X.X','XXX','..X','XX.'],
  ' ': ['...','...','...','...','...'],
  '-': ['...','...','XXX','...','...'],
  '·': ['...','...','.X.','...','...'],
  '?': ['XX.','..X','.X.','...','.X.'],
  '!': ['.X.','.X.','.X.','...','.X.'],
  '+': ['...','.X.','XXX','.X.','...'],
  '×': ['...','X.X','.X.','X.X','...'],
  '→': ['...','..X','XXX','..X','...'],
  '✓': ['...','..X','.XX','X..','...'],
  '(': ['.X.','X..','X..','X..','.X.'],
  ')': ['.X.','..X','..X','..X','.X.'],
  '/': ['..X','..X','.X.','X..','X..'],
  ':': ['...','.X.','...','.X.','...'],
  '∘': ['...','.X.','X.X','.X.','...'],
  '=': ['...','XXX','...','XXX','...'],
  '.': ['...','...','...','...','.X.'],
  ',': ['...','...','...','.X.','X..'],
  'f': ['.XX','X..','XX.','X..','X..'],
  'g': ['.XX','X..','X.X','X.X','.XX'],
  'h': ['X..','X..','XX.','X.X','X.X'],
  'k': ['X..','X.X','XX.','X.X','X.X'],
  'x': ['...','X.X','.X.','X.X','...']
};
/* cache glyph per (karakter|warna|skala): canvas kecil, digambar sekali */
const _glyphCache = {};
function _glyph(karakter, warna, skala) {
  const key = karakter + '|' + warna + '|' + skala;
  if (_glyphCache[key]) return _glyphCache[key];
  const g = FONT3[karakter] || FONT3[karakter.toUpperCase()] || FONT3['?'];
  const cv = document.createElement('canvas');
  cv.width = 3 * skala; cv.height = 5 * skala;
  const c = cv.getContext('2d');
  c.fillStyle = warna;
  for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) {
    if (g[y][x] === 'X') c.fillRect(x * skala, y * skala, skala, skala);
  }
  _glyphCache[key] = cv;
  return cv;
}
function _ukuranTeks(teks, skala) { return teks.length * 4 * skala - skala; }
/* pxText - gambar teks bitmap per-piksel.
   skala = satuan gambar per piksel glyph: di dalam buffer stasiun/gerbong
   (transform 0.5) pakai 2 supaya 1 piksel glyph = 1 piksel buffer. */
function pxText(c, teks, x, y, warna, opsi) {
  const o = opsi || {};
  const skala = o.skala || 2;
  teks = String(teks).replace(/[\u2013\u2014\u2212]/g, '-');   // minus/dash → glyph '-'
  let px = Math.round(x);
  if (o.align === 'center') px = Math.round(x - _ukuranTeks(teks, skala) / 2);
  else if (o.align === 'right') px = Math.round(x - _ukuranTeks(teks, skala));
  const py = Math.round(y);
  for (let i = 0; i < teks.length; i++) {
    c.drawImage(_glyph(teks[i], warna, skala), px + i * 4 * skala, py);
  }
  return _ukuranTeks(teks, skala);
}
/* pxTextOutlined - teks dengan bayangan 1px gelap di kanan-bawah */
function pxTextOutlined(c, teks, x, y, warna, opsi) {
  const o = opsi || {};
  const skala = o.skala || 2;
  const bayang = o.bayang || PAL.outline;
  pxText(c, teks, x + skala, y + skala, bayang, opsi);
  return pxText(c, teks, x, y, warna, opsi);
}

/* ------------------------------------------------------- mesin sprite */
/* Template chibi 16x22. Huruf = slot warna:
   H=rambut h2=rambut gelap S=kulit T=baju t=baju gelap P=celana B=sepatu
   W=putih(mata) .=transparan. Outline gelap ditambahkan otomatis. */

const TPL_DOWN = [
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '...HHHHHHHHHH...',
  '...Hh2HHHHHHh2..',
  '...HSSSSSSSSH...',
  '...HSWSSSSWSH...',
  '....SSSSSSSS....',
  '...TTTTTTTTTT...',
  '..tTTTTTTTTtTT..',
  '..tTTTTTTTTtTT..',
  '..TTTTTtTTTTTT..',
  '..SSTTTTTTTTSS..',
  '...TTTTTTTTTT...',
  '...PPPPPPPPPP...',
  '...PPPPPpPPPP...',
  '...PPPP..PPPP...',
  '...PPPP..PPPP...',
  '...BBBB..BBBB...',
  '...BBBB..BBBB...',
  '................',
  '................'
];
const TPL_UP = [
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '...HHHHHHHHHH...',
  '...Hh2HHHHHHh2..',
  '...HHHHHHHHHH...',
  '...HHHHHHHHHH...',
  '....HHHHHHHH....',
  '...TTTTTTTTTT...',
  '..tTTTTTTTTtTT..',
  '..tTTTTTTTTtTT..',
  '..TTTTTtTTTTTT..',
  '..SSTTTTTTTTSS..',
  '...TTTTTTTTTT...',
  '...PPPPPPPPPP...',
  '...PPPPPpPPPP...',
  '...PPPP..PPPP...',
  '...PPPP..PPPP...',
  '...BBBB..BBBB...',
  '...BBBB..BBBB...',
  '................',
  '................'
];
/* samping (menghadap kanan; kiri = mirror) */
const TPL_SIDE = [
  '.....HHHHHH.....',
  '....HHHHHHHH....',
  '...HHHHHHHHHH...',
  '...HHHHHHHHHH...',
  '...HHh2HHHHHh...',
  '....HSSSSSSH....',
  '....HSSSWSSH....',
  '....SSSSSSS.....',
  '....TTTTTTTT....',
  '....tTTTTTTT....',
  '....tTTTTTTT....',
  '....TTTTtTTT....',
  '....TTTTTTTSS...',
  '....TTTTTTTT....',
  '....PPPPPPPP....',
  '....PPPPPPPp....',
  '....PPPPPP......',
  '....PPPPPPPP....',
  '....BBBBBBB.....',
  '....BBBBBB......',
  '................',
  '................'
];
/* frame jalan: kaki bergantian - ganti 4 baris terakhir tubuh */
const LEGS_DOWN_A = ['...PPPP.PPPP....', '...PPPP..PPPP...', '..BBBB...BBBB...', '..BBBB....BBB...'];
const LEGS_DOWN_B = ['....PPPP.PPPP...', '....PPPP.PPPP...', '...BBBB..BBBB...', '....BBB..BBBB...'];
const LEGS_UP_A = LEGS_DOWN_A, LEGS_UP_B = LEGS_DOWN_B;
const LEGS_SIDE_A = ['....PPPPPPPP....', '...PPPPPPPPP....', '...BBBBBBBB.....', '..BBBBBBB.......'];
const LEGS_SIDE_B = ['....PPPPPPPP....', '....PPPPPPPP....', '.....BBBBBBB....', '.....BBBBBB.....'];

/* susun matriks karakter dari template + kaki, lalu tambahkan outline 4-arah */
function _matriks(rows) {
  const m = rows.map(r => r.split(''));
  const outline = [];
  for (let y = -1; y <= m.length; y++) outline.push(new Array(18).fill(0));
  const solid = (x, y) => y >= 0 && y < m.length && x >= 0 && x < 16 && m[y][x] !== '.';
  for (let y = -1; y <= m.length; y++) for (let x = -1; x <= 16; x++) {
    const dalam = y >= 0 && y < m.length && x >= 0 && x < 16;
    if (dalam && m[y][x] !== '.') { outline[y + 1][x + 1] = m[y][x]; continue; }
    if (solid(x, y - 1) || solid(x, y + 1) || solid(x - 1, y) || solid(x + 1, y)) outline[y + 1][x + 1] = 'O';
  }
  return outline;                                // 18 kolom x 24 baris (margin 1px)
}
function spriteCanvas(rows, cfg) {
  const m = _matriks(rows);
  const cv = document.createElement('canvas');
  cv.width = 18; cv.height = 24;
  const c = cv.getContext('2d');
  const map = {
    H: cfg.hair, h2: cfg.hairD || cfg.hair, S: cfg.skin, T: cfg.top, t: cfg.topD || cfg.top,
    P: cfg.pants, p: cfg.pants, B: cfg.boots, W: '#ffffff', O: PAL.outline
  };
  for (let y = 0; y < m.length; y++) for (let x = 0; x < m[y].length; x++) {
    const ch = m[y][x];
    if (ch === 0 || ch === '.') continue;
    c.fillStyle = map[ch] || '#ff00ff';
    c.fillRect(x, y, 1, 1);
  }
  return cv;
}
function replaceLegs(tpl, legs) {
  const out = tpl.slice(0, tpl.length - legs.length).concat(legs);
  return out;
}
function mirrorCanvas(cv) {
  const m = document.createElement('canvas');
  m.width = cv.width; m.height = cv.height;
  const c = m.getContext('2d');
  c.translate(cv.width, 0); c.scale(-1, 1); c.drawImage(cv, 0, 0);
  return m;
}
/* Bangun 3 frame x 3 arah untuk satu karakter. left = mirror dari kanan. */
function makeSprite(cfg) {
  const d = [TPL_DOWN, replaceLegs(TPL_DOWN, LEGS_DOWN_A), replaceLegs(TPL_DOWN, LEGS_DOWN_B)];
  const u = [TPL_UP, replaceLegs(TPL_UP, LEGS_UP_A), replaceLegs(TPL_UP, LEGS_UP_B)];
  const s = [TPL_SIDE, replaceLegs(TPL_SIDE, LEGS_SIDE_A), replaceLegs(TPL_SIDE, LEGS_SIDE_B)];
  const down = d.map(r => spriteCanvas(r, cfg));
  const up = u.map(r => spriteCanvas(r, cfg));
  const right = s.map(r => spriteCanvas(r, cfg));
  const left = right.map(mirrorCanvas);
  return { down, up, left, right };
}

/* ------------------------- karakter (dari referensi user, warna setara) */
const CHAR_DEFS = {
  kurir:  { nama: 'KAMU',            hair: '#8a4a2a', hairD: '#6a3418', skin: '#f0c8a0', top: '#b89058', topD: '#94703f', pants: '#3a3a8a', boots: '#4a3220', bag: true },
  sari:   { nama: 'BU SARI',         hair: '#201820', hairD: '#100c10', skin: '#f0c8a0', top: '#e8e4ee', topD: '#c8c4d4', pants: '#a07850', boots: '#5a4a3a' },
  petugas:{ nama: 'PETUGAS',         hair: '#2a2a2a', hairD: '#1a1a1a', skin: '#e8b888', top: '#4a6ab8', topD: '#3a5290', pants: '#2a3a5a', boots: '#2a2a2a', cap: '#3a5290' },
  satpam: { nama: 'PAK SATPAM',      hair: '#2a2a2a', hairD: '#1a1a1a', skin: '#d8a878', top: '#5a6a7a', topD: '#46545f', pants: '#3a4450', boots: '#2a2a2a', cap: '#46545f' },
  anak:   { nama: 'ANAK SEKOLAH',    hair: '#8a6a3a', hairD: '#6a5028', skin: '#f0c8a0', top: '#8a5aa8', topD: '#6f4488', pants: '#4a4a9a', boots: '#5a4a3a' },
  ibu:    { nama: 'IBU BERKOPER',    hair: '#7a3a3a', hairD: '#5a2828', skin: '#f0c8a0', top: '#5a7a4a', topD: '#47623a', pants: '#4a5a3a', boots: '#5a4a3a' },
  tua:    { nama: 'PAK TUA',         hair: '#c8c4cc', hairD: '#9a96a4', skin: '#e8c0a0', top: '#8a5a5a', topD: '#6f4646', pants: '#4a4a5a', boots: '#3a3a44' },
  kucing: { nama: 'KUCING',          hair: '#e8a038', hairD: '#c8822a', skin: '#e8a038', top: '#e8a038', topD: '#c8822a', pants: '#e8a038', boots: '#c8822a' }
};
const SPRITES = {};
function initSprites() {
  if (SPRITES.kurir) return;
  for (const k in CHAR_DEFS) SPRITES[k] = makeSprite(CHAR_DEFS[k]);
}

/* ---------------------------------------------- gambar karakter di buffer */
/* Koordinat masuk dalam SATUAN DUNIA (transform 0.5 di buffer) - di-snap ke
   kelipatan 2 supaya sprite menempel ke grid piksel buffer (tidak bergetar). */
function pxChar(c, key, x, y, dir, frame, scale, name) {
  initSprites();
  const sp = SPRITES[key] || SPRITES.kurir;
  const f = (frame || 0) % 3;
  const img = (sp[dir] || sp.down)[f];
  const s = scale || 1;
  x = Math.round(x / 2) * 2; y = Math.round(y / 2) * 2;
  c.imageSmoothingEnabled = false;
  c.save(); c.translate(x - 9 * s, y - 23 * s); c.scale(s, s);
  c.drawImage(img, 0, 0);
  if (CHAR_DEFS[key] && CHAR_DEFS[key].bag) {     // tas kurir: strap emas diagonal
    c.fillStyle = '#ffcc55'; c.fillRect(4, 11, 10, 1); c.fillRect(12, 11, 2, 4);
  }
  c.restore();
  if (name) pxTextOutlined(c, name, x, y + 4, '#e8e4ee', { align: 'center' });
}
/* karakter DUDUK: hanya kepala+torso (14 baris atas) menyembul di atas sandaran */
function pxCharDuduk(c, key, x, y, name) {
  initSprites();
  const img = SPRITES[key].down[0];
  x = Math.round(x / 2) * 2; y = Math.round(y / 2) * 2;
  c.imageSmoothingEnabled = false;
  c.drawImage(img, 0, 0, 18, 14, x - 9, y - 14, 18, 14);
  if (name) pxTextOutlined(c, name, x, y - 18, '#e8e4ee', { align: 'center' });
}

/* ------------------------------------------- recolor aset GB Studio (data-URI) */
const _asetGBCache = {};
/* muatAsetGB('nama', ASET_GB.nama, PETA_GB.dasar) -> canvas recolored (null saat memuat) */
function muatAsetGB(nama, url, pemetaan, selesai) {
  if (_asetGBCache[nama]) { if (selesai) selesai(_asetGBCache[nama]); return _asetGBCache[nama]; }
  if (_asetGBCache['__m_' + nama]) return null;   // sedang memuat
  _asetGBCache['__m_' + nama] = true;
  const img = new Image();
  img.onload = () => {
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const c = cv.getContext('2d');
    c.drawImage(img, 0, 0);
    const d = c.getImageData(0, 0, cv.width, cv.height);
    const dd = d.data;
    for (let i = 0; i < dd.length; i += 4) {
      const m = pemetaan[dd[i] + ',' + dd[i + 1] + ',' + dd[i + 2]];
      if (m) { dd[i] = (m >> 16) & 255; dd[i + 1] = (m >> 8) & 255; dd[i + 2] = m & 255; }
    }
    c.putImageData(d, 0, 0);
    _asetGBCache[nama] = cv;
    if (selesai) selesai(cv);
  };
  img.src = url;
  return null;
}
/* konfigurasi recolor per aset: 4 warna GB + key transparan -> warna game.
   ubah di satu tempat ini saja kalau mau ganti nuansa. */
const PETA_GB = {
  dasar: {
    '224,248,207': 0xddd5ec,   // terang -> lantai interior ungu muda
    '134,192,108': 0x8a7fae,   // medium -> kursi ungu-abu
    '48,104,80': 0x52466e,     // medium gelap -> dinding/kerangka
    '7,24,33': 0x2a2438        // gelap -> outline
  },
  kereta: {
    '224,248,207': 0xf4f2fa,   // bodi highlight
    '134,192,108': 0xd8d4e4,   // bodi
    '48,104,80': 0x4aa8b0,     // strip teal
    '7,24,33': 0x2a2438,
    '101,255,0': null          // key -> transparan
  },
  emoteLove: {
    '224,248,207': 0xffffff, '134,192,108': 0xff6b9d, '48,104,80': 0xd04868,
    '7,24,33': 0x2a2438, '0,255,0': null
  },
  emoteTanya: {
    '224,248,207': 0xffffff, '134,192,108': 0x9fd8ff, '48,104,80': 0x38bdf8,
    '7,24,33': 0x2a2438, '0,255,0': null
  },
  eskalator: {
    '224,248,207': 0xddd5ec, '134,192,108': 0x8a7fae, '48,104,80': 0x52466e, '7,24,33': 0x2a2438
  }
};

/* ---------------------------------------------- potret NPC untuk dialog DOM */
/* kunci sprite dari nama pembicara dialog (dipakai dlg() di game.js) */
function kunciWajah(o) {
  const w = ((o.who || '') + ' ' + (o.tag || '')).toUpperCase();
  const urut = [['BU SARI', 'sari'], ['SATPAM', 'satpam'], ['PAK TUA', 'tua'],
    ['ANAK SEKOLAH', 'anak'], ['IBU BERKOPER', 'ibu'], ['PETUGAS', 'petugas'],
    ['PENGUMUMAN', 'petugas'], ['PENERIMA', 'satpam'], ['KERETA', 'petugas'],
    ['KURIR', 'kurir'], ['KANTOR', 'kurir'], ['SURAT', 'kurir'], ['KOTAK POS', 'kurir']];
  for (const [k, v] of urut) if (w.indexOf(k) >= 0) return v;
  return 'kurir';
}
/* gambar potret bust (kepala+torso, crop atas sprite) ke canvas .face dialog */
function gambarWajah(cv) {
  initSprites();
  const sp = (SPRITES[cv.dataset.key] || SPRITES.kurir).down[0];
  const c = cv.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.fillStyle = '#0e1728';
  c.fillRect(0, 0, cv.width, cv.height);
  const s = 4;
  c.drawImage(sp, 0, 0, 18, 14, (cv.width - 18 * s) / 2, cv.height - 14 * s - 4, 18 * s, 14 * s);
  return cv;
}

/* pra-muat semua aset GB (dipanggil saat World.start) */
function siapkanAsetGB() {
  muatAsetGB('interior', ASET_GB.interior, PETA_GB.dasar);
  muatAsetGB('kereta', ASET_GB.kereta, PETA_GB.kereta);
  muatAsetGB('emoteLove', ASET_GB.emoteLove, PETA_GB.emoteLove);
  muatAsetGB('emoteTanya', ASET_GB.emoteTanya, PETA_GB.emoteTanya);
  muatAsetGB('eskalator', ASET_GB.eskalator, PETA_GB.eskalator);
}


/* ------------------------------------------------------------- tile dunia */
function pxFloor(c, x0, y0, w, h, t) {
  c.fillStyle = PAL.lantai; c.fillRect(x0, y0, w, h);
  c.strokeStyle = PAL.lantaiGaris; c.lineWidth = 1;
  c.beginPath();
  for (let x = x0 - (x0 % 40); x <= x0 + w; x += 40) { c.moveTo(x, y0); c.lineTo(x, y0 + h); }
  for (let y = y0 - (y0 % 40); y <= y0 + h; y += 40) { c.moveTo(x0, y); c.lineTo(x0 + w, y); }
  c.stroke();
  c.fillStyle = PAL.lantai2;
  const off = Math.floor((t || 0) / 8);
  for (let i = 0; i < 30; i++) {
    const ix = ((i * 7 + off) % 24) * 40 + 20, iy = ((i * 5) % 15) * 40 + 60;
    if (ix > x0 && ix < x0 + w && iy > y0 && iy < y0 + h) c.fillRect(ix, iy, 40, 40);
  }
}
function pxWallStrip(c, x, y, w, seed) {
  c.fillStyle = PAL.dinding; c.fillRect(x, y, w, 26);
  c.fillStyle = PAL.dinding2; c.fillRect(x, y + 22, w, 4);
  const g = [PAL.grafiti1, PAL.grafiti2, PAL.grafiti3, PAL.grafiti4];
  let s = seed || 7;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let bx = x + 12; bx < x + w - 30; bx += 34 + Math.floor(rnd() * 30)) {
    c.strokeStyle = g[Math.floor(rnd() * g.length)];
    c.lineWidth = 2; c.beginPath();
    const yy = y + 5 + rnd() * 12, n = 3 + Math.floor(rnd() * 3);
    c.moveTo(bx, yy);
    for (let i = 1; i <= n; i++) c.lineTo(bx + i * 7, yy + (rnd() - 0.5) * 10);
    c.stroke();
  }
}
function pxBench(c, x, y) {
  c.fillStyle = PAL.outline; c.fillRect(x - 1, y - 1, 122, 26);
  c.fillStyle = PAL.bangku; c.fillRect(x, y, 120, 24);
  c.fillStyle = PAL.bangku2;
  for (let i = 0; i < 4; i++) c.fillRect(x + 6 + i * 30, y + 3, 24, 18);
}
function pxVending(c, x, y) {
  c.fillStyle = PAL.outline; c.fillRect(x - 1, y - 1, 30, 50);
  c.fillStyle = PAL.vending; c.fillRect(x, y, 28, 48);
  c.fillStyle = PAL.vending2; c.fillRect(x + 4, y + 6, 12, 24);
  c.fillStyle = PAL.vendingAir; c.fillRect(x + 6, y + 9, 3, 6); c.fillRect(x + 11, y + 12, 3, 6);
  c.fillStyle = PAL.emas; c.fillRect(x + 4, y + 34, 20, 4);
}
function pxPapan(c, x, y, w, h) {
  c.fillStyle = PAL.outline; c.fillRect(x - 2, y - 2, w + 4, h + 4);
  c.fillStyle = PAL.papan; c.fillRect(x, y, w, h);
}
function pxLoket(c, x, y, w, h) {
  c.fillStyle = PAL.outline; c.fillRect(x - 2, y - 2, w + 4, h + 4);
  c.fillStyle = PAL.meja; c.fillRect(x, y, w, h);
  c.fillStyle = PAL.meja2; c.fillRect(x, y, w, 6);
  c.fillStyle = PAL.keretaKaca; c.fillRect(x + w - 40, y - 14, 34, 14);
  c.fillStyle = PAL.aman; c.fillRect(x + 4, y + h - 6, w - 8, 3);
}
function pxGerbang(c, o, open) {
  c.fillStyle = open ? 'rgba(74,222,128,.18)' : 'rgba(224,85,99,.16)';
  c.fillRect(o.x, o.y, o.w, o.h);
  c.strokeStyle = open ? PAL.gerbangBuka : PAL.gerbangTutup; c.lineWidth = 2;
  c.strokeRect(o.x + 1, o.y + 1, o.w - 2, o.h - 2);
  const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
  const ang = (Date.now() / 600) % (Math.PI * 2);
  c.fillStyle = PAL.keretaGaris;
  for (let i = 0; i < 3; i++) {
    const a = ang + i * (Math.PI * 2 / 3);
    c.fillRect(Math.round(cx + Math.cos(a) * 10) - 2, Math.round(cy + Math.sin(a) * 6) - 2, 4, 4);
  }
  pxText(c, open ? 'LOLOS' : 'TIKET?', o.x + o.w / 2, o.y - 12, open ? PAL.gerbangBukaTeks : '#ffb0a8', { align: 'center' });
}
function pxRel(c, x, y, w) {
  c.fillStyle = PAL.rel; c.fillRect(x, y - 24, w, 48);
  c.fillStyle = PAL.relTies;
  for (let bx = x; bx < x + w; bx += 18) c.fillRect(bx, y - 18, 10, 36);
  c.fillStyle = PAL.relGaris; c.fillRect(x, y - 3, w, 3); c.fillRect(x, y + 10, w, 3);
}
function pxKereta(c, x, y, w, modern) {
  const body = modern ? PAL.kereta : PAL.keretaTua;
  const line = modern ? PAL.keretaTeal : PAL.karat;
  c.fillStyle = PAL.outline; c.fillRect(x, y - 2, w, 44);
  c.fillStyle = body; c.fillRect(x, y, w, 40);
  c.fillStyle = line; c.fillRect(x, y + 30, w, 4);
  c.fillStyle = body;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x - 14, y + 18); c.lineTo(x - 14, y + 40); c.lineTo(x, y + 40); c.fill();
  c.fillStyle = PAL.keretaKaca; c.fillRect(x - 10, y + 8, 8, 10);
  c.fillStyle = PAL.keretaKaca;
  for (let wx = x + 12; wx < x + w - 20; wx += 34) c.fillRect(wx, y + 6, 22, 12);
  c.fillStyle = line;
  for (let dx = x + w - 40; dx > x + 30; dx -= 90) c.fillRect(dx, y + 4, 10, 36);
  c.fillStyle = PAL.outline;
  for (let rx = x + 16; rx < x + w; rx += 34) { c.beginPath(); c.arc(rx, y + 42, 4, 0, 6.3); c.fill(); }
}
