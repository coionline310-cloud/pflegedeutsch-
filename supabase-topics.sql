-- ════════════════════════════════════════════════════════
-- TOPICS — Lĩnh vực học (Y tế, Đời sống, ...)
-- Chạy trong Supabase → SQL Editor
-- ════════════════════════════════════════════════════════

-- 1. Tạo bảng topics
CREATE TABLE IF NOT EXISTS public.topics (
  id         bigint generated always as identity primary key,
  key        text   unique not null,
  label      text   not null,
  icon       text   not null default '📚',
  color      text   not null default 'var(--blue)',
  sort_order int    not null default 0,
  created_at timestamptz default now()
);

-- 2. Thêm topic_id vào bảng categories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS topic_id bigint references public.topics(id) on delete set null;

-- 3. Thêm topic_id vào bảng dialogues
ALTER TABLE public.dialogues
  ADD COLUMN IF NOT EXISTS topic_id bigint references public.topics(id) on delete set null;

-- 4. RLS cho bảng topics
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "topics_read_anon" ON public.topics;
CREATE POLICY "topics_read_anon" ON public.topics
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "topics_all_auth" ON public.topics;
CREATE POLICY "topics_all_auth" ON public.topics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Topic mặc định: Y tế (gán sau khi tạo categories)
INSERT INTO public.topics (key, label, icon, color, sort_order)
VALUES ('medical', 'Y tế', '🏥', '#25cba8', 1)
ON CONFLICT (key) DO NOTHING;

-- 6. Reload Supabase schema cache
NOTIFY pgrst, 'reload schema';
