

## Tampilkan Kosakata, Catatan Grammar, dan Catatan Budaya di Halaman Detail Materi

### Masalah
Saat ini, ketika materi di-generate oleh AI, data kosakata, catatan grammar, dan catatan budaya hanya ditampilkan di halaman generator. Ketika materi disimpan ke database, hanya konten utama (HTML) yang tersimpan. Data tambahan tersebut hilang dan tidak muncul di halaman detail materi.

### Solusi

#### 1. Tambah kolom baru di tabel `materials`
Tambahkan 3 kolom baru:
- `vocabulary` (JSONB, nullable) - menyimpan array kosakata `[{kanji, kana, meaning}]`
- `grammar_notes` (JSONB, nullable) - menyimpan array catatan grammar `[{pattern, explanation}]`
- `cultural_note` (TEXT, nullable) - menyimpan catatan budaya

#### 2. Update proses penyimpanan di MaterialGenerator
Saat menyimpan materi, ikut sertakan data `vocabulary`, `grammar_notes`, dan `cultural_note` ke dalam insert query.

#### 3. Tampilkan di MaterialDetail
Setelah konten utama, tambahkan 3 bagian baru:
- **Kosakata** - Tabel dengan kolom Kanji, Kana, Arti (sama seperti tampilan di generator)
- **Catatan Grammar** - Collapsible section dengan pola grammar dan penjelasannya
- **Catatan Budaya** - Card sederhana dengan teks catatan budaya

### Detail Teknis

**Migration SQL:**
```text
ALTER TABLE materials
  ADD COLUMN vocabulary jsonb DEFAULT NULL,
  ADD COLUMN grammar_notes jsonb DEFAULT NULL,
  ADD COLUMN cultural_note text DEFAULT NULL;
```

**MaterialGenerator.tsx** - Update insert query untuk menyertakan 3 kolom baru.

**MaterialDetail.tsx** - Tambahkan 3 section baru setelah konten utama:
- Tabel kosakata (jika ada data)
- Collapsible catatan grammar (jika ada data)
- Card catatan budaya (jika ada data)

Desain mengikuti pola yang sudah ada di MaterialGenerator (zen-card, tabel, collapsible).
