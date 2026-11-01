/* ============================================================================
   WORLD.JS - stasiun yang bisa dijelajahi (canvas 2D pixel-art)
   Dua mode tampilan:
     - 'stasiun' : top-down ala stasiun bawah tanah (buffer 480x310, di-zoom 2x)
     - 'gerbong' : side-view interior kereta, latar jendela bergulir (melaju)
   Bagian cerita/soal tetap ditangani game.js lewat window.AKSI.
   ============================================================================ */

const WD = 960, WH = 620;                 // ukuran dunia (piksel logis)
const W = { cv: null, ctx: null, sc: 1, ox: 0, oy: 0, t: 0, t8: 0, buf: null, bctx: null, mode: 'stasiun' };

const JALUR_Y = { f: 132, g: 252, h: 372, k: 492 };

/* Tema visual per stasiun (Fase 8): HANYA warna, teks poster, dan varian properti
   yang berubah. Geometri gameplay (JALUR_Y, gerbang, loket, SOLID) tidak disentuh.
   Semua deterministik, tanpa Math.random. */
const TEMA_STASIUN = [
  { nama: 'PUSAT',   dinding: '#474259', dinding2: '#57526a',
    hall1: '#ccc1df', hall2: '#bfb3d4', peron1: '#b9bdd1', peron2: '#adb2c8',
    aman: '#f0b429', aman2: '#c98d1d', chip: '#ffd24a', vending: '#c03848',
    luar: '#161226', nat: 'rgba(146,136,172,.5)', papan: '#9fd8ff',
    varian: 'tanaman',
    poster: ['JADWAL', 'IKLAN', 'PETA', 'MUSIK'],
    posterCol: ['#3f6fa8', '#b8632f', '#3f6fa8', '#7a4a8a'] },
  { nama: 'TIMUR',   dinding: '#2f4a5a', dinding2: '#3a586b',
    hall1: '#bfd8de', hall2: '#aecbd4', peron1: '#a9c9d1', peron2: '#97bac4',
    aman: '#4aa8b0', aman2: '#3a8a92', chip: '#7ad0e8', vending: '#2f7a8a',
    luar: '#0d1620', nat: 'rgba(120,160,170,.5)', papan: '#7ad0e8',
    varian: 'tanaman',
    poster: ['PASAR', 'BAJU', 'KULINER', 'MAINAN'],
    posterCol: ['#b8632f', '#c9a447', '#3f8a5c', '#b8632f'] },
  { nama: 'SELATAN', dinding: '#3a5a40', dinding2: '#476b4e',
    hall1: '#c9dcc0', hall2: '#b8cfad', peron1: '#b5ccaa', peron2: '#a3bd97',
    aman: '#8ac06a', aman2: '#6da050', chip: '#a8e08a', vending: '#3f8a5c',
    luar: '#101c14', nat: 'rgba(130,170,130,.5)', papan: '#b8e0a0',
    varian: 'pilar',
    poster: ['TAMAN', 'BUNGA', 'DANAU', 'LARI'],
    posterCol: ['#3f8a5c', '#d04868', '#3f6fa8', '#8a8a4a'] },
  { nama: 'BARAT',   dinding: '#6a4436', dinding2: '#7d5442',
    hall1: '#e0c9b0', hall2: '#d2b8a0', peron1: '#d6c0a8', peron2: '#c8b098',
    aman: '#d96a3a', aman2: '#b85428', chip: '#f0a860', vending: '#b8632f',
    luar: '#1c1410', nat: 'rgba(190,150,120,.5)', papan: '#f0c090',
    varian: 'pilar',
    poster: ['GUDANG', 'KIRIM', 'MUAT', 'PETI'],
    posterCol: ['#8a5a34', '#c9a447', '#8a5a34', '#a85a3a'] },
  { nama: 'KANTOR',  dinding: '#3a3a44', dinding2: '#4a4a55',
    hall1: '#c9c9cf', hall2: '#bbbbc2', peron1: '#c0c0c8', peron2: '#b2b2ba',
    aman: '#9aa0b0', aman2: '#7a8090', chip: '#e8e4ee', vending: '#4a4a58',
    luar: '#101014', nat: 'rgba(150,150,165,.5)', papan: '#d8d8e2',
    varian: 'tanaman',
    poster: ['POS', 'KANTOR', 'STEMPEL', 'ARSIP'],
    posterCol: ['#5a5a68', '#6a6a78', '#5a5a68', '#7a7a88'] }
];
const JALUR_URUT = ['f', 'g', 'h', 'k'];

const player = { x: 250, y: 500, dir: 'down', step: 0, cool: 0, jalur: null, idx: 0, stuck: 0, tx: null, ty: null };
const keys = {};
const SOLID = [];                          // {x,y,w,h,aktif?}
const OBJ = [];                            // objek interaktif mode stasiun
const NPCS = [];
let near = null, pending = null, worldOn = false, worldPause = false;

/* --------------------------------------------------------------- mode gerbong */
/* Interior top-down (aset GB recolor) 672x288 di dunia (144,100). Lorong tengah
   bebas jalan; gerakan & interaksi memakai engine stasiun yang sama. */
const GEB = {
  aktif: false, leg: 0, simpan: null,
  npcs: [],                                // {key,nama,x,y,aksi}
  emote: null                              // {i, t} emote di atas kepala penumpang
};
const INT = { ox: 144, oy: 100, w: 672, h: 288 };
/* 4 jendela interior (dunia) untuk scenery parallax */
const JENDELA = [
  { x: 296, y: 120, w: 84, h: 44 },
  { x: 392, y: 120, w: 84, h: 44 },
  { x: 488, y: 120, w: 84, h: 44 },
  { x: 584, y: 120, w: 84, h: 44 }
];
function gerbongNpcList() {
  /* penumpang duduk di bangku atas (x dunia), sisi kiri ke kanan */
  return [
    { key: 'sari', nama: 'BU SARI', x: 380, y: 210, aksi: 'gerbong:sari' },
    { key: 'tua', nama: 'PAK TUA', x: 470, y: 210, aksi: 'gerbong:tua' },
    { key: 'anak', nama: 'ANAK SEKOLAH', x: 560, y: 210, aksi: 'gerbong:anak' },
    { key: 'ibu', nama: 'IBU BERKOPER', x: 650, y: 210, aksi: 'gerbong:ibu' }
  ];
}
/* dunia solid interior gerbong: dinding + dua baris bangku; lorong tengah bebas */
function duniaGerbong() {
  const sol = [];
  const b = (x, y, w, h) => sol.push({ x: x, y: y, w: w, h: h });
  b(24, 24, 120, 572);            // luar kiri (pemain tidak keluar interior)
  b(816, 24, 120, 572);           // luar kanan
  b(144, 24, 672, 76);            // luar atas (y24..100)
  b(144, 388, 672, 208);          // luar bawah (y388..596)
  b(144, 100, 672, 76);           // dinding atas interior (100..176)
  b(288, 176, 388, 48);           // bangku atas (176..224)
  b(284, 308, 396, 40);           // bangku bawah (308..348)
  b(144, 348, 672, 40);           // dinding bawah interior (348..388)
  b(144, 100, 44, 288);           // dinding kiri (pintu kiri = dekorasi)
  b(772, 100, 44, 288);           // dinding kanan (pintu kanan di depannya)
  return sol;
}
/* objek interaktif gerbong: 4 penumpang (rect sampai lorong) + pintu kanan */
function objekGerbong(npcs) {
  const obj = [];
  for (const n of npcs) obj.push({ label: n.nama, aksi: n.aksi, x: n.x - 20, y: 176, w: 40, h: 64, warna: '#ffcc55' });
  obj.push({ id: 'pintu-kanan', x: 700, y: 108, w: 76, h: 150, label: 'PINTU KERETA', aksi: 'gerbongTiba', warna: '#4ade80' });
  return obj;
}

