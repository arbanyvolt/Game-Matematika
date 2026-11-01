# DESIGN.md — Stasiun Transit

Arah desain untuk game edukasi matematika pixel-art "Stasiun Transit" (fungsi komposisi & invers, kelas XI). Ditulis dari jawaban pemilik proyek: karakter "malam hangat", palet "ungu malam + kuning lampu", gerak "tenang". Tipografi didelegasikan ke perancang dengan alasan tertulis di bawah.

## Identitas

Kamu kurir malam di sebuah stasiun bawah tanah yang sepi tapi aman: keramik ungu, lampu kuning, petugas yang ramah. Game untuk presentasi di depan kelas, dibaca dari jarak jauh, dimainkan dengan santai. Identitas visualnya: **pixel art stasiun malam yang hangat dan teratur**, bukan neon futuristik, bukan Game Boy, bukan kartun.

## Dial

- **ENERGY 2** (hangat dan ramah, tidak berteriak)
- **RHYTHM 1** (layar game: HUD, panel soal, dialog selalu di tempat yang sama; keseragaman adalah keputusan, karena pemain harus tahu persis ke mana melihat saat mengerjakan soal)
- **MOTION 1** (tenang: hover, transisi kecil, feedback pilihan jawaban)

Pengecualian beralasan di luar dial MOTION: efek **teks diketik** pada dialog dan **kereta datang/berjalan**. Keduanya konten cerita, bukan dekorasi UI, dan punya alasan naratif (dialog terasa hidup; kereta harus terlihat melaju).

## Palet (3 inti + 1 aksen, R-29)

| Peran | Warna | Dipakai untuk |
|---|---|---|
| Inti 1 · malam | biru-ungu sangat gelap (`#0a0f1a`, `#0b1322`) | latar layar, HUD, panel gelap |
| Inti 2 · keramik | ungu muda (`#cfc3e0`) | lantai stasiun, permukaan terang, teks terang di panel |
| Inti 3 · kayu hangat | coklat (`#7a5a3a`, panel Kenney brown) | dialog, meja loket, panel kios |
| **Aksen** | kuning lampu (`#ffd24a`) | HANYA momen kunci: chip kode RUTE, prompt `E`, status cap, garis pengaman |

Warna fungsional (bukan dekorasi, terbatas): hijau `#4ade80` untuk sukses/cap sah, merah `#e05563` untuk tiket ditolak. Warna empat jalur f/g/h/k (merah, kuning, ungu, hijau) adalah **data game**, dihitung di luar palet UI.

Alasan: kuning lampu hanya di tempat pemain harus melihat (prompt, rute, pengaman); kalau kuning ada di mana-mana, prompt `E` kehilangan arti. Ungu-biru neon dan gradien ungu-biru dilarang sebagai dekorasi; latar memakai warna malam solid, bukan glow.

## Motif identitas

**Garis pengaman stasiun**: strip kuning-hitam miring (alanya eskalator, tepi peron) dipakai ulang sebagai satu-satunya motif dekoratif: garis tipis di atas layar menu dan tepi peron di canvas. Motif ini datang dari dunia game sendiri, bukan pola stok.

## Tipografi

- **Press Start 2P**: HANYA logo menu dan angka besar HUD (kode ruang, RUTE). Alasan: memberi identitas pixel yang langsung terbaca sebagai "game", tapi font ini sangat lebar dan padat, jadi kalau dipakai untuk kalimat, teks soal matematika jadi sulit dibaca.
- **VT323**: seluruh teks lain (soal, dialog, tabel, tombol). Alasan: bentuknya pixel tetapi lebar hurufnya hemat, cocok untuk soal berisi rumus dan angka; monospace membantu kesejajaran rumus seperti `f(x) = 3x + 1`.
- Inter/Geist/Space Grotesk ditolak: tidak ada karakter pixel, merusak identitas. Monospace estetika terminal ("HOW IT WORKS" ber-tracking lebar) ditolak: label memakai kalimat normal.
- Fallback `monospace` selalu ada agar offline tetap terbaca.

## Tekstur & pola

- Scanline CRT sangat halus (alpha 0.06) di atas canvas dunia. Alasan: menegaskan bahwa dunia adalah layar pixel, bagian dari identitas retro (R-07: pola dengan alasan tertulis).
- Dither 2×2 pada tekstur canvas (garis pengaman, bayangan dinding). Alasan: bahasa rendering pixel asli.
- Tidak ada grid dekoratif, tidak ada glow, tidak ada glassmorphism: overlay dialog memakai tirai gelap solid (blur merusak kesan pixel).

## Gerak

- Hover tombol: terang + tombol turun (gambar varian `pressed`). Alasan: umpan balik tekan, khas game.
- Teks dialog diketik huruf demi huruf. Alasan: naratif (lihat pengecualian di atas).
- Tidak ada pulse/loop tanpa pemicu; elemen dekorasi bergerak hanya yang mewakili dunia (lampu berkedip, penumpang berjalan) dan di-kuantisasi 8fps.
- `prefers-reduced-motion: reduce`: teks dialog langsung penuh, tanpa animasi.

## Cap penghargaan & tema stasiun (Fase 7-9)

- **Cap penghargaan**: stempel bulat pixel prosedural (lingkaran ganda + ikon pixel), warna per cap (kuning/hijau/merah muda/ungu/teal). Alasan: cap adalah **koleksi data game** seperti warna empat jalur, bukan dekorasi UI; warna berbeda membantu anak mengenali cap mana yang baru diraih.
- **Tema stasiun**: Pusat ungu, Timur biru-teal, Selatan hijau, Barat oranye-bata, Kantor abu resmi. Alasan: setiap stasiun transit adalah "level"; warna memberi rasa kemajuan perjalanan tanpa mengubah satu pun geometri gameplay. Aksen kuning lampu tetap jadi satu-satunya aksen di semua stasiun (garis pengaman ikut berganti hue mengikuti tema, tetap berperan sebagai penanda tepi peron).
- **Ending subuh**: palet oranye-ungu dipakai sekali di akhir. Alasan: kontras emosional antara shift malam dan pulang; satu-satunya momen hangat-oranye sehingga terasa sebagai penutup.
