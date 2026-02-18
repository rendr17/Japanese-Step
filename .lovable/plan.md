
## Auto-Simpan Kosakata saat "Simpan ke Materi"

### Perubahan
Saat tombol **"Simpan ke Materi"** diklik, kosakata dari hasil generate akan otomatis disimpan ke halaman Kosakata Saya tanpa perlu klik tombol terpisah. Kosakata yang sudah ada (duplikat) akan dilewati.

### Cara Kerja
1. Setelah materi berhasil disimpan ke database, sistem akan mengecek setiap kata di daftar kosakata
2. Untuk setiap kata, cek apakah sudah ada di `vocab_bank` berdasarkan kombinasi **kana + user_id**
3. Jika belum ada, simpan dengan level JLPT sesuai level materi (N5, N4, dst)
4. Jika sudah ada (duplikat), lewati
5. Tampilkan toast: "X kata baru ditambahkan ke kosakata (Y sudah ada)"

### Detail Teknis

**File yang diubah:** `src/pages/MaterialGenerator.tsx`

**Perubahan di `handleSaveToMaterials`:**
- Setelah insert materi berhasil, jalankan loop untuk setiap vocab
- Query `vocab_bank` dengan filter `kana` dan `user_id` untuk cek duplikat
- Insert hanya yang belum ada, dengan field `jlpt_level` diisi dari level materi
- Hapus tombol "Tambah Semua ke Vocab" yang terpisah (karena sudah otomatis)
- Update toast message untuk menampilkan jumlah kata baru vs yang sudah ada

```text
Alur:
Klik "Simpan ke Materi"
  |
  v
Simpan materi ke DB --> Gagal? --> Toast error, stop
  |
  OK
  v
Loop setiap vocab:
  Cek di vocab_bank (kana + user_id)
    |-- Sudah ada --> skip, count duplikat
    |-- Belum ada --> insert dengan jlpt_level
  v
Toast: "Disimpan! X kata baru ditambahkan (Y sudah ada)"
  |
  v
Navigate ke /materials
```

**Tidak ada perubahan database** -- menggunakan tabel `vocab_bank` yang sudah ada.
