/* ============================================================================
   STASIUN TRANSIT - Fungsi Komposisi & Invers
   Tema 6: peta jalur kereta = notasi komposisi fungsi.
   Tanpa hint. Soal acak tiap main (kode rute). Tiket ditolak kalau jawaban salah.
   ============================================================================ */

/* ---------------------------------------------------------------- 1. UTIL  */
const $ = s => document.querySelector(s);
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };

function makeRng(seed) {                 // LCG: kode rute menghasilkan soal yang sama
  let s = (seed >>> 0) || 1;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
function shuffle(r, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const MINUS = '\u2212';                  // tanda minus tampilan

/* ---------------------------------------------- 2. JALUR = FUNGSI (linear) */
/* f(x)=ax+b   g(x)=cx+d   h(x)=ex   k(x)=x+q
   Syarat tolak saat mengacak:
     - a !== c
     - f∘g != g∘f  <=>  d(a-1) !== b(c-1)   (kalau sama, momen "tiket ditolak" jadi omong kosong) */
function commutative(a, b, c, d) { return d * (a - 1) === b * (c - 1); }

const COEF = [2, 3, 4];
const CONST = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
const JALUR_INFO = {
  f: { nama: 'JALUR A', warna: '#ff5f5f', fungsi: 'menyebar kode ruang lalu digeser' },
  g: { nama: 'JALUR B', warna: '#ffd24a', fungsi: 'menyebar kode ruang lalu digeser' },
  h: { nama: 'JALUR C', warna: '#a97bff', fungsi: 'menggandakan kode ruang' },
  k: { nama: 'JALUR D', warna: '#4ade80', fungsi: 'hanya menggeser kode ruang' }
};

function mn(j, R) {                       // koefisien & konstanta tiap jalur
  if (j === 'f') return [R.a, R.b];
  if (j === 'g') return [R.c, R.d];
  if (j === 'h') return [R.e, 0];
  return [1, R.q];                        // k
}
function applyJalur(j, x, R) { const [m, n] = mn(j, R); return m * x + n; }
function applySeq(x, order, R) { let v = x; for (const j of order) v = applyJalur(j, v, R); return v; }
function coefOf(order, R) {               // komposisi seluruh rute -> (A x + B)
  let A = 1, B = 0;
  for (const j of order) { const [m, n] = mn(j, R); A = m * A; B = m * B + n; }
  return { A, B };
}
function poly(m, n) {                     // "3x + 1" / "x − 1" / "2x"
  let s = (m === 1 ? '' : m) + 'x';
  if (n > 0) s += ' + ' + n;
  else if (n < 0) s += ' ' + MINUS + ' ' + Math.abs(n);
  return s;
}
function fJalur(j, R) { const [m, n] = mn(j, R); return j + '(x) = ' + poly(m, n); }
function notasi(order) {
  if (order.length === 1) return order[0];
  return '(' + order.slice().reverse().join('\u2218') + ')';
}
function namaRute(order) { return order.map(j => JALUR_INFO[j].nama.replace('JALUR ', '')).join(' \u2192 '); }

/* --------------------------------------------- 3. GENERATOR RUTE & LEMBAR */
function genRute(seed) {
  const r = makeRng(seed);
  for (let guard = 0; guard < 20000; guard++) {
    const a = pick(r, COEF), c = pick(r, COEF);
    if (a === c) continue;
    const b = pick(r, CONST), d = pick(r, CONST);
    if (commutative(a, b, c, d)) continue;              // WAJIB
    const e = pick(r, [2, 3]);
    const q = pick(r, [-4, -3, -2, -1, 1, 2, 3, 4]);
    const x0 = 2 + Math.floor(r() * 11);                // 2..12
    const base = { seed, a, b, c, d, e, q };
    if (Math.abs(applyJalur('f', x0, base)) > 60) continue;
    const y2 = applySeq(x0, ['f', 'g'], base);
    if (Math.abs(y2) > 400) continue;
    const order = shuffle(r, ['f', 'g', 'h', 'k']);     // urutan rute wajib
    const R = Object.assign({}, base, { x0, order });
    const { A, B } = coefOf(order, R);
    const fc = A * x0 + B;
    if (fc > 900 || fc < 20) continue;
    return Object.assign(R, { A, B, finalCode: fc, sheet: 1 });
  }
  return null;
}
/* lembar baru: angka acak ulang, peta & bentuk jalur tetap */
function genLembar(prev, seed) {
  const r = makeRng(seed);
  for (let guard = 0; guard < 20000; guard++) {
    const x0 = 2 + Math.floor(r() * 11);
    const R = Object.assign({}, prev, { x0, sheetSeed: seed });
    if (Math.abs(applyJalur('f', x0, R)) > 60) continue;
    const order = shuffle(r, ['f', 'g', 'h', 'k']);
    R.order = order;
    const { A, B } = coefOf(order, R);
    const fc = A * x0 + B;
    if (fc > 900 || fc < 20) continue;
    R.A = A; R.B = B; R.finalCode = fc; R.sheet = (prev.sheet || 1) + 1;
    return R;
  }
  return null;
}

/* --------------------------------------------------- 4. JAWABAN & SCOPING */
function norm(s) {
  let t = String(s == null ? '' : s).trim().toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\u00d7|\u00b7/g, '*')
    .replace(/[\u2212\u2013\u2014]/g, '-')
    .replace(/\^/g, '**');
  const comas = (t.match(/,/g) || []).length;
  if (comas === 1) t = /^-?\d+,\d+$/.test(t) ? t.replace(',', '.') : t.replace(',', '+');
  else if (comas > 1) t = t.replace(/,/g, '+');
  t = t.replace(/([0-9x)])(\()/g, '$1*(');      // implisit kali: 12(x+3) -> 12*(x+3); "(" di awal tidak diganggu
  t = t.replace(/\)x/g, ')*x');
  t = t.replace(/\*+/g, '*');
  return t;
}
function exprForms(A, B) {                          // bentuk-bentuk yang diterima
  const out = new Set();
  const cs = A === 1 ? ['1', ''] : [String(A)];
  const Bt = B === 0 ? '' : (B > 0 ? '+' + B : '-' + Math.abs(B));
  for (const c of cs) {
    out.add(c + 'x' + Bt);
    out.add(c + 'x+0');
    if (B !== 0) {
      const first = B > 0 ? String(B) : '-' + Math.abs(B);
      out.add(first + '+' + c + 'x');
      out.add(first + '+' + c + '*x');
    }
  }
  return out;
}
function parseLin(t) {                              // "3x+1" / "1+3x" / "x-1" / "-2x" / "2(x+3)"
  if (!t || !/^[-+0-9x*]+$/.test(t)) return null;
  // bentuk kurung: a(x+b)
  const par = t.match(/^(-?\d*)\*?\(x([+-]\d+)\)$/);
  if (par) {
    const a = (par[1] === '' || par[1] === '+') ? 1 : (par[1] === '-' ? -1 : parseInt(par[1], 10));
    const b = parseInt(par[2], 10);
    return { a: a, b: a * b };
  }
  const parts = t.replace(/-/g, '+-').split('+').filter(Boolean);
  let a = 0, b = 0, ok = false;
  for (const p of parts) {
    if (p.indexOf('x') >= 0) {
      // bentuk sah: "3x", "-x", "x", "3*x" - x harus di AKHIR suku ("x12" ditolak)
      const m2 = p.match(/^(-?\d*)\*?x$/);
      if (!m2) return null;
      const k = m2[1];
      if (k === '' || k === '+') a += 1;
      else if (k === '-') a -= 1;
      else a += parseInt(k, 10);
      ok = true;
    } else {
      if (!/^-?\d+$/.test(p)) return null;
      b += parseInt(p, 10); ok = true;
    }
  }
  return ok ? { a: a, b: b } : null;
}
function evalExpr(t) {                              // uji nilai: dukung "2(x+3)" / "2*(x+3)"
  if (!/^[-+0-9x*().]+$/.test(t)) return null;
  try {
    const f = new Function('x', 'return (' + t + ');');
    const v = [f(0), f(1), f(2)];
    if (v.some(n => typeof n !== 'number' || !isFinite(n))) return null;
    return v;
  } catch (e) { return null; }
}
function checkExpr(t, A, B) {
  const n = norm(t);
  if (exprForms(A, B).has(n)) return true;
  const p = parseLin(n);
  if (p && p.a === A && p.b === B) return true;
  if (!/^[-+0-9x*().]+$/.test(n)) return false;
  const v = evalExpr(n);
  if (v && Math.abs(v[0] - B) < 1e-9 && Math.abs((v[1] - v[0]) - A) < 1e-9 &&
      Math.abs((v[2] - v[0]) - 2 * A) < 1e-9) return true;
  return false;
}
function nums(t) {                                   // NB: spasi DIPERTAHANKAN
  const s = String(t == null ? '' : t).trim()
    .replace(/[\u2212\u2013\u2014]/g, '-').replace(/,/g, '.');
  const m = s.match(/-?\d+(\.\d+)?/g);
  return m ? m.map(Number) : [];
}
function checkNum(t, target) {
  const n = nums(t);
  return n.length === 1 && Math.abs(n[0] - target) < 1e-9;
}

/* ------------------------------------------------------- 5. GAMBARAN SOAL */
function coefLine(R) {
  return ['f', 'g', 'h', 'k'].map(j => fJalur(j, R)).join('   ');
}