/* ------------------------------------------------------------------ layout */
function box(x, y, w, h, aktif) { const o = { x: x, y: y, w: w, h: h }; if (aktif) o.aktif = aktif; SOLID.push(o); return o; }
function obj(o) { OBJ.push(o); return o; }
function npc(o) { o.diri = o.diri || { x: o.x, y: o.y }; NPCS.push(o); return o; }

function buildLayout() {
  SOLID.length = 0; OBJ.length = 0; NPCS.length = 0;

  /* dinding luar stasiun */
  box(20, 20, 920, 16);
  box(20, 584, 920, 16);
  box(20, 20, 16, 580);
  box(924, 20, 16, 580);

  /* dinding pemisah hall (kiri) dengan peron (kanan), koridor di tengah */
  box(452, 36, 16, 240);
  box(452, 356, 16, 228);

  /* perabot hall (dekor: digambar sendiri di drawStation, bukan sebagai dinding abu-abu) */
  box(64, 92, 168, 40).dekor = true;        // loket tiket
  box(64, 452, 168, 40).dekor = true;       // kantor pengaduan
  box(296, 448, 136, 40).dekor = true;      // kios kopi & roti (celah 64px dari pengaduan - margin A*)
  box(262, 72, 168, 34).dekor = true;       // papan jalur
  box(296, 200, 152, 30).dekor = true;      // papan rumus (celah 64px dari loket - margin A*)
  box(300, 520, 132, 32).dekor = true;      // meja informasi / pintu keluar
  box(680, 60, 44, 92).dekor = true;        // vending machine (dekor, kanan atas hall)
  box(80, 236, 96, 112).dekor = true;        // eskalator (halangan, digambar sendiri)
  box(460, 68, 24, 26).dekor = true;         // tanaman 1 (pojok dinding atas, bukan jalur)
  box(604, 134, 24, 26).dekor = true;        // tanaman 2

  /* peron: bangku + pagar gerbang + rel per jalur (dekor = sudah digambar sendiri).
     Gerbang digeser ke kanan (x=520) supaya tersedia jalan setapak vertikal
     di tepi peron (sel x 480-500) - pemain selalu bisa berjalan ke semua gerbang. */
  for (const j of JALUR_URUT) {
    const y = JALUR_Y[j];
    box(576, y + 22, 116, 24).dekor = true;
    box(520, y - 22, 52, 44, () => (ST.caps || []).indexOf(j) >= 0);
    box(700, y - 26, 216, 52).dekor = true;
  }

  box(232, 560, 96, 24).dekor = true;            // pintu masuk (dekorasi)

  /* --------- interaktif --------- */
  obj({ id: 'loket', x: 64, y: 92, w: 168, h: 40, label: 'LOKET TIKET', aksi: 'loket', warna: '#38bdf8' });
  obj({ id: 'pengaduan', x: 64, y: 452, w: 168, h: 40, label: 'PENGADUAN', aksi: 'pengaduan', warna: '#f0a24a' });
  obj({ id: 'jalur', x: 262, y: 72, w: 168, h: 34, label: 'PAPAN JALUR', aksi: 'papanJalur', warna: '#9fd8ff' });
  obj({ id: 'rumus', x: 296, y: 200, w: 152, h: 30, label: 'PAPAN RUMUS', aksi: 'papanRumus', warna: '#c9a447' });
  obj({ id: 'kios', x: 296, y: 448, w: 136, h: 40, label: 'KOPI · ROTI', aksi: 'npc:kopi', warna: '#ffcc55' });
  obj({ id: 'keluar', x: 300, y: 520, w: 132, h: 32, label: 'PINTU KELUAR', aksi: 'keluar', warna: '#4ade80' });
  for (const j of JALUR_URUT) {
    obj({ id: 'gerbang-' + j, x: 520, y: JALUR_Y[j] - 22, w: 52, h: 44, label: 'GERBANG ' + j.toUpperCase(),
          aksi: 'gerbang:' + j, warna: JALUR_INFO[j].warna, glyph: j });
  }

  /* --------- NPC stasiun --------- */
  npc({ id: 'sari', x: 364, y: 426, nama: 'BU SARI', sprite: 'sari', aksi: 'npc:kopi', wp: [] });
  npc({ id: 'satpam', x: 236, y: 512, nama: 'PAK SATPAM', sprite: 'satpam', aksi: 'npc:satpam', wp: [] });
  npc({ id: 'anak', x: 400, y: 150, nama: 'ANAK SEKOLAH', sprite: 'anak', aksi: 'npc:anak',
        wp: [{ x: 400, y: 150 }, { x: 404, y: 386 }, { x: 120, y: 386 }, { x: 120, y: 150 }], spd: 52 });
  npc({ id: 'ibu', x: 200, y: 300, nama: 'IBU BERKOPER', sprite: 'ibu', aksi: 'npc:ibu',
        wp: [{ x: 200, y: 300 }, { x: 396, y: 300 }, { x: 396, y: 470 }, { x: 210, y: 470 }], spd: 44 });
  npc({ id: 'tua', x: 620, y: 300, nama: 'PAK TUA', sprite: 'tua', aksi: 'npc:tua', wp: [] });
  npc({ id: 'bersih', x: 640, y: 500, nama: 'PETUGAS KEBERSIHAN', sprite: 'petugas', aksi: 'npc:bersih',
        wp: [{ x: 640, y: 500 }, { x: 860, y: 500 }, { x: 860, y: 100 }, { x: 640, y: 100 }], spd: 48 });
  npc({ id: 'asongan', x: 620, y: 100, nama: 'PEDAGANG ASONGAN', sprite: 'anak', aksi: 'npc:asongan',
        wp: [{ x: 620, y: 100 }, { x: 640, y: 560 }, { x: 870, y: 560 }, { x: 870, y: 100 }], spd: 56 });
}

