

## Perbaikan Fitur yang Belum Berjalan Maksimal

Berikut adalah daftar masalah yang ditemukan beserta rencana perbaikannya, diurutkan berdasarkan prioritas dan dampak:

---

### 1. Streak Belajar Tidak Pernah Terupdate (Prioritas Tinggi)

**Masalah**: Field `current_streak` dan `longest_streak` di profil selalu bernilai 0 karena tidak ada kode yang memperbarui streak ketika user belajar.

**Solusi**: Membuat database function + trigger yang otomatis menghitung streak setiap kali ada log XP harian baru (`daily_xp_logs`). Streak bertambah jika user belajar hari berturut-turut, reset jika ada gap.

---

### 2. Learning Path Progress Hardcoded 42% (Prioritas Tinggi)

**Masalah**: Widget di dashboard selalu menampilkan 42% — angka placeholder yang tidak terhubung ke data nyata.

**Solusi**: Menghitung progress berdasarkan jumlah kosakata yang dikuasai (mastered) terhadap target per level JLPT. Misalnya N5 butuh ~800 kata, N4 butuh ~1500 kata, dst.

---

### 3. Sidebar Menampilkan "Learner" Hardcoded (Prioritas Sedang)

**Masalah**: Footer sidebar selalu menampilkan nama "Learner" dan "Free Plan" tanpa mengambil data profil pengguna.

**Solusi**: Menggunakan hook `useProfile()` yang sudah ada untuk menampilkan `display_name` dan avatar pengguna di sidebar.

---

### 4. XP Upsert Perlu Unique Constraint (Prioritas Sedang)

**Masalah**: Upsert pada `daily_xp_logs` menggunakan `onConflict: "user_id,date"` tapi kemungkinan belum ada unique constraint, bisa menyebabkan duplikasi data atau error.

**Solusi**: Menambahkan unique constraint pada `(user_id, date)` di tabel `daily_xp_logs` via migrasi database, dan memperbaiki logika upsert agar XP ditambahkan (bukan di-replace).

---

### 5. Pengaturan Tema Tidak Diterapkan (Prioritas Sedang)

**Masalah**: User bisa mengubah tema (Light/Dark/Auto), ukuran font, dan bahasa di Settings, tapi perubahan ini tidak benar-benar diterapkan ke UI.

**Solusi**: Mengintegrasikan `theme_preference` dari profil dengan sistem tema aplikasi (`next-themes`), dan menerapkan class CSS berdasarkan `font_size`.

---

### 6. DailyKanji forwardRef Warning (Prioritas Rendah)

**Masalah**: Console menampilkan warning React karena komponen `DailyKanji` tidak menggunakan `forwardRef`.

**Solusi**: Membungkus komponen dengan `React.forwardRef` atau menghapus ref yang tidak diperlukan.

---

## Detail Teknis

### File yang akan diubah:

| File | Perubahan |
|------|-----------|
| Migrasi SQL baru | Unique constraint pada `daily_xp_logs(user_id, date)`, function + trigger untuk update streak |
| `src/components/layout/AppSidebar.tsx` | Menggunakan `useProfile()` untuk nama + avatar user |
| `src/components/dashboard/LearningPathIndicator.tsx` | Menghitung progress nyata berdasarkan data vocab + SRS |
| `src/hooks/useDailyXP.ts` | Memperbaiki logika upsert XP |
| `src/components/DailyKanji.tsx` | Fix forwardRef warning |
| `src/App.tsx` atau layout root | Menerapkan tema dari profil pengguna |

### Urutan implementasi:
1. Migrasi database (constraint + streak trigger)
2. Fix sidebar nama user
3. Fix Learning Path progress
4. Fix XP upsert
5. Terapkan tema dari settings
6. Fix DailyKanji warning