/* ------------------------------------------------------------ 6. UI DASAR */
const ov = $('#ov'), ovBody = $('#ovBody');
function dlg(o) {                                   // dialog ala visual novel (teks diketik)
  return new Promise(res => {
    if (window.__typeT) { clearInterval(window.__typeT); window.__typeT = null; }
    const btns = (o.buttons || [{ label: 'Lanjut', act: 'ok' }]);
    ovBody.innerHTML =
      (o.tag ? '<div class="tag">' + o.tag + '</div>' : '') +
      (o.title ? '<h2>' + o.title + '</h2>' : '') +
      '<div class="speaker">' +
        (o.face || o.who ? '<div class="face"><canvas class="fcv" data-key="' + kunciWajah(o) + '" width="96" height="96"></canvas></div>' : '') +
        '<div class="bubble">' +
          (o.who ? '<div class="who">' + o.who + '</div>' : '') +
          '<div class="say"></div>' +
        '</div>' +
      '</div>' + (o.extra || '') +
      '<div class="actions">' + btns.map((b, i) => '<button class="btn ' + (b.cls || '') + '" data-i="' + i + '">' + b.label + '</button>').join('') + '</div>';
    if (o.after) o.after();
    ovBody.querySelectorAll('canvas.fcv').forEach(cv => gambarWajah(cv));
    /* efek teks diketik huruf demi huruf (HTML asli dipasang saat selesai) */
    const sayEl = ovBody.querySelector('.say');
    if (sayEl && o.say) {
      const full = String(o.say);
      const plain = full.replace(/<[^>]+>/g, '');
      let i = 0;
      sayEl.textContent = '';
      window.__typeT = setInterval(() => {
        i += 2;
        sayEl.textContent = plain.slice(0, i);
        if (i >= plain.length) { clearInterval(window.__typeT); window.__typeT = null; sayEl.innerHTML = full; }
      }, 16);
    } else if (sayEl && o.say === undefined) { sayEl.innerHTML = ''; }
    ov.classList.remove('hidden');
    ov.classList.toggle('soft', !!o.soft);
    const list = ovBody.querySelectorAll('.actions button');
    list.forEach((b, i) => {
      b.onclick = () => {
        AUDIO.init();
        AUDIO.sfx('klik');
        if (window.__typeT) { clearInterval(window.__typeT); window.__typeT = null; }
        if (o.clear !== false) ovBody.innerHTML = '';
        ov.classList.add('hidden');
        res(btns[i].act);
      };
      if (i === 0) b.dataset.first = '1';
    });
    ov.onkeydown = e => { if (e.key === 'Enter') { const f = ovBody.querySelector('.actions button[data-first]'); if (f) f.click(); } };
    list[0] && list[0].focus();
  });
}
function closeOv() { ovBody.innerHTML = ''; ov.classList.add('hidden'); }

/* --------------------------------------------------------------- 7. PETA  */
const STASIUN_POS = {
  pusat: { x: 500, y: 350, r: 38 },
  f: { x: 165, y: 128, r: 30 },
  g: { x: 165, y: 572, r: 30 },
  h: { x: 835, y: 150, r: 30 },
  k: { x: 835, y: 560, r: 30 }
};
function mapSize() {
  const b = $('#mapbox').getBoundingClientRect();
  return { w: b.width || 1000, h: b.height || 700 };
}
function drawMap(R) {
  const map = $('#map');
  if (!map) return;                       // peta SVG digantikan canvas dunia (world.js)
  const { w, h } = mapSize();
  map.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  let s = '';
  s += '<defs><pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">' +
       '<path d="M50 0H0V50" fill="none" stroke="#132139" stroke-width="1"/></pattern></defs>';
  s += '<rect width="' + w + '" height="' + h + '" fill="url(#grid)"/>';
  // tata letak relatif (skala proporsional, tidak peduli lebar panel)
  const sx = w / 1000, sy = h / 700;
  const S = {
    pusat: { x: 500 * sx, y: 350 * sy },
    f: { x: 165 * sx, y: 128 * sy },
    g: { x: 165 * sx, y: 572 * sy },
    h: { x: 835 * sx, y: 150 * sy },
    k: { x: 835 * sx, y: 560 * sy }
  };
  MAPS = S;
  const fs = Math.max(11, Math.min(20, Math.min(w / 46, h / 30)));
  for (const j of ['f', 'g', 'h', 'k']) {
    const p = S[j], c = JALUR_INFO[j].warna;
    s += '<line x1="' + S.pusat.x + '" y1="' + S.pusat.y + '" x2="' + p.x + '" y2="' + p.y +
         '" stroke="' + c + '" stroke-width="9" stroke-opacity=".35" stroke-linecap="round"/>';
    s += '<line x1="' + S.pusat.x + '" y1="' + S.pusat.y + '" x2="' + p.x + '" y2="' + p.y +
         '" stroke="' + c + '" stroke-width="2" stroke-dasharray="14 16"/>';
  }
  const rr = fs * 1.9;
  s += '<circle cx="' + S.pusat.x + '" cy="' + S.pusat.y + '" r="' + rr + '" fill="#0f1a2e" stroke="#38bdf8" stroke-width="3"/>' +
       '<text x="' + S.pusat.x + '" y="' + (S.pusat.y - 3) + '" text-anchor="middle" fill="#9fd8ff" font-size="' + (fs * .85) + '" font-family="monospace">STASIUN</text>' +
       '<text x="' + S.pusat.x + '" y="' + (S.pusat.y + fs + 1) + '" text-anchor="middle" fill="#9fd8ff" font-size="' + (fs * .85) + '" font-family="monospace">PUSAT</text>';
  for (const j of ['f', 'g', 'h', 'k']) {
    const p = S[j], c = JALUR_INFO[j].warna;
    const stamped = (ST.caps || []).indexOf(j) >= 0;
    const warn = (p.x > w - 4 * fs) ? -1 : 1;   // label di sisi dalam, jangan keluar layar
    const tx = p.x + (p.x < w / 2 ? 1 : -1) * 0;
    s += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + rr + '" fill="#0d1526" stroke="' + c + '" stroke-width="' + (stamped ? 6 : 3) + '"/>' +
         '<text x="' + p.x + '" y="' + (p.y + fs * .45) + '" text-anchor="middle" fill="' + c + '" font-size="' + (fs * 1.5) + '" font-family="monospace">' + j + '</text>' +
         '<text x="' + p.x + '" y="' + (p.y + rr + fs * 1.35) + '" text-anchor="middle" fill="#cfe0f5" font-size="' + fs + '" font-family="monospace">' +
           JALUR_INFO[j].nama + ' \u00b7 ' + fJalur(j, R) + '</text>' +
         (stamped ? '<text x="' + (p.x + rr * .8) + '" y="' + (p.y - rr * .8) + '" text-anchor="middle" fill="#8ef0b5" font-size="' + (fs * 1.2) + '" font-family="monospace">\u2713</text>' : '');
  }
  map.innerHTML = s;
}
let MAPS = null;

let ACTOR_AT = 'pusat';
function syncActor() { setActor(ACTOR_AT); }
function setActor(j, R) {                            // posisi pemain di peta
  const a = $('#actor');
  if (!a) { ACTOR_AT = j || 'pusat'; return; }        // token digambar oleh world.js
  a.classList.remove('hidden');
  ACTOR_AT = j || 'pusat';
  if (!MAPS) return;
  const p = (!j || j === 'pusat') ? MAPS.pusat : MAPS[j];
  const dx = (j === 'f' || j === 'g') ? 40 : (j === 'h' || j === 'k' ? -40 : 0);
  const dy = (j === 'f' || j === 'h') ? 46 : (j === 'g' || j === 'k' ? -46 : 60);
  a.style.transform = 'translate(' + (p.x + dx) + 'px,' + (p.y + dy) + 'px)';
}
function trainTo(j) {
  if (!$('#train') || !MAPS) return;
  const t = $('#train'); t.classList.remove('hidden');
  const p = (!j || j === 'pusat') ? MAPS.pusat : MAPS[j];
  const dx = (j === 'f' || j === 'g') ? 55 : (j === 'h' || j === 'k' ? -55 : 0);
  const dy = (j === 'f' || j === 'h') ? -60 : (j === 'g' || j === 'k' ? 60 : -70);
  t.innerHTML = '<div style="width:74px;height:34px;border-radius:8px;background:linear-gradient(180deg,#20334f,#16233c);' +
    'border:2px solid #38bdf8;position:relative;box-shadow:0 0 18px rgba(56,189,248,.35)">' +
    '<div style="position:absolute;left:8px;top:7px;width:13px;height:10px;background:#9fd8ff;border-radius:2px"></div>' +
    '<div style="position:absolute;left:28px;top:7px;width:13px;height:10px;background:#9fd8ff;border-radius:2px"></div>' +
    '<div style="position:absolute;left:50px;top:7px;width:13px;height:10px;background:#9fd8ff;border-radius:2px"></div></div>';
  t.style.transition = 'transform 2.2s linear';
  t.style.transform = 'translate(' + (p.x + dx) + 'px,' + (p.y + dy) + 'px)';
}

function hud() {
  const R = CUR, STx = ST;
  $('#hStation').textContent = STx.tempat || '\u2014';
  $('#hCode').textContent = STx.code;
  $('#hCap').textContent = STx.capLabel || '\u2014';
  $('#hSenyum').textContent = STx.smile === 0 ? '\u00b7' : '\u2665'.repeat(STx.smile);
  $('#hCaps').innerHTML = ['f', 'g', 'h', 'k'].map(j =>
    '<i class="' + ((STx.caps || []).indexOf(j) >= 0 ? 'on' : '') + '" style="color:' + JALUR_INFO[j].warna + '"></i>').join('');
  $('#hRute').textContent = 'RUTE ' + R.seed + (R.sheet > 1 ? ' \u00b7 LEMBAR ' + R.sheet : '');
  $('#hProg').style.width = Math.round(((STx.caps || []).length / ST.path.length) * 100) + '%';
}
function hintBar(t) { $('#hintbar').innerHTML = t; }
function bigBtn(label, fn) {
  const b = $('#btnAct');
  if (!b) return;
  if (!label) { b.classList.add('hidden'); b.onclick = null; return; }
  b.classList.remove('hidden'); b.textContent = label; b.onclick = fn;
}