/* ------------------------------------------------------------------ fisika */
function rectPlayer() { return { x: player.x - 11, y: player.y - 13, w: 22, h: 26 }; }
function hits(x, y) {
  const r = { x: x - 11, y: y - 13, w: 22, h: 26 };
  for (const s of SOLID) {
    if (s.aktif && s.aktif()) continue;   // pagar terbuka → bisa dilewati
    if (r.x < s.x + s.w && r.x + r.w > s.x && r.y < s.y + s.h && r.y + r.h > s.y) return true;
  }
  if (r.x < 24 || r.y < 24 || r.x + r.w > 936 || r.y + r.h > 596) return true;
  return false;
}
function move(dx, dy) {
  if (dx) { if (!hits(player.x + dx, player.y)) player.x += dx; else player.stuck += 0.1; }
  if (dy) { if (!hits(player.x, player.y + dy)) player.y += dy; else player.stuck += 0.1; }
}
function distToRect(x, y, o) {
  const cx = Math.max(o.x, Math.min(x, o.x + o.w));
  const cy = Math.max(o.y, Math.min(y, o.y + o.h));
  return Math.hypot(x - cx, y - cy);
}
function interaktifTerdekat() {
  let best = null, bd = 42;
  for (const o of OBJ) { const d = distToRect(player.x, player.y, o); if (d < bd && (!o.on || o.on())) { bd = d; best = o; } }
  for (const n of NPCS) { const d = distToRect(player.x, player.y, n); if (d < bd) { bd = d; best = { id: n.id, label: n.nama, aksi: n.aksi, x: n.x - 30, y: n.y - 40, w: 60, h: 20, warna: n.warna }; } }
  return best;
}
function kandidatTarget(o) {
  const cx = Math.max(o.x + 6, Math.min(o.x + o.w - 6, player.x));
  const cy = Math.max(o.y + 6, Math.min(o.y + o.h - 6, player.y));
  const dasar = [
    { x: cx, y: o.y + o.h + 22 },
    { x: cx, y: o.y - 16 },
    { x: o.x - 20, y: o.y + o.h / 2 },
    { x: o.x + o.w + 20, y: o.y + o.h / 2 }
  ].filter(p => !hits(p.x, p.y));
  let cand = dasar;
  if (!cand.length) {
    for (let d = 34; d <= 110 && !cand.length; d += 18) {
      cand = [
        { x: cx, y: o.y + o.h + d }, { x: cx, y: o.y - d },
        { x: o.x - d, y: o.y + o.h / 2 }, { x: o.x + o.w + d, y: o.y + o.h / 2 }
      ].filter(p => !hits(p.x, p.y));
    }
  }
  cand.sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y));
  if (!cand.length) cand = [{ x: cx, y: cy }];
  return cand;
}
function targetTerdekat(o) {
  /* pilih titik yang benar-benar BISA dijangkau lewat jalur jalan (A*),
     bukan sekadar terdekat - titik di seberang pagar tertutup tidak terjangkau */
  const cand = kandidatTarget(o);
  for (const p of cand) {
    const j = cariJalur(player.x, player.y, p.x, p.y);
    if (j.length > 1) return p;
  }
  return cand[0];
}

/* ------------------------------------------------- cari jalan (A* grid 20px) */
let GRID = null;
function buildGrid() {
  const cs = 20;
  const cols = Math.ceil(WD / cs), rows = Math.ceil(WH / cs);
  const g = new Uint8Array(cols * rows);
  for (let iy = 0; iy < rows; iy++) for (let ix = 0; ix < cols; ix++) {
    const x = ix * cs + cs / 2, y = iy * cs + cs / 2;
    let bebas = !hits(x, y);
    if (bebas) { for (const d of [[5, 0], [-5, 0], [0, 6], [0, -6]]) if (hits(x + d[0], y + d[1])) { bebas = false; break; } }
    g[iy * cols + ix] = bebas ? 1 : 0;
  }
  GRID = { cs: cs, cols: cols, rows: rows, g: g };
}
function cellOf(x, y) {
  const cs = GRID.cs;
  return [Math.max(0, Math.min(GRID.cols - 1, Math.floor(x / cs))),
          Math.max(0, Math.min(GRID.rows - 1, Math.floor(y / cs)))];
}
const CELL = (ix, iy) => iy * GRID.cols + ix;
function cariJalur(sx, sy, tx, ty) {
  if (!GRID) buildGrid();
  let [ax, ay] = cellOf(sx, sy), [bx, by] = cellOf(tx, ty);
  if (!GRID.g[CELL(ax, ay)]) {
    let found = false;
    for (let d = 1; d <= 3 && !found; d++) {
      for (let dx = -d; dx <= d && !found; dx++) for (let dy = -d; dy <= d && !found; dy++) {
        const nx = ax + dx, ny = ay + dy;
        if (nx < 0 || ny < 0 || nx >= GRID.cols || ny >= GRID.rows) continue;
        if (GRID.g[CELL(nx, ny)]) { ax = nx; ay = ny; found = true; }
      }
    }
    if (!found) return [];
  }
  if (!GRID.g[CELL(bx, by)]) {
    let best = null, bd = 1e9;
    for (let d = 0; d <= 4; d++) {
      for (let dx = -d; dx <= d; dx++) for (let dy = -d; dy <= d; dy++) {
        const nx = bx + dx, ny = by + dy;
        if (nx < 0 || ny < 0 || nx >= GRID.cols || ny >= GRID.rows) continue;
        if (!GRID.g[CELL(nx, ny)]) continue;
        const dd = dx * dx + dy * dy;
        if (dd < bd) { bd = dd; best = [nx, ny]; }
      }
      if (best) break;
    }
    if (!best) return [];
    bx = best[0]; by = best[1];
  }
  const start = CELL(ax, ay), goal = CELL(bx, by);
  const open = [start], came = {}, gs = {}, fs = {};
  gs[start] = 0; fs[start] = Math.hypot(ax - bx, ay - by);
  const seen = new Set();
  while (open.length) {
    open.sort((p1, p2) => fs[p1] - fs[p2]);
    const cur = open.shift();
    if (cur === goal) break;
    if (seen.has(cur)) continue;
    seen.add(cur);
    const cx = cur % GRID.cols, cy = (cur - cx) / GRID.cols;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= GRID.cols || ny >= GRID.rows) continue;
      const ni = CELL(nx, ny);
      if (!GRID.g[ni]) continue;
      if (dx && dy && (!GRID.g[CELL(cx + dx, cy)] || !GRID.g[CELL(cx, cy + dy)])) continue;
      const step = (dx && dy) ? 1.4142 : 1;
      const ng = (gs[cur] || 0) + step;
      if (gs[ni] === undefined || ng < gs[ni]) {
        came[ni] = cur; gs[ni] = ng;
        fs[ni] = ng + Math.hypot(nx - bx, ny - by);
        open.push(ni);
      }
    }
  }
  if (came[goal] === undefined && goal !== start) return [];
  const jalur = [];
  let c = goal;
  while (c !== undefined) { const ix = c % GRID.cols, iy = (c - ix) / GRID.cols; jalur.push({ x: ix * GRID.cs + GRID.cs / 2, y: iy * GRID.cs + GRID.cs / 2 }); c = came[c]; }
  jalur.reverse();
  jalur.push({ x: tx, y: ty });
  return jalur;
}
function jalanKeTitik(tx, ty) {
  const j = cariJalur(player.x, player.y, tx, ty);
  player.jalur = j.length > 1 ? j : [{ x: tx, y: ty }];
  player.idx = 0;
  player.stuck = 0;
  player.ulang = 0;
}

