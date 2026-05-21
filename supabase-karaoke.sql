-- ══════════════════════════════════════════════════════════
-- KARAOKE AUDIO UPGRADE
-- Run this in Supabase → SQL Editor to enable:
--   • Supabase Storage audio (CORS-safe)
--   • Word-level timestamps from Whisper.js
-- ══════════════════════════════════════════════════════════

-- 1. Add new columns to reading_lessons
ALTER TABLE public.reading_lessons
  ADD COLUMN IF NOT EXISTS audio_path text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS word_timestamps jsonb DEFAULT '[]'::jsonb;

-- 2. Create public storage bucket for karaoke audio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'karaoke-audio',
  'karaoke-audio',
  true,
  52428800,
  ARRAY['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/webm','audio/m4a','audio/aac','audio/x-m4a']
) ON CONFLICT (id) DO NOTHING;

-- 3. RLS: allow anonymous users to read audio (public bucket)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'karaoke_audio_anon_read'
  ) THEN
    CREATE POLICY "karaoke_audio_anon_read"
      ON storage.objects FOR SELECT TO anon
      USING (bucket_id = 'karaoke-audio');
  END IF;
END $$;

-- 4. RLS: allow authenticated users to upload / manage audio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'karaoke_audio_auth_all'
  ) THEN
    CREATE POLICY "karaoke_audio_auth_all"
      ON storage.objects FOR ALL TO authenticated
      USING (bucket_id = 'karaoke-audio')
      WITH CHECK (bucket_id = 'karaoke-audio');
  END IF;
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
