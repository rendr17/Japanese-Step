
# Perbaikan Import File Anki (.apkg) — WASM Loading Error

## Masalah

Saat user meng-upload file `.apkg`, aplikasi menggunakan library `sql.js` untuk membaca database SQLite di dalamnya. `sql.js` membutuhkan file WebAssembly (`.wasm`) yang diunduh secara terpisah.

Kode saat ini mengambil file WASM dari CDN eksternal `https://sql.js.org/dist/`:

```ts
// AnkiImportDialog.tsx — baris 70-72
const SQL = await initSqlJs({
  locateFile: (f: string) => `https://sql.js.org/dist/${f}`,
});
```

CDN tersebut **gagal diakses** dari environment preview (HTTP 404/network error), sehingga WASM tidak bisa dimuat dan seluruh parsing `.apkg` gagal.

## Solusi

File WASM sudah tersedia secara lokal di `node_modules/sql.js/dist/sql-wasm.wasm`. Solusinya adalah:

1. **Salin file WASM ke `public/`** — file di folder `public/` secara otomatis di-serve oleh Vite sebagai asset statis, bisa diakses di `https://yourapp.com/sql-wasm.wasm`

2. **Ubah `locateFile`** di `AnkiImportDialog.tsx` agar menunjuk ke `/sql-wasm.wasm` (path lokal) bukan CDN eksternal

3. **Tambah Vite config** untuk mengakomodasi WASM dengan benar (header MIME type dan optimizeDeps exclusion untuk sql.js)

## Detail Teknis

### File yang Diubah

**1. `public/sql-wasm.wasm`** *(file baru — disalin dari node_modules)*
- Disalin dari `node_modules/sql.js/dist/sql-wasm.wasm`
- Langsung tersedia di `/sql-wasm.wasm` saat runtime, tanpa build step apapun

**2. `src/components/flashcard/AnkiImportDialog.tsx`** *(ubah locateFile)*
```ts
// SEBELUM (gagal — CDN eksternal)
const SQL = await initSqlJs({
  locateFile: (f: string) => `https://sql.js.org/dist/${f}`,
});

// SESUDAH (berhasil — file lokal dari public/)
const SQL = await initSqlJs({
  locateFile: (f: string) => `/${f}`,
});
```

**3. `vite.config.ts`** *(exclude sql.js dari optimizeDeps)*
- Tambahkan `sql.js` ke daftar `optimizeDeps.exclude` supaya Vite tidak mencoba men-transform WASM loader bawaan sql.js yang menyebabkan file WASM dicari di lokasi yang salah saat bundle.

### Mengapa Ini Berhasil

```text
SEBELUM:
Browser → fetch https://sql.js.org/dist/sql-wasm.wasm → ❌ HTTP Error / CORS
            ↓ fallback sync fetch → ❌ juga gagal
            ↓ Error: "both async and sync fetching of the wasm failed"

SESUDAH:
Browser → fetch /sql-wasm.wasm (dari public/) → ✅ 200 OK
            ↓ WASM loaded → sql.js Database terbentuk
            ↓ Parse .apkg berhasil → kartu ditampilkan
```

### Tidak Ada Ketergantungan Eksternal Baru
- Tidak butuh API key, CDN, atau library tambahan
- WASM file diambil dari package `sql.js` yang sudah terinstall (versi 1.14.0)
- Perubahan minimal, hanya memperbaiki path pengambilan WASM
