# ABOUT GAME — STASIUN TRANSIT
### Game Edukasi Matematika: Fungsi Komposisi & Fungsi Invers

---

## 1. LATAR BELAKANG

Materi **fungsi komposisi dan fungsi invers** termasuk materi matematika yang paling
sering menjadi sumber kebingungan siswa: notasi `(f∘g)(x)` terlihat abstrak, urutan
pengerjaan (kanan ke kiri) mudah tertukar, dan invers sering dihafal sebagai rumus
tanpa dipahami maknanya.

**STASIUN TRANSIT** lahir dari satu gagasan: materi itu bisa dibuat konkret.
Jalur kereta yang harus ditempuh **berurutan** adalah **komposisi fungsi**; kode
ruang yang berubah setiap melewati satu jalur adalah hasil komposisi bertahap; dan
membaca ulang isi paket dengan membalik cap-nya adalah **invers**. Siswa tidak
sekadar menghitung — siswa *menjadi* bagian dari notasi itu.

Game ini dibuat sebagai media pembelajaran untuk mata pelajaran Matematika
(SMK Telkom XI PPLG 2, tema 6) dan didesain agar bisa langsung dipakai guru:
soal dapat dibagikan seragam ke satu kelas, dan hasil akhir siswa dapat
diperiksa konsistensinya di layar.

---

## 2. TUJUAN

1. Menjadikan fungsi komposisi dan invers **dipahami lewat pengalaman**, bukan hafalan.
2. Melatih urutan berpikir: notasi `(f∘g)(x)` dibaca kanan → kiri, dipraktikkan
   sebagai "jalur mana yang ditempuh lebih dulu".
3. Melatih ketelitian: setiap jawaban salah mendapat umpan balik yang menjelaskan
   **mengapa** salah (bukan sekadar "SALAH").
4. Menyediakan alat untuk guru: kode rute yang bisa dibagikan ke kelas dan rapor
   akhir yang menunjukkan konsistensi hitungan siswa.
5. Membuktikan bahwa game edukasi bisa dibuat **ringan dan mandiri**: satu folder,
   tanpa instalasi, tanpa internet, dibuka dengan klik dua kali.

---

## 3. TEMA GAME

- **Tema besar:** stasiun kereta bawah tanah di malam hari (subway), dengan gaya
  visual **pixel art** otentik.
- **Pembungkus cerita:** kamu adalah **kurir malam** yang harus mengantarkan paket
  melintasi empat stasiun dengan kereta; "lembar rute" tiketmu adalah notasi
  komposisi, dan "cap" tiap jalur menempel di tiketmu.
- **Mengapa kereta?** Karena jalur kereta punya sifat yang sama dengan komposisi:
  **urutan itu penting**. Naik jalur F lalu G berbeda hasilnya dengan G lalu F —
  persis seperti f(g(x)) ≠ g(f(x)).

---

## 4. ALUR PERMAINAN

| Babak | Lokasi | Yang terjadi |
|---|---|---|
| 0. Pembuka | Kota malam | Dialog pembuka + adegan jalan ke STASIUN PUSAT (23:10) |
| 1. Loket Tiket | Hall stasiun | Sapaan petugas → **1 soal konsep** (huruf jalur mana dikerjakan pertama) → lembar rute diterbitkan |
| 2. Gerbang Peron | Peron jalur F/G/H/K | Serahkan tiket → **1 soal kode ruang** per jalur → cap turun di tiket → naik kereta |
| 3. Di Dalam Gerbong | Interior kereta (top-down) | Jalan bebas, **side quest opsional**: sapa penumpang, bantu mereka → +senyum; tekan **E** di PINTU KERETA untuk lanjut |
| 4. Stasiun Transit | Pusat → Timur → Selatan → Barat | Ulangi babak 1–3; **tiap stasiun punya tema visual berbeda** |
| 5. Pintu Keluar | STASIUN KANTOR | **2 soal**: tulis cap akhir (bentuk fungsi) + nilai capnya |
| 6. Kantor Pengaduan | Loket pengaduan | **4 soal invers**: membatalkan cap E(x) supaya isi paket terbaca |
| 7. Ending | Keluar stasiun | Petugas kantor → jalan keluar → **adegan kota subuh** → surat epilog → rapor + cap penghargaan |

Jumlah soal wajib: **9** (mode penuh, 4 jalur) atau **5** (MODE SINGKAT, 2 jalur).
Salah 2× pada soal yang sama → tiket disita → kembali ke loket dengan lembar baru
(angka diacak ulang). Tidak ada game over — pemain selalu bisa lanjut.

---

## 5. STORY