/* ------------------------------------------------------------------- input */
function onKey(e, down) {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].indexOf(k) >= 0) e.preventDefault();
  keys[k] = down;
  if (window.__kunciInput) return;                 // ending: interaksi terkunci
  if (down && (k === 'e' || k === 'enter')) {
    if (!worldPause && near && window.AKSI && window.AKSI[near.aksi.split(':')[0]]) jalankanAksi(near.aksi);
  }
}
function jalankanAksi(aksi) {
  const [nama, arg] = aksi.split(':');
  const fn = window.AKSI && window.AKSI[nama];
  if (!fn) { hintBar('Belum ada aksi untuk ' + aksi); return; }
  player.tx = player.ty = null; pending = null;
  Promise.resolve(fn(arg)).catch(err => console.error(err));
}
function onClick(ev) {
  if (worldPause || window.__kunciInput) return;
  const p = toWorld(ev);
  for (const o of OBJ.concat(NPCS.map(n => ({ x: n.x - 32, y: n.y - 46, w: 64, h: 46, aksi: n.aksi })))) {
    if (p.x >= o.x - 8 && p.x <= o.x + (o.w || 64) + 8 && p.y >= o.y - 8 && p.y <= o.y + (o.h || 46) + 8) {
      const t = targetTerdekat(o);
      jalanKeTitik(t.x, t.y); pending = o.aksi; return;
    }
  }
  jalanKeTitik(p.x, p.y); pending = null;
}
function toWorld(ev) {
  const r = W.cv.getBoundingClientRect();
  const dpr = W.dpr || 1;
  const px = (ev.clientX - r.left) * dpr - (W.ox || 0);
  const py = (ev.clientY - r.top) * dpr - (W.oy || 0);
  const sc = W.sc || 1;
  return { x: px / sc, y: py / sc };
}

/* -------------------------------------------------------------------- loop */
function resize() {
  const box = W.cv.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const bw = Math.max(200, Math.round((box.width || 960) * dpr));
  const bh = Math.max(200, Math.round((box.height || 620) * dpr));
  W.cv.width = bw; W.cv.height = bh;
  W.cv.style.width = (box.width || 960) + 'px';
  W.cv.style.height = (box.height || 620) + 'px';
  W.dpr = dpr;
  /* skala per PIKSEL BUFFER di piksel perangkat: 1 piksel buffer = N piksel
     perangkat bulat (N boleh ganjil, piksel tetap seragam sempurna) */
  const N = Math.floor(Math.min(bw / 480, bh / 310));
  if (N >= 2) {
    W.sc = N / 2;                                  // piksel perangkat per piksel dunia
    W.ox = Math.floor((bw - 480 * N) / 2);         // letterbox terpusat, bulat
    W.oy = Math.floor((bh - 310 * N) / 2);
  } else {
    /* layar kecil: fallback proporsional, prioritas muat (tak pernah > 1x dunia) */
    const s = Math.min(bw / 960, bh / 620);
    W.sc = s;
    W.ox = Math.floor((bw - 960 * s) / 2);
    W.oy = Math.floor((bh - 620 * s) / 2);
  }
  /* kompatibilitas pemetaan klik lama (satuan CSS px) */
  W.cssSc = W.sc / dpr;
  W.cssOx = W.ox / dpr;
  W.cssOy = W.oy / dpr;
}

