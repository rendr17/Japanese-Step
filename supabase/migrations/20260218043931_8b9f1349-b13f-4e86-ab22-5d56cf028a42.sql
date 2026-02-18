
-- Exam questions bank
CREATE TABLE public.exam_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- ["option1","option2","option3","option4"]
  correct_answer INTEGER NOT NULL, -- 0-3 index
  level TEXT NOT NULL, -- n5, n4, n3, n2, n1
  section TEXT NOT NULL, -- vocabulary, grammar, reading
  difficulty INTEGER NOT NULL DEFAULT 3, -- 1-5
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Exam results
CREATE TABLE public.exam_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exam_type TEXT NOT NULL, -- jlpt, jft
  level TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL, -- [{question_id, selected, correct, section}]
  time_taken_seconds INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- Questions are readable by all authenticated users
CREATE POLICY "Authenticated users can read exam questions"
ON public.exam_questions FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Results are user-scoped
CREATE POLICY "Users can view their own results"
ON public.exam_results FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own results"
ON public.exam_results FOR INSERT
WITH CHECK (auth.uid() = user_id);