/* ------------------------------------------------------- 8. PANEL SOAL UI */
/* type: num | expr | pair | letter.  Semua dijawab dengan mengetik. */
const PADS = {
  num: ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '-'],
  expr: ['x', '+', '-', '7', '8', '9', '4', '5', '6', '1', '2', '3', '0'],
  pair: ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', 'spasi'],
  letter: ['f', 'g', 'h', 'k']
};
function askQuestion(q) {
  return new Promise(resolve => {
    let wrong = 0;
    const wrap = $('#qwrap');
    function render() {
      wrap.classList.add('on');
      if (CUR) setTimeout(() => { drawMap(CUR); if (ST.path) hud(); syncActor(); }, 30);
      wrap.innerHTML =
        '<div class="qcard">' +
          '<div class="qhead"><span class="tag" style="margin:0">' + q.tag + '</span>' +
            '<span class="who">' + (q.who || 'PETUGAS') + '</span>' +
            '<span class="tries" id="qtries"></span></div>' +
          '<div class="qtext">' + q.prompt + '</div>' +
          (q.sub ? '<div class="qsub">' + q.sub + '</div>' : '') +
          '<div class="qrow"><input id="qin" autocomplete="off" spellcheck="false" placeholder="' + (q.ph || 'ketik jawabanmu') + '">' +
            '<button class="btn primary" id="qgo">KIRIM</button></div>' +
          '<div class="pad">' + PADS[q.type].map(k => (k === 'spasi'
              ? '<button data-k=" ">spasi</button>'
              : '<button data-k="' + k + '">' + k + '</button>')).join('') +
            '<button data-k="\b" class="warn">\u232b hapus</button>' +
            '<button data-k="\n" class="ok">kirim \u21b5</button></div>' +
          '<div class="fb" id="qfb"></div>' +
        '</div>';
      const inp = $('#qin');
      wrap.querySelectorAll('.pad button').forEach(b => b.onclick = () => {
        const k = b.dataset.k;
        if (k === '\b') inp.value = inp.value.slice(0, -1);
        else if (k === '\n') submit();
        else if (k === ' ') inp.value += ' ';
        else inp.value += k;
        inp.focus();
      });
      $('#qgo').onclick = submit;
      inp.onkeydown = e => { if (e.key === 'Enter') submit(); };
      inp.focus();
    }
    function fb(cls, html) { const f = $('#qfb'); f.className = 'fb ' + cls; f.innerHTML = html; }
    async function submit() {
      const raw = $('#qin').value;
      if (!norm(raw)) return;
      const ok = q.check(raw);
      AUDIO.sfx(ok ? 'benar' : 'salah');
      if (q.tag && (q.tag.indexOf('TULIS CAP') >= 0 || q.tag.indexOf('INVERS \u00b7 3') >= 0)) EXPR_LOG.push(ok);
      if (ok) {
        fb('good', q.goodHtml(raw));
        q.record(raw, true, wrong);
        await new Promise(r => { $('#qgo').textContent = 'LANJUT \u21b5'; $('#qgo').onclick = r; $('#qin').onkeydown = e => { if (e.key === 'Enter') r(); }; });
        wrap.innerHTML = ''; wrap.classList.remove('on');
        resolve({ ok: true });
        return;
      }
      wrong++;
      const msg = q.diagnose ? q.diagnose(raw, wrong) : 'Belum tepat. Coba periksa kembali langkahmu.';
      if (wrong >= 2) {
        // percobaan terakhir: petugas loket menyelipkan LEMBAR CONTOH (pola, bukan jawaban)
        const more = q.example ? q.example() : '';
        fb('bad', '<span class="ttl">\u2716 ' + (q.rejectTitle || 'TIKET DITOLAK') + '</span><br>' + msg +
          (more ? '<span class="ttl" style="display:block;margin-top:8px">LEMBAR CONTOH DARI PETUGAS LOKET</span>' + more + '' : ''));
        q.record(raw, false, wrong);
        const go = $('#qgo');
        go.textContent = 'SAYA PAHAM, KEMBALI KE LOKET';
        go.onclick = () => { wrap.innerHTML = ''; wrap.classList.remove('on'); resolve({ ok: false, consumed: true }); };
        $('#qin').onkeydown = e => { if (e.key === 'Enter') go.click(); };
        return;
      }
      const more = (q.example && wrong >= 3) ? q.example() : '';
      fb('bad', '<span class="ttl">\u2716 ' + (q.rejectTitle || 'TIKET DITOLAK') + '</span><br>' + msg + more);
      q.record(raw, false, wrong);
      $('#qtries').textContent = 'PERCOBAAN 2 DARI 2 \u2014 HATI-HATI';
    }
    render();
    $('#qtries').textContent = 'PERCOBAAN 1 DARI 2';
  });
}

