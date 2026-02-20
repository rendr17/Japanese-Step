
# Analisis & Rekomendasi Fitur untuk Nihongo-Step

Setelah memeriksa seluruh kodebase, berikut temuan dan rekomendasi fitur berdasarkan prioritas:

---

## Masalah yang Perlu Diperbaiki (Bug / Data Palsu)

### 1. XP Harian Hardcoded (Dashboard)
Di `DailyGoalCard.tsx`, nilai XP saat ini (`currentXP = 25`) dikodekan secara manual dan tidak terhubung ke database. Artinya progress harian tidak pernah berubah meski user aktif belajar.

**Solusi:** Buat tabel `daily_xp_logs` di database untuk melacak XP per hari per user, lalu sambungkan ke kartu ini.

### 2. Riwayat Ujian Palsu (Exam Page)
Di `ExamSimulasi.tsx`, data `pastResults` dan `scoreProgression` adalah array hardcoded statis, bukan data nyata dari database. Ujian memang ada di `exam_results`, tapi tidak ditampilkan di sini.

**Solusi:** Query tabel `exam_results` yang sudah ada dan tampilkan hasil ujian sesungguhnya di halaman ini.

### 3. Badge SRS di Sidebar Hardcoded
Di `AppSidebar.tsx`, badge Flashcards menampilkan angka `3` yang hardcoded:
```
{ icon: Layers, label: "Flashcards (SRS)", path: "/flashcards", badge: 3 }
```
**Solusi:** Buat hook ringan yang query jumlah SRS yang jatuh tempo dan tampilkan angka real-time.

### 4. Statistik "Minggu Ini" Kosong
Di `StatsOverview.tsx`, kartu "Minggu Ini" selalu `0 menit` karena tidak ada tracking waktu belajar sama sekali.

**Solusi:** Buat tabel `study_sessions` untuk mencatat waktu belajar, dan tampilkan total waktu mingguan.

---

## Fitur Baru yang Direkomendasikan (Berdasarkan Prioritas)

### Prioritas Tinggi

#### A. Sistem Progress / Halaman "/progress" (Missing Route)
Sidebar menampilkan menu "Progress" dengan ikon `BarChart3` yang menuju `/progress`, tapi halaman tersebut **belum ada** — mengakibatkan 404. Ini harus segera dibuat.

Konten yang perlu ada:
- Grafik SRS heatmap (kartu per hari, mirip GitHub contributions)
- Grafik akurasi review flashcard dari waktu ke waktu
- Breakdown kosakata per level JLPT
- Statistik streak belajar harian

#### B. Fitur Kuis Kana (di halaman /kana)
Halaman tabel kana sudah bagus tapi bersifat pasif. Tambahkan tab "Kuis" yang:
- Menampilkan karakter kana acak (Hiragana atau Katakana)
- User harus mengetik romaji yang benar
- Ada skor, timer, dan feedback visual

#### C. Streak Belajar Harian
Tidak ada sistem streak saat ini. Tambahkan:
- Pelacakan hari berturut-turut user belajar
- Tampilkan streak di WelcomeSection (misal: 🔥 7 hari berturut-turut)
- Notifikasi jika streak hampir putus

### Prioritas Menengah

#### D. Audio TTS di Kosakata & Flashcard
Banyak kartu tidak memiliki `audio_url`. Bisa menggunakan **Web Speech API** (`speechSynthesis`) untuk TTS Japanese secara gratis tanpa API key, dan tombolnya sudah ada di `FlashcardCard.tsx`.

#### E. Filter Tag di Halaman Kosakata
Saat ini hanya ada filter Level dan Sort. Menambahkan filter berdasarkan tag (yang sudah ada di database) akan memudahkan user mengelola kosakata berdasarkan topik/materi.

#### F. Import CSV Kosakata
Halaman sudah punya Export CSV, tapi belum ada Import CSV. Ini berguna untuk user yang ingin memindahkan kosakata dari Anki atau Quizlet.

### Prioritas Rendah

#### G. Dark Mode yang Fungsional
Setting tema sudah ada di Settings, tapi tidak benar-benar mengubah tema aplikasi karena tidak terhubung ke `next-themes` atau CSS variable toggling.

#### H. Notifikasi di Browser (Push Notification)
Setting notifikasi sudah ada di UI (`srs_reminders`, `email_reminders`) tapi tidak berfungsi karena tidak ada backend scheduler.

---

## Ringkasan Rencana Implementasi (jika disetujui)

Saya rekomendasikan memulai dari yang paling berdampak:

```text
FASE 1 (Perbaikan Bug):
├── Sambungkan badge SRS sidebar ke data real
├── Tampilkan riwayat ujian nyata di halaman Exam
└── Perbaiki XP harian

FASE 2 (Fitur Missing):
├── Buat halaman /progress yang hilang
└── Tambah kuis interaktif di halaman /kana

FASE 3 (Enhancement):
├── TTS audio menggunakan Web Speech API
├── Filter tag di kosakata
└── Import CSV kosakata
```

Mana yang ingin kamu mulai kerjakan?
