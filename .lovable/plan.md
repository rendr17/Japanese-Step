
## Root Cause

The problem is a **data quality issue** in the database. Many vocabulary entries in `vocab_bank` have their `meaning` column filled with kana readings instead of Indonesian translations. For example:
- `日本語` → `meaning: にほんご` (should be: `Bahasa Jepang`)
- `彼` → `meaning: かれ` (should be: `Dia (laki-laki)`)
- `私` → `meaning: わたし` (should be: `Saya / Aku`)

This means the UI code (`FlashcardCard.tsx`) is actually working correctly — it displays `card.meaning` as intended — but the data stored is wrong.

The fix has **two parts**:

---

## Part 1 — Fix the bad data in the database

Use an AI-powered edge function (`vocab-ai-fill`) that already exists in the project to batch-update the `meaning` field for all vocab entries where `meaning` looks like Japanese (kana/kanji) instead of Indonesian.

Query to identify and fix the entries:
- Find all rows where `meaning` matches Japanese character patterns (hiragana/katakana)
- Call the `vocab-ai-fill` edge function (which already exists) to generate correct Indonesian translations
- Or write a one-time SQL update using a deterministic mapping for common words

**Approach**: Since there are potentially many bad entries, we'll add a **"Perbaiki Arti"** (Fix Meaning) button in the UI that:
1. Detects vocab entries whose `meaning` field contains only Japanese characters
2. Calls the existing `vocab-ai-fill` edge function to auto-fill correct Indonesian translations in batch
3. Shows a progress indicator while fixing

---

## Part 2 — Add a visual guard in FlashcardCard

As a safety net, detect when `card.meaning` looks like Japanese text and show a warning/placeholder instead of displaying kana as "Arti". This prevents confusion while data is being fixed.

---

## Files to Change

### 1. `src/components/flashcard/FlashcardCard.tsx`
- Add a helper `isJapanese(text: string)` that returns `true` if the string contains only kana/kanji characters
- If `card.meaning` is detected as Japanese, show a styled "—" with a note "Arti belum tersedia" instead

### 2. `src/pages/Flashcards.tsx`
- Add a "Perbaiki Data" button that triggers batch fix for vocab with bad meaning data
- This button calls the `vocab-ai-fill` edge function for detected bad entries

### 3. `src/pages/Vocabulary.tsx` (or a shared utility)
- Add a bulk fix utility that finds all `vocab_bank` rows where `meaning` is Japanese, then sends them to the AI fill function

---

## Technical Details

**Detection logic** (to identify bad meaning entries):
```typescript
const isJapaneseMeaning = (text: string) =>
  /^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\s・ー]+$/.test(text.trim());
```

**Batch fix flow**:
1. Query all `vocab_bank` WHERE `meaning` matches Japanese pattern
2. For each bad entry, call `vocab-ai-fill` edge function with `{ vocab_id, kanji, kana }`
3. Edge function returns Indonesian translation and updates `meaning` in DB

**FlashcardCard guard** (immediate fix for display):
```tsx
const meaningDisplay = isJapaneseMeaning(card.meaning)
  ? null  // show placeholder
  : card.meaning;

<p className="text-2xl font-semibold text-foreground">
  {meaningDisplay || <span className="text-muted-foreground italic text-base">Arti belum tersedia</span>}
</p>
```

This two-pronged approach fixes both the **display** (immediate) and the **underlying data** (permanent fix via AI).
