

## Update Target Karakter di Edge Function

### Masalah
Label di frontend sudah diubah ke ~700/~1400/~2000 karakter, tetapi edge function `generate-material` masih menggunakan target lama (100/300/500 karakter). Selain itu, perlu menambahkan `max_tokens` agar output AI tidak terpotong.

### Perubahan

**File: `supabase/functions/generate-material/index.ts`**

1. **Ubah `charTarget`** (baris 23):
   - `short`: 100 --> 700
   - `medium`: 300 --> 1400
   - `long`: 500 --> 2000

2. **Tambah `max_tokens: 8192`** di body request ke AI gateway agar konten panjang tidak terpotong di tengah jalan.

### Detail Teknis

```text
// Sebelum:
const charTarget = length === "short" ? 100 : length === "long" ? 500 : 300;

// Sesudah:
const charTarget = length === "short" ? 700 : length === "long" ? 2000 : 1400;
```

Dan di body fetch AI gateway, tambahkan:
```text
max_tokens: 8192,
```

Tidak ada perubahan file lain yang diperlukan.