> Jam 23:10, kota sudah sepi. Kamu kurir shift malam; tugasmu malam ini ada di
> ujung jalur kereta. Sebuah paket bermaterai harus melewati empat stasiun — dan
> "kode ruang" paket itu berubah setiap kali melewati satu jalur kereta. Petugas
> loket memberimu lembar rute; petugas peron memeriksa cap satu per satu; dan
> penerima paket hanya menerima **cap akhir yang tepat** — kalau urutan jalurmu
> salah, angkanya lain, dan paketmu ditolak. Di ujung perjalanan, satu kotak pos
> menunggu di KANTOR PENGADUAN: satu-satunya cara membacanya adalah membalik
> capnya — **invers** — langkah demi langkah, sampai isi aslinya kembali.

Di dalam gerbong ada penumpang-penumpang kecil dengan masalahnya masing-masing
(Bu Sari di kios, Pak Tua, Anak Sekolah, Ibu Berkoper). Membantu mereka tidak
wajib, tidak mengubah soal — tetapi **senyum mereka menentukan bagaimana kota
menyambutmu saat shift usai**.

---

## 6. CARA BERMAIN

| Aksi | Kontrol |
|---|---|
| Jalan di stasiun / gerbong | **WASD / panah**, atau klik lantai (karakter jalan sendiri, A*) |
| Berinteraksi (loket, gerbang, NPC, pintu) | **E** saat dekat objek |
| Ketik jawaban | Keyboard, atau papan angka / tombol f g h k di layar |
| Kirim jawaban | `Enter` / tombol KIRIM |
| Menu jeda | **☰ MENU** (berisi PAPAN RUMUS + koleksi CAP) |

- Tidak ada timer dan tidak ada nyawa — permainan tidak bisa "kalah".
- **PAPAN RUMUS** adalah contekan rumus (komposisi, urutan, invers), bukan jawaban soal.
- Saat menjawab soal, peta stasiun tetap terlihat di kiri — siswa bisa menghitung
  sambil melihat `JALUR F · f(x) = …` di papan jalur.
- **Kode RUTE** di pojok HUD menentukan seluruh soal: mainkan kode yang sama,
  soalnya persis sama (praktis untuk dibagikan ke satu kelas).
- HUD menampilkan progres: stasiun, kode ruang, cap terakhir, dan **senyum ♥**.

---

## 7. MATERI MTK YANG DIAJARKAN

Seluruh soal digenerate dari fungsi-fungsi berikut (angka diacak, dijaga valid):

```
f(x) = ax + b     g(x) = cx + d     h(x) = ex     k(x) = x + q
```

| Soal | Materi |
|---|---|
| Loket · soal konsep | Membaca notasi `(f∘g∘h∘k)(x)` — mana yang dikerjakan pertama (kanan) |
| Peron 1–4 (kode ruang) | Evaluasi komposisi **bertahap**: x₀ → f(x₀) → g(f(x₀)) → … |
| Pintu keluar · cap | Menyusun **bentuk fungsi** hasil komposisi (ax + b) |
| Pintu keluar · nilai | Substitusi nilai ke hasil komposisi |
| Invers 1 | Menentukan E⁻¹(x) = (x − b)/a dari E(x) = ax + b |
| Invers 2 | Menggunakan invers untuk **membaca kembali** isi paket |
| Invers 3 | Bukti (E⁻¹∘E)(x) = x |
| Invers 4 | Invers satu jalur: dari output kembali ke input |

**Dua jaminan matematis dari generator soal:**
1. Urutan rute selalu bisa dibedakan (ditolak jika f∘g = g∘f, agar momen
   "tiket ditolak karena urutan" selalu punya makna).
2. Semua jawaban dijamin bilangan bulat, dan kode akhir ≤ 900 agar terbaca
   dari baris belakang kelas.

**Validator jawaban aljabar:** jawaban bentuk fungsi diperiksa dengan parse +
uji nilai di tiga titik, jadi `12x+8`, `8+12x`, dan `2(x+4)+8x` diterima sebagai
jawaban yang sama — tapi `8x+12` tetap ditolak. Tidak ada jawaban salah yang
lolos karena kebetulan penulisan.

---

## 8. ENDING

Setelah soal invers terakhir:

1. **Petugas STASIUN KANTOR** menandai shift terakhir.
2. Karakter **jalan keluar dari stasiun** (auto-walk) dengan layar memudar.
3. **Adegan kota subuh** — langit oranye-ungu, matahari setengah terbit, karakter
   dan si kucing melangkah pulang. Shift malam berakhir.
4. **Surat epilog** — isinya bervariasi berdasarkan jumlah senyum:

