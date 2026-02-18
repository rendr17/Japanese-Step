

## Tampilkan Kosakata, Grammar, dan Catatan Budaya di Detail Materi

### Masalah Saat Ini
Ketika materi di-generate oleh AI, data kosakata, catatan grammar, dan catatan budaya hanya ditampilkan di halaman Generator tetapi **tidak disimpan** ke database. Sehingga saat membuka materi yang sudah disimpan, data tersebut hilang.

### Rencana Implementasi

#### 1. Tambah Kolom Baru di Database
Menambahkan 3 kolom baru pada tabel `materials`:
- `vocabulary` (JSONB) -- array of {kanji, kana, meaning}
- `grammar_notes` (JSONB) -- array of {pattern, explanation}
- `cultural_note` (TEXT) -- catatan budaya

#### 2. Update Proses Simpan di MaterialGenerator
Saat klik "Simpan ke Materi", data vocabulary, grammar_notes, dan cultural_note ikut disimpan ke kolom baru.

#### 3. Tampilkan di Halaman MaterialDetail
Setelah konten utama, tampilkan 3 section tambahan:
- **Kosakata** -- tabel dengan kanji, kana, arti, dan tombol "Simpan Semua ke Kosakata Saya"
- **Catatan Grammar** -- daftar pola grammar dengan penjelasan (collapsible)
- **Catatan Budaya** -- paragraf informatif

#### 4. Simpan Kosakata ke Halaman Vocabulary
Tombol "Simpan Semua ke Kosakata Saya" akan menyimpan semua kosakata dari materi ke tabel `vocab_bank` sekaligus dengan level JLPT dari materi tersebut (misal N5, N4, dst).

### Detail Teknis

**Migration SQL:**
```sql
ALTER TABLE materials
  ADD COLUMN vocabulary jsonb DEFAULT '[]',
  ADD COLUMN grammar_notes jsonb DEFAULT '[]',
  ADD COLUMN cultural_note text DEFAULT '';
```

**File yang diubah:**
- `src/pages/MaterialGenerator.tsx` -- tambah vocabulary, grammar_notes, cultural_note ke payload insert
- `src/pages/MaterialDetail.tsx` -- tampilkan 3 section baru + tombol simpan vocab dengan level
- `src/hooks/useMaterialEditor.ts` -- tambah field baru di save payload (opsional, untuk editor manual)

**Alur Simpan Kosakata:**
1. User buka materi yang sudah disimpan
2. Di bawah konten, terlihat daftar kosakata
3. Klik "Simpan Semua ke Kosakata Saya"
4. Setiap kata disimpan ke `vocab_bank` dengan `jlpt_level` sesuai level materi (N5/N4/N3/N2/N1)
5. Toast konfirmasi muncul

