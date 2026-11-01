/* ============================================================================
   AKSI.WORLD.JS - jembatan antara stasiun yang bisa dijelajahi (world.js)
   dengan cerita & soal (game.js).
   Dimuat SESUDAH game.js, jadi fungsi cerita sudah tersedia.
   ============================================================================ */

function worldPauseOn() { if (window.World) World.pause(); }
function worldPauseOff() { if (window.World) World.resume(); }
function worldJalanKe(tempat) {
  if (!window.World) return;
  World.jalanKe(tempat.x, tempat.y);
  World.tempat(tempat.nama);
}
const TEMPAT = {
  loket: { x: 150, y: 172, nama: 'HALL TIKET' },
  pengaduan: { x: 150, y: 422, nama: 'KANTOR PENGADUAN' },
  kios: { x: 300, y: 422, nama: 'KIOS KOPI & ROTI' },
  papanJalur: { x: 346, y: 136, nama: 'PAPAN JALUR' },
  pintuKeluar: { x: 366, y: 500, nama: 'PINTU KELUAR STASIUN' }
};
function tempatGerbang(j) { return { x: 470, y: JALUR_Y[j] + 4, nama: 'GERBANG ' + j.toUpperCase() }; }
/* nama stasiun per level transit: stasiun transit = level */
const NAMA_STASIUN = ['STASIUN PUSAT', 'STASIUN TIMUR', 'STASIUN SELATAN', 'STASIUN BARAT', 'STASIUN KANTOR'];
function beriCap(j) {
  ST.caps = (ST.caps || []).concat([j]);
  const cc = coefOf(CUR.path.slice(0, ST.caps.length), CUR);
  AUDIO.sfx('cap');
  ST.capLabel = notasi(CUR.path.slice(0, ST.caps.length)) + '(x) = ' + poly(cc.A, cc.B);
  ST.code = applySeq(CUR.x0, CUR.path.slice(0, ST.caps.length), CUR);
  window.STASIUN_TEME = { seed: 7 + ST.caps.length * 13, idx: window.STASIUN_TEME ? window.STASIUN_TEME.idx : 0 };
  hud();
}

/* Gagal 2x di peron/pintu keluar/pengaduan: tiket disita, lembar baru menunggu di loket */
async function sitaTiket(who, face, pesan) {
  await dlg({
    tag: 'TIKET DISITA', face: face, who: who,
    say: pesan + '\n\nTiket ini saya sita. Tidak ada denda - kembali ke <b>LOKET</b> untuk lembar baru. Angkanya diacak ulang, peta dan bentuk jalurnya tetap.',
    buttons: [{ label: 'KE LOKET', act: 'ok', cls: 'primary' }]
  });
  AUDIO.sfx('sita');
  CUR = genLembar(CUR, seedBaru()) || CUR;
  ST.code = CUR.x0; ST.capLabel = null; ST.caps = []; ST.sheet = CUR.sheet; ST.lembar = false; ST.keluarOk = false; ST.gagal = 0;
  ST.pernahDisita = true;
  ST.tempat = 'HALL STASIUN'; hud();
  toast('TIKET DISITA \u00b7 LEMBAR BARU MENUNGGU DI LOKET');
}

/* Cek jawaban bentuk fungsi, termasuk koefisien pecahan: "x/2", "(x-2)/3", "1/2x", "0.5x" */
function cekFungsi(raw, A, B) {
  if (checkExpr(raw, A, B)) return true;
  const s = String(raw == null ? '' : raw).trim().toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[\u2212\u2013\u2014]/g, '-')
    .replace(/,/g, '.')
    .replace(/(\d\/\d+)x/g, '$1*x')           // "1/2x" -> "1/2*x"
    .replace(/([0-9x)])(\()/g, '$1*(');       // "2(x+3)" -> "2*(x+3)"
  if (!s || !/^[-+0-9x*().\/]+$/.test(s)) return false;
  try {
    const f = new Function('x', 'return (' + s + ');');
    const v = [f(0), f(6), f(12)];
    if (v.some(t => typeof t !== 'number' || !isFinite(t))) return false;
    return Math.abs(v[0] - B) < 1e-9 && Math.abs(v[1] - (6 * A + B)) < 1e-9 && Math.abs(v[2] - (12 * A + B)) < 1e-9;
  } catch (e) { return false; }
}