/* -------------------------------------------------------- 9. APAKAH SOAL  */
function makeSoal(kind, i, R) {
  const path = ST.path;
  const STx = ST;
  const base = { who: 'PETUGAS PERON', tag: '', rejectTitle: 'TIKET DITOLAK' };

  if (kind === 'loket-konsep') {
    const first = path[0];
    const huruf = { f: 'f', g: 'g', h: 'h', k: 'k' };
    return Object.assign(base, {
      who: 'PETUGAS LOKET', tag: 'LOKET \u00b7 SOAL KONSEP',
      prompt: 'Lembar ini menetapkan rute: ' + namaRute(path) + '.\n' +
              'Cap akhir yang diminta penerima: ' + notasi(path) + '(x).\n\n' +
              'Jalur mana yang harus kamu lalui PALING DULU? (ketik hurufnya)',
      sub: 'Petunjuk baca: notasi komposisi dibaca dari kanan.',
      type: 'letter', ph: 'ketik f / g / h / k',
      check: raw => huruf[norm(raw)[0]] === first,
      diagnose: (raw, w) => {
        const t = norm(raw)[0];
        if (huruf[t]) return 'Kamu memilih jalur <b>' + t + '</b>. Perhatikan: di ' + notasi(path) + '(x), fungsi yang ditulis paling <b>kanan</b> dikerjakan paling awal.';
        return 'Tulis satu huruf jalur: f, g, h, atau k.';
      },
      example: () => '<span class="calc">Contoh pola: rute (k\u2218h)(x) \u2192 tulis k\u2218h terbalik jadi h dulu, baru k.\n' +
        'Jadi jalur paling dulu = yang hurufnya paling kanan pada notasi.</span>',
      goodHtml: () => '<span class="ttl">\u2714 TIKET DITERBITKAN</span><br>' +
        'Benar. Notasi ' + notasi(path) + ' dibaca dari kanan: <b>' + first + '</b> dikerjakan lebih dulu.',
      record: (raw, ok, w) => STx.stats.push({ peron: 'Loket', typed: raw, ok, cap: path[0], kode: '-' })
    });
  }

  if (kind === 'peron') {
    const j = path[i];
    const codeIn = applySeq(R.x0, path.slice(0, i), R);
    const codeOut = applySeq(R.x0, path.slice(0, i + 1), R);
    const [m, n] = mn(j, R);
    const jl = '';
    return Object.assign(base, {
      tag: 'PERON ' + (i + 1) + ' \u00b7 JALUR ' + j.toUpperCase(),
      prompt: fJalur(j, R) + '\nKode ruangmu saat tiba di peron ini: ' + codeIn + '\n\nBerapa kode ruangmu setelah melewati jalur ini?',
      type: 'num', ph: 'ketik angka',
      check: raw => checkNum(raw, codeOut),
      diagnose: (raw, w) => {
        const t = nums(raw)[0];
        if (t === codeIn) return 'Kamu menulis kode ruang sebelum jalur ini. Jalur ' + j + ' belum dikerjakan.';
        if (t === applyJalur(j, R.x0, R)) return 'Kamu memakai kode ruang awal (' + R.x0 + '), bukan kode ruang di peron ini (' + codeIn + ').';
        if (t === applySeq(R.x0, path.slice(0, i + 2), R)) return 'Kamu terlalu jauh satu jalur. Jalur berikutnya belum kamu lalui.';
        const alt = applyJalur(j, codeIn, R);
        if (t !== undefined && Math.abs(t - alt) < 1e-9) return 'Hitung ulang dengan cermat: ' + j + '(x) = ' + poly(m, n) + ', masukkan x = ' + codeIn + '.';
        if (t !== undefined && (t - codeIn) === n) return 'Kamu hanya menambah/ mengurangi ' + Math.abs(n) + ', padahal jalur ini juga mengalikan kode ruang dengan ' + m + '.';
        return 'Kode ruang di peron ini ' + codeIn + '. Masukkan angka itu ke ' + j + '(x) = ' + poly(m, n) + '.';
      },
      example: () => {
        const other = ['f', 'g', 'h', 'k'].filter(x => x !== j)[0];
        const [m2, n2] = mn(other, R);
        return '<span class="calc">Contoh pola (angka beda): kode 6 lewat ' + other + '(x) = ' + poly(m2, n2) +
               ' \u2192 6 \u00d7 ' + m2 + (n2 >= 0 ? ' + ' + n2 : ' ' + MINUS + ' ' + Math.abs(n2)) + ' = ' + applyJalur(other, 6, R) + '.</span>';
      },
      goodHtml: () => '<span class="ttl">\u2714 CAP TURUN DI TIKET</span><br>Cap <b>' + j + '</b> sah.' +
        '<span class="calc">Perhitungan: ' + j + '(' + codeIn + ') = ' + poly(m, n).replace('x', String(codeIn)) + ' = ' + codeOut + '</span>',
      record: (raw, ok, w) => STx.stats.push({ peron: 'Peron ' + (i + 1), typed: raw, ok, cap: j, kode: codeOut })
    });
  }

  if (kind === 'receipt-rumus' || kind === 'receipt-nilai') {
    const { A, B } = coefOf(path, R);
    if (kind === 'receipt-rumus') {
      return Object.assign(base, {
        who: 'PENERIMA PAKET', tag: 'PINTU KELUAR \u00b7 TULIS CAP',
        prompt: 'Rute yang kamu tempuh: ' + namaRute(path) + '\n' +
                'Tulis cap akhir paket dalam bentuk fungsi.\n\n' + notasi(path) + '(x) = \u2026',
        sub: 'Bentuk jawaban: ax + b, contoh: 12x + 8',
        type: 'expr', ph: 'contoh: 12x+8',
        check: raw => checkExpr(raw, A, B),
        diagnose: (raw, w) => {
          const p = parseLin(norm(raw));
          const wrongOrder = coefOf(path.slice().reverse(), R);
          if (p && p.a === wrongOrder.A && p.b === wrongOrder.B) return 'Bentukmu persis hasil urutan <b>terbalik</b>. Jalur paling kanan di notasi justru dikerjakan lebih dulu.';
          const partial = coefOf(path.slice(0, path.length - 1), R);
          if (p && p.a === partial.A && p.b === partial.B) return 'Kamu berhenti satu jalur sebelum selesai. Jalur terakhir belum kamu masukkan.';
          if (p && p.b === B && p.a !== A) return 'Konstantanya sudah benar, koefisien x belum. Periksa hasil perkalian koefisien semua jalur.';
          if (p) return 'Kalikan jalur satu per satu dari yang paling kanan: ' + path[0] + ' dulu, lalu ' + path.slice(1).join(', ') + '.';
          return 'Tulis dalam bentuk ax + b. Contoh: 12x + 8.';
        },
        example: () => {
          const [m1, n1] = mn(path[1 % path.length], R), [m2, n2] = mn(path[0], R);
          const A2 = m1 * m2, B2 = m1 * n2 + n1;
          return '<span class="calc">Contoh pola 2 jalur (angka beda): (' + path[1 % path.length] + '\u2218' + path[0] + ')(x)\n' +
                 '= ' + m1 + '(' + poly(m2, n2) + ') = ' + poly(m1 * m2, m1 * n2) + (n1 >= 0 ? ' + ' + n1 : ' ' + MINUS + ' ' + Math.abs(n1)) + ' = ' + poly(A2, B2) + '</span>';
        },
        goodHtml: () => '<span class="ttl">\u2714 CAP AKHIR DITERIMA</span><br>' +
          notasi(path) + '(x) = <b>' + poly(A, B) + '</b><span class="calc">Diperiksa dari rute: ' + path.map(j => j).join(' \u2192 ') + '</span>',
        record: (raw, ok, w) => STx.stats.push({ peron: 'Pintu Keluar', typed: raw, ok, cap: notasi(path), kode: '-' })
      });
    }
    return Object.assign(base, {
      who: 'PENERIMA PAKET', tag: 'PINTU KELUAR \u00b7 NILAI CAP',
      prompt: 'Cap akhir paket: ' + notasi(path) + '(x) = ' + poly(A, B) + '\nKode ruang awal paket ini: ' + R.x0 +
              '\n\nBerapa kode ruangmu di pintu keluar?',
      type: 'num', ph: 'ketik angka',
      check: raw => checkNum(raw, R.finalCode),
      diagnose: (raw, w) => {
        const t = nums(raw)[0];
        if (t === A * R.x0 - B) return 'Tanda konstanta terbalik. Di ' + poly(A, B) + ', tanda ' + (B > 0 ? '+' : MINUS) + ' harus ikut dipakai.';
        if (t === A + B) return 'Kamu langsung menggabungkan ' + A + ' dan ' + B + '. Kode ruang awal (' + R.x0 + ') dulu yang dimasukkan ke x.';
        if (t === B - A * R.x0) return 'Kode ruang awal belum dikalikan dengan ' + A + '.';
        if (t !== undefined) return 'Masukkan x = ' + R.x0 + ' ke ' + poly(A, B) + ': hitung ' + A + ' \u00d7 ' + R.x0 + ', lalu sesuaikan dengan ' + B + '.';
        return 'Masukkan kode ruang awal ke cap akhir.';
      },
      example: () => '<span class="calc">Contoh pola: ' + poly(A, B) + ' dengan x = 3 \u2192 ' + A + ' \u00d7 3 ' +
        (B >= 0 ? ' + ' + B : ' ' + MINUS + ' ' + Math.abs(B)) + ' = ' + (A * 3 + B) + '</span>',
      goodHtml: () => '<span class="ttl">\u2714 PAKET DITERIMA</span><br>Kode ruang di pintu keluar: <b>' + R.finalCode + '</b>' +
        '<span class="calc">' + notasi(path) + '(' + R.x0 + ') = ' + A + '(' + R.x0 + ')' + (B >= 0 ? ' + ' + B : ' ' + MINUS + ' ' + Math.abs(B)) + ' = ' + R.finalCode + '</span>',
      record: (raw, ok, w) => STx.stats.push({ peron: 'Pintu Keluar', typed: raw, ok, cap: 'nilai', kode: R.finalCode })
    });
  }

  if (kind === 'inv-pair') {
    return Object.assign(base, {
      who: 'PETUGAS PENGADUAN', tag: 'BABAK INVERS \u00b7 1',
      prompt: 'Cap pabrik paket ini: E(x) = ' + poly(R.A, R.B) + '\n' +
              'Kita balik: y = ' + poly(R.A, R.B) + ' \u2192 x = (y ' + (R.B > 0 ? MINUS + ' ' + R.B : '+ ' + Math.abs(R.B)) + ') / ' + R.A + '\n\n' +
              'Sesuai contoh itu: tulis E\u207b\u00b9(x) = (x + a) / b. Berapa nilai <b>a</b> dan <b>b</b>?\n' +
              'Kalau tanda di capmu minus, tulis a sebagai bilangan negatif.',
      sub: 'Isi a lalu b, pisahkan dengan spasi. Contoh: 3 4 (untuk (x + 3)/4) atau -3 4 (untuk (x \u2212 3)/4)',
      type: 'pair', ph: 'contoh: 3 4',
      check: raw => { const n = nums(raw); return n.length === 2 && Math.abs(n[0] - (-R.B)) < 1e-9 && Math.abs(n[1] - R.A) < 1e-9; },
      diagnose: (raw, w) => {
        const n = nums(raw);
        if (n.length === 2 && n[0] === R.A && n[1] === -R.B) return 'Angkanya tertukar posisi: ' + R.A + ' adalah <b>pembagi</b>, ' + (-R.B) + ' adalah <b>a</b>.';
        if (n.length === 2 && n[0] === R.B) return 'Tanda a belum dibalik. Di ' + poly(R.A, R.B) + ', konstanta ' + (R.B > 0 ? '+ ' + R.B : MINUS + ' ' + Math.abs(R.B)) +
          ' berpindah ruas jadi ' + ((-R.B) >= 0 ? '+ ' + (-R.B) : MINUS + ' ' + Math.abs(-R.B)) + '.';
        if (n.length === 2 && n[1] === 1) return 'Pembaginya bukan 1. Setelah konstanta dipindah, kedua ruas dibagi ' + R.A + '.';
        return 'Lihat contohnya persis: y = 4x \u2212 3 \u2192 x = (y + 3)/4 \u2192 a = 3, b = 4. Sekarang pakai angka capmu.';
      },
      example: () => '<span class="calc">Contoh pola yang tertulis di layar:\n' +
        'y = 4x \u2212 3  \u2192  x = (y + 3)/4  \u2192  E\u207b\u00b9(x) = (x + 3)/4\n' +
        'jadi kamu tulis: 3 4  (a = 3, b = 4)\n' +
        'kalau capmu y = 4x + 3 \u2192 x = (y \u2212 3)/4 \u2192 kamu tulis: -3 4</span>',
      goodHtml: () => '<span class="ttl">\u2714 TERBACA</span><br>a = ' + (-R.B) + ', b = ' + R.A +
        '  \u2192  E\u207b\u00b9(x) = (x ' + ((-R.B) >= 0 ? '+ ' + (-R.B) : MINUS + ' ' + Math.abs(-R.B)) + ') / ' + R.A,
      record: (raw, ok, w) => STx.stats.push({ peron: 'Invers 1', typed: raw, ok, cap: 'E\u207b\u00b9', kode: '-' })
    });
  }

  if (kind === 'inv-isi') {
    return Object.assign(base, {
      who: 'PETUGAS PENGADUAN', tag: 'BABAK INVERS \u00b7 2',
      prompt: 'Label kotak pos ini hanya menunjukkan angka ' + R.finalCode + '.\n' +
              'Cap paket: E(x) = ' + poly(R.A, R.B) + '\n\nBerapa isi aslinya (kode ruang awal paket)?',
      type: 'num', ph: 'ketik angka',
      check: raw => checkNum(raw, R.x0),
      diagnose: (raw, w) => {
        const t = nums(raw)[0];
        if (t === R.finalCode) return 'Kamu menulis angkanya kembali. Angka di label itu hasil cap, yang diminta yang <b>sebelum</b> dicap.';
        if (t !== undefined && Math.abs(t - R.finalCode / R.A) < 1e-9) return 'Kamu membagi dengan ' + R.A + ' saja, padahal ' + R.B + ' harus dihilangkan lebih dulu.';
        if (t !== undefined) return 'Urutannya: tambahkan ' + Math.abs(R.B) + ' pada ' + R.finalCode + ', baru bagi ' + R.A + '.';
        return 'Balik cap paket satu langkah demi satu langkah.';
      },
      example: () => '<span class="calc">Contoh pola: E(x) = 4x \u2212 3, label 29 \u2192 (29 + 3)/4 = 32/4 = 8\n' +
        'Cek: 4 \u00d7 8 \u2212 3 = 29 \u2713</span>',
      goodHtml: () => '<span class="ttl">\u2714 ISI TERBACA</span><br>Isi asli: <b>' + R.x0 + '</b>' +
        '<span class="calc">Cek: E(' + R.x0 + ') = ' + poly(R.A, R.B).replace('x', String(R.x0)) + ' = ' + R.finalCode + ' \u2713</span>',
      record: (raw, ok, w) => STx.stats.push({ peron: 'Invers 2', typed: raw, ok, cap: 'isi', kode: R.x0 })
    });
  }

  if (kind === 'inv-bukti') {
    return Object.assign(base, {
      who: 'PETUGAS PENGADUAN', tag: 'BABAK INVERS \u00b7 3',
      prompt: 'Buktikan cap ini bisa dibatalkan.\nHitung (E\u207b\u00b9 \u2218 E)(x) = \u2026',
      sub: 'Tulis hasil paling sederhana. Contoh: x',
      type: 'expr', ph: 'contoh: x',
      check: raw => checkExpr(raw, 1, 0),
      diagnose: (raw, w) => {
        const p = parseLin(norm(raw));
        if (p && p.a === R.A && p.b === R.B) return 'Kamu menulis cap E(x) sendiri. Yang diminta: hasil setelah cap dibatalkan.';
        if (p && p.a === 1) return 'Koefisien x sudah 1, tapi ada angka yang tersisa. Setelah dibatalkan, seharusnya tersisa x saja.';
        return 'Masukkan E(x) = ' + poly(R.A, R.B) + ' ke E\u207b\u00b9(x) = (x ' + (R.B > 0 ? MINUS + ' ' + R.B : '+ ' + Math.abs(R.B)) + ')/' + R.A + '.';
      },
      example: () => '<span class="calc">Contoh pola: E(x) = 4x \u2212 3, E\u207b\u00b9(x) = (x + 3)/4\n' +
        '(E\u207b\u00b9 \u2218 E)(x) = ((4x \u2212 3) + 3)/4 = 4x/4 = x \u2713</span>',
      goodHtml: () => '<span class="ttl">\u2714 TERBUKTI</span><br>(E\u207b\u00b9 \u2218 E)(x) = <b>x</b>' +
        '<span class="calc">E\u207b\u00b9(' + poly(R.A, R.B) + ') = ((' + poly(R.A, R.B) + ') ' + (R.B > 0 ? MINUS + ' ' + R.B : '+ ' + Math.abs(R.B)) + ')/' + R.A + ' = x</span>',
      record: (raw, ok, w) => STx.stats.push({ peron: 'Invers 3', typed: raw, ok, cap: '(E\u207b\u00b9\u2218E)', kode: '-' })
    });
  }

  if (kind === 'inv-jalur') {
    const j = path[1] || path[0];
    const [m, n] = mn(j, R);
    const z = applyJalur(j, R.x0, R);
    return Object.assign(base, {
      who: 'PETUGAS PENGADUAN', tag: 'BABAK INVERS \u00b7 4',
      prompt: 'Jalur ' + j.toUpperCase() + ': ' + fJalur(j, R) + '\n' +
              'Sebuah tiket lama bertanda ' + z + ' di ujung jalur ini (kode rute sama).\n\nBerapa nilai masukannya?',
      type: 'num', ph: 'ketik angka',
      check: raw => checkNum(raw, R.x0),
      diagnose: (raw, w) => {
        const t = nums(raw)[0];
        if (t === z) return 'Kamu menulis angka di ujung jalur. Yang dibalik: dari ujung menuju nilai masukannya.';
        if (m !== 1 && t !== undefined && Math.abs(t - (z - n)) < 1e-9) return 'Kamu mengurang ' + Math.abs(n) + ' saja. Karena jalur ini mengalikan dengan ' + m + ', hasilnya masih perlu dibagi ' + m + '.';
        if (m !== 1 && t !== undefined && Math.abs(t - z / m) < 1e-9) return 'Kamu membagi ' + m + ' saja. Pergeseran ' + Math.abs(n) + ' harus dihilangkan lebih dulu.';
        return 'Balik jalur ' + j + ': dari ' + z + ', hilangkan dulu pergeserannya, lalu bagi dengan ' + m + '.';
      },
      example: () => '<span class="calc">Contoh pola: k(x) = x + 6, ujung 16 \u2192 k\u207b\u00b9(16) = 16 \u2212 6 = 10\n' +
        'Cek: k(10) = 10 + 6 = 16 \u2713</span>',
      goodHtml: () => '<span class="ttl">\u2714 TERBACA</span><br>Nilai masukan: <b>' + R.x0 + '</b>' +
        '<span class="calc">Cek: ' + j + '(' + R.x0 + ') = ' + poly(m, n).replace('x', String(R.x0)) + ' = ' + z + ' \u2713</span>',
      record: (raw, ok, w) => STx.stats.push({ peron: 'Invers 4', typed: raw, ok, cap: j + '\u207b\u00b9', kode: R.x0 })
    });
  }
  return null;
}

