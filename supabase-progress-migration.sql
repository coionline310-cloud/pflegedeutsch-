-- ════════════════════════════════════════════════════════════════════
-- PflegeDeutsch — Migration: user_progress schema update
-- Chạy file này trong Supabase → SQL Editor
-- An toàn để chạy nhiều lần (idempotent)
-- ════════════════════════════════════════════════════════════════════

-- Thêm cột srs_db nếu chưa có (lưu SRS data dạng JSONB)
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS srs_db jsonb DEFAULT '{}' NOT NULL;

-- Thêm cột game_state nếu chưa có (lưu XP, streak, bookmarks, ...)
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS game_state jsonb DEFAULT '{}' NOT NULL;

-- Di chuyển dữ liệu cũ (nếu table được tạo từ supabase-schema.sql cũ)
-- Chỉ update những row có game_state trống nhưng có dữ liệu ở cột cũ
UPDATE public.user_progress
SET game_state = jsonb_build_object(
  'xp',             COALESCE(xp, 0),
  'streak',         COALESCE(streak, 1),
  'mastered',       COALESCE(mastered, 0),
  'flashDone',      COALESCE(flash_done, 0),
  'exDone',         COALESCE(ex_done, 0),
  'exPerfectRound', COALESCE(ex_perfect_round, 0),
  'roleplays',      COALESCE(roleplays, 0),
  'dialogues',      COALESCE(dialogues, 0),
  'lastDate',       COALESCE(last_date, ''),
  'earnedBadges',   to_jsonb(COALESCE(earned_badges, array[]::text[])),
  'bookmarks',      '[]'::jsonb
)
WHERE game_state = '{}'::jsonb
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_progress' AND column_name = 'xp'
  )
  AND COALESCE(xp, 0) > 0;

-- Di chuyển srs_data → srs_db nếu cột cũ tồn tại
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'user_progress'
      AND column_name  = 'srs_data'
  ) THEN
    UPDATE public.user_progress
    SET srs_db = srs_data
    WHERE srs_db = '{}'::jsonb AND srs_data <> '{}'::jsonb;
  END IF;
END $$;

-- Đảm bảo RLS policy cho phép upsert đúng
DROP POLICY IF EXISTS "progress_self_rw" ON public.user_progress;
CREATE POLICY "progress_self_rw" ON public.user_progress
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