/* satu perjalanan kereta: soal nilai -> cap -> kereta datang -> masuk gerbong */
async function naikKereta(j) {
  await dlg({
    tag: 'GERBANG ' + j.toUpperCase() + ' \u00b7 PERON', face: '\uD83D\uDC6E', who: 'PETUGAS PERON',
    say: PETUGAS_PERON[ST.caps.length % PETUGAS_PERON.length],
    buttons: [{ label: 'SERAHKAN TIKET', act: 'ok', cls: 'primary' }]
  });
  const i = ST.caps.length;
  const res = await askQuestion(makeSoal('peron', i, CUR));
  if (!res.ok) return { ok: true, gagal: true };
  AUDIO.sfx('gerbang');
  beriCap(j);
  /* animasi kereta datang */
  window.keretaAktif = { j: j, t: 2.2, total: 2.2 };
  AUDIO.sfx('keretaDatang');
  await dlg({
    face: '\uD83D\uDE89', who: 'KERETA JALUR ' + j.toUpperCase(), soft: true,
    say: 'Pintu terbuka. Naik, paket ditaruh di rak.',
    buttons: [{ label: 'NAIK GERBONG', act: 'ok', cls: 'primary' }]
  });
  window.keretaAktif = null;
  /* masuk adegan gerbong (side-view). Pemain bebas jalan; side quest opsional;
     melanjutkan perjalanan dengan menekan E di PINTU KERETA. */
  World.masukGerbong(i);
  worldPauseOff();
  toast('DI DALAM GERBONG \u00b7 SAPA PENUMPANG (E), ATAU LANJUT KE PINTU (E)');
  return { ok: true, naik: true };
}

/* E di pintu kereta: turun di stasiun transit berikutnya */
async function gerbongTiba() {  if (!window.World || !World.mode || World.mode() !== 'gerbong') return;
  AUDIO.sfx('tiba');
  worldPauseOn();
  await dlg({
    face: '\uD83D\uDCE2', who: 'PENGUMUMAN KERETA',
    say: 'Kita tiba di ' + (NAMA_STASIUN[ST.caps.length] || 'stasiun berikutnya') + '. Penumpang turun di pintu kanan.',
    buttons: [{ label: 'TURUN', act: 'ok', cls: 'primary' }]
  });
  World.keluarGerbong();
  if (window.STASIUN_TEME) window.STASIUN_TEME.idx = Math.min(4, ST.caps.length);
  worldJalanKe(TEMPAT.loket);
  const nx = CUR.path[ST.caps.length];
  if (nx) {
    World.tempat(NAMA_STASIUN[ST.caps.length] || 'STASIUN TRANSIT');
    toast('STASIUN TRANSIT \u00b7 LANJUTKAN KE GERBANG ' + nx.toUpperCase());
  } else {
    World.tempat(NAMA_STASIUN[ST.caps.length] || 'STASIUN KANTOR');
    toast('SAMPAI DI STASIUN KANTOR \u00b7 BAWA TIKET KE PINTU KELUAR');
  }
  worldPauseOff();
}