/* ------------------------------------------------ 10a. SENYUM (HUD + toast) */
/* Satu pintu penambahan senyum: HUD langsung diperbarui, toast SENYUM PENUH
   hanya sekali per shift saat menyentuh tiga. */
function tambahSenyum() {
  ST.smile++;
  hud();
  AUDIO.sfx('senyum');
  if (ST.smile >= 3 && !ST.senyumToastSekali) {
    ST.senyumToastSekali = true;
    toast('SENYUM PENUH \u00b7 PENUMPANG AKAN MENGENALMU');
  }
}

/* ------------------------------------------------------- 10. NPC SIDEQUEST */
function npcData(i, R) {
  const list = [
    { nama: 'BU SARI, PENJUAL KUE', wajah: '\uD83E\uDDD5',
      sapaan: 'Nak, sebentar. Anak saya baru masuk jalur A dari kode ruang 4. Sampai di ujung jalurnya jadi berapa ya? Saya takut salah catat.',
      jenis: 'num', hitung: () => applyJalur('f', 4, R), label: 'kode ruang anak saya di ujung jalur A',
      penjelasan: 'f(4) = ' },
    { nama: 'PAK TUA PEMBAWA TIKET', wajah: '\uD83D\uDC74',
      sapaan: 'Tiket saya cuma bertanda begini. Jalur B itu menambah berapa? Saya sudah lupa.',
      jenis: 'num', hitung: () => R.d, label: 'pergeseran pada jalur B',
      penjelasan: '' },
    { nama: 'ANAK SEKOLAH', wajah: '\uD83E\uDDD1\u200D\uD83C\uDF93',
      sapaan: 'Kak, saya ada PR. Kalau h(x) dan g(x) digabung, jadi berapa? Tulis bentuknya ya, bukan nilainya.',
      jenis: 'expr', hitung: () => { const A = R.e * R.c, B = R.e * R.d; return { A, B }; }, label: '(h\u2218g)(x)',
      penjelasan: '' },
    { nama: 'PETUGAS KEBERSIHAN', wajah: '\uD83E\uDDF9',
      sapaan: 'Saya sering lihat jalur D. Itu kalau dibalik jadi fungsi apa? Saya cuma mau memastikan catatan saya benar.',
      jenis: 'expr', hitung: () => ({ A: 1, B: -R.q }), label: 'k\u207b\u00b9(x)',
      penjelasan: '' }
  ];
  return list[i % list.length];
}
async function sideQuest(i, R) {
  const d = npcData(i, R);
  const ambil = await dlg({
    tag: 'DI DALAM GERBONG \u00b7 OPSIONAL', face: d.wajah, who: d.nama,
    say: d.sapaan,
    buttons: [{ label: 'BANTU DIA', act: 'bantu', cls: 'gold' }, { label: 'MAAF, SAYA SEDANG BURU-BURU', act: 'tolak', cls: 'ghost' }]
  });
  if (ambil === 'tolak') {
    await dlg({
      face: d.wajah, who: d.nama, soft: true,
      say: 'Oh\u2026 ya sudah. Hati-hati di jalan.',
      buttons: [{ label: 'Lanjut', act: 'ok', cls: 'ghost' }]
    });
    return { helped: false, nama: d.nama };
  }
  // gerbong melambat, soal pendek dijawab sambil duduk
  ST.tempat = 'DI DALAM GERBONG';
  const jawab = d.jenis === 'num'
    ? { A: null, B: null }
    : d.hitung();
  const q = {
    who: d.nama, tag: 'SIDE QUEST \u00b7 BONUS',
    prompt: d.jenis === 'expr'
      ? 'Tulis bentuk ' + d.label + ' untuk jalur: ' + fJalur('g', R) + ' dan ' + fJalur('h', R)
      : d.sapaan.split('\n')[0] + '\n\nBerapa ' + d.label + '?',
    sub: d.jenis === 'expr' ? 'Bentuk jawaban: ax + b' : null,
    type: d.jenis, ph: d.jenis === 'expr' ? 'contoh: 6x+8' : 'ketik angka',
    rejectTitle: 'BANTUAN BELUM TUNTAS',
    check: d.jenis === 'num' ? (raw => checkNum(raw, d.hitung()))
                              : (raw => checkExpr(raw, jawab.A, jawab.B)),
    diagnose: (raw) => d.jenis === 'num'
      ? 'Coba hitung sekali lagi dengan cermat. Tidak apa-apa, kereta masih menunggu.'
      : 'Kalikan jalur yang kanan dulu. Bentuk akhir: ax + b.',
    goodHtml: () => d.jenis === 'num'
      ? '<span class="ttl">\u2714 TERIMA KASIH</span><br>Jawabanmu benar: <b>' + d.hitung() + '</b>'
      : '<span class="ttl">\u2714 TERIMA KASIH</span><br>' + d.label + ' = <b>' + poly(jawab.A, jawab.B) + '</b>',
    record: (raw, ok, w) => ST.stats.push({ peron: 'Side quest', typed: raw, ok, cap: d.label, kode: '-' })
  };
  const res = await askQuestion(q);
  if (res.ok) {
    await dlg({
      face: '\uD83D\uDE0A', who: d.nama,
      say: 'Terima kasih banyak! Ini untukmu.',
      buttons: [{ label: 'Lanjut', act: 'ok', cls: 'primary' }]
    });
    tambahSenyum();
    return { helped: true, nama: d.nama };
  }
  return { helped: false, nama: d.nama };
}

