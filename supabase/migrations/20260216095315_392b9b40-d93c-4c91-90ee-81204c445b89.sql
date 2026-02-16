
-- Create storage bucket for vocab audio recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('vocab-audio', 'vocab-audio', true);

-- Allow authenticated users to upload their own audio
CREATE POLICY "Users can upload their own vocab audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vocab-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access for audio playback
CREATE POLICY "Vocab audio is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'vocab-audio');

-- Allow users to delete their own audio
CREATE POLICY "Users can delete their own vocab audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vocab-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
