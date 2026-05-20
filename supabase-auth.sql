-- ════════════════════════════════════════════════════════
-- PflegeDeutsch — Auth & User Progress Schema
-- Chạy file này trong Supabase → SQL Editor
-- ════════════════════════════════════════════════════════

-- Bảng lưu tiến độ học của từng thành viên
CREATE TABLE IF NOT EXISTS public.user_progress (
  user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  srs_db      jsonb DEFAULT '{}' NOT NULL,
  game_state  jsonb DEFAULT '{}' NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

-- Row Level Security: mỗi user chỉ thao tác được với row của mình
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_progress;
CREATE POLICY "Users can manage own progress"
  ON public.user_progress
  FOR ALL
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tự cập nhật updated_at khi upsert
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_user_progress_updated ON public.user_progress;
CREATE TRIGGER trg_user_progress_updated
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ════════════════════════════════════════════════════════
-- Supabase Auth settings (làm trong Dashboard, không phải SQL)
-- Authentication → Settings:
--   • Site URL: URL của app bạn (e.g. https://yourname.github.io/pflegedeutsch-)
--   • Confirm email: có thể tắt (Disable) để test nhanh
-- ════════════════════════════════════════════════════════