/* ------------------------------------------------------- 11. ALUR UTAMA  */
let CUR = null, SKIP_NPC = [], RUN_LOG = [], EXPR_LOG = [];

function seedBaru() { return Math.floor(Math.random() * 90000) + 10000; }

async function mulaiShift(seed, mode) {
  const R = genRute(seed) || genRute(seedBaru());
  CUR = R;
  R.path = R.order.slice(0, mode === 'singkat' ? 2 : 4);
  const { A, B } = coefOf(R.path, R);
  R.A = A; R.B = B; R.finalCode = A * R.x0 + B;
  ST = { code: R.x0, capLabel: null, caps: [], tempat: 'HALL TIKET', stats: [], smile: 0, sheet: 1, path: R.path };
  RUN_LOG = []; SKIP_NPC = []; EXPR_LOG = [];   // log permainan sebelumnya tidak ikut ke rapor
  window.STASIUN_TEME = { seed: 7, idx: 0 };   // stasiun awal: PUSAT
  $('#menu').classList.add('hidden');
  $('#app').classList.remove('hidden');
  drawMap(R); setActor('pusat', R); hud();
}

async function babakAwal(R) {
  await dlg({
    tag: 'SHIFT MALAM \u00b7 23:40', face: '\uD83C\uDF19', who: 'PESAN SINGKAT DARI KANTOR',
    say: 'Kode ruangmu malam ini <b>' + R.x0 + '</b>. Kotak pos di kode ruang ' + R.finalCode +
         ' menunggu. Jalur kereta kota ini adalah terowongan berkode: setiap kali kamu menempuh satu jalur, kode ruangmu berubah mengikuti sifat jalur itu.\n' +
         'Laporkan kode ruangmu di setiap peron, atau penjaga pintu keluar tidak akan melepasmu.',
    extra: '<div class="note">JALUR MALAM INI\n' + coefLine(R) + '\n\nRute wajib dari loket: ' + namaRute(R.path) + '</div>',
    buttons: [{ label: 'BERANGKAT KE LOKET', act: 'ok', cls: 'primary' }]
  });
}

async function babakLoket(R, alasan) {
  const a = await dlg({
    tag: 'LOKET TIKET \u00b7 STASIUN PUSAT', face: '\uD83E\uDDD1\u200D\uD83D\uDCBC', who: 'PETUGAS LOKET',
    say: (alasan ? alasan + '\n\n' : '') +
         'Lembar rute untukmu. Baca dulu: cap akhir yang diminta penerima <b>' + notasi(R.path) + '(x)</b>, dan kode ruang awalmu <b>' + R.x0 + '</b>.' +
         (R.sheet > 1 ? '\n\nLembar ke-' + R.sheet + '. Angkanya sudah diacak ulang, peta dan bentuk jalurnya tetap sama.' : ''),
    extra: '<div class="note">RUTE WAJIB: ' + namaRute(R.path) + '\nCAP DIMINTA: ' + notasi(R.path) + '(x)  |  KODE AWAL: ' + R.x0 +
           (R.sheet >= 3 ? '\n\nCATATAN PETUGAS: ini lembar terakhir di loket malam ini. Santai saja.' : '') + '</div>',
    buttons: [{ label: 'SAYA SIAP', act: 'ok', cls: 'primary' }]
  });
  if (R.sheet >= 2) {
    await dlg({
      face: '\uD83E\uDDD1\u200D\uD83D\uDCBC', who: 'PETUGAS LOKET', soft: true,
      say: 'Sekali lagi: baca notasi komposisi dari kanan. Yang ditulis paling kanan, dikerjakan paling dulu.',
      buttons: [{ label: 'Mengerti', act: 'ok', cls: 'ghost' }]
    });
  }
  return a;
}

async function babakPeron(R, i) {
  const j = R.path[i];
  ST.tempat = 'PERON ' + (i + 1) + ' \u00b7 JALUR ' + j.toUpperCase();
  setActor(j, R); hud();
  hintBar('Peron ' + (i + 1) + ' \u00b7 jalur ' + j.toUpperCase() + ' (' + fJalur(j, R) + ')');
  await dlg({
    tag: 'PERON ' + (i + 1) + ' \u00b7 ' + JALUR_INFO[j].nama, face: '\uD83D\uDC6E', who: 'PETUGAS PERON',
    say: PETUGAS_PERON[i % PETUGAS_PERON.length],
    buttons: [{ label: 'SERAHKAN TIKET', act: 'ok', cls: 'primary' }]
  });
  const res = await askQuestion(makeSoal('peron', i, R));
  if (!res.ok) return { ok: false, confiscate: true };
  ST.caps = (ST.caps || []).concat([j]);
  const cc = coefOf(R.path.slice(0, i + 1), R);
  ST.capLabel = notasi(R.path.slice(0, i + 1)) + '(x) = ' + poly(cc.A, cc.B);
  ST.code = applySeq(R.x0, R.path.slice(0, i + 1), R);
  hud(); drawMap(R);
  trainTo(j);
  await dlg({
    face: '\uD83D\uDC6E', who: 'PETUGAS PERON', soft: true,
    say: PERON_OK[i % PERON_OK.length] + '<br><b>Cap ' + notasi(R.path.slice(0, i + 1)) + '</b> turun di tiketmu. Kode ruangmu sekarang <b>' + ST.code + '</b>.',
    buttons: [{ label: 'NAIK GERBONG', act: 'ok', cls: 'primary' }]
  });
  if (i < R.path.length - 1 && !SKIP_NPC.includes(i)) {
    const sq = await sideQuest(i, R);
    RUN_LOG.push({ stasiun: 'Gerbong ' + (i + 1), npc: sq.nama, bantu: sq.helped });
  }
  hud();
  return { ok: true };
}

const PETUGAS_PERON = [
  'Shift malam baru mulai. Periksa dulu kode ruangmu \u2014 semuanya kami catat di sini.',
  'Banyak yang salah hitung di jalur ini. Santai saja, tidak ada denda.',
  'Setiap jalur mengubah kode ruangmu. Tidak ada yang gratis di kota ini.',
  'Peron terakhir. Setelah ini urusanmu dengan penerima, bukan denganku.'
];
const PERON_OK = [
  'Tercatat. Cap pertama sudah turun.',
  'Bagus. Petugas berikutnya hanya melihat cap terakhirmu.',
  'Satu jalur lagi. Kamu sudah dekat.',
  'Peron empat selesai. Lampu stasiun tujuan sudah kelihatan.'
];

async function babakPintuKeluar(R) {
  ST.tempat = 'PINTU KELUAR';
  setActor('pusat', R); hud();
  await dlg({
    tag: 'STASIUN TUJUAN \u00b7 00:55', face: '\uD83D\uDD10', who: 'PENERIMA PAKET',
    say: 'Saya lihat cap terakhir tiketmu. Sebelum saya buka pintu, tunjukkan cap akhir paket dan kode ruangmu.',
    buttons: [{ label: 'TUNJUKKAN TIKET', act: 'ok', cls: 'primary' }]
  });
  let res = await askQuestion(makeSoal('receipt-rumus', 0, R));
  if (!res.ok) return { ok: false };
  res = await askQuestion(makeSoal('receipt-nilai', 0, R));
  if (!res.ok) return { ok: false };
  return { ok: true };
}

async function babakInvers(R) {
  ST.tempat = 'KANTOR PENGADUAN';
  hud();
  await dlg({
    tag: 'LOKET PENGADUAN EKSPEDISI \u00b7 01:05', face: '\uD83D\uDCE6', who: 'PETUGAS PENGADUAN',
    say: 'Paket ini dicap pabrik, bukan kurir. Kamu harus membatalkan capnya supaya isinya terbaca. ' +
         'Kotak pos ini terakhir keluar dengan cap <b>E(x) = ' + poly(R.A, R.B) + '</b>. Angka terakhir yang tercatat di label: <b>' + R.finalCode + '</b>.',
    buttons: [{ label: 'SAYA BANTU BONGKAR', act: 'ok', cls: 'primary' }]
  });
  for (const k of ['inv-pair', 'inv-isi', 'inv-bukti', 'inv-jalur']) {
    const res = await askQuestion(makeSoal(k, 0, R));
    if (!res.ok) return { ok: false };
  }
  return { ok: true };
}

/* transisi fade hitam antar adegan (fase 9) */
function fadeKe(op) {
  const f = document.getElementById('fade');
  if (!f) return Promise.resolve();
  f.style.opacity = op;
  if (window.__instantMode) return Promise.resolve();   // mode uji: tanpa jeda
  return new Promise(r => setTimeout(r, 780));
}

