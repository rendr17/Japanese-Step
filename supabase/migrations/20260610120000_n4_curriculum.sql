-- N4 curriculum + starter_key mapping for all learning lessons

-- Map existing N5 lessons
UPDATE public.learning_lessons SET starter_key = 'n5-hiragana-dasar' WHERE title = 'Hiragana Dasar' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-katakana-dasar' WHERE title = 'Katakana Dasar' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-salam-perkenalan' WHERE title = 'Salam & Perkenalan' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-angka-waktu' WHERE title = 'Angka & Waktu' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-grammar-wa-ga' WHERE title = 'Partikel は dan が' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-grammar-wo-ni' WHERE title = 'Partikel を dan に' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-grammar-masu' WHERE title = 'Kata Kerja ます' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-adj-i' WHERE title = 'Kata Sifat い' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-adj-na' WHERE title = 'Kata Sifat な' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-negative' WHERE title = 'Bentuk Negatif' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-past' WHERE title = 'Bentuk Lampau' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-vocab-daily-1' WHERE title = 'Kosakata Harian 1' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-vocab-daily-2' WHERE title = 'Kosakata Harian 2' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-conversation-restaurant' WHERE title = 'Percakapan Restoran' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-conversation-shopping' WHERE title = 'Percakapan Belanja' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-grammar-review-1' WHERE title = 'Grammar N5 Review 1' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-grammar-review-2' WHERE title = 'Grammar N5 Review 2' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-reading-1' WHERE title = 'Reading N5 1' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-reading-2' WHERE title = 'Reading N5 2' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'n5-exam-prep' WHERE title = 'Persiapan Ujian N5' AND starter_key IS NULL;

-- Map existing JFT lessons
UPDATE public.learning_lessons SET starter_key = 'jft-workplace-greeting' WHERE title = 'Salam di Tempat Kerja' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'jft-self-intro' WHERE title = 'Perkenalan Diri' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'jft-numbers-time' WHERE title = 'Angka & Jam Kerja' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'jft-simple-instructions' WHERE title = 'Instruksi Sederhana' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'jft-polite-requests' WHERE title = 'Permintaan Sopan' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'jft-patient-conversation' WHERE title = 'Percakapan Pasien' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'jft-care-vocab-1' WHERE title = 'Kosakata Perawatan 1' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'jft-care-vocab-2' WHERE title = 'Kosakata Perawatan 2' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'jft-emergency' WHERE title = 'Situasi Darurat' AND starter_key IS NULL;
UPDATE public.learning_lessons SET starter_key = 'jft-review' WHERE title = 'Review JFT A2' AND starter_key IS NULL;

-- Seed N4 curriculum unit
DO $$
DECLARE
  v_unit_id uuid;
  v_lesson_id uuid;
  v_lessons jsonb := '[
    {"title":"Bentuk て形","key":"n4-te-form","desc":"Te-form untuk menghubungkan kalimat"},
    {"title":"Bentuk Potensial","key":"n4-potential","desc":"Bisa/mampu melakukan sesuatu"},
    {"title":"Perbandingan より/ほうが","key":"n4-comparison","desc":"Membandingkan dua hal"},
    {"title":"Keinginan たい形","key":"n4-tai-form","desc":"Menyatakan keinginan"},
    {"title":"Bentuk ないで","key":"n4-naide","desc":"Tanpa melakukan / larangan"},
    {"title":"Membaca Email","key":"n4-reading-email","desc":"Membaca email singkat"},
    {"title":"Kosakata N4 — Harian 1","key":"n4-vocab-daily-1","desc":"Kosakata kehidupan sehari-hari"},
    {"title":"Kosakata N4 — Harian 2","key":"n4-vocab-daily-2","desc":"Perasaan dan kondisi"},
    {"title":"Bentuk ば","key":"n4-grammar-ba","desc":"Kondisi jika"},
    {"title":"Bentuk たら","key":"n4-grammar-tara","desc":"Setelah / jika"},
    {"title":"Percakapan Telepon","key":"n4-conversation-phone","desc":"Telepon dalam bahasa Jepang"},
    {"title":"Reading N4","key":"n4-reading-short","desc":"Membaca paragraf pendek"},
    {"title":"Grammar N4 Review 1","key":"n4-grammar-review-1","desc":"Review te-form dan potensial"},
    {"title":"Grammar N4 Review 2","key":"n4-grammar-review-2","desc":"Review perbandingan dan keinginan"},
    {"title":"Persiapan Ujian N4","key":"n4-exam-prep","desc":"Tips persiapan JLPT N4"}
  ]'::jsonb;
  v_lesson jsonb;
  v_idx integer := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.learning_units WHERE path = 'jlpt_academic' AND level = 'n4') THEN
    INSERT INTO public.learning_units (path, level, title, description, order_index)
    VALUES ('jlpt_academic', 'n4', 'JLPT N4 — Menengah', 'Kurikulum menengah untuk persiapan JLPT N4', 1)
    RETURNING id INTO v_unit_id;

    FOR v_lesson IN SELECT * FROM jsonb_array_elements(v_lessons)
    LOOP
      INSERT INTO public.learning_lessons (unit_id, title, description, order_index, xp_reward, starter_key)
      VALUES (
        v_unit_id,
        v_lesson->>'title',
        v_lesson->>'desc',
        v_idx,
        30,
        v_lesson->>'key'
      )
      RETURNING id INTO v_lesson_id;

      INSERT INTO public.lesson_activities (lesson_id, activity_type, config, order_index)
      VALUES
        (v_lesson_id, 'read', '{"hint": "Baca materi terkait"}'::jsonb, 0),
        (v_lesson_id, 'quiz', '{"count": 5}'::jsonb, 1);

      v_idx := v_idx + 1;
    END LOOP;
  END IF;
END $$;