function update(dt) {
  W.t += dt;
  if (GEB.emote) { GEB.emote.t -= dt; if (GEB.emote.t <= 0) GEB.emote = null; }
  if (worldPause) return;
  /* pagar berubah (cap baru / tiket disita) → peta A* dibangun ulang */
  const k = keySolid();
  if (k !== solidKey) { solidKey = k; buildGrid(); }
  const spd = GEB.aktif ? 150 : 168;
  let dx = 0, dy = 0;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (window.__kunciInput) { dx = 0; dy = 0; }   // ending: jalur A* tak boleh diganggu
  if (dx || dy) {
    const n = Math.hypot(dx, dy) || 1;
    move(dx / n * spd * dt, dy / n * spd * dt);
    player.step += dt * 9;
    player.dir = dx ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    player.jalur = null; player.idx = 0;
  } else if (player.jalur && player.jalur.length) {
    const w = player.jalur[player.idx] || player.jalur[player.jalur.length - 1];
    const ddx = w.x - player.x, ddy = w.y - player.y, d = Math.hypot(ddx, ddy);
    if (d < 6) {
      player.idx++;
      if (player.idx >= player.jalur.length) { player.jalur = null; player.idx = 0; player.stuck = 0; player.ulang = 0; }
    } else {
      move(ddx / d * spd * dt, ddy / d * spd * dt);
      player.step += dt * 9;
      player.dir = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up');
      if (player.stuck > 0.6) {
        player.stuck = 0;
        player.ulang = (player.ulang || 0) + 1;
        if (player.ulang <= 3) {
          const akhir = player.jalur[player.jalur.length - 1];
          player.jalur = null;
          jalanKeTitik(akhir.x, akhir.y);
        } else {
          player.jalur = null; player.idx = 0; player.ulang = 0;
          toastWorld('Jalan tertutup - coba jalan manual');
        }
      }
    }
  }
  for (const n of NPCS) {
    if (!n.wp || !n.wp.length) continue;
    const w = n.wp[n.wi || 0];
    const ddx = w.x - n.x, ddy = w.y - n.y, d = Math.hypot(ddx, ddy);
    if (d < 5) { n.wait = (n.wait || 0) + dt; if (n.wait > 1.2) { n.wi = ((n.wi || 0) + 1) % n.wp.length; n.wait = 0; } }
    else { n.x += ddx / d * (n.spd || 50) * dt; n.y += ddy / d * (n.spd || 50) * dt; n.dir = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up'); }
  }
  /* footstep sangat pelan: hanya saat frame jalan berganti */
  if (!window.__kunciInput && (dx || dy || player.jalur)) {
    const fr = Math.floor(player.step) % 2;
    if (fr !== window.__footstepFrame) { window.__footstepFrame = fr; AUDIO.sfx('langkah'); }
  }
  if (window.__kunciInput) {
    near = null;                                  // prompt E tidak digambar saat ending
  } else {
    near = interaktifTerdekat();
    if (pending && near && near.aksi === pending) { const a = pending; pending = null; jalankanAksi(a); }
    else if (pending && !player.jalur) pending = null;
  }
  if (window.__sampaiRes && !player.jalur) { const r = window.__sampaiRes; window.__sampaiRes = null; r(); }
  if (window.keretaAktif) window.keretaAktif.t -= dt;
}
/* jalan otomatis sampai tiba (dipakai ending); aman bila tab dibekukan */
function jalanSampai(x, y) {
  return new Promise(res => {
    if (window.__instantMode) { jalanKeTitik(x, y); res(); return; }
    jalanKeTitik(x, y);
    window.__sampaiRes = res;                 // update() menyelesaikan ini bila timer beku
    let n = 0;
    const iv = setInterval(() => {
      for (let k = 0; k < 10; k++) { update(0.05); if (!player.jalur) break; }
      if (!player.jalur || ++n > 200) { clearInterval(iv); window.__sampaiRes = null; res(); }
    }, 30);
  });
}
let solidKey = '';
let SOLID_ST = null, OBJ_ST = null, NPCS_ST = null;   // salinan dunia stasiun saat masuk gerbong
function keySolid() { let k = ''; for (const s of SOLID) k += s.aktif ? (s.aktif() ? 1 : 0) : 9; return k; }

let wtoast = null;
function toastWorld(t) { wtoast = { t: 2.2, s: t }; }

/* ================================================================== RENDER */
function render() {
  /* ukuran kontainer bisa berubah setelah layout settle - cek tiap frame, murah */
  const b = W.cv.parentElement.getBoundingClientRect();
  if (Math.abs(b.width - (W.lastBw || 0)) > 2 || Math.abs(b.height - (W.lastBh || 0)) > 2) {
    resize();
    W.lastBw = b.width; W.lastBh = b.height;
  }
  const c = W.bctx;
  c.setTransform(0.5, 0, 0, 0.5, 0, 0);          // dunia 960x620 → buffer 480x310
  if (GEB.aktif) drawGerbong(c); else drawStation(c);
  /* blit buffer → layar (nearest neighbor = tampilan pixel).
     Buffer 480x310 mewakili dunia 960x620 → digambar 2x buffer = ukuran penuh. */
  const ctx = W.ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#070b12';
  ctx.fillRect(0, 0, W.cv.width, W.cv.height);
  ctx.drawImage(W.buf, 0, 0, 480, 310, W.ox, W.oy, 960 * W.sc, 620 * W.sc);
}

/* ------------------------------------------------------- mode: STASIUN */
/* chip teks kecil bergaya pixel */
function chip(c, cx, cy, txt, col) {
  const w = _ukuranTeks(String(txt), 2) + 14;
  const bx = Math.round(cx - w / 2), by = Math.round(cy) - 9;
  c.fillStyle = PAL.papan; c.fillRect(bx, by, w, 18);
  c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(bx + .5, by + .5, w - 1, 17);
  pxText(c, txt, cx, by + 4, col, { align: 'center' });
  return w;
}
function trainBody(c, x, y, len, col) {
  const top = y - 24, h = 48;
  c.fillStyle = '#2a2438'; c.fillRect(x - 3, top - 3, len + 6, h + 6);
  c.fillStyle = '#eceaf2'; c.fillRect(x, top, len, h);
  c.fillStyle = col; c.fillRect(x, top + 29, len, 6);
  /* moncong kiri membulat */
  c.fillStyle = '#eceaf2';
  c.beginPath(); c.moveTo(x, top); c.quadraticCurveTo(x - 14, top + 10, x - 14, y); c.quadraticCurveTo(x - 14, top + h - 10, x, top + h); c.fill();
  c.fillStyle = '#ffd24a'; c.fillRect(x - 11, top + 10, 6, 7);
  /* jendela */
  c.fillStyle = '#38506a';
  for (let wx = x + 16; wx < x + len - 24; wx += 32) c.fillRect(wx, top + 8, 20, 12);
  /* pintu */
  c.fillStyle = '#b9b4c6'; c.fillRect(x + len - 30, top + 6, 12, 36);
  c.fillStyle = col; c.fillRect(x + len - 30, top + 29, 12, 6);
  /* roda */
  c.fillStyle = '#2a2438';
  for (let rx = x + 12; rx < x + len; rx += 30) { c.beginPath(); c.arc(rx, top + h + 3, 4, 0, 6.3); c.fill(); }
}
function drawStation(c) {
  initSprites();
  const T = TEMA_STASIUN[(window.STASIUN_TEME && window.STASIUN_TEME.idx) || 0] || TEMA_STASIUN[0];
  /* dasar */
  c.fillStyle = T.luar; c.fillRect(0, 0, WD, WH);

  /* lantai: keramik dua nada (hall ungu, peron biru-keabuan) */
  for (let y = 36; y < 600; y += 40) for (let x = 20; x < 940; x += 40) {
    const on = ((x + y) / 40) % 2 === 0;
    const peron = x >= 468;
    c.fillStyle = peron ? (on ? T.peron1 : T.peron2) : (on ? T.hall1 : T.hall2);
    c.fillRect(x, y, 40, 40);
  }
  c.strokeStyle = T.nat; c.lineWidth = 1;
  c.beginPath();
  for (let x = 20; x <= 940; x += 40) { c.moveTo(x, 36); c.lineTo(x, 600); }
  for (let y = 36; y <= 600; y += 40) { c.moveTo(20, y); c.lineTo(940, y); }
  c.stroke();

  /* dinding atas: gelap + papan nama stasiun + poster rapi */
  c.fillStyle = T.dinding; c.fillRect(20, 20, 920, 18);
  c.fillStyle = T.dinding2; c.fillRect(20, 20, 920, 4);
  /* bayangan bawah dinding (dither halus) */
  c.fillStyle = PAL.lantaiBayang;
  for (let x = 20; x < 940; x += 8) c.fillRect(x + ((x / 8) % 2) * 4, 38, 4, 2);
  const posters = [
    { x: 70, w: 84, col: T.posterCol[0], txt: T.poster[0] },
    { x: 240, w: 74, col: T.posterCol[1], txt: T.poster[1] },
    { x: 610, w: 84, col: T.posterCol[2], txt: T.poster[2] },
    { x: 800, w: 84, col: T.posterCol[3], txt: T.poster[3] }
  ];
  for (const p of posters) {
    c.fillStyle = p.col; c.fillRect(p.x, 23, p.w, 12);
    pxText(c, p.txt, p.x + p.w / 2, 26, PAL.teksPutih, { align: 'center' });
  }

  /* vending machine digambar sebelum jalur supaya label JALUR tidak tertimpa */
  {
    c.fillStyle = PAL.outline; c.fillRect(678, 58, 48, 96);
    c.fillStyle = T.vending; c.fillRect(680, 60, 44, 92);
    c.fillStyle = PAL.vending2; c.fillRect(685, 66, 26, 46);
    c.fillStyle = PAL.vendingAir;
    for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) c.fillRect(688 + k * 10, 70 + r * 14, 6, 8);
    c.fillStyle = PAL.emas; c.fillRect(716, 70, 5, 40);
  }

  /* ---- per jalur: bed rel, garis pengaman, kereta parkir, bangku, gerbang ---- */
  for (const j of JALUR_URUT) {
    const y = JALUR_Y[j], col = JALUR_INFO[j].warna;
    /* bed rel */
    c.fillStyle = PAL.relBed; c.fillRect(656, y - 30, 284, 60);
    c.fillStyle = PAL.relBed2;
    for (let bx = 660; bx < 936; bx += 22) c.fillRect(bx, y - 26, 12, 52);
    c.fillStyle = PAL.relGaris; c.fillRect(656, y - 6, 284, 4); c.fillRect(656, y + 2, 284, 4);
    /* garis pengaman kuning bertekstur (dither 2x2 konsisten) */
    c.fillStyle = T.aman; c.fillRect(646, y - 26, 9, 52);
    c.fillStyle = T.aman2;
    for (let by = y - 26; by < y + 26; by += 4) for (let dxb = 646 + ((by / 4) % 2) * 4; dxb < 654; dxb += 8) c.fillRect(dxb, by, 2, 2);
    /* kereta parkir: strip warna = warna jalur */
    const open = ST.caps && ST.caps.indexOf(j) >= 0;
    trainBody(c, 700, y, 216, col);
    if (open) { c.fillStyle = PAL.tintCap; c.fillRect(700, y - 27, 216, 54); }
    /* bangku tunggu */
    c.fillStyle = PAL.outline; c.fillRect(558, y + 20, 124, 28);
    c.fillStyle = PAL.bangku; c.fillRect(560, y + 22, 120, 24);
    c.fillStyle = PAL.bangku2; c.fillRect(560, y + 22, 120, 6);
    c.fillStyle = PAL.bangkuBayang;
    for (let i = 0; i < 3; i++) c.fillRect(568 + i * 40, y + 31, 32, 12);
    /* gerbang: dua tiang + lampu status */
    const go = OBJ.find(o => o.id === 'gerbang-' + j);
    if (go) {
      const gcol = open ? PAL.gerbangBuka : PAL.gerbangTutup;
      c.fillStyle = PAL.gerbangMerahMuda; c.fillRect(go.x + 8, go.y + 4, go.w - 16, go.h - 8);
      c.fillStyle = PAL.pilar;
      c.fillRect(go.x, go.y, 8, go.h); c.fillRect(go.x + go.w - 8, go.y, 8, go.h);
      c.fillStyle = gcol; c.fillRect(go.x + 2, go.y - 7, 4, 7); c.fillRect(go.x + go.w - 6, go.y - 7, 4, 7);
      pxText(c, open ? 'LOLOS' : 'TIKET?', go.x + go.w / 2, go.y + go.h + 6, gcol, { align: 'center' });
    }
    /* label jalur + fungsi (font bitmap; rumus f(x) tampil dengan huruf kecil asli) */
    pxText(c, 'JALUR ' + j.toUpperCase() + ' \u00b7 ' + (CUR ? fJalur(j, CUR) : ''), 592, y - 38, col);
    if (open) pxText(c, '\u2713 CAP OK', 592, y + 14, PAL.gerbangBukaTeks);
  }

  /* kereta datang: 6 frame bullet_train_fancy (GB recolor) meluncur masuk */
  if (window.keretaAktif) {
    const ka = window.keretaAktif, y = JALUR_Y[ka.j];
    const prog = 1 - Math.max(0, ka.t) / ka.total;
    const fr = _asetGBCache['kereta'];
    if (fr) {
      const fidx = Math.floor(W.t8 * 2) % 6;
      const kx = Math.round(920 - prog * 280);
      c.drawImage(fr, fidx * 160, 0, 160, 32, kx, y - 36, 320, 64);
    } else {
      const x = 920 - prog * 240;
      trainBody(c, x + 200, y, 216, JALUR_INFO[ka.j].warna);
    }
  }

  /* eskalator beranimasi (4 frame aset GB recolor, 8fps) di hall kiri */
  {
    const es = _asetGBCache['eskalator'];
    if (es) {
      const fidx = Math.floor(W.t8 * 2) % 4;
      c.drawImage(es, fidx * 48, 0, 48, 56, 80, 236, 96, 112);
      pxText(c, 'KE LANTAI 2', 128, 356, PAL.teksRedup, { align: 'center' });
    }
  }

  /* ---- furnitur hall ---- */
  const O = id => OBJ.find(o => o.id === id);
  /* loket & pengaduan: meja kayu + kaca + papan nama */
  for (const [id, sign, scol] of [['loket', 'LOKET TIKET', PAL.mejaLoket], ['pengaduan', 'PENGADUAN', PAL.mejaPengaduan]]) {
    const o = O(id);
    c.fillStyle = PAL.mejaBayang; c.fillRect(o.x + 6, o.y - 15, o.w - 12, 15);
    c.strokeStyle = PAL.jendelaFrame; c.lineWidth = 2; c.strokeRect(o.x + 6, o.y - 15, o.w - 12, 15);
    c.fillStyle = PAL.meja; c.fillRect(o.x, o.y, o.w, o.h);
    c.fillStyle = PAL.meja2; c.fillRect(o.x, o.y, o.w, 8);
    chip(c, o.x + o.w / 2, o.y - 24, sign, scol);
  }
  /* kios kopi: awning hijau-putih */
  {
    const o = O('kios');
    for (let i = 0; i < Math.floor(o.w / 12); i++) {
      c.fillStyle = i % 2 ? PAL.vending2 : PAL.awning;
      c.fillRect(o.x + i * 12, o.y - 14, 12, 14);
    }
    c.fillStyle = PAL.meja; c.fillRect(o.x, o.y, o.w, o.h);
    c.fillStyle = PAL.meja2; c.fillRect(o.x, o.y, o.w, 8);
    chip(c, o.x + o.w / 2, o.y - 24, 'KOPI · ROTI', PAL.emas);
  }
  /* papan jalur: isi fungsi sebenarnya */
  {
    const o = O('jalur');
    c.fillStyle = PAL.papan; c.fillRect(o.x, o.y, o.w, o.h);
    c.strokeStyle = T.papan; c.lineWidth = 1.5; c.strokeRect(o.x + 1, o.y + 1, o.w - 2, o.h - 2);
    if (CUR) {
      pxText(c, 'f ' + fJalur('f', CUR).slice(7) + '   g ' + fJalur('g', CUR).slice(7), o.x + 8, o.y + 6, T.papan);
      pxText(c, 'h ' + fJalur('h', CUR).slice(7) + '   k ' + fJalur('k', CUR).slice(7), o.x + 8, o.y + 18, T.papan);
    }
    chip(c, o.x + o.w / 2, o.y - 10, 'PAPAN JALUR', PAL.papanText2);
  }
  /* papan rumus */
  {
    const o = O('rumus');
    c.fillStyle = PAL.papan; c.fillRect(o.x, o.y, o.w, o.h);
    c.strokeStyle = PAL.emas; c.lineWidth = 1.5; c.strokeRect(o.x + 1, o.y + 1, o.w - 2, o.h - 2);
    pxText(c, '(f\u2218g)(x) = f(g(x))', o.x + 8, o.y + 11, PAL.emas);
    chip(c, o.x + o.w / 2, o.y - 10, 'PAPAN RUMUS', PAL.emas);
  }
  /* pintu keluar */
  {
    const o = O('keluar');
    c.fillStyle = PAL.outline; c.fillRect(o.x - 3, o.y - 11, o.w + 6, o.h + 14);
    c.fillStyle = PAL.pintu; c.fillRect(o.x, o.y - 8, o.w, o.h + 8);
    c.fillStyle = PAL.pintu2; c.fillRect(o.x + 6, o.y - 2, o.w - 12, o.h - 4);
    chip(c, o.x + o.w / 2, o.y - 18, '\u25b8 KELUAR', PAL.gerbangBuka);
  }

  /* tanaman pot (dekor + halangan kecil, tidak memblok jalur utama) */
  for (const tp of [{ x: 460, y: 74 }, { x: 604, y: 140 }]) {
    c.fillStyle = PAL.outline; c.fillRect(tp.x - 1, tp.y + 12, 26, 14);
    if (T.varian === 'pilar') {
      c.fillStyle = PAL.pilar; c.fillRect(tp.x + 3, tp.y - 6, 18, 20);
      c.fillStyle = PAL.pilar2; c.fillRect(tp.x + 3, tp.y - 6, 18, 4);
      c.fillStyle = PAL.pilarBayang; c.fillRect(tp.x, tp.y + 12, 24, 6);
    } else {
      c.fillStyle = PAL.potKayu; c.fillRect(tp.x, tp.y + 13, 24, 12);
      c.fillStyle = PAL.daun; c.fillRect(tp.x + 2, tp.y - 6, 20, 20);
      c.fillStyle = PAL.daun2; c.fillRect(tp.x + 5, tp.y - 4, 6, 6); c.fillRect(tp.x + 13, tp.y, 6, 6);
    }
  }

  /* dinding solid (pemisah hall/peron) - dekorasi (rel/bangku) digambar sendiri */
  for (const s of SOLID) {
    if (s.aktif || s.dekor) continue;
    if (s.y === 20 || s.y === 584 || s.x === 20 || s.x === 924) continue;   // dinding luar sudah digambar
    c.fillStyle = T.dinding; c.fillRect(s.x, s.y, s.w, s.h);
    c.fillStyle = T.dinding2; c.fillRect(s.x, s.y, s.w, 4);
  }
  /* pagar gerbang tertutup (yang terbuka tak digambar) */
  for (const s of SOLID) {
    if (!s.aktif) continue;
    if (s.aktif()) continue;
    c.fillStyle = PAL.pagarSita; c.fillRect(s.x, s.y, s.w, s.h);
    c.strokeStyle = PAL.gerbangTutup; c.lineWidth = 1.5; c.strokeRect(s.x + 1, s.y + 1, s.w - 2, s.h - 2);
  }

  /* NPC */
  for (const n of NPCS) {
    const nx = Math.round(n.x / 2) * 2;
    c.fillStyle = PAL.bayangNpc;
    c.fillRect(nx - 12, Math.round(n.y) + 12, 24, 5);
    const frame = (n.wp && n.wp.length) ? (Math.floor(n.x / 12) % 2 ? 1 : 2) : 0;
    pxChar(c, n.sprite || 'anak', n.x, n.y + 14, n.dir || 'down', frame, 1);
  }

  /* pemain */
  const psx = Math.round(player.x / 2) * 2;
  c.fillStyle = PAL.bayang;
  c.fillRect(psx - 13, Math.round(player.y) + 11, 26, 5);
  const pframe = (player.jalur || dxKeys()) ? (Math.floor(player.step) % 2 ? 1 : 2) : 0;
  pxChar(c, 'kurir', player.x, player.y + 16, player.dir, pframe, 1, 'KAMU');

  /* nama stasiun tergantung di dinding (tidak menabrak furnitur) */
  chip(c, 480, 30, (typeof ST !== 'undefined' && ST.tempat) ? ST.tempat : 'STASIUN', T.chip);

  /* prompt interaksi */
  if (near && !worldPause) {
    const t = 'E - ' + (near.label || near.aksi).toUpperCase();
    const w = _ukuranTeks(t, 2) + 14;
    const bx = Math.round(near.x + (near.w || 60) / 2 - w / 2), by = Math.round(near.y) - 26;
    c.fillStyle = PAL.kotakPrompt; c.fillRect(bx, by, w, 18);
    c.strokeStyle = PAL.emas; c.lineWidth = 1; c.strokeRect(bx + .5, by + .5, w - 1, 17);
    pxText(c, t, bx + 7, by + 4, PAL.emas);
  }
  if (wtoast) {
    const w = _ukuranTeks(wtoast.s, 2) + 16;
    const bx = Math.round(WD / 2 - w / 2);
    c.fillStyle = PAL.kotakToast; c.fillRect(bx, 40, w, 20);
    c.strokeStyle = PAL.emas; c.strokeRect(bx + .5, 40 + .5, w - 1, 19);
    pxText(c, wtoast.s, WD / 2, 44, PAL.emas, { align: 'center' });
  }
  pxText(c, 'WASD / PANAH UNTUK JALAN \u00b7 KLIK LANTAI JUGA BISA \u00b7 E UNTUK BERINTERAKSI', 32, 600, PAL.teksRedup);
}
function dxKeys() { return keys['a'] || keys['d'] || keys['arrowleft'] || keys['arrowright']; }

