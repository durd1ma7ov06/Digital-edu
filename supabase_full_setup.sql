-- ============================================================================
-- DIGITALEDU — TO'LIQ BAZA SETUP (FINAL, MUKAMMAL)
-- ============================================================================
-- Bu faylni Supabase Dashboard → SQL Editor'da to'liq nusxalab RUN qiling.
-- Barcha jadval, funksiya, RLS, storage va ADMIN avtomatik yaratiladi.
-- IF NOT EXISTS / CREATE OR REPLACE — qayta run qilsa ham xato bermaydi.
--
-- ADMIN KIRISH:
--   Email:  admin@digitaledu.uz
--   Parol:  DigitalEdu2024!Admin
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_emoji TEXT NOT NULL DEFAULT '🎯',
  group_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
  diagnostic_completed BOOLEAN NOT NULL DEFAULT false,
  diagnostic_score INTEGER NOT NULL DEFAULT 0,
  diagnostic_total INTEGER NOT NULL DEFAULT 0,
  diagnostic_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
  ON public.profiles (lower(username)) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_group_name_idx ON public.profiles(group_name);

-- ============================================================================
-- 2. CONTENT ITEMS (material, test, practice)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('material', 'test', 'practice')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  topic_id INTEGER,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  practice JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_items_type_idx ON public.content_items(content_type);
CREATE INDEX IF NOT EXISTS content_items_status_idx ON public.content_items(status);
CREATE INDEX IF NOT EXISTS content_items_topic_idx ON public.content_items(topic_id);

-- ============================================================================
-- 3. RESULTS (Diagnostic, Quiz, Practice)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.diagnostic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL DEFAULT 0,
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
  part_id INTEGER NOT NULL DEFAULT 1,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.practice_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL DEFAULT 0,
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 100,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS diagnostic_results_user_id_idx ON public.diagnostic_results(user_id);
CREATE INDEX IF NOT EXISTS quiz_results_user_id_idx ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS quiz_results_content_item_id_idx ON public.quiz_results(content_item_id);
CREATE INDEX IF NOT EXISTS practice_results_user_id_idx ON public.practice_results(user_id);
CREATE INDEX IF NOT EXISTS practice_results_content_item_id_idx ON public.practice_results(content_item_id);

-- ============================================================================
-- 4. SECURITY HELPER FUNKSIYALAR
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_or_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'));
$$;

-- ============================================================================
-- 5. SUBMISSIONS (amaliyot fayl yuklash)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL CHECK (length(file_name) <= 255),
  file_size INTEGER NOT NULL CHECK (file_size >= 1 AND file_size <= 10485760),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'graded')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT CHECK (feedback IS NULL OR length(feedback) <= 2000),
  graded_by UUID REFERENCES public.profiles(id),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_item_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_user ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_content ON public.submissions(content_item_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);

-- ============================================================================
-- 6. ROLE_REQUESTS (teacher roli so'rovi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_role_requests_pending_unique
  ON public.role_requests(user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_role_requests_status ON public.role_requests(status);
CREATE INDEX IF NOT EXISTS idx_role_requests_user ON public.role_requests(user_id);

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());

-- Content (admin VA teacher kontent qo'sha/tahrirlay/o'chira oladi)
DROP POLICY IF EXISTS "content_select" ON public.content_items;
DROP POLICY IF EXISTS "content_insert" ON public.content_items;
DROP POLICY IF EXISTS "content_update" ON public.content_items;
DROP POLICY IF EXISTS "content_delete" ON public.content_items;
CREATE POLICY "content_select" ON public.content_items FOR SELECT TO authenticated
  USING (status = 'published' OR public.is_teacher_or_admin());
CREATE POLICY "content_insert" ON public.content_items FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher_or_admin());
CREATE POLICY "content_update" ON public.content_items FOR UPDATE TO authenticated
  USING (public.is_teacher_or_admin()) WITH CHECK (public.is_teacher_or_admin());
CREATE POLICY "content_delete" ON public.content_items FOR DELETE TO authenticated
  USING (public.is_teacher_or_admin());