async function tutupCerita(R) {
  const smile = ST.smile;
  let judul, ending;
  if (smile >= 3) {
    judul = 'KURIR YANG DIKENAL';
    ending = 'Petugas pintu keluar menahan pintu lebih lama untukmu. Dua orang yang kamu bantu tadi ikut mengantar kotak pos sampai ambang pintu. Warga mulai mengenali kurir yang selalu menolong; besok, ada yang menunggumu di peron.';
  } else if (smile >= 1) {
    judul = 'KURIR YANG TELITI';
    ending = 'Pintu ditutup tepat saat kamu lewat. Kerjamu rapi, hitunganku tak pernah meleset satu rupiah pun. Petugas jaga mengangguk kecil; ia tahu namamu, dan itu di kota ini sudah berarti.';
  } else {
    judul = 'KURIR YANG EFISIEN';
    ending = 'Pintu ditutup tepat di belakangmu. Kotak pos terbuka, tugas selesai, tidak ada yang menunggumu di peron. Cepat memang; tapi kota yang besar ini belum sempat mengenalmu.';
  }
  /* 1. petugas kantor menandai babak final */
  await dlg({
    tag: 'STASIUN KANTOR · 01:30', who: 'PETUGAS STASIUN KANTOR',
    say: 'Shift terakhirmu malam ini, kurir. Paketnya sudah saya terima, kotak posnya sudah dibongkar. Pintu depan masih terbuka. Hati-hati di jalan pulang.',
    buttons: [{ label: 'MELANGKAH KELUAR', act: 'ok', cls: 'primary' }]
  });
  /* 2. pemain berjalan keluar (input dikunci) lalu layar gelap */
  window.__kunciInput = true;
  if (window.World && World.mode() === 'stasiun') {
    const o = OBJ.find(o => o.aksi === 'keluar');
    if (o) { const t = targetTerdekat(o); await window.jalanSampai(t.x, t.y); }
    await fadeKe(1);
  }
  window.__kunciInput = false;
  /* 3. adegan kota subuh */
  AUDIO.sfx('subuh');
  AUDIO.musik('subuh');
  await dlg({
    tag: 'SUBUH · 05:12',
    extra: '<canvas id="subuhCv" width="240" height="125" style="width:100%;image-rendering:pixelated;border:1px solid #233350;border-radius:10px"></canvas>',
    say: 'Langit mulai jingga. Kota pelan-pelan terbangun, dan kamu melangkah keluar dari stasiun, membawa langkah pulang yang lebih ringan dari tadi malam.',
    clear: false,
    after: () => { const cv = document.querySelector('#subuhCv'); if (cv) gambarPembuka(cv, 'subuh'); },
    buttons: [{ label: 'MELANGKAH PULANG', act: 'ok', cls: 'primary' }]
  });
  /* 4. surat ending jadi panggung utama */
  await dlg({
    tag: 'EPILOG · ' + judul, title: judul,
    say: ending,
    buttons: [{ label: 'BACA SURATNYA', act: 'ok', cls: 'primary' }]
  });
  /* 5. rekap matematika (isi surat) */
  await dlg({
    soft: true, who: 'ISI SURAT',
    say: 'Kode ruangmu berubah karena rangkaian jalur yang kamu tempuh. Itu <b>komposisi</b>: ' + notasi(R.path) + '(x) = ' + poly(R.A, R.B) + '.\n' +
         'Kode ruang <b>' + R.x0 + '</b> menjadi <b>' + R.finalCode + '</b> hanya karena jalurnya berurutan. Kalau urutannya diubah, angkanya lain, dan penerima langsung menolaknya.\n' +
         'Membaca ulang isi paket berarti <b>membalik</b> capnya: E\u207b\u00b9(x) = (x ' + (R.B > 0 ? MINUS + ' ' + R.B : '+ ' + Math.abs(R.B)) + ') / ' + R.A + '. Itu <b>invers</b>.\n' +
         'Dan urutannya dibalik: untuk membatalkan "f lalu g", yang dibuka dulu adalah g.',
    buttons: [{ label: 'SELESAIKAN SHIFT', act: 'ok', cls: 'primary' }]
  });
  AUDIO.musik(null);
  await fadeKe(0);
  /* 6. rapor + cap */
  await layarHasil(R);
}

function rincianKonsisten(R) {
  const rows = [];
  rows.push(['Kode ruang awal (dari loket)', R.x0, '']);
  let acc = [];
  R.path.forEach((j, i) => {
    acc = acc.concat([j]);
    const st = ST.stats.filter(s => s.peron === 'Peron ' + (i + 1)).pop();
    rows.push(['Peron ' + (i + 1) + ' \u00b7 cap ' + j + ' \u2192 kode ruang',
      applySeq(R.x0, acc, R),
      'jawabanmu: ' + (st ? (st.typed + (st.ok ? ' \u2713' : ' \u2716')) : '\u2014')]);
  });
  rows.push(['Pintu keluar \u00b7 ' + notasi(R.path) + '(x) = ' + poly(R.A, R.B), R.finalCode, 'dinilai penerima']);
  rows.push(['Pembatalan E\u207b\u00b9(' + R.finalCode + ')', R.x0, 'kembali ke kode ruang awal']);
  return rows;
}

/* ------------------------------------------------------------ 11b. CAP STASIUN */
/* Cap penghargaan: stempel bulat pixel prosedural. Data dari ST.stats /
   RUN_LOG / EXPR_LOG yang sudah ada; format record tidak diubah. */