const AKSI = {
  loket: async () => {
    worldPauseOn(); World.tempat('HALL TIKET');
    /* sapaan pembuka petugas loket (ala game story) */
    await dlg({
      face: '\uD83E\uDDD1\u200D\uD83D\uDCBC', who: 'PETUGAS LOKET',
      say: 'Selamat malam. Silakan, Anda bisa membeli tiket kereta di sini \u2014 silakan pilih rute kereta yang ingin dituju.',
      buttons: [{ label: 'SAYA MAU BELI TIKET', act: 'ok', cls: 'primary' }]
    });
    if (CUR && ST.lembar && ST.caps.length >= CUR.path.length) {
      await dlg({
        face: '\uD83E\uDDD1\u200D\uD83D\uDCBC', who: 'PETUGAS LOKET',
        say: 'Rute lembarmu sudah selesai \u2014 semua cap sudah turun di tiketmu.\n' +
             'Sekarang bawa tiketmu ke <b>PINTU KELUAR</b> (bawah), lalu ke <b>KANTOR PENGADUAN</b> untuk membongkar paketnya.',
        buttons: [{ label: 'SIAP', act: 'ok', cls: 'primary' }]
      });
      worldPauseOff();
      return;
    }
    if (ST.lembar && ST.caps.length < CUR.path.length) {
      const a = await dlg({
        face: '\uD83E\uDDD1\u200D\uD83D\uDCBC', who: 'PETUGAS LOKET',
        say: 'Lembarmu masih berlaku. Kamu masih punya ' + (CUR.path.length - ST.caps.length) + ' peron lagi. Mau lembar baru (angka diacak ulang) atau lanjut?',
        buttons: [{ label: 'LANJUT SAJA', act: 'ok', cls: 'primary' }, { label: 'MINTA LEMBAR BARU', act: 'baru', cls: 'ghost' }]
      });
      if (a === 'ok') { worldPauseOff(); return; }
      CUR = genLembar(CUR, seedBaru());
      ST.code = CUR.x0; ST.capLabel = null; ST.caps = []; ST.sheet = CUR.sheet; ST.lembar = false;
      hud(); toast('LEMBAR BARU DICETAK');
    }
    await babakLoket(CUR, ST.caps.length ? 'Tiketmu sedang berjalan. Ini lembar pengganti kalau perlu.' : null);
    const res = await askQuestion(makeSoal('loket-konsep', 0, CUR));
    if (!res.ok) {
      CUR = genLembar(CUR, seedBaru());
      ST.code = CUR.x0; ST.capLabel = null; ST.caps = []; ST.sheet = CUR.sheet; ST.lembar = false;
      ST.tempat = 'HALL TIKET'; hud();
      toast('LEMBAR BARU DICETAK');
    } else {
      AUDIO.sfx('lembar');
      ST.lembar = true;
      const nx = CUR.path[0];
      toast('LEMBAR SAH \u00b7 MULAI DARI GERBANG ' + nx.toUpperCase());
    }
    worldPauseOff();
  },

  gerbang: async j => {
    if (!CUR || ST.caps.length >= CUR.path.length) { toast('Semua cap sudah kamu miliki'); return; }
    const diharap = CUR.path[ST.caps.length];
    if (j !== diharap) {
      worldPauseOn();
      await dlg({
        face: '\uD83D\uDC6E', who: 'PETUGAS PERON',
        say: 'Cap terakhirmu belum membolehkan jalur ini. Lembarmu menyuruh jalur <b>' + diharap.toUpperCase() + '</b> dulu.',
        buttons: [{ label: 'KEMBALI', act: 'ok', cls: 'primary' }]
      });
      worldPauseOff();
      return;
    }
    worldPauseOn(); World.tempat('GERBANG ' + j.toUpperCase());
    const r = await naikKereta(j);
    if (r.gagal) {
      ST.gagal = (ST.gagal || 0) + 1;
      ST.lembar = false;
      if (ST.gagal >= 3) {
        await sitaTiket('PETUGAS PERON', '\uD83D\uDC6E', 'Tiga kali tiketmu belum sah di gerbang ini.');
        ST.gagal = 0;
      } else {
        await dlg({
          tag: 'TIKET BELUM SAH \u00b7 PERCOBAAN ' + ST.gagal + ' DARI 3', face: '\uD83D\uDC6E', who: 'PETUGAS PERON',
          say: 'Jawabanmu dua kali belum tepat \u2014 tiket ini belum bisa saya pakai.\n' +
               'Kembali ke <b>LOKET</b> untuk mengerjakan lembar tiket yang baru (percobaan ' + ST.gagal + ' dari 3).',
          buttons: [{ label: 'KE LOKET', act: 'ok', cls: 'primary' }]
        });
        toast('TIKET BELUM SAH \u00b7 KEMBALI KE LOKET (' + ST.gagal + '/3)');
      }
    }
    worldPauseOff();
  },

  /* di dalam gerbong: E di pintu = turun di stasiun berikutnya */
  gerbongTiba: gerbongTiba,

  /* sapa penumpang di dalam gerbong: side quest opsional */
  gerbong: async id => {
    worldPauseOn();
    const petakan = { sari: 'kopi', tua: 'tua', anak: 'anak', ibu: 'ibu', bersih: 'bersih' };
    const fn = NPC_AKSI[petakan[id]];
    if (fn) {
      const s0 = ST.smile;
      await fn();
      RUN_LOG.push({ stasiun: 'Gerbong ' + ((ST.caps.length || 1)), npc: (petakan[id] || '').toUpperCase(), bantu: ST.smile > s0 });
      /* emote di atas kepala penumpang kalau side quest sukses (Fase 4) */
      if (ST.smile > s0 && window.World && World.mode() === 'gerbong') {
        GEB.emote = { i: GEB.npcs.findIndex(function (n) { return n.aksi === 'gerbong:' + id; }), t: 1.6 };
        AUDIO.sfx('emote');
      }
    }
    worldPauseOff();
  },

  papanJalur: async () => {
    worldPauseOn();
    await dlg({
      tag: 'PAPAN JALUR \u00b7 STASIUN PUSAT', face: '\uD83D\uDDFA\uFE0F', who: 'PAPAN INFORMASI',
      say: 'Empat jalur melintas malam ini. Tiap jalur mengubah kode ruangmu.',
      extra: '<div class="note">' + ['f', 'g', 'h', 'k'].map(j =>
        'JALUR ' + j.toUpperCase() + '   ' + fJalur(j, CUR) + '   \u2014 ' + JALUR_INFO[j].fungsi).join('\n') +
        '\n\nRUTE WAJIBMU: ' + namaRute(CUR.path) + '\nCAP DIMINTA: ' + notasi(CUR.path) + '(x) = ' + poly(CUR.A, CUR.B) +
        '\nKODE RUANG SEKARANG: ' + ST.code + (ST.caps.length ? '\nCAP SUDAH DIPEROLEH: ' + notasi(CUR.path.slice(0, ST.caps.length)) : '') + '</div>',
      buttons: [{ label: 'TUTUP', act: 'ok', cls: 'primary' }]
    });
    worldPauseOff();
  },

  papanRumus: async () => { worldPauseOn(); await papanRumus(); worldPauseOff(); },

  pengaduan: async () => {
    if (!CUR || ST.caps.length < CUR.path.length) {
      worldPauseOn();
      await dlg({
        face: '\uD83D\uDCE6', who: 'PETUGAS PENGADUAN',
        say: 'Kantor ini hanya melayani paket yang sudah sampai. Selesaikan rute dulu \u2014 masih ada <b>' +
             (CUR.path.length - ST.caps.length) + '</b> peron yang harus kamu lewati.',
        buttons: [{ label: 'KEMBALI', act: 'ok', cls: 'primary' }]
      });
      worldPauseOff();
      return;
    }
    worldPauseOn(); World.tempat('KANTOR PENGADUAN');
    const r = await babakInvers(CUR);
    if (!r.ok) {
      await sitaTiket('PETUGAS PENGADUAN', '\uD83D\uDCE6', 'Dua kali pembatalan capnya belum berhasil. Kotak pos ini tidak bisa kubuka dengan paksa.');
      worldPauseOff();
      return;
    }
    await tutupCerita(CUR);
    worldPauseOff();
  },

  keluar: async () => {
    if (!CUR) return;
    worldPauseOn(); World.tempat('PINTU KELUAR STASIUN');
    if (ST.keluarOk) {
      await dlg({
        face: '\uD83D\uDD10', who: 'PENERIMA PAKET',
        say: 'Paketmu sudah saya terima. Lanjutkan ke <b>KANTOR PENGADUAN</b> untuk membongkar kotak posnya.',
        buttons: [{ label: 'SIAP', act: 'ok', cls: 'primary' }]
      });
      worldPauseOff();
      return;
    }
    if (ST.caps.length < CUR.path.length) {
      await dlg({
        face: '\uD83D\uDD10', who: 'PENERIMA PAKET',
        say: 'Cap terakhir tiketmu belum lengkap. Masih <b>' + (CUR.path.length - ST.caps.length) +
             '</b> peron yang harus kamu lewati sebelum saya buka pintu.',
        buttons: [{ label: 'KEMBALI', act: 'ok', cls: 'primary' }]
      });
      worldPauseOff();
      return;
    }
    const r = await babakPintuKeluar(CUR);
    if (!r.ok) {
      await sitaTiket('PENERIMA PAKET', '\uD83D\uDD10', 'Dua kali cap akhirmu belum tepat. Aku tidak bisa membuka pintu dengan cap yang salah.');
      worldPauseOff();
      return;
    }
    ST.keluarOk = true;
    await dlg({
      face: '\uD83D\uDD10', who: 'PENERIMA PAKET', soft: true,
      say: 'Paketmu saya terima. Tapi kotak pos ini masih tersegel cap pabrik <b>E(x) = ' + poly(CUR.A, CUR.B) +
           '</b> \u2014 isinya belum terbaca.\nBawa ke <b>KANTOR PENGADUAN</b> (pojok kiri bawah) supaya capnya dibatalkan.',
      buttons: [{ label: 'KE PENGADUAN', act: 'ok', cls: 'primary' }]
    });
    toast('LANJUT KE KANTOR PENGADUAN \u00b7 POJOK KIRI BAWAH');
    worldPauseOff();
  },

  npc: async id => {
    worldPauseOn();
    const d = NPC_AKSI[id];
    if (d) await d();
    else await dlg({ face: '\uD83D\uDC64', who: 'PENUMPANG', say: 'Maaf, saya sedang tidak bisa membantu.', buttons: [{ label: 'OK', act: 'ok' }] });
    worldPauseOff();
  }
};
window.AKSI = AKSI;

