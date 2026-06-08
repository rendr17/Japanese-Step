# Nihongo Step

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=111)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=fff)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-3FCF8E?logo=supabase&logoColor=111)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Private-lightgrey)](#lisensi)

Nihongo Step adalah platform belajar bahasa Jepang berbasis web untuk belajar terarah, latihan ujian, flashcard SRS, manajemen materi, dan bantuan AI. Aplikasi ini dirancang untuk membantu pelajar membangun rutinitas belajar dari materi dasar, kosakata, kana, grammar, sampai simulasi JLPT dan JFT Basic.


## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Demo dan Penggunaan](#demo-dan-penggunaan)
- [Tech Stack](#tech-stack)
- [Prasyarat](#prasyarat)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Supabase dan Edge Functions](#supabase-dan-edge-functions)
- [Scripts](#scripts)
- [Struktur Proyek](#struktur-proyek)
- [Testing dan Build](#testing-dan-build)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)
- [Lisensi](#lisensi)

## Fitur Utama

- **Dashboard belajar personal** - ringkasan progres, target harian, misi, achievement, rekomendasi belajar, dan review yang jatuh tempo.
- **Learning path** - alur belajar terstruktur dengan progres materi, rekomendasi topik, dan konten starter untuk level awal sampai N4.
- **Practice Hub** - sesi latihan interaktif untuk memperkuat kosakata, grammar, kanji, dan area lemah.
- **Materi belajar** - baca, edit, impor, dan generate materi dengan preview HTML yang mendukung konten kaya.
- **Quiz materi** - latihan singkat dari materi belajar, termasuk integrasi edge function untuk generate quiz.
- **Kosakata dan flashcard** - deck flashcard, SRS review, tracking jawaban, dan tampilan kana/furigana.
- **Furigana otomatis** - enrichment teks Jepang memakai Kuroshiro/Kuromoji, dictionary lokal di `public/dict`, dan utilitas Tiptap/ruby HTML.
- **Simulasi ujian** - JLPT dan JFT Basic dengan setup sesi, sesi full-screen, hasil ujian, dan seed soal.
- **AI tools** - asisten chat, analisis kalimat, generator materi, import materi, generate soal, dan auto-fill kosakata.
- **Progress dan gamification** - XP harian, statistik belajar, weak-area tracking, review packs, dan reminder belajar.

## Demo dan Penggunaan

Setelah aplikasi berjalan, buka `http://localhost:8080`.

Alur penggunaan utama:

1. Register atau login.
2. Selesaikan onboarding untuk memilih preferensi belajar.
3. Buka dashboard untuk melihat target harian, rekomendasi, dan review jatuh tempo.
4. Gunakan halaman `Learn` untuk mengikuti learning path.
5. Gunakan halaman `Practice` untuk latihan interaktif.
6. Tambahkan atau impor materi di halaman `Materials`.
7. Review kosakata lewat `Flashcards`.
8. Jalankan simulasi ujian JLPT atau JFT Basic dari menu `Exam`.

Route penting:

| Route | Fungsi |
| --- | --- |
| `/` | Dashboard utama |
| `/learn` | Learning path |
| `/practice` | Practice Hub |
| `/materials` | Daftar materi belajar |
| `/materials/import` | Import materi |
| `/flashcards` | Flashcard dan SRS review |
| `/vocabulary` | Kosakata |
| `/kana` | Tabel hiragana dan katakana |
| `/exam` | Simulasi ujian |
| `/ai-assistant` | AI assistant |
| `/ai-tools/analyzer` | Analisis kalimat Jepang |
| `/ai-tools/generate` | Generator materi |
| `/progress` | Statistik progres |
| `/settings` | Pengaturan akun |

## Tech Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [React Router](https://reactrouter.com/) untuk routing aplikasi
- [TanStack Query](https://tanstack.com/query) untuk data fetching/cache
- [Tiptap](https://tiptap.dev/) untuk editor dan render konten kaya
- [Kuroshiro](https://github.com/hexenq/kuroshiro) + [Kuromoji](https://github.com/takuyaa/kuromoji.js) untuk furigana
- [Supabase](https://supabase.com/) untuk auth, database, migrations, dan edge functions
- [Vitest](https://vitest.dev/) untuk unit test

## Prasyarat

- Node.js 18+
- npm
- Proyek Supabase
- Google Gemini API key untuk edge functions AI

## Instalasi

Clone repository:

```sh
git clone https://github.com/rendr17/Japanese-Step.git
cd Japanese-Step
```

Install dependency:

```sh
npm install
```

Siapkan environment file:

```sh
cp .env.example .env
```

Jalankan development server:

```sh
npm run dev
```

Aplikasi berjalan di `http://localhost:8080`.

## Konfigurasi

Isi `.env` dengan kredensial Supabase:

```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_URL=https://your-project-id.supabase.co
```

File `.env` tidak di-commit ke repository. Gunakan `.env.example` sebagai template konfigurasi lokal.

### Google OAuth

1. Buat OAuth Client ID di [Google Cloud Console](https://console.cloud.google.com/).
2. Di Supabase Dashboard -> Authentication -> Providers -> Google, aktifkan provider.
3. Isi Client ID dan Client Secret.
4. Tambahkan redirect URL: `https://<project-id>.supabase.co/auth/v1/callback`.
5. Untuk dev lokal, tambahkan `http://localhost:8080` di Site URL atau Redirect URLs.

### Dictionary Furigana

Proyek memakai `kuromoji`, `kuroshiro`, dan `kuroshiro-analyzer-kuromoji` untuk enrichment furigana.

Dictionary runtime tersedia di `public/dict`. Script `postinstall` menjalankan `scripts/copy-kuromoji-dict.mjs` untuk menyalin dictionary dari `node_modules/kuromoji/dict` ke `public/dict` setelah install.

## Supabase dan Edge Functions

Folder `supabase/migrations/` berisi skema database, tabel pembelajaran interaktif, seed soal ujian, starter content, dan kurikulum N4.

Secret server-side dikonfigurasi di dashboard Supabase, bukan di `.env` frontend.

| Secret | Deskripsi |
| --- | --- |
| `GEMINI_API_KEY` | API key Google Gemini dari [AI Studio](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | Opsional, default `gemini-2.0-flash` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key untuk edge functions |

### Edge Functions

| Function | Fungsi |
| --- | --- |
| `ai-chat` | Chat assistant untuk belajar bahasa Jepang |
| `analyze-sentence` | Analisis kalimat Jepang |
| `fix-vocab-kana` | Perbaikan kana pada data kosakata |
| `generate-lesson-quiz` | Generate quiz dari materi belajar |
| `generate-material` | Generate materi belajar dengan AI |
| `generate-questions` | Generate soal latihan atau ujian |
| `import-material` | Import dan parsing materi |
| `process-srs-review` | Proses hasil review flashcard SRS |
| `study-reminders` | Reminder belajar |
| `vocab-ai-fill` | Auto-fill metadata kosakata |

## Scripts

| Command | Deskripsi |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview build production |
| `npm run lint` | ESLint |
| `npm run test` | Vitest single run |
| `npm run test:watch` | Vitest watch mode |
| `npm run postinstall` | Salin Kuromoji dictionary ke `public/dict` |

## Struktur Proyek

```text
src/
  assets/         # Ilustrasi dan aset React
  components/     # UI, layout, dashboard, material, flashcard, practice
  contexts/       # Auth context
  hooks/          # Custom React hooks untuk data dan flow belajar
  integrations/   # Supabase client dan generated types
  lib/            # Furigana, Tiptap HTML, gamification, utilities
  pages/          # Route pages aplikasi
  test/           # Test setup dan contoh test
  types/          # Type declaration tambahan
public/
  dict/           # Kuromoji dictionary untuk furigana
supabase/
  functions/      # Edge functions
  migrations/     # Database migrations dan seed content
scripts/
  copy-kuromoji-dict.mjs
```

## Testing dan Build

Jalankan test:

```sh
npm run test
```

Jalankan build production:

```sh
npm run build
```

Catatan: build dapat menampilkan warning ukuran chunk besar atau warning kompatibilitas browser dari dependency Kuromoji. Selama command selesai sukses, bundle tetap dibuat di `dist/`.

## Troubleshooting

| Masalah | Solusi |
| --- | --- |
| Environment Supabase kosong | Pastikan `.env` sudah dibuat dari `.env.example` dan semua value `VITE_SUPABASE_*` terisi |
| Login Google gagal redirect | Periksa Google provider di Supabase dan pastikan redirect URL sudah benar |
| Furigana tidak muncul | Jalankan `npm install` atau `npm run postinstall`, lalu pastikan file dictionary ada di `public/dict` |
| Edge function AI gagal | Pastikan `GEMINI_API_KEY` dan `SUPABASE_SERVICE_ROLE_KEY` sudah diset di Supabase secrets |
| Build menampilkan warning chunk besar | Warning ini tidak selalu fatal; pertimbangkan code splitting jika bundle perlu dioptimalkan |

## Roadmap

- Tambah screenshot dan demo deployment publik.
- Perluas konten kurikulum untuk N3 ke atas.
- Tambah mode latihan grammar dan listening yang lebih detail.
- Optimasi bundle dengan dynamic import/manual chunks.
- Tambah dokumentasi deployment Supabase lengkap.
- Tambah coverage test untuk hooks dan edge-case SRS.

## Contributing

Repository ini saat ini bersifat privat. Jika kontribusi dibuka, gunakan alur berikut:

1. Buat branch dari `main`.
2. Jalankan `npm run test` dan `npm run build` sebelum submit.
3. Buat pull request dengan ringkasan perubahan, alasan perubahan, dan catatan testing.
4. Hindari commit secret, `.env`, atau data pribadi.

Standar commit yang disarankan:

```text
feat: add new learning flow
fix: repair furigana rendering
docs: update setup guide
```

## Acknowledgements

- React, Vite, dan TypeScript untuk fondasi frontend.
- Supabase untuk auth, database, dan edge functions.
- shadcn/ui dan Radix UI untuk komponen UI.
- Kuroshiro dan Kuromoji untuk pemrosesan teks Jepang.
- Google Gemini untuk fitur AI assistant dan generation.

## Lisensi

Proyek privat - hak cipta pemilik repository.
