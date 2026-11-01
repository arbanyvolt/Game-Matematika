# STASIUN TRANSIT — Fungsi Komposisi & Invers

Game edukasi matematika pixel-art, tema 6: **jalur kereta bawah tanah sebagai notasi komposisi fungsi.**
Kamu kurir malam. Kode ruangmu berubah setiap kali menempuh satu jalur kereta.
Urutan jalur = **komposisi**. Membaca ulang isi paket = **invers**.

---

## Cara membuka

**Klik dua kali `index.html`.** Tidak perlu install, tidak perlu server.

- Tanpa internet pun jalan: font otomatis memakai cadangan sistem, seluruh grafis
  digambar prosedural di canvas (tanpa file gambar wajib).
- Soal diacak setiap kali mulai; **kode RUTE** di pojok kanan atas HUD menentukan seluruh soal.
  Mainkan kode yang sama → soal persis sama (praktis untuk dibagikan ke satu kelas).
- `server-dev.js` hanya alat bantu pengembangan (server lokal tanpa cache) — tidak dipakai untuk main.

## Kontrol

| Aksi | Cara |
|---|---|
| Jalan di stasiun | **WASD / tombol panah**, atau klik lantai (karakter jalan sendiri) |
| Berinteraksi (loket, gerbang, NPC, pintu) | **E** saat dekat objek |
| Jalan di dalam gerbong | **A/D** atau klik lantai (kiri–kanan di lorong) |
| Ketik jawaban | keyboard, atau klik papan angka / tombol f g h k di layar |
| Kirim jawaban | `Enter` atau tombol **KIRIM** |
| Menu jeda | tombol **☰ MENU** (ada PAPAN RUMUS) |

Tidak ada tombol hint. Yang ada **PAPAN RUMUS**: contekan rumus (komposisi, urutan, invers), bukan jawaban soal.

## Alur permainan

    0. Pembuka            jalan kota malam → SMS kantor → masuk STASIUN PUSAT
    1. LOKET TIKET        sapaan petugas → 1 soal konsep → tiket diterbitkan
    2. GERBANG peron      serahkan tiket → soal kode ruang
                          salah 2× di soal yang sama → tiket belum sah → kembali ke LOKET
                          (maksimal 3×; setelah itu lembar baru dengan angka diacak ulang)
    3. DI DALAM GERBONG   adegan berubah jadi side-view ala KRL, kereta benar-benar melaju
                          (jendela bergulir, interior bergoyang). Side quest opsional:
                          sapa penumpang (E) — bantu mereka untuk +senyum.
                          Lanjutkan perjalanan: tekan E di PINTU KERETA.
    4. STASIUN TRANSIT    turun di stasiun berikutnya (Pusat → Timur → Selatan → Barat)
                          — inilah "level" game-nya. Ulangi 1–3 di jalur berikutnya.
    5. PINTU KELUAR       stasiun terakhir = STASIUN KANTOR: tulis cap akhir + nilainya
    6. KANTOR PENGADUAN   4 soal INVERS: membatalkan cap E(x) supaya isi paket terbaca
    7. EPILOG             surat penutup (senyum menentukan varian ending) + RAPOR SHIFT

Jumlah soal wajib: 9 (mode penuh, 4 jalur) atau 5 (MODE SINGKAT, 2 jalur).
Side quest di gerbong: opsional, hanya memengaruhi epilog.

## Cara soal dibuat (penting kalau mau mengubah)

Soal **tidak ditulis sebagai teks tetap**. Semua angka dibuat oleh generator di awal `game.js`:

```
f(x) = ax + b     g(x) = cx + d     h(x) = ex     k(x) = x + q
```

`genRute(seed)` mengacak a, b, c, d, e, q, kode ruang awal x0, dan urutan rute.
Dua syarat wajib yang dijaga generator:

1. **Urutan harus bisa dibedakan** — tolak kombinasi jika `d(a−1) === b(c−1)` (akibatnya
   f∘g = g∘f, momen "tiket ditolak" jadi tidak punya beda angka), dan pastikan `a ≠ c`.
2. **Semua jawaban bilangan bulat** — jawaban invers `(y − B)/A` harus pas dibagi;
   kode ruang akhir dibatasi ≤ 900 supaya terbaca dari baris belakang kelas.

Semua soal dibuat di satu tempat: `makeSoal(kind, i, R)` di `game.js`.
Jenis: `loket-konsep`, `peron`, `receipt-rumus`, `receipt-nilai`, `inv-pair`, `inv-isi`,
`inv-bukti`, `inv-jalur`.

## Penerimaan jawaban

| Jenis | Diterima | Ditolak |
|---|---|---|
| angka | `24`, `24.`, `24,0`, `-4` | `24 24`, `2 4` |
| bentuk fungsi | `12x+8`, `12x + 8`, `8+12x`, `12*x+8`, `2(x+4)+8x` (setara), `x/2`, `(x-2)/3` | `x12+8`, `12x-8`, `8x+12`, `12x`, `12x=8` |
| pasangan angka | `3 4`, `-3 4` | `34` (tanpa pemisah) |

Jawaban bentuk fungsi diperiksa secara aljabar (parse + uji nilai di tiga titik),
jadi penulisan setara tetap diterima tetapi jawaban salah tidak bisa "lolos kebetulan".

## Berkas

    index.html      tampilan + CSS (HUD atas, dunia kiri, panel soal kanan)
    game.js         generator soal, validator jawaban, cerita, dialog typewriter
    world.js        dunia pixel: mode STASIUN (top-down) + mode GERBONG (side-view),
                    fisika, A* cari jalan, NPC berjalan
    pixel.js        palet, mesin sprite karakter (4 arah × 3 frame), gambar tile/kereta
    aksi.world.js   jembatan dunia ↔ cerita: aksi loket/gerbang/pintu/NPC,
                    adegan pembuka, transisi stasiun, aturan gagal maks 3×
    aset/           UI Kenney (RPG UI Expansion, lisensi CC0) — tombol, panel, bar, ikon
    server-dev.js   (opsional) server lokal tanpa cache untuk pengembangan

## Catatan untuk presentasi

- Tidak ada timer, tidak ada nyawa, tidak ada jalan gagal — pemain selalu bisa lanjut.
- Saat menjawab soal, peta stasiun tetap terlihat di kiri: siswa bisa menghitung sambil
  melihat `JALUR F · f(x) = …` di papan jalur.
- Rapor akhir menampilkan pemeriksaan silang (kode awal → tiap peron → pintu keluar →
  pembatalan E⁻¹), jadi guru bisa menunjukkan hasilnya konsisten, bukan tebakan.
- Kalau ingin seluruh kelas mengerjakan soal yang sama: bagikan **kode RUTE** di HUD.
- Grafis karakter = chibi 16×22 ala Stardew Valley, digambar prosedural — tidak ada
  aset gambar wajib, game tetap utuh walau folder `aset/` hilang (hanya UI yang berubah gaya).

## Kredit

- UI: [Kenney UI Pack RPG Expansion](https://kenney.nl) — CC0 (public domain).
- Matematika & desain soal: diverifikasi otomatis (uji 800 seed, konsistensi komposisi-invers).
