

## Analisis Masalah

Masalah bukan di kode UI, melainkan di **data database**. Banyak entri di tabel `vocab_bank` memiliki kolom `kana` yang isinya sama dengan `kanji` (bukan kana sebenarnya).

Contoh:
- 彼 → kana: `彼` (seharusnya `かれ`)
- 私 → kana: `私` (seharusnya `わたし`)
- 使う → kana: `使う` (seharusnya `つかう`)

Ditemukan banyak baris seperti ini. Tombol "Tampilkan kana" sudah menampilkan `card.kana`, tapi isi `kana` di database salah.

## Solusi

### 1. Edge Function: Bulk Fix Kana
Membuat edge function `fix-vocab-kana` yang:
- Mengambil semua vocab di mana `kana = kanji` atau kana mengandung karakter kanji
- Menggunakan AI (Gemini Flash) untuk menghasilkan reading kana yang benar
- Memperbarui kolom `kana` di database

### 2. UI: Tombol "Perbaiki Kana" di Halaman Flashcards
- Menambahkan tombol di halaman Flashcards untuk menjalankan proses perbaikan kana secara batch
- Menampilkan progress dan jumlah yang diperbaiki

### 3. Perbaikan Saat Import
- Mengupdate logika import agar memvalidasi kolom kana — jika kana sama dengan kanji, tandai perlu diperbaiki

### Detail Teknis

**File baru: `supabase/functions/fix-vocab-kana/index.ts`**
- Query vocab_bank di mana kana mengandung karakter kanji (regex Unicode range \u4E00-\u9FFF)
- Kirim batch ke Gemini Flash untuk mendapatkan reading kana yang benar
- Update hasilnya ke database

**File: `src/pages/Flashcards.tsx`**
- Tambahkan tombol "Perbaiki Kana Otomatis" yang memanggil edge function tersebut
- Tampilkan toast dengan jumlah entri yang berhasil diperbaiki

**File: `src/components/flashcard/FlashcardCard.tsx`**
- Tambahkan deteksi: jika `card.kana` mengandung kanji (bukan kana murni), tampilkan pesan "Kana belum tersedia" sebagai fallback agar user tahu datanya perlu diperbaiki

