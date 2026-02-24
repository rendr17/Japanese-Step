

## Perbaikan Progress Learning Path dari Hardcoded 42% ke Data Nyata

### Masalah
Baris 32 di `LearningPathIndicator.tsx` menggunakan nilai tetap `const progressPct = 42` yang tidak terhubung ke data apapun.

### Solusi
Menghitung progress berdasarkan jumlah kosakata yang sudah dikuasai (mastered via SRS) dibandingkan target kosakata per level JLPT pengguna.

**Target kosakata per level:**
| Level | Target |
|-------|--------|
| N5    | 800    |
| N4    | 1.500  |
| N3    | 3.750  |
| N2    | 6.000  |
| N1    | 10.000 |

**Rumus:** `progress = Math.min(100, Math.round((mastered / target) * 100))`

### Detail Teknis

**File: `src/hooks/useDashboardData.ts`**
- Menambahkan hook baru `useLearningProgress()` yang:
  - Mengambil `default_jlpt_level` dari profil user
  - Menghitung jumlah vocab mastered dari `srs_logs` (status = 'mastered')
  - Menghitung jumlah total vocab di `vocab_bank`
  - Mengembalikan `{ mastered, total, target, progressPct, level }`

**File: `src/components/dashboard/LearningPathIndicator.tsx`**
- Mengganti `const progressPct = 42` dengan data dari `useLearningProgress()`
- Menampilkan label progress yang lebih informatif, misalnya: "142 / 800 kata dikuasai"
- Menampilkan progress bar untuk kedua jalur (JLPT dan JFT), bukan hanya JLPT
- Menampilkan level aktif user (misal "N4") di bawah label jalur