| Senyum | Judul ending |
|---|---|
| ≥ 3 | **KURIR YANG DIKENAL** — orang yang kamu bantu ikut mengantarmu |
| 1–2 | **KURIR YANG TELITI** — kerjamu rapi, dan itu cukup |
| 0 | **KURIR YANG EFISIEN** — tidak ada yang menunggumu di peron |

5. **Rekap matematika** — komposisi dan invers dijelaskan ulang memakai angka
   milik pemain sendiri (kode awal → kode akhir).
6. **RAPOR SHIFT** — dua tabel: pemeriksaan silang konsistensi (kode awal → tiap
   peron → pintu keluar → pembatalan E⁻¹) dan perjalanan tiket (jawaban per soal,
   DITERIMA/DITOLAK).

### Cap Penghargaan (badge / reward)

Lima **cap stempel** yang didapat dari permainan, tampil di rapor dan dikumpulkan
di menu utama (yang belum didapat tampil "? ? ?"):

| Cap | Syarat |
|---|---|
| 🕐 CAP TEPAT WAKTU | Tamat tanpa satu pun tiket disita |
| 🤝 CAP SAHABAT STASIUN | Senyum ≥ 3 |
| 💗 CAP HATI PENUMPANG | Membantu semua penumpang yang muncul |
| ✏️ CAP ALJABAR | Semua soal bentuk fungsi dijawab benar |
| 🚉 CAP RUTE PENUH | Menyelesaikan mode penuh (4 jalur) |

Koleksi cap tersimpan otomatis di browser (localStorage) — pendorong main ulang.

---

## 9. KOMPONEN GAME

### Berkas

| Berkas | Isi |
|---|---|
| `index.html` | Layout, CSS, HUD, dialog, menu, efek scanline |
| `game.js` | Generator soal berbasis seed, validator jawaban aljabar, cerita & dialog, sistem cap |
| `world.js` | Dunia pixel 2 mode (stasiun top-down + gerbong top-down), fisika, A* pathfinding, 5 tema stasiun |
| `pixel.js` | Palet, mesin sprite karakter (4 arah × 3 frame, outline otomatis), font bitmap 3×5 (`pxText`) |
| `aksi.world.js` | Jembatan dunia ↔ cerita: aksi loket/gerbang/pintu/NPC, transisi stasiun, ending |
| `asetGB.js` | Pemuat & perekolor aset Game Boy ke palet game |
| `aset/` | UI Kenney (RPG UI Expansion, CC0) |
| `Train Example/` | Sumber aset interior gerbong & stasiun (GB Studio Trains, direcolor saat dimuat) |
| `about game.md` | Dokumen ini |
| `server-dev.js` | (Opsional, khusus pengembangan) server lokal tanpa cache |

### Sistem di dalam game

- **Generator soal berbasis seed (kode RUTE)** — soal diacak tapi bisa direproduksi.
- **Validator jawaban aljabar** — menerima bentuk setara, menolak jawaban salah.
- **Umpan balik diagnostik** — tiap jenis kesalahan punya pesan spesifik
  (jawaban urutan terbalik, tanda konstanta terbalik, satu jalur terlewat, dst).
- **Dunia top-down dengan A\* pathfinding** — klik lantai, karakter mencari jalan sendiri.
- **5 tema visual stasiun** — Pusat (ungu), Timur (teal, pasar), Selatan (hijau, taman),
  Barat (bata, gudang), Kantor (abu resmi).
- **Pixel art otentik** — semua teks di dunia memakai font bitmap 3×5 yang digambar
  per-piksel; animasi dunia berjalan 8 fps khas retro; skala layar selalu membuat
  piksel seragam di ukuran layar apa pun.
- **Aset Game Boy di-recolor otomatis** ke palet game saat dimuat — file asli tak diubah.
- **Sistem cap penghargaan** dengan koleksi tersimpan.

---

## 10. ALAT YANG DIGUNAKAN

| Alat | Peran |
|---|---|
| **HTML5 + CSS3** | Struktur & tampilan (HUD, dialog, panel soal) |
| **JavaScript vanilla** | Seluruh logika game — tanpa framework, tanpa library |
| **Canvas 2D API** | Seluruh grafis digambar prosedural (tanpa file gambar wajib) |
| **Google Fonts** | Press Start 2P & VT323 untuk tampilan retro (ada fallback sistem, tetap jalan offline) |
| **Kenney UI Pack – RPG Expansion** | Elemen UI (CC0 / public domain) |
| **GB Studio Trains Asset Pack (Reakain)** | Interior gerbong & stasiun, sheet kereta 6 frame, emote (direcolor) |
| **Node.js** | Hanya untuk pemeriksaan sintaks saat pengembangan (`node --check`) |
| **ZCode (AI coding agent, model GLM)** | Partner pengembangan: analisis kode, desain fitur, review kualitas, QA statis |

