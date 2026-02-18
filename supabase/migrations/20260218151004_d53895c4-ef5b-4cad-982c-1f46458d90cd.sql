
-- Create import_history table
CREATE TABLE public.import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_category TEXT NOT NULL,
  template TEXT,
  total_materials INTEGER DEFAULT 0,
  total_vocab INTEGER DEFAULT 0,
  settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add source_import_id to materials
ALTER TABLE public.materials ADD COLUMN source_import_id UUID REFERENCES public.import_history(id) DEFAULT NULL;

-- Enable RLS
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own imports" ON public.import_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own imports" ON public.import_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own imports" ON public.import_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own imports" ON public.import_history FOR DELETE USING (auth.uid() = user_id);