/* ------------------------------------------------ mode: GERBONG (top-down) */
function drawGerbong(c) {
  initSprites();
  const sway = Math.round(Math.sin(W.t8 * 2.1) * 2);
  c.fillStyle = PAL.papan; c.fillRect(0, 0, WD, WH);
  /* bingkai lantai serumpun di sekeliling interior */
  c.fillStyle = PAL.lantaiGer; c.fillRect(120, 76, 720, 336);
  c.fillStyle = PAL.lantaiGer2; c.fillRect(120, 76, 720, 6);

  c.save();
  c.translate(0, sway);

  const int = _asetGBCache['interior'];
  if (int) c.drawImage(int, INT.ox, INT.oy, INT.w, INT.h);
  else { c.fillStyle = PAL.langit; c.fillRect(INT.ox, INT.oy, INT.w, INT.h); }

  /* scenery malam berparallax di balik 4 jendela (kecepatan per lapisan, 8fps) */
  const scroll = Math.floor(W.t8 * 90);
  for (const jd of JENDELA) {
    c.save();
    c.beginPath(); c.rect(jd.x, jd.y, jd.w, jd.h); c.clip();
    c.fillStyle = PAL.langit; c.fillRect(jd.x, jd.y, jd.w, jd.h);
    c.fillStyle = '#e8e4ee';
    for (let st = 0; st < 10; st++) c.fillRect(jd.x + ((st * 37) % jd.w), jd.y + ((st * 23) % 16), 2, 2);
    c.fillStyle = PAL.kota1;
    for (let b = 0; b < 4; b++) {
      const bx = jd.x - Math.floor((scroll * 0.4 + b * 90) % 130);
      c.fillRect(bx, jd.y + 20, 42, jd.h - 20);
      c.fillRect(bx + 22, jd.y + 12, 20, jd.h - 12);
    }
    c.fillStyle = PAL.kota2;
    for (let b = 0; b < 3; b++) {
      const bx = jd.x - Math.floor((scroll + b * 150) % 190);
      c.fillRect(bx, jd.y + 28, 52, jd.h - 28);
    }
    c.fillStyle = PAL.emas;
    for (let b = 0; b < 2; b++) {
      const bx = jd.x - Math.floor((scroll * 1.7 + b * 320) % 640);
      c.fillRect(bx, jd.y + 6, 3, jd.h - 6);
    }
    c.restore();
  }

  /* lampu plafon berkedip (8fps) */
  for (let i = 0; i < 4; i++) {
    c.fillStyle = ((W.t8 * 8) % 16 === 0 && i === 2) ? PAL.lampuMati : PAL.lampu;
    c.fillRect(330 + i * 88, 165, 26, 5);
  }

  /* penumpang duduk (kepala+torso menyembul di sandaran) + emote */
  for (let i = 0; i < GEB.npcs.length; i++) {
    const n = GEB.npcs[i];
    pxCharDuduk(c, n.key, n.x, n.y, n.nama);
    if (GEB.emote && GEB.emote.i === i && GEB.emote.t > 0) {
      const em = _asetGBCache['emoteLove'];
      if (em) c.drawImage(em, n.x - 16, n.y - 58, 32, 32);
    }
  }

  /* pemain (lorong tengah) */
  const pgx = Math.round(player.x / 2) * 2;
  c.fillStyle = PAL.bayang;
  c.fillRect(pgx - 13, Math.round(player.y) + 11, 26, 5);
  const moving = dxKeys() || player.jalur;
  const pframe = moving ? (Math.floor(player.step) % 2 ? 1 : 2) : 0;
  pxChar(c, 'kurir', player.x, player.y + 16, player.dir, pframe, 1, 'KAMU');

  c.restore();

  /* label pintu kiri (dekorasi) */
  pxText(c, 'MASUK', 218, 150, PAL.teksRedup, { align: 'center' });

  /* prompt interaksi & toast (tanpa sway) */
  if (near && !worldPause) {
    const t = 'E - ' + (near.label || near.aksi).toUpperCase();
    const w = _ukuranTeks(t, 2) + 14;
    const bx = Math.round(near.x + (near.w || 60) / 2 - w / 2), by = Math.round(near.y) - 26;
    c.fillStyle = 'rgba(9,15,26,.95)'; c.fillRect(bx, by, w, 18);
    c.strokeStyle = PAL.emas; c.lineWidth = 1; c.strokeRect(bx + .5, by + .5, w - 1, 17);
    pxText(c, t, bx + 7, by + 4, PAL.emas);
  }
  if (wtoast) {
    const w = _ukuranTeks(wtoast.s, 2) + 16;
    const bx = Math.round(WD / 2 - w / 2);
    c.fillStyle = 'rgba(9,15,26,.9)'; c.fillRect(bx, 40, w, 20);
    c.strokeStyle = PAL.emas; c.strokeRect(bx + .5, 40 + .5, w - 1, 19);
    pxText(c, wtoast.s, WD / 2, 44, PAL.emas, { align: 'center' });
  }
}

