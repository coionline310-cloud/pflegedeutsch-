-- ════════════════════════════════════════════════════════
-- PflegeDeutsch — Thêm cột audio_url vào bảng dialogues
-- Chạy trong Supabase → SQL Editor
-- ════════════════════════════════════════════════════════

ALTER TABLE public.dialogues
  ADD COLUMN IF NOT EXISTS audio_url text DEFAULT NULL;

-- ════════════════════════════════════════════════════════
-- Cách lấy link Google Drive:
--  1. Upload file audio (.mp3 / .m4a) lên Google Drive
--  2. Chuột phải → Share → "Anyone with the link" → Copy link
--  3. Dán link vào trường "Google Drive Audio URL" trong admin
--     VD: https://drive.google.com/file/d/1aBcDeFgHiJkLmNo/view
-- App sẽ tự trích xuất file ID và nhúng player Drive.
-- ════════════════════════════════════════════════════════
