
-- 1. Create ENUMS
CREATE TYPE public.jlpt_level AS ENUM ('n5', 'n4', 'n3', 'n2', 'n1', 'none');
CREATE TYPE public.material_category AS ENUM ('grammar', 'reading', 'conversation', 'vocabulary');
CREATE TYPE public.learning_path AS ENUM ('jlpt_academic', 'jft_practical');
CREATE TYPE public.srs_status AS ENUM ('new', 'learning', 'review', 'mastered');

-- 2. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  current_path learning_path NOT NULL DEFAULT 'jlpt_academic',
  daily_goal_xp INTEGER NOT NULL DEFAULT 50,
  theme_preference TEXT NOT NULL DEFAULT 'light',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Create materials table
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB,
  level jlpt_level NOT NULL DEFAULT 'n5',
  category material_category NOT NULL,
  tags TEXT[],
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own materials"
  ON public.materials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own materials"
  ON public.materials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own materials"
  ON public.materials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own materials"
  ON public.materials FOR DELETE USING (auth.uid() = user_id);

-- 4. Create vocab_bank table
CREATE TABLE public.vocab_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kanji TEXT,
  kana TEXT NOT NULL,
  meaning TEXT NOT NULL,
  example_sentence TEXT,
  audio_url TEXT,
  jlpt_level jlpt_level,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vocab_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vocab"
  ON public.vocab_bank FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own vocab"
  ON public.vocab_bank FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vocab"
  ON public.vocab_bank FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vocab"
  ON public.vocab_bank FOR DELETE USING (auth.uid() = user_id);

-- 5. Create srs_logs table
CREATE TABLE public.srs_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vocab_id UUID NOT NULL REFERENCES public.vocab_bank(id) ON DELETE CASCADE,
  status srs_status NOT NULL DEFAULT 'new',
  interval_days FLOAT NOT NULL DEFAULT 0,
  ease_factor FLOAT NOT NULL DEFAULT 2.5,
  repetitions INTEGER NOT NULL DEFAULT 0,
  next_review_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ
);

ALTER TABLE public.srs_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own srs_logs"
  ON public.srs_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own srs_logs"
  ON public.srs_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own srs_logs"
  ON public.srs_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own srs_logs"
  ON public.srs_logs FOR DELETE USING (auth.uid() = user_id);

-- 6. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