/* -------------------------------------------------- aksi tiap NPC di stasiun */
const NPC_AKSI = {
  kopi: async () => {
    const mula = await dlg({
      tag: 'KIOS KOPI & ROTI', face: '\uD83E\uDDD5', who: 'BU SARI',
      say: 'Kopi malam ini bukan untuk dijual \u2014 aku cuma mau memastikan hitunganku benar. Anakku baru lewat jalur ' +
           CUR.path[0].toUpperCase() + ', dan jalurnya kena soal begini:',
      extra: '<div class="note">' + fJalur(CUR.path[0], CUR) + '\njika kode ruang anakku <b>4</b>, jadi berapa di ujung jalur?</div>',
      buttons: [{ label: 'SAYA HITUNG', act: 'ok', cls: 'gold' }, { label: 'MAAF, SEDANG BURU-BURU', act: 'tolak', cls: 'ghost' }]
    });
    if (mula === 'tolak') {
      await dlg({ face: '\uD83E\uDDD5', who: 'BU SARI', say: 'Ya sudah nak, hati-hati di jalan.', buttons: [{ label: 'OK', act: 'ok', cls: 'ghost' }] });
      return;
    }
    const j0 = CUR.path[0], [m, n] = mn(j0, CUR), benar = applyJalur(j0, 4, CUR);
    const q = {
      who: 'BU SARI', tag: 'SIDE QUEST \u00b7 KIOS', rejectTitle: 'BANTUAN BELUM TUNTAS',
      prompt: fJalur(j0, CUR) + '\nKode ruang anakku 4. Jadi berapa di ujung jalur?',
      type: 'num', ph: 'ketik angka',
      check: raw => checkNum(raw, benar),
      diagnose: () => 'Coba sekali lagi. Kalikan dulu, baru tambahkan atau kurangkan.',
      goodHtml: () => '<span class="ttl">\u2714 TERIMA KASIH</span><br>Benar: <b>' + benar + '</b><span class="calc">' + j0 + '(4) = ' + poly(m, n).replace('x', '4') + ' = ' + benar + '</span>',
      record: (raw, ok, w) => ST.stats.push({ peron: 'Side quest', typed: raw, ok, cap: 'jalur ' + j0, kode: '-' })
    };
    const r = await askQuestion(q);
    if (r.ok) { tambahSenyum(); World.tempat('KIOS KOPI & ROTI'); toast('BU SARI TERSENYUM'); }
  },

  satpam: async () => {
    await dlg({
      tag: 'HALL TIKET', face: '\uD83D\uDC6E', who: 'PAK SATPAM',
      say: 'Tiketmu sah, cap terakhir ' + (ST.capLabel || 'belum ada') + '. Lanjut saja, gerbang ada di sebelah kanan.',
      extra: CUR ? '<div class="note">TEMPAT KAMU SEKARANG: ' + (ST.tempat || 'HALL') + '\nSUDAH DICAP: ' + (ST.caps.length ? notasi(CUR.path.slice(0, ST.caps.length)) : '\u2014') +
        '\nBELUM DICAP: ' + (CUR.path.length - ST.caps.length) + ' jalur</div>' : '',
      buttons: [{ label: 'TERIMA KASIH', act: 'ok', cls: 'primary' }]
    });
  },

  anak: async () => {
    worldPauseOn();
    const r = await dlg({
      tag: 'PERON \u00b7 ANAK SEKOLAH', face: '\uD83E\uDDD1\u200D\uD83C\uDF93', who: 'ANAK SEKOLAH',
      say: 'Kak, saya ada PR. Katanya (h\u2218g)(x) itu artinya apa? Guru saya tidak menjelaskan urutannya.',
      buttons: [{ label: 'JELASKAN (contoh kecil)', act: 'ok', cls: 'gold' }, { label: 'MAAF, SAYA BURU-BURU', act: 'tolak', cls: 'ghost' }]
    });
    if (r === 'ok') {
      await dlg({
        face: '\uD83E\uDDD1\u200D\uD83C\uDF93', who: 'ANAK SEKOLAH',
        say: 'Jadi (h\u2218g)(x) = h(g(x)) ya \u2014 g dulu, lalu hasilnya masuk ke h. Kalau urutannya dibalik, hasilnya beda ya kak?',
        extra: '<div class="note">Bukti kecil dari stasiun ini:\ng(' + CUR.x0 + ') = ' + applyJalur('g', CUR.x0, CUR) +
               ', lalu h(' + applyJalur('g', CUR.x0, CUR) + ') = ' + applyJalur('h', applyJalur('g', CUR.x0, CUR), CUR) +
               '\nsedangkan kalau dibalik: h(' + CUR.x0 + ') = ' + applyJalur('h', CUR.x0, CUR) + ', g dari situ = ' +
               applyJalur('g', applyJalur('h', CUR.x0, CUR), CUR) + '\nangkanya beda \u2192 urutannya penting.</div>',
        buttons: [{ label: 'BENAR', act: 'ok', cls: 'primary' }]
      });
      tambahSenyum();
    } else {
      await dlg({ face: '\uD83E\uDDD1\u200D\uD83C\uDF93', who: 'ANAK SEKOLAH', say: 'Ya sudah, terima kasih.', buttons: [{ label: 'OK', act: 'ok', cls: 'ghost' }] });
    }
  },

  ibu: async () => {
    worldPauseOn();
    const r = await dlg({
      tag: 'HALL \u00b7 IBU BERKOPER', face: '\uD83E\uDDF3', who: 'IBU BERKOPER',
      say: 'Nak, koporku berat. Sekalian ya \u2014 tolong tunjukkan ke arah gerbang jalur yang hurufnya paling kanan di notasi tiket ini.',
      extra: '<div class="note">CAP YANG DIMINTA PENERIMA: ' + notasi(CUR.path) + '(x)</div>',
      buttons: [{ label: 'SAYA TUNJUKKAN', act: 'ok', cls: 'gold' }, { label: 'MAAF, SAYA TERBURU-BURU', act: 'tolak', cls: 'ghost' }]
    });
    if (r === 'ok') {
      await dlg({
        face: '\uD83E\uDDF3', who: 'IBU BERKOPER',
        say: 'Jadi yang dikerjakan paling dulu itu yang paling kanan: jalur <b>' + CUR.path[0].toUpperCase() +
             '</b>. Betul ya? Saya hafal sekarang: baca dari kanan.',
        buttons: [{ label: 'BETUL', act: 'ok', cls: 'primary' }]
      });
      tambahSenyum();
    } else {
      await dlg({ face: '\uD83E\uDDF3', who: 'IBU BERKOPER', say: 'Baiklah, hati-hati ya.', buttons: [{ label: 'OK', act: 'ok', cls: 'ghost' }] });
    }
  },

  tua: async () => {
    const a = await dlg({
      tag: 'PERON \u00b7 PAK TUA', face: '\uD83D\uDC74', who: 'PAK TUA',
      say: 'Tiketku bertanda begini. Jalur ini menambah berapa? Aku sudah lupa hitungannya.',
      extra: '<div class="note">JALUR ' + CUR.path[0].toUpperCase() + ': ' + fJalur(CUR.path[0], CUR) + '</div>',
      buttons: [{ label: 'SAYA BANTU', act: 'ok', cls: 'gold' }, { label: 'MAAF, SAYA BURU-BURU', act: 'tolak', cls: 'ghost' }]
    });
    if (a !== 'ok') {
      await dlg({ face: '\uD83D\uDC74', who: 'PAK TUA', say: 'Ya sudah, terima kasih.', buttons: [{ label: 'OK', act: 'ok', cls: 'ghost' }] });
      return;
    }
    const [m, n] = mn(CUR.path[0], CUR);
    await dlg({
      face: '\uD83D\uDC74', who: 'PAK TUA',
      say: 'Jadi rumusnya: kalikan <b>' + m + '</b>, lalu ' + (n >= 0 ? 'tambah <b>' + n + '</b>' : 'kurang <b>' + Math.abs(n) + '</b>') + '. Terima kasih nak.',
      buttons: [{ label: 'SAMA-SAMA', act: 'ok', cls: 'primary' }]
    });
    tambahSenyum();
  }
};