-- Diagnostic
DROP POLICY IF EXISTS "diagnostic_select" ON public.diagnostic_results;
DROP POLICY IF EXISTS "diagnostic_insert" ON public.diagnostic_results;
CREATE POLICY "diagnostic_select" ON public.diagnostic_results FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_teacher_or_admin());
CREATE POLICY "diagnostic_insert" ON public.diagnostic_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Quiz
DROP POLICY IF EXISTS "quiz_select" ON public.quiz_results;
DROP POLICY IF EXISTS "quiz_insert" ON public.quiz_results;
CREATE POLICY "quiz_select" ON public.quiz_results FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_teacher_or_admin());
CREATE POLICY "quiz_insert" ON public.quiz_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Practice
DROP POLICY IF EXISTS "practice_select" ON public.practice_results;
DROP POLICY IF EXISTS "practice_insert" ON public.practice_results;
CREATE POLICY "practice_select" ON public.practice_results FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_teacher_or_admin());
CREATE POLICY "practice_insert" ON public.practice_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Submissions
DROP POLICY IF EXISTS "submissions_student_select" ON public.submissions;
DROP POLICY IF EXISTS "submissions_student_insert" ON public.submissions;
DROP POLICY IF EXISTS "submissions_student_update" ON public.submissions;
DROP POLICY IF EXISTS "submissions_teacher_update" ON public.submissions;
CREATE POLICY "submissions_student_select" ON public.submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_teacher_or_admin());
CREATE POLICY "submissions_student_insert" ON public.submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "submissions_student_update" ON public.submissions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending') WITH CHECK (auth.uid() = user_id);
CREATE POLICY "submissions_teacher_update" ON public.submissions FOR UPDATE TO authenticated
  USING (public.is_teacher_or_admin());

-- Role Requests
DROP POLICY IF EXISTS "role_requests_select" ON public.role_requests;
DROP POLICY IF EXISTS "role_requests_insert" ON public.role_requests;
DROP POLICY IF EXISTS "role_requests_update" ON public.role_requests;
CREATE POLICY "role_requests_select" ON public.role_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "role_requests_insert" ON public.role_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student'));
CREATE POLICY "role_requests_update" ON public.role_requests FOR UPDATE TO authenticated USING (public.is_admin());

-- ============================================================================
-- 8. TRIGGERS (updated_at avtomatik)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_submission_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS submissions_updated_at ON public.submissions;
CREATE TRIGGER submissions_updated_at BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_submission_timestamp();

CREATE OR REPLACE FUNCTION public.update_role_request_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS role_requests_updated_at ON public.role_requests;
CREATE TRIGGER role_requests_updated_at BEFORE UPDATE ON public.role_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_role_request_timestamp();

