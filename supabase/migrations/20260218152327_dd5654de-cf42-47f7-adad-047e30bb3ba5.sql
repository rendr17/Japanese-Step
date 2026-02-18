
-- Add new settings columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS default_jlpt_level TEXT DEFAULT 'n5',
  ADD COLUMN IF NOT EXISTS furigana_display TEXT DEFAULT 'always',
  ADD COLUMN IF NOT EXISTS study_reminder_time TEXT DEFAULT '20:00',
  ADD COLUMN IF NOT EXISTS ui_language TEXT DEFAULT 'indonesian',
  ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS animations_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS reduce_motion BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_reminders BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS srs_reminders BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS weekly_report BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS achievement_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_play_pronunciation BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tts_voice TEXT DEFAULT 'female',
  ADD COLUMN IF NOT EXISTS audio_speed TEXT DEFAULT '1x';

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
