ALTER TABLE materials
  ADD COLUMN vocabulary jsonb DEFAULT NULL,
  ADD COLUMN grammar_notes jsonb DEFAULT NULL,
  ADD COLUMN cultural_note text DEFAULT NULL;