let last = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
  if (wtoast) { wtoast.t -= dt; if (wtoast.t <= 0) wtoast = null; }
  update(dt);
  /* kuantisasi waktu dunia ke 8 fps: sway/scroll/kedip ber-"detak" khas pixel art */
  W.t8 = Math.floor(W.t * 8) / 8;
  render();
  requestAnimationFrame(frame);
}

/* -------------------------------------------------------------------- API */
const World = {
  start() {
    W.cv = $('#world'); W.ctx = W.cv.getContext('2d');
    W.buf = document.createElement('canvas');
    W.buf.width = 480; W.buf.height = 310;
    W.bctx = W.buf.getContext('2d');
    W.bctx.imageSmoothingEnabled = false;
    buildLayout(); resize(); buildGrid(); solidKey = keySolid();
    siapkanAsetGB();
    if (!W.listen) {
      W.listen = true;
      window.addEventListener('resize', resize);
      window.addEventListener('keydown', e => onKey(e, true));
      window.addEventListener('keyup', e => onKey(e, false));
      W.cv.addEventListener('click', onClick);
    }
    worldOn = true;
    if (!frame.loop) { frame.loop = true; requestAnimationFrame(frame); }
  },
  pause() { worldPause = true; },
  resume() { worldPause = false; },
  jalanKe(x, y) { player.x = x; player.y = y; player.jalur = null; player.idx = 0; },
  tempat(nama) { ST.tempat = nama; hud(); },
  segarkan() { render(); },
  /* masuk adegan gerbong: simpan dunia stasiun, pasang dunia interior */
  masukGerbong(leg) {
    GEB.aktif = true; GEB.leg = leg || 0;
    GEB.simpan = { x: player.x, y: player.y, dir: player.dir };
    GEB.npcs = gerbongNpcList();
    GEB.emote = null;
    if (!SOLID_ST) { SOLID_ST = SOLID.slice(); OBJ_ST = OBJ.slice(); NPCS_ST = NPCS.slice(); }
    SOLID.length = 0; SOLID.push.apply(SOLID, duniaGerbong());
    OBJ.length = 0; OBJ.push.apply(OBJ, objekGerbong(GEB.npcs));
    NPCS.length = 0;
    buildGrid(); solidKey = keySolid();
    AUDIO.sfx('pintu');
    AUDIO.musik('gerbong');
    player.x = 220; player.y = 266; player.dir = 'right';
    player.jalur = null; player.idx = 0; player.tx = null; pending = null;
    if (window.ST) ST.tempat = 'DI DALAM GERBONG';
    hud();
  },
  keluarGerbong() {
    GEB.aktif = false; GEB.emote = null;
    if (SOLID_ST) {
      SOLID.length = 0; SOLID.push.apply(SOLID, SOLID_ST);
      OBJ.length = 0; OBJ.push.apply(OBJ, OBJ_ST);
      NPCS.length = 0; NPCS.push.apply(NPCS, NPCS_ST);
    }
    buildGrid(); solidKey = keySolid();
    AUDIO.sfx('pintu');
    AUDIO.musik('stasiun');
    if (GEB.simpan) { player.x = GEB.simpan.x; player.y = GEB.simpan.y; player.dir = GEB.simpan.dir; }
    player.jalur = null; player.idx = 0; player.tx = null; pending = null;
    if (window.ST) ST.tempat = 'STASIUN TRANSIT';
    hud();
  },
  mode: () => GEB.aktif ? 'gerbong' : 'stasiun'
};
window.World = World;
