# Nihongo Step

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

Aplikasi berjalan di `http://localhost:8080`.

## Environment variables

Salin `.env.example` ke `.env` dan isi nilainya. File `.env` **tidak** di-commit ke repository.

| Variable | Deskripsi |
| --- | --- |
| `VITE_SUPABASE_URL` | URL proyek Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/public key Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ID proyek Supabase |

Edge functions di `supabase/functions/` membutuhkan secret server-side yang dikonfigurasi di dashboard Supabase, bukan di `.env` frontend.

| Secret | Deskripsi |
| --- | --- |
| `GEMINI_API_KEY` | API key Google Gemini dari [AI Studio](https://aistudio.google.com/apikey) (tier gratis tersedia) |
| `GEMINI_MODEL` | Opsional — default `gemini-2.0-flash` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key untuk edge functions |

### Google OAuth (login dengan Google)

1. Buat OAuth Client ID di [Google Cloud Console](https://console.cloud.google.com/)
2. Di Supabase Dashboard → Authentication → Providers → Google: aktifkan dan isi Client ID & Secret
3. Tambahkan redirect URL: `https://<project-id>.supabase.co/auth/v1/callback`
4. Untuk dev lokal, tambahkan `http://localhost:8080` di Site URL / Redirect URLs

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