### Peran AI dalam pembuatan

Game ini dibuat **berkolaborasi dengan AI (ZCode — model GLM)** dengan pembagian
kerja yang jelas:

- **Siswa (penulis):** keputusan kreatif, arah desain, pemilihan fitur, dan setiap
  keputusan final.
- **AI:** meninjau kode (menemukan bug — termasuk satu bug pengunci permainan di
  adegan gerbong yang sudah diperbaiki), merancang sistem (font bitmap, skala layar,
  tema stasiun, sistem cap, adegan ending), menulis spesifikasi teknis yang
  diimplementasikan bertahap, dan melakukan pemeriksaan kualitas (uji sintaks,
  audit geometri, verifikasi logika badge).

Semua sistem penting (generator soal, validator jawaban, jaminan matematis)
didesain agar bisa **diverifikasi otomatis** — diuji pada 800 seed dengan
konsistensi komposisi–invers.

### Lama pembuatan

**±4 hari efektif (29 Oktober – 1 November 2026)**, dikembangkan secara iteratif:
inti permainan & mesin soal (hari 1–2), perombakan visual ke pixel art otentik +
adegan gerbong top-down (hari 3), tema stasiun, sistem cap, ending, dan
pembersihan akhir (hari 4).

---

## 11. KELEBIHAN

1. **Materi menyatu dengan mekanik** — komposisi = jalur kereta, invers = membaca
   ulang paket; bukan soal yang ditempel di atas game.
2. **Umpan balik salah yang mengajar** — setiap jawaban salah dijelaskan
   miskonsepsinya, bukan cuma ditandai.
3. **Soal reproducible** — satu kode RUTE untuk satu kelas; guru bisa menyamakan
   soal, siswa bisa membahas ulang di rumah.
4. **Jawaban diperiksa aljabar** — penulisan bebas, kesalahan tetap tertangkap.
5. **Tanpa fail-state** — tidak ada nyawa/timer; siswa tidak pernah "kalah", hanya
   mencoba lagi dengan lembar baru.
6. **Jalan di mana saja** — klik dua kali `index.html`, tanpa internet, tanpa instal;
   grafis digambar prosedural sehingga game tetap utuh tanpa aset.
7. **Pixel art otentik & konsisten** — font bitmap, animasi ber-detak, palet
   terpusat; bukan sekadar gambar yang di-resize kasar.
8. **Layar memenuhi layar apa pun** — skala per piksel buffer dengan letterbox
   seragam, tajam di monitor besar maupun laptop.
9. **Reward berlapis** — ending bervariasi (3 varian), adegan subuh, rapor yang
   bisa diverifikasi gurunya, dan 5 cap koleksi.
10. **Setiap stasiun terasa transit** — lima tema visual berbeda, bukan satu peta
    yang dipakai ulang.

## 12. KEKURANGAN

1. **Belum ada audio sama sekali** — belum ada bunyi kereta, jawaban benar/salah,
   atau musik latar (rencana: WebAudio prosedural, tanpa file).
2. **Progres tidak tersimpan** — refresh halaman mengulang shift dari awal;
   hanya koleksi cap yang tersimpan.
3. **Rapor belum bisa disalin/dicetak** — guru harus memotret layar untuk
   mengumpulkan hasil siswa.
4. **Perpaduan gaya visual** — karakter chibi buatan sendiri bertemu aset Game Boy
   yang flat; sudah disamakan warnanya, tapi gaya gamarnya tetap terasa berbeda.
5. **Satu pemain, satu perangkat** — belum ada mode kelas atau papan skor bersama.
6. **Konten soal terbatas pada fungsi linear** — sesuai kurikulum (komposisi &
   invers), tapi tidak mencakup variasi fungsi lain.
7. **Uji main menyeluruh masih berjalan** — semua pemeriksaan kode lolos, tetapi
   pemainan penuh di berbagai ukuran layar masih terus diuji.
8. **Lisensi aset pihak ketiga sedang diverifikasi** — aset UI sudah CC0; lisensi
   pack interior kereta sedang dicek di halaman sumbernya sebelum disebarluaskan.

---

*Dibuat sebagai media pembelajaran Matematika — SMK Telkom XI PPLG 2.*
*Kode rute hari ini menentukan soalmu. Sampai jumpa di stasiun berikutnya.* 🚉