-- ============================================================================
-- 9. RPC FUNKSIYALAR
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_user_role(p_user_id UUID, p_role TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Only admin can change roles'; END IF;
  IF p_role NOT IN ('teacher', 'student') THEN RAISE EXCEPTION 'Invalid role. Use teacher or student.'; END IF;
  UPDATE public.profiles SET role = p_role, updated_at = now() WHERE id = p_user_id AND role != 'admin';
END; $$;

CREATE OR REPLACE FUNCTION public.update_own_profile(
  p_full_name TEXT DEFAULT NULL, p_group_name TEXT DEFAULT NULL, p_avatar_emoji TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET
    full_name = COALESCE(p_full_name, full_name),
    group_name = COALESCE(p_group_name, group_name),
    avatar_emoji = COALESCE(p_avatar_emoji, avatar_emoji),
    updated_at = now()
  WHERE id = auth.uid();
END; $$;

CREATE OR REPLACE FUNCTION public.complete_diagnostic(
  p_score INTEGER, p_total INTEGER, p_answers JSONB DEFAULT '[]'::jsonb
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.diagnostic_results (user_id, score, total_questions, percentage, answers)
  VALUES (auth.uid(), p_score, p_total, ROUND((p_score::NUMERIC / NULLIF(p_total, 0)) * 100, 2), COALESCE(p_answers, '[]'::jsonb));
  UPDATE public.profiles SET diagnostic_completed = true, diagnostic_score = p_score,
    diagnostic_total = p_total, diagnostic_completed_at = now(), updated_at = now()
  WHERE id = auth.uid();
END; $$;

CREATE OR REPLACE FUNCTION public.submit_role_request()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_role TEXT; v_request_id UUID;
BEGIN
  SELECT role INTO v_user_role FROM public.profiles WHERE id = auth.uid();
  IF v_user_role != 'student' THEN RAISE EXCEPTION 'Only students can submit role requests'; END IF;
  IF EXISTS (SELECT 1 FROM public.role_requests WHERE user_id = auth.uid() AND status = 'pending') THEN
    RAISE EXCEPTION 'You already have a pending role request';
  END IF;
  INSERT INTO public.role_requests (user_id, status) VALUES (auth.uid(), 'pending') RETURNING id INTO v_request_id;
  RETURN v_request_id;
END; $$;

CREATE OR REPLACE FUNCTION public.review_role_request(p_request_id UUID, p_approved BOOLEAN)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID; v_status TEXT;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Only admins can review role requests'; END IF;
  SELECT user_id, status INTO v_user_id, v_status FROM public.role_requests WHERE id = p_request_id;
  IF v_status != 'pending' THEN RAISE EXCEPTION 'Request is not pending'; END IF;
  IF p_approved THEN
    UPDATE public.role_requests SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now() WHERE id = p_request_id;
    UPDATE public.profiles SET role = 'teacher', updated_at = now() WHERE id = v_user_id;
  ELSE
    UPDATE public.role_requests SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now() WHERE id = p_request_id;
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.grade_submission(
  p_submission_id UUID, p_score INTEGER, p_feedback TEXT DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID; v_content_item_id UUID; v_topic_id INTEGER; v_xp INTEGER;
BEGIN
  IF NOT public.is_teacher_or_admin() THEN RAISE EXCEPTION 'Only teachers and admins can grade submissions'; END IF;
  IF p_score < 0 OR p_score > 100 THEN RAISE EXCEPTION 'Score must be between 0 and 100'; END IF;
  IF p_feedback IS NOT NULL AND length(p_feedback) > 2000 THEN RAISE EXCEPTION 'Feedback must not exceed 2000 characters'; END IF;
  SELECT user_id, content_item_id INTO v_user_id, v_content_item_id FROM public.submissions WHERE id = p_submission_id AND status = 'pending';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Submission not found or already graded'; END IF;
  v_xp := round((p_score::numeric / 100) * 50);
  UPDATE public.submissions SET score = p_score, feedback = p_feedback, graded_by = auth.uid(),
    graded_at = now(), status = 'graded', updated_at = now() WHERE id = p_submission_id;
  SELECT topic_id INTO v_topic_id FROM public.content_items WHERE id = v_content_item_id;
  INSERT INTO public.practice_results (user_id, topic_id, content_item_id, score, max_score, xp_earned)
  VALUES (v_user_id, COALESCE(v_topic_id, 0), v_content_item_id, p_score, 100, v_xp);
END; $$;

GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_own_profile(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_diagnostic(INTEGER, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_role_request() TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_role_request(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grade_submission(UUID, INTEGER, TEXT) TO authenticated;

-- ============================================================================
-- 10. AUTH TRIGGER (yangi user -> profil avtomatik yaratiladi)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE base_username TEXT; final_username TEXT;
BEGIN
  base_username := lower(regexp_replace(
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'student'),
    '[^a-z0-9_]+', '_', 'g'));
  IF base_username IS NULL OR length(base_username) = 0 THEN base_username := 'student'; END IF;
  final_username := base_username;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = final_username) THEN
    final_username := final_username || '_' || substr(NEW.id::text, 1, 8);
  END IF;
  INSERT INTO public.profiles (id, username, full_name, avatar_emoji, group_name, role)
  VALUES (NEW.id, final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', final_username),
    COALESCE(NEW.raw_user_meta_data->>'avatar_emoji', '🎯'),
    COALESCE(NEW.raw_user_meta_data->>'group_name', ''), 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 11. LEADERBOARD VIEW
-- ============================================================================
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
  p.id AS user_id, p.full_name, p.avatar_emoji, p.group_name, p.diagnostic_score,
  COALESCE(q.total_quiz_xp, 0) AS total_quiz_xp,
  COALESCE(q.total_quizzes, 0) AS total_quizzes,
  COALESCE(q.avg_quiz_percentage, 0) AS avg_quiz_percentage,
  COALESCE(pr.total_practice_xp, 0) AS total_practice_xp,
  COALESCE(pr.total_practices, 0) AS total_practices,
  (COALESCE(q.total_quiz_xp, 0) + COALESCE(pr.total_practice_xp, 0) + COALESCE(p.diagnostic_score, 0)) AS total_xp,
  COALESCE(q.unique_topics, 0) AS topics_completed,
  GREATEST(1, FLOOR((COALESCE(q.total_quiz_xp, 0) + COALESCE(pr.total_practice_xp, 0) + COALESCE(p.diagnostic_score, 0)) / 100) + 1) AS level,
  p.created_at
FROM public.profiles p
LEFT JOIN (
  SELECT user_id, SUM(xp_earned) AS total_quiz_xp, COUNT(*) AS total_quizzes,
         ROUND(AVG(percentage), 2) AS avg_quiz_percentage,
         COUNT(DISTINCT COALESCE(content_item_id::text, topic_id::text)) AS unique_topics
  FROM public.quiz_results GROUP BY user_id
) q ON q.user_id = p.id
LEFT JOIN (
  SELECT user_id, SUM(xp_earned) AS total_practice_xp, COUNT(*) AS total_practices
  FROM public.practice_results GROUP BY user_id
) pr ON pr.user_id = p.id
WHERE p.role = 'student'
ORDER BY total_xp DESC;

-- ============================================================================
-- 12. STORAGE BUCKET (practice-files) + RLS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('practice-files', 'practice-files', false, 10485760,
  ARRAY['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "practice_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "practice_files_update" ON storage.objects;
DROP POLICY IF EXISTS "practice_files_select" ON storage.objects;
DROP POLICY IF EXISTS "practice_files_delete" ON storage.objects;

CREATE POLICY "practice_files_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'practice-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "practice_files_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'practice-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "practice_files_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'practice-files' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_teacher_or_admin()));
CREATE POLICY "practice_files_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'practice-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- 13. ADMIN AVTOMATIK YARATISH
--   Email: admin@digitaledu.uz | Parol: DigitalEdu2024!Admin
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DO $$
DECLARE admin_uid UUID;
BEGIN
  -- Eski admin bo'lsa tozalash
  DELETE FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@digitaledu.uz');
  DELETE FROM auth.identities WHERE provider_id IN (SELECT id::text FROM auth.users WHERE email = 'admin@digitaledu.uz');
  DELETE FROM auth.users WHERE email = 'admin@digitaledu.uz';

  admin_uid := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', admin_uid, 'authenticated', 'authenticated',
    'admin@digitaledu.uz', crypt('DigitalEdu2024!Admin', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Admin Rahimov","username":"admin","avatar_emoji":"👑","group_name":"Administrators"}'::jsonb,
    now(), now(), '', '', ''
  );

  -- MUHIM: identities (login ishlashi uchun shart)
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), admin_uid, admin_uid::text,
    jsonb_build_object('sub', admin_uid::text, 'email', 'admin@digitaledu.uz', 'email_verified', true, 'provider', 'email'),
    'email', now(), now(), now()
  );

  -- Admin profili
  INSERT INTO public.profiles (id, username, full_name, avatar_emoji, group_name, role)
  VALUES (admin_uid, 'admin', 'Admin Rahimov', '👑', 'Administrators', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin';
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 14. SCHEMA CACHE YANGILASH (PostgREST funksiyalarni darrov ko'rishi uchun)
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- ✅ TAYYOR! Endi ilovaga kiring:
--   Email:  admin@digitaledu.uz
--   Parol:  DigitalEdu2024!Admin
-- ============================================================================
