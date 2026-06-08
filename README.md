# Japanese Step

Platform belajar bahasa Jepang dengan materi interaktif, latihan ujian, dan bantuan AI.

**Repository:** [github.com/rendr17/Japanese-Step](https://github.com/rendr17/Japanese-Step)

## Fitur

- **Materi belajar** — baca, edit, dan impor materi pembelajaran
- **Kosakata & flashcard** — SRS (spaced repetition) dengan tampilan kana
- **Tabel kana** — referensi hiragana dan katakana
- **Simulasi ujian** — JLPT dan JFT Basic
- **AI tools** — asisten chat, analisis kalimat, generator materi
- **Progress** — pelacakan tujuan harian dan statistik belajar

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/) — auth, database, dan edge functions

## Prasyarat

- Node.js 18+
- npm
- Proyek Supabase (URL dan anon key)

## Setup lokal

```sh
git clone https://github.com/rendr17/Japanese-Step.git
cd Japanese-Step
npm install
cp .env.example .env
```

Isi `.env` dengan kredensial Supabase Anda, lalu jalankan:

```sh
npm run dev
```

Aplikasi berjalan di `http://localhost:5173` (port default Vite).

## Environment variables

Salin `.env.example` ke `.env` dan isi nilainya. File `.env` **tidak** di-commit ke repository.

| Variable | Deskripsi |
| --- | --- |
| `VITE_SUPABASE_URL` | URL proyek Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/public key Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ID proyek Supabase |

Edge functions di `supabase/functions/` membutuhkan secret server-side (`LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, dll.) yang dikonfigurasi di dashboard Supabase, bukan di `.env` frontend.

## Scripts

| Command | Deskripsi |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview build production |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (single run) |

## Struktur proyek

```
src/
  pages/          # Halaman aplikasi
  components/     # UI components
  hooks/          # Custom React hooks
  integrations/   # Supabase client
supabase/
  functions/      # Edge functions (AI, SRS, import, dll.)
  migrations/     # Database migrations
```

## Lisensi

Proyek privat — hak cipta pemilik repository.
