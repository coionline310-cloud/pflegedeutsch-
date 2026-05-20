-- ════════════════════════════════════════════════════════════════════
-- PflegeDeutsch V4 Pro — Supabase Schema
-- Chạy toàn bộ file này trong Supabase → SQL Editor (chạy 1 lần duy nhất)
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. ENUMS ────────────────────────────────────────────────────────
do $$ begin
  create type app_role as enum ('super_admin','editor','viewer','student');
exception when duplicate_object then null; end $$;

do $$ begin
  create type difficulty_level as enum ('easy','medium','hard');
exception when duplicate_object then null; end $$;

-- ─── 2. PROFILES (gắn với auth.users) ─────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  role app_role not null default 'student',
  created_at timestamptz not null default now(),
  last_login timestamptz
);

-- Trigger tự tạo profile khi user mới đăng ký qua auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::app_role, 'student')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 3. PHRASES (DATA — cụm từ, từ vựng) ─────────────────────────────
create table if not exists public.phrases (
  id bigserial primary key,
  category text not null,           -- patient, colleague, vocab, anatomy...
  group_name text not null,         -- tên nhóm (Chào hỏi, Hỏi triệu chứng...)
  de text not null,                 -- tiếng Đức
  vi text not null,                 -- tiếng Việt
  note text,                        -- ghi chú (n: trong DATA cũ)
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.phrases add column if not exists example text;

create index if not exists idx_phrases_category on public.phrases(category, sort_order);
-- UNIQUE constraint cần thiết để upsert onConflict hoạt động
create unique index if not exists idx_phrases_upsert_key on public.phrases(category, group_name, de);

-- ─── 4. DIALOGUES (hội thoại + dòng hội thoại) ──────────────────────
create table if not exists public.dialogues (
  id bigserial primary key,
  title text not null,
  icon text not null default '💬',
  difficulty difficulty_level not null default 'easy',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dialogue_lines (
  id bigserial primary key,
  dialogue_id bigint not null references public.dialogues(id) on delete cascade,
  role text not null,               -- nurse / patient / doctor...
  de text not null,
  vi text not null,
  sort_order int not null default 0
);

create index if not exists idx_dlines_dialogue on public.dialogue_lines(dialogue_id, sort_order);

-- ─── 5. LEVELS ───────────────────────────────────────────────────────
create table if not exists public.levels (
  id bigserial primary key,
  min_xp int not null unique,
  name text not null,
  emoji text not null default '⭐',
  sort_order int not null default 0
);

-- ─── 6. BADGES ───────────────────────────────────────────────────────
-- condition_type: xp | flashDone | exDone | exPerfectRound | streak |
--                 mastered | roleplays | dialogues
create table if not exists public.badges (
  id bigserial primary key,
  code text unique not null,
  emoji text not null,
  name text not null,
  condition_type text not null,
  condition_value int not null,
  sort_order int not null default 0
);

-- ─── 7. USER_PROGRESS (XP, streak, SRS, badges của từng học viên) ────
create table if not exists public.user_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp int not null default 0,
  streak int not null default 1,
  mastered int not null default 0,
  flash_done int not null default 0,
  ex_done int not null default 0,
  ex_perfect_round int not null default 0,
  roleplays int not null default 0,
  dialogues int not null default 0,
  last_date text not null default '',
  srs_data jsonb not null default '{}'::jsonb,
  earned_badges text[] not null default array[]::text[],
  updated_at timestamptz not null default now()
);

-- ─── 8. AUTO-UPDATE TIMESTAMPS ───────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_phrases_updated on public.phrases;
create trigger trg_phrases_updated before update on public.phrases
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_dialogues_updated on public.dialogues;
create trigger trg_dialogues_updated before update on public.dialogues
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_user_progress_updated on public.user_progress;
create trigger trg_user_progress_updated before update on public.user_progress
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════
alter table public.profiles        enable row level security;
alter table public.phrases         enable row level security;
alter table public.dialogues       enable row level security;
alter table public.dialogue_lines  enable row level security;
alter table public.levels          enable row level security;
alter table public.badges          enable row level security;
alter table public.user_progress   enable row level security;

-- Hàm helper: lấy role của user hiện tại
create or replace function public.current_role()
returns app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ─── PROFILES POLICIES ──────────────────────────────────────────────
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using ( id = auth.uid() or public.current_role() = 'super_admin' );

drop policy if exists "profiles_update_own_basic" on public.profiles;
create policy "profiles_update_own_basic" on public.profiles
  for update to authenticated
  using ( id = auth.uid() )
  with check ( id = auth.uid() and role = (select role from public.profiles where id = auth.uid()) );
-- ↑ user thường chỉ sửa được full_name/username, KHÔNG đổi role được

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all to authenticated
  using ( public.current_role() = 'super_admin' )
  with check ( public.current_role() = 'super_admin' );

-- ─── PHRASES POLICIES ───────────────────────────────────────────────
drop policy if exists "phrases_read_all_auth" on public.phrases;
create policy "phrases_read_all_auth" on public.phrases
  for select to authenticated using ( true );

drop policy if exists "phrases_write_editor_admin" on public.phrases;
create policy "phrases_write_editor_admin" on public.phrases
  for all to authenticated
  using ( public.current_role() in ('super_admin','editor') )
  with check ( public.current_role() in ('super_admin','editor') );

-- ─── DIALOGUES POLICIES ─────────────────────────────────────────────
drop policy if exists "dialogues_read_all_auth" on public.dialogues;
create policy "dialogues_read_all_auth" on public.dialogues
  for select to authenticated using ( true );

drop policy if exists "dialogues_write_editor_admin" on public.dialogues;
create policy "dialogues_write_editor_admin" on public.dialogues
  for all to authenticated
  using ( public.current_role() in ('super_admin','editor') )
  with check ( public.current_role() in ('super_admin','editor') );

drop policy if exists "dlines_read_all_auth" on public.dialogue_lines;
create policy "dlines_read_all_auth" on public.dialogue_lines
  for select to authenticated using ( true );

drop policy if exists "dlines_write_editor_admin" on public.dialogue_lines;
create policy "dlines_write_editor_admin" on public.dialogue_lines
  for all to authenticated
  using ( public.current_role() in ('super_admin','editor') )
  with check ( public.current_role() in ('super_admin','editor') );

-- ─── LEVELS / BADGES POLICIES ───────────────────────────────────────
drop policy if exists "levels_read_all_auth" on public.levels;
create policy "levels_read_all_auth" on public.levels
  for select to authenticated using ( true );

drop policy if exists "levels_write_editor_admin" on public.levels;
create policy "levels_write_editor_admin" on public.levels
  for all to authenticated
  using ( public.current_role() in ('super_admin','editor') )
  with check ( public.current_role() in ('super_admin','editor') );

drop policy if exists "badges_read_all_auth" on public.badges;
create policy "badges_read_all_auth" on public.badges
  for select to authenticated using ( true );

drop policy if exists "badges_write_editor_admin" on public.badges;
create policy "badges_write_editor_admin" on public.badges
  for all to authenticated
  using ( public.current_role() in ('super_admin','editor') )
  with check ( public.current_role() in ('super_admin','editor') );

-- ─── USER_PROGRESS POLICIES ─────────────────────────────────────────
drop policy if exists "progress_self_rw" on public.user_progress;
create policy "progress_self_rw" on public.user_progress
  for all to authenticated
  using ( user_id = auth.uid() or public.current_role() in ('super_admin','viewer') )
  with check ( user_id = auth.uid() or public.current_role() = 'super_admin' );

-- ═══════════════════════════════════════════════════════════════════
-- SEED: LEVELS + BADGES (nội dung mặc định, có thể sửa qua admin sau)
-- ═══════════════════════════════════════════════════════════════════
insert into public.levels (min_xp, name, emoji, sort_order) values
  (0,    'Anfänger',         '🌱', 1),
  (100,  'Lernender',        '📖', 2),
  (300,  'Fortgeschrittener','⚡', 3),
  (600,  'Kompetent',        '🎯', 4),
  (1000, 'Erfahren',         '🏅', 5),
  (1500, 'Experte',          '🥇', 6),
  (2500, 'Meister',          '🏆', 7),
  (4000, 'Pflegeprofi',      '🌟', 8)
on conflict (min_xp) do nothing;

insert into public.badges (code, emoji, name, condition_type, condition_value, sort_order) values
  ('first_flash', '🃏','Thẻ đầu tiên',      'flashDone',      1,   1),
  ('flash10',     '🔟','10 thẻ flashcard',  'flashDone',      10,  2),
  ('flash50',     '🎴','50 thẻ flashcard',  'flashDone',      50,  3),
  ('flash100',    '💎','100 thẻ flashcard', 'flashDone',      100, 4),
  ('ex_first',    '✏️','Bài tập đầu tiên',  'exDone',         1,   5),
  ('ex_perfect',  '💯','Vòng hoàn hảo',     'exPerfectRound', 1,   6),
  ('ex_3perfect', '🎯','3 vòng hoàn hảo',   'exPerfectRound', 3,   7),
  ('streak3',     '🔥','3 ngày liên tiếp',  'streak',         3,   8),
  ('streak7',     '🌟','7 ngày liên tiếp',  'streak',         7,   9),
  ('streak30',    '👑','30 ngày liên tiếp', 'streak',         30,  10),
  ('mastered10',  '🏅','Thuộc 10 mục',      'mastered',       10,  11),
  ('mastered50',  '🥇','Thuộc 50 mục',      'mastered',       50,  12),
  ('mastered100', '🏆','Thuộc 100 mục',     'mastered',       100, 13),
  ('roleplay1',   '🤖','Roleplay đầu tiên', 'roleplays',      1,   14),
  ('roleplay5',   '🎭','5 buổi roleplay',   'roleplays',      5,   15),
  ('dialogue1',   '💬','Xem hội thoại đầu', 'dialogues',      1,   16),
  ('dialogue5',   '📖','Xem 5 hội thoại',   'dialogues',      5,   17),
  ('srs_first',   '🔁','SRS đầu tiên',      'flashDone',      1,   18),
  ('xp100',       '⭐','100 XP',             'xp',             100, 19),
  ('xp500',       '🌠','500 XP',             'xp',             500, 20),
  ('xp2000',      '💫','2000 XP',            'xp',             2000,21),
  ('xp5000',      '🌌','5000 XP · Pflegeprofi','xp',           5000,22)
on conflict (code) do nothing;

-- ═══════════════════════════════════════════════════════════════════
-- ANON READ + REALTIME (cho index.html không cần đăng nhập)
-- ═══════════════════════════════════════════════════════════════════
-- index.html load nội dung công khai (phrases, dialogues, levels, badges)
-- bằng anon key, không bắt buộc đăng nhập → phải cho anon SELECT.

drop policy if exists "phrases_read_anon"        on public.phrases;
create policy "phrases_read_anon"        on public.phrases        for select to anon using ( true );
drop policy if exists "dialogues_read_anon"      on public.dialogues;
create policy "dialogues_read_anon"      on public.dialogues      for select to anon using ( true );
drop policy if exists "dlines_read_anon"         on public.dialogue_lines;
create policy "dlines_read_anon"         on public.dialogue_lines for select to anon using ( true );
drop policy if exists "levels_read_anon"         on public.levels;
create policy "levels_read_anon"         on public.levels         for select to anon using ( true );
drop policy if exists "badges_read_anon"         on public.badges;
create policy "badges_read_anon"         on public.badges         for select to anon using ( true );

-- Bật Realtime publication cho các bảng nội dung (để index.html nhận update tức thời)
do $$ begin alter publication supabase_realtime add table public.phrases;        exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.dialogues;      exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.dialogue_lines; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.levels;         exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table public.badges;         exception when others then null; end $$;

-- ═══════════════════════════════════════════════════════════════════
-- GHI CHÚ
-- - Sau khi chạy schema, vào Admin Panel → tab "Cài đặt" → click
--   "Nhập dữ liệu mặc định" để seed toàn bộ DATA và DIALOGUES.
-- - Để biến account của bạn thành super_admin, sau khi đăng ký xong:
--     update public.profiles set role='super_admin' where username='ten_cua_ban';
-- - Phần ANON READ + REALTIME ở trên cho phép index.html (không đăng nhập)
--   đọc nội dung học tập và nhận cập nhật realtime khi admin sửa.
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- CATEGORIES (quản lý danh mục động — thêm/sửa/xóa qua Admin Panel)
-- Chạy phần này nếu chưa có bảng categories
-- ═══════════════════════════════════════════════════════════════════
create table if not exists public.categories (
  id          bigserial primary key,
  key         text unique not null,
  label       text not null,
  icon        text not null default '📁',
  section     text not null default 'vocabulary'
                check (section in ('communication','vocabulary','other')),
  color       text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "categories_read_auth" on public.categories;
create policy "categories_read_auth" on public.categories
  for select to authenticated using ( true );

drop policy if exists "categories_read_anon" on public.categories;
create policy "categories_read_anon" on public.categories
  for select to anon using ( true );

drop policy if exists "categories_write_editor_admin" on public.categories;
create policy "categories_write_editor_admin" on public.categories
  for all to authenticated
  using ( public.current_role() in ('super_admin','editor') )
  with check ( public.current_role() in ('super_admin','editor') );

do $$ begin
  alter publication supabase_realtime add table public.categories;
exception when others then null; end $$;

-- Seed categories mặc định
insert into public.categories (key, label, icon, section, sort_order) values
  ('patient',         'Bệnh nhân',      '👤', 'communication', 1),
  ('colleague',       'Đồng nghiệp',    '👥', 'communication', 2),
  ('handover',        'Bàn giao ca',    '🔄', 'communication', 3),
  ('emergency',       'Khẩn cấp',       '🚨', 'communication', 4),
  ('vocab',           'Chuyên ngành',   '📚', 'vocabulary',    5),
  ('anatomy',         'Giải phẫu',      '🫀', 'vocabulary',    6),
  ('medication',      'Thuốc & ĐT',     '💊', 'vocabulary',    7),
  ('documentation',   'Hồ sơ',          '📋', 'vocabulary',    8),
  ('nursing_process', 'Quy trình ĐD',   '🩺', 'vocabulary',    9),
  ('mental',          'Tâm thần & Lão', '🧠', 'vocabulary',    10)
on conflict (key) do nothing;