const CAP_DAFTAR = [
  { id: 'tepat', nama: 'CAP TEPAT WAKTU', warna: '#ffd24a',
    ikon: ['.###.', '#...#', '#.#.#', '#.###', '#...#', '.###.'] },
  { id: 'sahabat', nama: 'CAP SAHABAT STASIUN', warna: '#4ade80',
    ikon: ['#...#', '#...#', '.....', '#...#', '.###.'] },
  { id: 'hati', nama: 'CAP HATI PENUMPANG', warna: '#ff8aa0',
    ikon: ['.#.#.', '#####', '#####', '.###.', '..#..'] },
  { id: 'aljabar', nama: 'CAP ALJABAR', warna: '#a97bff',
    ikon: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'] },
  { id: 'rute', nama: 'CAP RUTE PENUH', warna: '#4aa8b0',
    ikon: ['.###.', '#....', '.###.', '....#', '.###.'] }
];
function muatCaps() {
  try { const v = JSON.parse(localStorage.getItem('stasiun-transit-caps') || '[]'); return Array.isArray(v) ? v : []; }
  catch (e) { return []; }
}
function simpanCaps(daftar) {
  try { localStorage.setItem('stasiun-transit-caps', JSON.stringify(daftar)); } catch (e) { /* storage mati: cap tetap tampil di rapor */ }
}
function hitungBadge() {
  const hasil = [];
  const wajib = ST.stats.filter(s => s.peron !== 'Side quest');
  if (wajib.length > 0 && wajib.every(s => s.ok) && !ST.pernahDisita)
    hasil.push(CAP_DAFTAR[0]);
  if (ST.smile >= 3) hasil.push(CAP_DAFTAR[1]);
  if (RUN_LOG.length > 0 && RUN_LOG.every(x => x.bantu)) hasil.push(CAP_DAFTAR[2]);
  if (EXPR_LOG.length > 0 && EXPR_LOG.every(Boolean)) hasil.push(CAP_DAFTAR[3]);
  if (CUR && CUR.path && CUR.path.length === 4) hasil.push(CAP_DAFTAR[4]);
  return hasil;
}
/* stempel bulat: lingkaran ganda + ikon pixel di tengah, tanpa teks melingkar */
function gambarCap(ikon, warna) {
  const cv = document.createElement('canvas');
  cv.width = 40; cv.height = 40;
  const c = cv.getContext('2d');
  c.strokeStyle = warna; c.fillStyle = warna;
  c.lineWidth = 2; c.beginPath(); c.arc(20, 20, 18, 0, 6.3); c.stroke();
  c.lineWidth = 1; c.beginPath(); c.arc(20, 20, 14, 0, 6.3); c.stroke();
  const px = Math.round(20 - ikon[0].length * 1.5), py = Math.round(20 - ikon.length * 1.5);
  for (let y = 0; y < ikon.length; y++) for (let x = 0; x < ikon[y].length; x++)
    if (ikon[y][x] === '#') c.fillRect(px + x * 3, py + y * 3, 3, 3);
  return cv.toDataURL();
}
function dataCapShift() {
  const earned = hitungBadge().map(d => ({ id: d.id, nama: d.nama, url: gambarCap(d.ikon, d.warna) }));
  const lama = muatCaps();
  const baru = earned.filter(e => lama.indexOf(e.id) < 0);
  if (earned.length) simpanCaps(lama.concat(baru.map(e => e.id)));
  if (baru.length) AUDIO.fanfareCaps(baru.length);   // fanfare berurutan, jeda 0,25 dtk
  return { earned, baru };
}
function renderCapsMenu() {
  const el = document.getElementById('mCaps');
  if (!el) return;
  const lama = muatCaps();
  el.innerHTML = CAP_DAFTAR.map(d => {
    const punya = lama.indexOf(d.id) >= 0;
    return '<div style="text-align:center;opacity:' + (punya ? 1 : 0.35) + '">' +
      '<img src="' + gambarCap(d.ikon, punya ? d.warna : '#6a6580') + '" width="40" height="40" alt="' + d.nama + '">' +
      '<div class="small">' + (punya ? d.nama : '? ? ?') + '</div></div>';
  }).join('');
}

async function layarHasil(R) {
  $('#qwrap').innerHTML = ''; $('#qwrap').classList.remove('on');
  bigBtn(null);
  const rows = rincianKonsisten(R);
  const caps = dataCapShift();
  const capsHtml = '<div class="small" style="margin-top:14px">CAP STASIUNMU</div><div class="rutas" style="align-items:flex-start">' +
    (caps.earned.length ? caps.earned.map(e => {
      const baru = caps.baru.some(b => b.id === e.id);
      return '<div style="text-align:center;max-width:130px"><img src="' + e.url + '" width="48" height="48" alt="' + e.nama + '"' +
        (baru ? ' style="outline:2px solid #ffd24a"' : '') + '><div class="small">' + e.nama +
        (baru ? ' <b style="color:#ffd24a">BARU!</b>' : '') + '</div></div>';
    }).join('') : '<div class="small">Belum ada cap. Selesaikan shift tanpa tiket disita dan bantu penumpang untuk meraihnya.</div>') +
    '</div>';
  const tabel = ST.stats.map(s =>
    '<tr><td>' + s.peron + '</td><td>' + (s.typed || '\u2014') + '</td><td class="' + (s.ok ? 'ok' : 'no') + '">' +
    (s.ok ? 'DITERIMA' : 'DITOLAK') + '</td><td>' + (s.cap || '') + '</td></tr>').join('');
  const smileTxt = ST.smile === 0 ? 'tidak ada' : ('♥'.repeat(ST.smile));
  ovBody.innerHTML =
    '<div class="tag">RAPOR SHIFT</div>' +
    '<h2>Kode rute ' + R.seed + ' \u00b7 ' + R.path.length + ' jalur</h2>' +
    (RUN_LOG.length ? '<div class="small">Yang kamu bantu di gerbong: ' +
      RUN_LOG.map(x => x.npc + (x.bantu ? ' (dibantu)' : ' (tidak dibantu)')).join(' \u00b7 ') +
      ' \u2014 senyum: ' + smileTxt + '</div>' : '') +
    '<table class="table" style="margin-top:12px"><tr><th>Pemeriksaan</th><th>Nilai</th><th>Catatan</th></tr>' +
    rows.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>').join('') + '</table>' +
    '<div class="small" style="margin-top:14px">PERJALANAN TIKETMU</div>' +
    '<table class="table"><tr><th>Peron</th><th>Jawabanmu</th><th>Status</th><th>Cap</th></tr>' + (tabel || '<tr><td>-</td><td>-</td><td>-</td><td>-</td></tr>') + '</table>' +
    capsHtml +
    '<div class="actions">' +
      '<button class="btn primary" id="rUlang">MAINKAN RUTE INI LAGI</button>' +
      '<button class="btn" id="rBaru">SHIFT BARU (SOAL ACAK BARU)</button>' +
      '<button class="btn ghost" id="rMenu">MENU UTAMA</button>' +
    '</div>';
  ov.classList.remove('hidden'); ov.classList.remove('soft');
  $('#rUlang').onclick = () => { closeOv(); window.mulaiShiftWorld(R.seed, R.path.length === 2 ? 'singkat' : 'penuh'); };
  $('#rBaru').onclick = () => { closeOv(); window.mulaiShiftWorld(seedBaru(), R.path.length === 2 ? 'singkat' : 'penuh'); };
  $('#rMenu').onclick = () => { closeOv(); keMenu(); };
}

function keMenuUlang() { keMenu(); }

let toastT = null;
function toast(t) {
  hintBar('<b style="color:#ffcc55">' + t + '</b>');
  clearTimeout(toastT);
  toastT = setTimeout(() => { if (CUR) hintBar('Peron \u00b7 jalur \u00b7 kode ruang'); }, 6000);
}

/* ------------------------------------------------------------ 12. MENU    */
function keMenu() {
  window.__kunciInput = false;   // pengaman: jangan ada input terkunci di menu
  AUDIO.musik('menu');
  $('#qwrap').innerHTML = ''; $('#qwrap').classList.remove('on');
  bigBtn(null);
  $('#app').classList.add('hidden');
  $('#menu').classList.remove('hidden');
  $('#mRute').textContent = String(LAST_SEED);
  perbaruiTombolSuara();
renderCapsMenu();
}
let LAST_SEED = seedBaru();          // kode rute sudah disiapkan sejak menu dibuka

function papanRumus() {
  return dlg({
    tag: 'PAPAN RUMUS \u00b7 BUKAN HINT', face: '\uD83D\uDCD0', who: 'CATATAN KURIR',
    say: 'Tiga baris ini saja.',
    extra:
      '<div class="board"><div class="who">1. KOMPOSISI</div><div class="say">(f\u2218g)(x) = f(g(x))</div>' +
      '<div class="small">Dibaca dari <b>kanan</b>: g dikerjakan lebih dulu, hasilnya masuk ke f.</div></div>' +
      '<div class="board"><div class="who">2. URUTANNYA PENTING</div><div class="say">(f\u2218g)(x) \u2260 (g\u2218f)(x) pada umumnya</div>' +
      '<div class="small">Karena itu urutan jalur menentukan cap akhir paket.</div></div>' +
      '<div class="board"><div class="who">3. INVERS</div><div class="say">y = f(x)  \u2192  f\u207b\u00b9(y) = x</div>' +
      '<div class="small">Cara cepat: tukar posisi, pindahkan konstanta (tanda berubah), lalu bagi dengan koefisien x. ' +
      'Dan invers sebuah rangkaian bekerja dengan urutan terbalik: (f\u2218g)\u207b\u00b9 = g\u207b\u00b9\u2218f\u207b\u00b9.</div></div>',
    buttons: [{ label: 'TUTUP', act: 'ok', cls: 'primary' }]
  });
}
function caraMain() {
  return dlg({
    tag: 'CARA BERMAIN', face: '\uD83D\uDE89', who: 'KURIR',
    say: 'Kamu kurir malam. Kode ruangmu berubah tiap kali menempuh jalur kereta.',
    extra:
      '<ul class="list">' +
      '<li><b>Jalan</b> pakai WASD / tombol panah, atau klik lantai. Klik sebuah objek (loket, gerbang, NPC) - kamu berjalan sendiri ke sana.</li>' +
      '<li>Tekan <b>E</b> saat dekat objek untuk berinteraksi.</li>' +
      '<li>Di <b>loket</b>: jawab soal untuk mendapat lembar rute.</li>' +
      '<li>Di setiap <b>peron</b>: serahkan tiket, jawab soal kode ruangmu. Benar \u2192 cap turun, kereta jalan.</li>' +
      '<li>Jawaban salah \u2192 <b>tiket ditolak</b>. Salah dua kali di peron yang sama \u2192 tiket disita, kembali ke loket untuk lembar baru (angka diacak ulang).</li>' +
      '<li>Di dalam <b>gerbong</b> ada NPC yang minta bantuan. Opsional: membantu menambah senyum, dan senyum mengubah epilog.</li>' +
      '<li>Di <b>pintu keluar</b>: tunjukkan cap akhir paket dan kode ruangmu.</li>' +
      '<li>Babak akhir: <b>membatalkan cap</b> (fungsi invers) supaya isi paket terbaca.</li>' +
      '<li>Tidak ada hint. Kalau macet, buka <b>PAPAN RUMUS</b> dari menu, atau perhatikan pesan penolakan petugas.</li>' +
      '<li>Ketik jawaban dengan keyboard, atau klik papan angka di layar. Tekan <b>Enter</b> untuk mengirim.</li>' +
      '</ul>',
    buttons: [{ label: 'SIAP', act: 'ok', cls: 'primary' }]
  });
}

/* --------------------------------------------------------- 13. KONTROL    */
window.addEventListener('error', e => { try { hintBar('<b style="color:#ff9a8a">ERROR: ' + e.message + '</b>'); } catch (_) {} });
const fail = e => { console.error(e); try { hintBar('<b style="color:#ff9a8a">ERROR: ' + (e && e.message) + '</b>'); } catch (_) {} };
$('#mHow').onclick = () => caraMain();
$('#mBoard').onclick = () => papanRumus();
$('#btnMenu').onclick = async () => {
  const a = await dlg({
    face: '\u23F8\uFE0F', who: 'SHIFT DIJEDA', say: 'Mau apa?',
    buttons: [{ label: 'LANJUT', act: 'lanjut', cls: 'primary' }, { label: 'PAPAN RUMUS', act: 'rumus' }, { label: 'SELESAIKAN SHIFT', act: 'menu', cls: 'ghost' }]
  });
  if (a === 'rumus') { await papanRumus(); $('#btnMenu').click(); }
  else if (a === 'menu') keMenu();
};
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeOv(); });
let rzT = null;
window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { if (CUR) { drawMap(CUR); if (ST.path) hud(); } }, 150); });
$('#mRute').textContent = String(LAST_SEED);
renderCapsMenu();
// banner kalau dibuka lewat file:// (tanpa server)
if (location.protocol === 'file:') hintBar('Dimainkan offline \u00b7 kalau kotak jawaban tidak bisa diketik, klik kolomnya dulu');
// input kode rute: klik chip RUTE
$('#hRute').style.cursor = 'pointer';
$('#hRute').onclick = async () => {
  const a = await dlg({
    tag: 'KODE RUTE', face: '\uD83D\uDD22', who: 'CATATAN SHIFT',
    say: 'Kode rute sekarang: <b>' + CUR.seed + '</b>\nKode ini menentukan seluruh soal. Pakai kode yang sama untuk memainkan soal identik (mis. untuk seluruh kelas).',
    buttons: [{ label: 'MAINKAN RUTE INI DARI AWAL', act: 'ulang', cls: 'primary' }, { label: 'TUTUP', act: 'ok', cls: 'ghost' }]
  });
  if (a === 'ulang') { const m = CUR.path.length === 2 ? 'singkat' : 'penuh'; window.mulaiShiftWorld(CUR.seed, m); }
};