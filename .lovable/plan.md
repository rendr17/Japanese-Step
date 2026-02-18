

## Fitur Import Materi dari File

Fitur ini memungkinkan user mengimpor materi belajar dari file (PDF/teks) atau paste text, lalu AI menganalisis dan menyusun konten menjadi materi terstruktur yang rapi. User bisa mereview, mengedit, split per bab, memilih bagian yang disimpan, dan mengekstrak kosakata.

### Arsitektur Fitur

Fitur ini dibangun sebagai wizard multi-step di satu halaman `/materials/import` dengan 5 tahap:

```text
[Input] -> [Analisis AI] -> [Preview & Edit] -> [Split & Pilih] -> [Simpan]
```

---

### 1. Database Migration

Tambah tabel `import_history` untuk menyimpan riwayat import:

```text
CREATE TABLE import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  source_type TEXT NOT NULL,        -- 'upload', 'paste', 'scan'
  source_category TEXT NOT NULL,    -- 'textbook', 'article', 'dialogue', 'notes'
  template TEXT,                    -- 'minna_no_nihongo', null
  total_materials INTEGER DEFAULT 0,
  total_vocab INTEGER DEFAULT 0,
  settings JSONB,                   -- simpan setting import untuk re-import
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tambah kolom source_import_id di materials
ALTER TABLE materials ADD COLUMN source_import_id UUID REFERENCES import_history(id) DEFAULT NULL;

-- RLS policies
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own imports" ON import_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 2. Edge Function: `import-material`

Buat edge function baru `supabase/functions/import-material/index.ts` yang:
- Menerima teks mentah (dari file atau paste)
- Menerima opsi: source_category, template, language, level, split_mode
- Mengirim ke AI Gateway (Lovable AI, model `google/gemini-3-flash-preview`) untuk:
  - Mendeteksi struktur (bab, subjudul, kosakata, grammar, dialog)
  - Menghasilkan ringkasan
  - Mengekstrak kosakata (kanji, kana, meaning, level)
  - Mengekstrak pola grammar
  - Membuat catatan budaya
  - Menghasilkan terjemahan Indonesia
  - Jika template "Minna no Nihongo", auto-map ke section: Bunkei, Reibun, Kaiwa, Kotoba, Renshuu, Mondai
- Return array sections yang siap ditampilkan di preview

### 3. Halaman Import (`src/pages/MaterialImport.tsx`)

Wizard multi-step dengan state management lokal:

**Step 1 - Input**
- 3 tab: Upload File | Paste Text | Foto/Scan
- Upload: accept `.pdf, .txt, .doc, .docx` (gunakan `document--parse_document` di edge function / kirim sebagai teks)
  - Karena edge function tidak bisa parse PDF langsung, file di-parse client-side: untuk `.txt` baca langsung, untuk PDF tampilkan info bahwa user perlu copy-paste teksnya
- Paste: textarea besar
- Pilihan metadata:
  - Jenis sumber (dropdown): Buku pelajaran, Artikel, Dialog, Catatan pribadi
  - Template (dropdown, opsional): Minna no Nihongo, (kosong)
  - Bahasa penjelasan: Indonesia / English
  - Target jalur: JLPT / JFT
  - Level: N5-N1 (opsional)

**Step 2 - Analisis & Preview**
- Panggil edge function `import-material`
- Tampilkan loading skeleton
- Hasil: judul auto, ringkasan, sections, kosakata, grammar, catatan budaya
- Setiap section bisa diedit (judul, konten) via inline editing
- Toggle: "Simpan isi lengkap" (OFF) vs "Simpan ringkasan saja" (ON)
- Jika "isi lengkap" ON, tampilkan reminder hak cipta

**Step 3 - Split & Pilih**
- Pilihan split mode: 1 materi, per Bab, per Subjudul, per panjang
- Tampilkan daftar hasil split dengan checkbox
- Per item: rename judul, pilih kategori (Grammar/Reading/Conversation/Vocabulary), auto-tags
- User bisa uncheck bagian yang tidak mau disimpan

**Step 4 - Ekstrak Kosakata**
- Panel kosakata yang terdeteksi (tabel)
- Checkbox per kata untuk pilih mana yang disimpan
- Edit kanji/kana/arti inline
- Tombol: "Simpan ke Kosakata Saya" dan "Simpan + Buat Flashcard SRS"

**Step 5 - Simpan & Selesai**
- Tombol "Simpan Materi"
- Progress bar saat menyimpan batch
- Setelah selesai: tampilkan ringkasan (X materi, Y kosakata)
- Tombol: "Buka materi pertama", "Lihat semua hasil import", "Ekstrak kosakata"

### 4. Tombol "Rapikan Format"

Di Step 2 preview, tambahkan tombol:
- "Rapikan Format" - minta AI membersihkan format (spasi, numbering, bullet)
- Toggle "Tampilkan furigana otomatis"
- Toggle "Bahasa penjelasan: Indonesia / English"

### 5. Update Navigasi

- **AppSidebar.tsx**: Tambah sub-item "Import Materi" di bawah "Materi Belajar" (atau bisa jadi item terpisah)
- **Materials.tsx**: Tambah tombol "Import dari File" di samping "Tambah Materi"
- **App.tsx**: Tambah route `/materials/import`

### 6. Halaman Riwayat Import

Tambahkan section di halaman import atau sebagai tab terpisah:
- Daftar file yang pernah diimport
- Total materi & kosakata per import
- Aksi: "Import ulang" (load settings lama), "Hapus hasil import" (dengan konfirmasi)

---

### Detail Teknis

**File yang akan dibuat:**
- `supabase/functions/import-material/index.ts` - Edge function untuk analisis AI
- `src/pages/MaterialImport.tsx` - Halaman wizard import (komponen utama)
- `src/components/import/ImportInputStep.tsx` - Step 1: input file/teks
- `src/components/import/ImportPreviewStep.tsx` - Step 2: preview & edit
- `src/components/import/ImportSplitStep.tsx` - Step 3: split & pilih
- `src/components/import/ImportVocabStep.tsx` - Step 4: ekstrak kosakata
- `src/components/import/ImportCompleteStep.tsx` - Step 5: selesai
- `src/hooks/useImportMaterial.ts` - Hook untuk state management & API calls

**File yang akan diubah:**
- `supabase/config.toml` - Tambah config function `import-material`
- `src/App.tsx` - Tambah route `/materials/import`
- `src/components/layout/AppSidebar.tsx` - Tambah menu "Import Materi"
- `src/pages/Materials.tsx` - Tambah tombol "Import dari File"
- Database migration untuk tabel `import_history` dan kolom `source_import_id`

**Batasan file upload:**
- Teks dari file dibaca client-side (FileReader API)
- Untuk PDF, user disarankan copy-paste teks karena parsing PDF di browser terbatas
- Maksimal ~50.000 karakter per analisis (limit AI context)

**Hak cipta:**
- Default mode: simpan ringkasan/catatan belajar saja (bukan konten penuh)
- Toggle eksplisit dengan disclaimer jika user ingin simpan konten penuh
- Konten disimpan di akun user pribadi, tidak dipublikasikan

