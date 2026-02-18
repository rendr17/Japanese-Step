

## Update Target Karakter ke ~1500 / ~2500 / ~5000

### Perubahan di 2 File

**1. Frontend: `src/pages/MaterialGenerator.tsx`**
- Update label di `lengthOptions`:
  - Pendek: ~700 --> ~1500 karakter
  - Sedang: ~1400 --> ~2500 karakter
  - Panjang: ~2000 --> ~5000 karakter

**2. Backend: `supabase/functions/generate-material/index.ts`**
- Update `charTarget` (baris 23):
  - short: 700 --> 1500
  - medium: 1400 --> 2500
  - long: 2000 --> 5000
- `max_tokens` sudah 8192, mungkin perlu dinaikkan ke 16384 untuk mengakomodasi output ~5000 karakter Jepang + vocabulary + grammar notes

### Detail Teknis

```text
// Edge function - sebelum:
const charTarget = length === "short" ? 700 : length === "long" ? 2000 : 1400;

// Edge function - sesudah:
const charTarget = length === "short" ? 1500 : length === "long" ? 5000 : 2500;

// max_tokens: 8192 --> 16384
```

```text
// Frontend labels - sesudah:
{ value: "short", label: "Pendek", chars: "~1500 karakter" }
{ value: "medium", label: "Sedang", chars: "~2500 karakter" }
{ value: "long", label: "Panjang", chars: "~5000 karakter" }
```

