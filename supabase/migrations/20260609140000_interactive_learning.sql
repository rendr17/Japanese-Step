-- Interactive Learning Module: progress, quizzes, learning path, practice, achievements

-- Profile extension
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Existing users skip onboarding redirect
UPDATE public.profiles SET onboarding_completed = true WHERE onboarding_completed = false;

-- Material reading progress
CREATE TABLE IF NOT EXISTS public.user_material_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  scroll_progress numeric NOT NULL DEFAULT 0,
  completed_at timestamptz,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, material_id)
);

ALTER TABLE public.user_material_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own material progress"
  ON public.user_material_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  source_type text NOT NULL DEFAULT 'material',
  score integer NOT NULL,
  total_questions integer NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  passed boolean NOT NULL DEFAULT false,
  xp_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own quiz attempts"
  ON public.quiz_attempts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Cached material quizzes (avoid repeated AI calls)
CREATE TABLE IF NOT EXISTS public.material_quiz_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES public.materials(id) ON DELETE CASCADE,
  cache_key text NOT NULL,
  questions jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cache_key)
);

ALTER TABLE public.material_quiz_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read quiz cache"
  ON public.material_quiz_cache FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users insert quiz cache"
  ON public.material_quiz_cache FOR INSERT
  TO authenticated WITH CHECK (true);

-- Learning path curriculum
CREATE TABLE IF NOT EXISTS public.learning_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path public.learning_path NOT NULL,
  level text NOT NULL,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.learning_units(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.materials(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  xp_reward integer NOT NULL DEFAULT 25,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lesson_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.learning_lessons(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('read', 'quiz', 'flashcard', 'roleplay', 'practice')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  order_index integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.learning_lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  score integer,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

ALTER TABLE public.learning_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated reads curriculum"
  ON public.learning_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated reads lessons"
  ON public.learning_lessons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated reads activities"
  ON public.lesson_activities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own lesson progress"
  ON public.user_lesson_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Practice sessions
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type text NOT NULL,
  topic text,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own practice sessions"
  ON public.practice_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏆',
  xp_reward integer NOT NULL DEFAULT 0,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads achievements"
  ON public.achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users read own earned achievements"
  ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own achievements"
  ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Review packs (post-exam adaptive review)
CREATE TABLE IF NOT EXISTS public.review_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_result_id uuid REFERENCES public.exam_results(id) ON DELETE SET NULL,
  title text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  vocab_ids uuid[] DEFAULT '{}',
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.review_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own review packs"
  ON public.review_packs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Streak update function
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last date;
  v_streak integer;
  v_longest integer;
  v_today date := (now() AT TIME ZONE 'UTC')::date;
BEGIN
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last, v_streak, v_longest
  FROM profiles WHERE id = p_user_id;

  IF v_last IS NULL OR v_last < v_today - 1 THEN
    v_streak := 1;
  ELSIF v_last = v_today - 1 THEN
    v_streak := COALESCE(v_streak, 0) + 1;
  ELSIF v_last = v_today THEN
    v_streak := COALESCE(v_streak, 1);
  END IF;

  IF v_streak > COALESCE(v_longest, 0) THEN
    v_longest := v_streak;
  END IF;

  UPDATE profiles
  SET current_streak = v_streak,
      longest_streak = v_longest,
      last_activity_date = v_today
  WHERE id = p_user_id;
END;
$$;

-- Seed achievements
INSERT INTO public.achievements (slug, title, description, icon, xp_reward, criteria) VALUES
  ('streak_7', 'Consistent Learner', 'Belajar 7 hari berturut-turut', '🔥', 50, '{"streak": 7}'),
  ('streak_30', 'Dedicated Student', 'Belajar 30 hari berturut-turut', '⭐', 200, '{"streak": 30}'),
  ('vocab_100', 'Word Collector', 'Kuasai 100 kosakata', '📚', 100, '{"vocab_mastered": 100}'),
  ('exam_pass', 'Exam Ready', 'Skor ujian simulasi ≥75%', '🎯', 75, '{"exam_score_pct": 75}'),
  ('lesson_10', 'Path Walker', 'Selesaikan 10 lesson', '🛤️', 100, '{"lessons_completed": 10}')
ON CONFLICT (slug) DO NOTHING;

-- Seed N5 curriculum (global curriculum, no user materials linked yet)
DO $$
DECLARE
  v_unit_id uuid;
  v_lesson_id uuid;
  v_titles text[] := ARRAY[
    'Hiragana Dasar', 'Katakana Dasar', 'Salam & Perkenalan', 'Angka & Waktu',
    'Partikel は dan が', 'Partikel を dan に', 'Kata Kerja ます', 'Kata Sifat い',
    'Kata Sifat な', 'Bentuk Negatif', 'Bentuk Lampau', 'Kosakata Harian 1',
    'Kosakata Harian 2', 'Percakapan Restoran', 'Percakapan Belanja',
    'Grammar N5 Review 1', 'Grammar N5 Review 2', 'Reading N5 1', 'Reading N5 2',
    'Persiapan Ujian N5'
  ];
  v_title text;
  v_idx integer := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.learning_units WHERE path = 'jlpt_academic' AND level = 'n5') THEN
    INSERT INTO public.learning_units (path, level, title, description, order_index)
    VALUES ('jlpt_academic', 'n5', 'JLPT N5 — Dasar', 'Kurikulum pemula untuk persiapan JLPT N5', 0)
    RETURNING id INTO v_unit_id;

    FOREACH v_title IN ARRAY v_titles LOOP
      INSERT INTO public.learning_lessons (unit_id, title, description, order_index, xp_reward)
      VALUES (v_unit_id, v_title, 'Pelajaran ' || (v_idx + 1) || ' — ' || v_title, v_idx, 25)
      RETURNING id INTO v_lesson_id;

      INSERT INTO public.lesson_activities (lesson_id, activity_type, config, order_index)
      VALUES
        (v_lesson_id, 'read', '{"hint": "Baca materi terkait atau buat materi sendiri"}'::jsonb, 0),
        (v_lesson_id, 'quiz', '{"count": 5}'::jsonb, 1);

      v_idx := v_idx + 1;
    END LOOP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.learning_units WHERE path = 'jft_practical' AND level = 'a2') THEN
    INSERT INTO public.learning_units (path, level, title, description, order_index)
    VALUES ('jft_practical', 'a2', 'JFT Basic A2', 'Bahasa Jepang praktis untuk kehidupan dan kerja', 0)
    RETURNING id INTO v_unit_id;

    v_titles := ARRAY[
      'Salam di Tempat Kerja', 'Perkenalan Diri', 'Angka & Jam Kerja',
      'Instruksi Sederhana', 'Permintaan Sopan', 'Percakapan Pasien',
      'Kosakata Perawatan 1', 'Kosakata Perawatan 2', 'Situasi Darurat',
      'Review JFT A2'
    ];
    v_idx := 0;

    FOREACH v_title IN ARRAY v_titles LOOP
      INSERT INTO public.learning_lessons (unit_id, title, description, order_index, xp_reward)
      VALUES (v_unit_id, v_title, 'Pelajaran JFT ' || (v_idx + 1), v_idx, 20)
      RETURNING id INTO v_lesson_id;

      INSERT INTO public.lesson_activities (lesson_id, activity_type, config, order_index)
      VALUES
        (v_lesson_id, 'read', '{}'::jsonb, 0),
        (v_lesson_id, 'roleplay', '{"scenario": "workplace"}'::jsonb, 1);

      v_idx := v_idx + 1;
    END LOOP;
  END IF;
END $$;
