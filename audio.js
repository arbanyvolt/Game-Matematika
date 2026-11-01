/* ============================================================================
   AUDIO.JS — SFX + musik latar prosedural (WebAudio, tanpa file audio)
   Semua suara dibuat dari osilator + noise buffer + filter + envelope.
   Aturan main:
   - AudioContext hanya dibuat/dilanjutkan dari gestur pengguna (AUDIO.init()).
   - Error audio tidak boleh menghentikan game: satu try-catch pusat.
   - Volume sopan: bus musik lebih pelan dari bus SFX; node selesai di-stop.
   - Mute = bus master menjadi 0 (context tetap jalan, tanpa bunyi pop).
   ============================================================================ */

const AUDIO = (function () {
  let ctx = null;               // AudioContext (dibuat saat gestur pertama)
  let master = null;            // AUDIO -> master -> destination
  let busSfx = null;            // bus efek
  let busMusik = null;          // bus musik latar
  let noiseBuf = null;          // buffer dera putih (dibuat sekali)
  let mute = false;             // keadaan senyap (tersimpan localStorage)
  let scene = null;             // musik yang sedang/akan berjalan
  let polaAktif = null;         // pola lagu aktif
  let acaraPos = 0;             // posisi langkah pola
  let acaraTime = 0;            // waktu audio langkah berikutnya
  let jadwalTimer = null;       // interval lookahead
  let sedangGanti = false;      // transisi musik sedang berjalan
  let nodeAktif = 0;            // pembatas osilator bersamaan
  let langkahTerakhir = 0;      // cooldown footstep

  const KUNCI_SIMPAN = 'stasiun-transit-audio';

  /* --------------------------------------------------- penyimpanan (aman) */
  function muatMute() {
    try {
      const v = JSON.parse(localStorage.getItem(KUNCI_SIMPAN) || '{}');
      return v && v.mute === true;
    } catch (e) { return false; }
  }
  function simpanMute() {
    try { localStorage.setItem(KUNCI_SIMPAN, JSON.stringify({ mute: mute })); } catch (e) { /* file:// privat */ }
  }

  /* --------------------------------------------------------- inti graph */
  function init() {
    if (ctx) {                                    // sudah ada: lanjutkan bila ditahan
      try { if (ctx.state === 'suspended') ctx.resume(); } catch (e) {}
      mulaiMusikTertunda();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = mute ? 0 : 1;
      master.connect(ctx.destination);
      busSfx = ctx.createGain(); busSfx.gain.value = 0.4; busSfx.connect(master);
      busMusik = ctx.createGain(); busMusik.gain.value = 0.16; busMusik.connect(master);
      /* buffer dera putih 1 detik, dipakai bersama semua noise */
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      if (ctx.state === 'suspended') ctx.resume();
      mulaiMusikTertunda();
    } catch (e) { ctx = null; }                   // audio gagal: game tetap sunyi
  }

  function siap() { return ctx && ctx.state === 'running'; }

  /* ------------------------------------------------------- penyintesis */
  function sambung(node) {
    node.onended = () => { node.aktif = false; nodeAktif = Math.max(0, nodeAktif - 1); };
    node.aktif = true; nodeAktif++;
  }

  /* satu nada dengan envelope; slide = frekuensi akhir (opsional) */
  function nada(f, dur, jenis, gn, waktu, bus, slide) {
    if (nodeAktif > 24) return;                   // batasi suara bersamaan
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = (jenis === 'sq') ? 'square' : 'triangle';
    o.frequency.setValueAtTime(f, waktu);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, waktu + dur);
    const serang = jenis === 'pad' ? dur * 0.35 : Math.min(0.02, dur / 3);
    g.gain.setValueAtTime(0.0001, waktu);
    g.gain.linearRampToValueAtTime(gn, waktu + serang);
    g.gain.exponentialRampToValueAtTime(0.0001, waktu + dur);
    o.connect(g); g.connect(bus);
    o.start(waktu); o.stop(waktu + dur + 0.05);
    sambung(o);
  }

  /* dera pendek lewat filter (lowpass/highpass) */
  function dera(dur, freq, jenisFilter, gn, waktu, bus) {
    if (nodeAktif > 24) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = jenisFilter; f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gn, waktu);
    g.gain.exponentialRampToValueAtTime(0.0001, waktu + dur);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(waktu); src.stop(waktu + dur + 0.05);
    sambung(src);
  }

  /* ------------------------------------------------------ daftar SFX */
  /* nama -> fungsi(waktu mulai). Semua pendek (<= 1,5 detik) dan pelan. */
  const SFX = {
    klik: t => { nada(660, 0.06, 'sq', 0.25, t, busSfx); nada(520, 0.08, 'sq', 0.22, t + 0.06, busSfx); },
    benar: t => { nada(523, 0.09, 'tri', 0.3, t, busSfx); nada(659, 0.09, 'tri', 0.3, t + 0.09, busSfx); nada(784, 0.14, 'tri', 0.3, t + 0.18, busSfx); },
    salah: t => { nada(220, 0.12, 'sq', 0.3, t, busSfx, 180); nada(180, 0.15, 'sq', 0.26, t + 0.13, busSfx); },
    cap: t => { dera(0.09, 900, 'lowpass', 0.5, t, busSfx); nada(110, 0.16, 'tri', 0.4, t + 0.02, busSfx); },
    sita: t => { nada(330, 0.45, 'sq', 0.25, t, busSfx, 165); dera(0.3, 600, 'lowpass', 0.2, t + 0.05, busSfx); },
    lembar: t => { dera(0.16, 3000, 'highpass', 0.3, t, busSfx); },
    gerbang: t => { nada(880, 0.05, 'sq', 0.2, t, busSfx); nada(880, 0.05, 'sq', 0.18, t + 0.1, busSfx); },
    keretaDatang: t => { nada(60, 2.0, 'tri', 0.3, t, busSfx, 130); nada(392, 0.28, 'sq', 0.16, t + 0.5, busSfx); nada(494, 0.28, 'sq', 0.16, t + 0.85, busSfx); },
    pintu: t => { dera(0.22, 800, 'lowpass', 0.3, t, busSfx); nada(180, 0.2, 'tri', 0.25, t + 0.05, busSfx); },
    senyum: t => { nada(523, 0.12, 'tri', 0.28, t, busSfx); nada(659, 0.16, 'tri', 0.28, t + 0.1, busSfx); },
    emote: t => { nada(880, 0.06, 'sq', 0.18, t, busSfx); },
    tiba: t => { nada(659, 0.22, 'tri', 0.28, t, busSfx); nada(523, 0.22, 'tri', 0.28, t + 0.3, busSfx); nada(392, 0.3, 'tri', 0.28, t + 0.6, busSfx); },
    capBaru: t => { nada(523, 0.13, 'tri', 0.28, t, busSfx); nada(659, 0.13, 'tri', 0.28, t + 0.13, busSfx); nada(784, 0.13, 'tri', 0.28, t + 0.26, busSfx); nada(1046, 0.2, 'tri', 0.28, t + 0.39, busSfx); },
    subuh: t => { nada(174.6, 2.6, 'pad', 0.2, t, busSfx); nada(220, 2.6, 'pad', 0.16, t + 0.1, busSfx); nada(261.6, 2.6, 'pad', 0.14, t + 0.2, busSfx); },
    langkah: t => { dera(0.03, 500, 'lowpass', 0.06, t, busSfx); }
  };

  /* --------------------------------------------------- musik latar BGM */
  /* Pola chiptune pelan: tiap "acara" berdurasi d beat dan memainkan beberapa
     nada serentak. Loop mulus; dijadwal lookahead 0,1 detik tiap 25 ms. */
  const LAGU = {
    menu: { bpm: 88, acara: [
      { d: 2, n: [[262, 1.7, 'tri', 0.5], [131, 3.7, 'pad', 0.3]] },
      { d: 2, n: [[330, 1.7, 'tri', 0.45]] },
      { d: 2, n: [[392, 1.7, 'tri', 0.5], [165, 3.7, 'pad', 0.3]] },
      { d: 2, n: [[494, 1.7, 'tri', 0.45]] },
      { d: 2, n: [[523, 1.7, 'tri', 0.45], [196, 3.7, 'pad', 0.3]] },
      { d: 2, n: [[440, 1.7, 'tri', 0.4]] },
      { d: 2, n: [[392, 1.7, 'tri', 0.45], [165, 3.7, 'pad', 0.3]] },
      { d: 2, n: [[330, 1.7, 'tri', 0.4]] }
    ] },
    stasiun: { bpm: 60, acara: [
      { d: 4, n: [[110, 3.8, 'pad', 0.4]] },
      { d: 4, n: [[220, 3.8, 'pad', 0.25], [110, 3.8, 'pad', 0.3]] },
      { d: 4, n: [[262, 3.8, 'pad', 0.25], [110, 3.8, 'pad', 0.3]] },
      { d: 4, n: [[880, 0.3, 'sq', 0.12], [110, 3.8, 'pad', 0.3]] }
    ] },
    gerbong: (function () {                 /* tok-tok rel + pad D minor */
      const ac = [];
      for (let i = 0; i < 16; i++) {
        const n = [[300, 0.06, 'tok', i % 2 === 0 ? 0.5 : 0.22]];
        if (i === 0) n.push([73.4, 3.8, 'pad', 0.35]);
        if (i === 8) n.push([65.4, 3.8, 'pad', 0.35]);
        ac.push({ d: 1, n: n });
      }
      return { bpm: 76, acara: ac };
    })(),
    subuh: { bpm: 66, acara: [
      { d: 4, n: [[174.6, 3.8, 'pad', 0.28], [220, 3.8, 'pad', 0.22], [261.6, 3.8, 'pad', 0.2]] },
      { d: 4, n: [[233, 3.8, 'pad', 0.24], [293.7, 3.8, 'pad', 0.2]] },
      { d: 4, n: [[196, 3.8, 'pad', 0.28], [261.6, 3.8, 'pad', 0.2], [329.6, 1.8, 'tri', 0.28]] },
      { d: 4, n: [[220, 3.8, 'pad', 0.24], [174.6, 3.8, 'pad', 0.24], [349.2, 1.8, 'tri', 0.28]] }
    ] }
  };

  /* mainkan satu acara musik pada waktu audio tertentu */
  function mainkanAcara(acara, waktu) {
    for (const [f, d, jenis, gn] of acara.n) {
      if (jenis === 'tok') dera(d, 300, 'lowpass', gn * 0.5, waktu, busMusik);
      else nada(f, d, jenis, gn, waktu, busMusik);
    }
  }

  /* lookahead: jadwalkan acara yang waktunya sudah dekat */
  function jalankanJadwal() {
    if (!ctx || !polaAktif) return;
    try {
      const spb = 60 / polaAktif.bpm;
      while (acaraTime < ctx.currentTime + 0.12) {
        const acara = polaAktif.acara[acaraPos];
        const durasi = acara.d * spb;
        mainkanAcara(acara, acaraTime);
        acaraPos = (acaraPos + 1) % polaAktif.acara.length;
        acaraTime += durasi;
      }
    } catch (e) { /* jangan pernah menghentikan game */ }
  }

  /* ganti musik: fade-out pendek lalu fade-in, tanpa bunyi klik */
  function musik(nama) {
    try {
      if (nama === scene) return;               // scene sama: jangan restart
      scene = nama;
      if (!ctx || !siap()) return;              // belum ada gestur: scene tersimpan
      if (sedangGanti) return;
      sedangGanti = true;
      const target = nama ? LAGU[nama] : null;
      busMusik.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15);
      setTimeout(() => {
        try {
          polaAktif = target;
          acaraPos = 0;
          acaraTime = ctx.currentTime + 0.05;
          if (target) {
            busMusik.gain.setTargetAtTime(0.16, ctx.currentTime, 0.2);
            jalankanJadwal();
          }
        } catch (e) {}
        sedangGanti = false;
      }, 460);
      if (!jadwalTimer) jadwalTimer = setInterval(jalankanJadwal, 25);
    } catch (e) {}
  }

  /* musik tertunda: scene disimpan sebelum context ada, dimulai saat siap */
  function mulaiMusikTertunda() {
    if (!scene) return;
    const s = scene;
    scene = null;
    musik(s);
  }

  /* ----------------------------------------------------------- API SFX */
  function sfx(nama, jeda) {
    try {
      if (!siap()) return;
      const fn = SFX[nama];
      if (!fn) return;
      if (nama === 'langkah') {                 // footstep: cooldown ketat
        if (ctx.currentTime - langkahTerakhir < 0.18) return;
        langkahTerakhir = ctx.currentTime;
      }
      fn(ctx.currentTime + 0.01 + (jeda || 0));
    } catch (e) { /* error audio tidak menghentikan game */ }
  }

  /* fanfare cap baru: tiap cap berurutan dengan jeda 0,25 detik */
  function fanfareCaps(jumlah) {
    try {
      for (let i = 0; i < jumlah; i++) sfx('capBaru', i * 0.25);
    } catch (e) {}
  }

  /* ----------------------------------------------------------- mute */
  function setMute(b) {
    mute = !!b;
    simpanMute();
    try {
      if (master && ctx) master.gain.setTargetAtTime(mute ? 0 : 1, ctx.currentTime, 0.05);
    } catch (e) {}
  }
  function toggleMute() { setMute(!mute); return mute; }

  mute = muatMute();                            // keadaan tersimpan dibaca saat load

  return {
    init: init,
    sfx: sfx,
    musik: musik,
    setMute: setMute,
    toggleMute: toggleMute,
    mute: function () { return mute; },
    siap: siap,
    sceneAktif: function () { return scene; }
  };
})();

/* ------------------------------------------------ tombol suara di HUD */
/* Dipasang dari sini supaya AUDIO sudah ada; scene 'menu' disimpan sekarang
   dan mulai saat gestur pertama (kebijakan autoplay). */
(function pasangTombolSuara() {
  const b = document.querySelector('#btnSuara');
  if (!b) return;
  function perbaruiLabel() { b.textContent = AUDIO.mute() ? 'SUARA: SENYAP' : 'SUARA: AKTIF'; }
  perbaruiLabel();
  b.onclick = () => {
    try { AUDIO.init(); } catch (e) {}
    AUDIO.toggleMute();
    perbaruiLabel();
  };
  AUDIO.musik('menu');
})();