/* NPC bergerak: sapaan singkat + bisa memberi satu soal (paket tua & kebersihan) */
NPC_AKSI.bersih = async () => {
  const a = await dlg({
    tag: 'PERON \u00b7 PETUGAS KEBERSIHAN', face: '\uD83E\uDDF9', who: 'PETUGAS KEBERSIHAN',
    say: 'Saya sering melihat jalur ' + CUR.path[0].toUpperCase() + '. Kalau jalur itu dibalik, jadi fungsi apa?',
    extra: '<div class="note">' + fJalur(CUR.path[0], CUR) + '\ntulis inversnya dalam bentuk ax + b (contoh: 2x \u2212 3)</div>',
    buttons: [{ label: 'SAYA COBA TULIS', act: 'ok', cls: 'gold' }, { label: 'MAAF, SEDANG BURU-BURU', act: 'tolak', cls: 'ghost' }]
  });
  if (a !== 'ok') {
    await dlg({ face: '\uD83E\uDDF9', who: 'PETUGAS KEBERSIHAN', say: 'Tidak apa-apa, lanjut saja.', buttons: [{ label: 'OK', act: 'ok', cls: 'ghost' }] });
    return;
  }
  const [m, n] = mn(CUR.path[0], CUR);
  const A = 1 / m, B = -n / m;
  const q = {
    who: 'PETUGAS KEBERSIHAN', tag: 'SIDE QUEST \u00b7 INVERS', rejectTitle: 'BELUM TEPAT',
    prompt: fJalur(CUR.path[0], CUR) + '\nTulis fungsi kebalikannya: ' + CUR.path[0] + '\u207b\u00b9(x) = \u2026',
    type: 'expr', ph: 'contoh: 2x\u22123 atau x/2',
    check: raw => cekFungsi(raw, A, B),
    diagnose: () => 'Tukar posisi: x jadi subjek. Pindahkan konstanta (tanda berubah), lalu bagi koefisien x.',
    goodHtml: () => '<span class="ttl">\u2714 BENAR</span><br>' + CUR.path[0] + '\u207b\u00b9(x) = (x ' +
      (n > 0 ? '\u2212 ' + n : '+ ' + Math.abs(n)) + ') / ' + m +
      (Number.isInteger(A) && Number.isInteger(B) ? '  =  ' + poly(A, B) : ''),
    record: (raw, ok, w) => ST.stats.push({ peron: 'Side quest', typed: raw, ok, cap: CUR.path[0] + '\u207b\u00b9', kode: '-' })
  };
  const r = await askQuestion(q);
  if (r.ok) { tambahSenyum(); toast('PETUGAS KEBERSIHAN MENGANGGUK SENANG'); }
};
NPC_AKSI.asongan = async () => {
  worldPauseOn();
  await dlg({
    tag: 'PERON \u00b7 PEDAGANG ASONGAN', face: '\uD83C\uDF6B', who: 'PEDAGANG ASONGAN',
    say: 'Sudah berapa jalur yang kamu lewati? Cap di tiketmu bisa dipakai buat cek.',
    extra: ST.caps.length ? '<div class="note">CAP SEKARANG: ' + notasi(CUR.path.slice(0, ST.caps.length)) + '\nKODE RUANG: ' + ST.code + '</div>' : '<div class="note">Tiketmu belum dicap sama sekali. Mulai dari gerbang ' + CUR.path[0].toUpperCase() + '.</div>',
    buttons: [{ label: 'TERIMA KASIH', act: 'ok', cls: 'primary' }]
  });
  worldPauseOff();
};

