-- Expand starter vocabulary for materials where body text contains kanji not listed in vocabulary

UPDATE public.starter_materials
SET vocabulary = '[
  {"kanji":"入浴","kana":"にゅうよく","meaning":"mandi"},
  {"kanji":"介助","kana":"かいじょ","meaning":"bantuan"},
  {"kanji":"排泄","kana":"はいせつ","meaning":"buang air"},
  {"kanji":"申し送り","kana":"もうしおくり","meaning":"serah terima shift"},
  {"kanji":"記録","kana":"きろく","meaning":"catatan"},
  {"kanji":"書く","kana":"かく","meaning":"menulis"}
]'::jsonb
WHERE starter_key = 'jft-care-vocab-2';

UPDATE public.materials
SET vocabulary = '[
  {"kanji":"入浴","kana":"にゅうよく","meaning":"mandi"},
  {"kanji":"介助","kana":"かいじょ","meaning":"bantuan"},
  {"kanji":"排泄","kana":"はいせつ","meaning":"buang air"},
  {"kanji":"申し送り","kana":"もうしおくり","meaning":"serah terima shift"},
  {"kanji":"記録","kana":"きろく","meaning":"catatan"},
  {"kanji":"書く","kana":"かく","meaning":"menulis"}
]'::jsonb
WHERE starter_key = 'jft-care-vocab-2';

UPDATE public.starter_materials
SET vocabulary = '[
  {"kanji":"シフト","kana":"シフト","meaning":"shift/jadwal kerja"},
  {"kanji":"夜勤","kana":"やきん","meaning":"shift malam"},
  {"kanji":"申し送り","kana":"もうしおくり","meaning":"serah terima shift"},
  {"kanji":"朝","kana":"あさ","meaning":"pagi"},
  {"kanji":"七時","kana":"しちじ","meaning":"jam tujuh"},
  {"kanji":"十五時","kana":"じゅうごじ","meaning":"jam lima belas"},
  {"kanji":"二十二時","kana":"にじゅうにじ","meaning":"jam dua puluh dua"}
]'::jsonb
WHERE starter_key = 'jft-numbers-time';

UPDATE public.materials
SET vocabulary = '[
  {"kanji":"シフト","kana":"シフト","meaning":"shift/jadwal kerja"},
  {"kanji":"夜勤","kana":"やきん","meaning":"shift malam"},
  {"kanji":"申し送り","kana":"もうしおくり","meaning":"serah terima shift"},
  {"kanji":"朝","kana":"あさ","meaning":"pagi"},
  {"kanji":"七時","kana":"しちじ","meaning":"jam tujuh"},
  {"kanji":"十五時","kana":"じゅうごじ","meaning":"jam lima belas"},
  {"kanji":"二十二時","kana":"にじゅうにじ","meaning":"jam dua puluh dua"}
]'::jsonb
WHERE starter_key = 'jft-numbers-time';
