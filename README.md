# Prompter Minimal + Footpedal 3 Tombol

Desain sengaja dibuat sesederhana mungkin.

## Home
Hanya daftar lagu.

### Footpedal di Home
- Kiri / Arrow Up = lagu sebelumnya
- Tengah / Space = pilih lagu
- Kanan / Arrow Down = lagu berikutnya

## Halaman Lagu
Hanya ada Home, judul lagu, transpose - / KEY / +, fullscreen, lirik dan chord.

### Footpedal di halaman lagu
- Kiri / Arrow Up = scroll naik
- Tengah / Space = play/pause auto-scroll
- Kanan / Arrow Down = scroll turun

Aplikasi juga menangkap mouse 3 tombol pada area kosong:
- Mouse kiri = kiri
- Mouse tengah = tengah
- Mouse kanan = kanan

Jika pedal bisa diprogram sebagai keyboard HID, mapping terbaik:
ArrowUp, Space, ArrowDown.

## Transpose
- Klik - atau +
- Keyboard - atau +
- Rentang -6 sampai +6 semitone

## Shortcut tambahan
- F = fullscreen
- Esc = kembali ke Home
- [ = auto-scroll lebih lambat
- ] = auto-scroll lebih cepat

## Jalankan
npm install
npm run dev
