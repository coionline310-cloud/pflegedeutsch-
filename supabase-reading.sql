-- ════════════════════════════════════════════════════════
-- PflegeDeutsch — Bảng reading_lessons (Karaoke Luyện Nghe)
-- Chạy trong Supabase → SQL Editor
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.reading_lessons (
  id          serial PRIMARY KEY,
  title       text NOT NULL,
  icon        text DEFAULT '🎧',
  de_text     text NOT NULL,        -- Nội dung tiếng Đức
  vi_text     text DEFAULT '',      -- Bản dịch tiếng Việt
  audio_url   text DEFAULT NULL,    -- Google Drive URL
  difficulty  text DEFAULT 'easy',  -- easy | medium | hard
  sort_order  int  DEFAULT 0
);

-- Row Level Security
ALTER TABLE public.reading_lessons ENABLE ROW LEVEL SECURITY;

-- Anon users có thể đọc (cho index.html)
DROP POLICY IF EXISTS "reading_lessons_read_anon" ON public.reading_lessons;
CREATE POLICY "reading_lessons_read_anon"
  ON public.reading_lessons FOR SELECT TO anon USING (true);

-- Authenticated users (admin) quản lý toàn bộ
DROP POLICY IF EXISTS "reading_lessons_admin" ON public.reading_lessons;
CREATE POLICY "reading_lessons_admin"
  ON public.reading_lessons FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════
-- Dữ liệu mẫu (xóa nếu không cần)
-- ════════════════════════════════════════════════════════
INSERT INTO public.reading_lessons (title, icon, de_text, vi_text, difficulty, sort_order) VALUES
('Chào hỏi bệnh nhân', '👩‍⚕️',
 'Guten Morgen! Mein Name ist Lan. Ich bin heute Ihre Pflegefachkraft. Wie geht es Ihnen heute?',
 'Chào buổi sáng! Tôi là Lan. Hôm nay tôi là điều dưỡng phụ trách bạn. Hôm nay bạn cảm thấy thế nào?',
 'easy', 1),
('Hỏi về cơn đau', '🩺',
 'Haben Sie Schmerzen? Wo genau tut es weh? Wie stark sind die Schmerzen auf einer Skala von eins bis zehn?',
 'Bạn có bị đau không? Đau ở đâu vậy? Mức độ đau bao nhiêu trên thang điểm từ một đến mười?',
 'easy', 2),
('Báo cáo SBAR', '📋',
 'Ich möchte Ihnen einen Patienten vorstellen. Herr Nguyen, sechzig Jahre alt, liegt in Zimmer dreizehn. Er wurde wegen Herzinsuffizienz aufgenommen.',
 'Tôi muốn báo cáo về một bệnh nhân. Ông Nguyễn, 60 tuổi, nằm phòng 13. Ông nhập viện vì suy tim.',
 'medium', 3)
ON CONFLICT DO NOTHING;
