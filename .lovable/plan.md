

## Tambah Terjemahan Indonesia + Tampilkan Kosakata/Grammar/Budaya di Detail Materi

### Ringkasan
1. Tambah kolom baru di database untuk menyimpan vocabulary, grammar_notes, cultural_note, dan translation
2. Update edge function AI agar juga generate terjemahan bahasa Indonesia
3. Update proses simpan di MaterialGenerator agar menyimpan semua data tambahan
4. Tampilkan semua data di halaman MaterialDetail dengan tombol toggle untuk terjemahan

### 1. Database Migration
Tambah 4 kolom baru pada tabel `materials`:

```sql
ALTER TABLE materials
  ADD COLUMN vocabulary jsonb DEFAULT '[]',
  ADD COLUMN grammar_notes jsonb DEFAULT '[]',
  ADD COLUMN cultural_note text DEFAULT '',
  ADD COLUMN translation text DEFAULT '';
```

### 2. Update Edge Function (generate-material)
Tambah field `translation` di tool schema agar AI juga menghasilkan terjemahan bahasa Indonesia dari konten utama.

```text
translation: { type: "string", description: "Full Indonesian translation of the content" }
```

Tambahkan juga instruksi di prompt: "Sertakan terjemahan lengkap dalam bahasa Indonesia."

### 3. Update MaterialGenerator.tsx (handleSaveToMaterials)
Saat simpan materi, sertakan data tambahan ke payload insert:

```text
vocabulary: result.vocabulary,
grammar_notes: result.grammar_notes,
cultural_note: result.cultural_note,
translation: result.translation ?? "",
```

### 4. Update MaterialDetail.tsx
Tambahkan di bawah konten utama:

**Tombol Terjemahan Indonesia**
- Tombol "Tampilkan Terjemahan" di bawah konten
- Klik untuk toggle menampilkan/menyembunyikan terjemahan
- Terjemahan ditampilkan dalam box dengan background berbeda

**Section Kosakata**
- Tabel dengan kolom: Kanji, Kana, Arti
- Hanya muncul jika data vocabulary ada

**Section Catatan Grammar**
- Daftar collapsible dengan pattern dan penjelasan

**Section Catatan Budaya**
- Paragraf informatif, hanya muncul jika ada data

### Detail Teknis

**File yang diubah:**
- `supabase/functions/generate-material/index.ts` -- tambah field translation di tool schema + prompt
- `src/pages/MaterialGenerator.tsx` -- tambah vocabulary, grammar_notes, cultural_note, translation ke payload insert
- `src/pages/MaterialDetail.tsx` -- tampilkan 4 section baru (terjemahan toggle, kosakata, grammar, budaya)

**Alur UI di MaterialDetail:**

```text
[Konten Jepang]
     |
[Tombol: 🇮🇩 Tampilkan Terjemahan]
     | (klik)
     v
[Box terjemahan bahasa Indonesia - bisa di-hide lagi]
     |
[Section: Kosakata - tabel kanji/kana/arti]
     |
[Section: Catatan Grammar - collapsible]
     |
[Section: Catatan Budaya - paragraf]
     |
[Materi Terkait]
```