/* ------------------------------------------------------------ mulai shift  */
/* adegan pembuka singkat: jalan kota malam, lalu masuk stasiun (canvas 240x125, di-stretch pixelated) */
function gambarPembuka(cv, mode) {
  const c = cv.getContext('2d');
  initSprites();
  c.imageSmoothingEnabled = false;
  const W2 = cv.width, H2 = cv.height;
  const subuh = mode === 'subuh';
  /* langit: malam berbintang + bulan, atau subuh tiga pita oranye-ungu */
  if (subuh) {
    c.fillStyle = '#2a2340'; c.fillRect(0, 0, W2, 34);
    c.fillStyle = '#6a3a52'; c.fillRect(0, 34, W2, 34);
    c.fillStyle = '#c96a3a'; c.fillRect(0, 68, W2, 26);
    c.fillStyle = '#f0a05a'; c.fillRect(W2 - 34, 58, 18, 10);   // matahari setengah terbit
    c.fillStyle = '#c96a3a'; c.fillRect(W2 - 34, 68, 18, 4);
    c.fillStyle = '#e8d8c0';
    for (let s = 0; s < 8; s++) c.fillRect((s * 71) % W2, (s * 37) % 26, 1, 1);
  } else {
    c.fillStyle = '#0e1326'; c.fillRect(0, 0, W2, H2);
    c.fillStyle = '#e8e4ee';
    for (let s = 0; s < 26; s++) c.fillRect((s * 71) % W2, (s * 37) % 42, 1, 1);
    c.fillStyle = '#f4f0d8'; c.beginPath(); c.arc(W2 - 26, 20, 9, 0, 6.3); c.fill();
    c.fillStyle = '#0e1326'; c.beginPath(); c.arc(W2 - 30, 17, 8, 0, 6.3); c.fill();
  }
  /* skyline jauh: siluet + jendela menyala */
  c.fillStyle = subuh ? '#241c2e' : '#1a2238';
  for (let i = 0; i < 7; i++) {
    const bw = 26 + (i * 13) % 18, bh = 26 + (i * 17) % 22, bx = i * 36 - 4;
    c.fillRect(bx, 78 - bh, bw, bh);
    c.fillStyle = '#ffd24a';
    for (let wy = 78 - bh + 4; wy < 74; wy += 6) c.fillRect(bx + 4, wy, 2, 3);
    c.fillStyle = '#1a2238';
  }
  /* ruko dekat: KOPI (awning hijau) kiri, STASIUN kanan */
  c.fillStyle = '#6a5a4a'; c.fillRect(6, 52, 74, 42);
  c.fillStyle = '#3a3344'; c.fillRect(14, 60, 22, 14); c.fillStyle = '#ffd24a'; c.fillRect(16, 62, 18, 10);
  c.fillStyle = '#8a7660'; c.fillRect(48, 58, 24, 36);
  for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#e8e4ee' : '#3a7a5a'; c.fillRect(6 + i * 13, 44, 13, 9); }
  /* stasiun: fasad gelap + papan nama menyala + pintu */
  c.fillStyle = '#2e3450'; c.fillRect(140, 40, 96, 54);
  c.fillStyle = '#12162a'; c.fillRect(148, 46, 80, 14);
  pxText(c, 'STASIUN PUSAT', 188, 50, PAL.emas, { align: 'center', skala: 1 });
  c.fillStyle = '#38506a'; c.fillRect(158, 64, 60, 30);
  c.fillStyle = '#ffd24a'; c.fillRect(156, 62, 64, 2);
  c.fillStyle = '#9fd8ff'; c.fillRect(186, 64, 4, 30); c.fillRect(158, 78, 60, 2);
  /* trotoar + jalan + marka + zebra */
  c.fillStyle = '#9a94a8'; c.fillRect(0, 94, W2, 10);
  c.fillStyle = '#8a8498'; for (let x = 0; x < W2; x += 16) c.fillRect(x, 94, 14, 2);
  c.fillStyle = '#34313e'; c.fillRect(0, 104, W2, H2 - 104);
  c.fillStyle = '#e8e6ee'; for (let x = 6; x < W2; x += 24) c.fillRect(x, 114, 12, 3);
  /* lampu jalan */
  for (const lx of [40, 120]) {
    c.fillStyle = '#3a3548'; c.fillRect(lx, 66, 2, 28);
    c.fillStyle = '#ffd24a'; c.fillRect(lx - 3, 64, 8, 4);
    c.fillStyle = 'rgba(255,210,74,.15)'; c.beginPath(); c.arc(lx, 66, 10, 0, 6.3); c.fill();
  }
  /* malam: menuju stasiun; subuh: keluar stasiun pulang ke kanan */
  if (subuh) {
    pxChar(c, 'kucing', 196, 92, 'right', 1, 1);
    pxChar(c, 'kurir', 220, 106, 'right', 1, 1, 'KAMU');
  } else {
    pxChar(c, 'kucing', 96, 92, 'down', 0, 1);
    pxChar(c, 'kurir', 128, 106, 'right', 1, 1, 'KAMU');
  }
}
async function adeganPembuka() {
  await dlg({
    tag: 'SHIFT MALAM \u00b7 23:10',
    extra: '<canvas id="introCv" width="240" height="125" style="width:100%;image-rendering:pixelated;border:1px solid #233350;border-radius:10px"></canvas>',
    say: 'Kota sudah sepi. Tugasmu malam ini ada di ujung jalur kereta \u2014 masuk ke <b>STASIUN PUSAT</b>.',
    buttons: [{ label: 'MASUK STASIUN', act: 'ok', cls: 'primary' }],
    clear: false,
    after: () => { const cv = document.querySelector('#introCv'); if (cv) gambarPembuka(cv); }
  });
}

async function mulaiShiftWorld(seed, mode) {
  await mulaiShift(seed, mode);
  if (window.World) { World.start(); World.resume(); PlayerReset(); }
  window.STASIUN_TEME = { seed: 7, idx: 0 };
  await adeganPembuka();
  await babakAwal(CUR);
  if (World) { World.resume(); World.tempat(NAMA_STASIUN[0]); }
  hud();
  AUDIO.musik('stasiun');
  toast('AMBIL LEMBAR DI LOKET \u00b7 JALAN PAKAI WASD ATAU KLIK LANTAI');
}
function PlayerReset() { if (window.World) World.jalanKe(250, 500); }

/* tombol lama di menu diarahkan ke alur dunia */
function pasangMenu() {
  $('#mStart').onclick = () => { LAST_SEED = seedBaru(); mulaiShiftWorld(LAST_SEED, 'penuh').catch(fail); };
  $('#mShort').onclick = () => { LAST_SEED = seedBaru(); mulaiShiftWorld(LAST_SEED, 'singkat').catch(fail); };
}
window.mulaiShiftWorld = mulaiShiftWorld;
window.pasangMenu = pasangMenu;
pasangMenu();                                   // tombol menu diarahkan ke alur dunia