-- ============================================
-- LERNIFY CS - SUPABASE DATABASE SCHEMA
-- ============================================
-- Bu SQL ni Supabase Dashboard -> SQL Editor ga nusxalab "Run" bosing
-- ============================================


-- ============================================
-- 1. PROFILES TABLE
-- Har bir ro'yxatdan o'tgan foydalanuvchi uchun profil
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_emoji TEXT NOT NULL DEFAULT '🎯',
  group_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  diagnostic_completed BOOLEAN NOT NULL DEFAULT false,
  diagnostic_score INTEGER DEFAULT 0,
  diagnostic_total INTEGER DEFAULT 0,
  diagnostic_completed_at TIMESTAMPTZ
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view all profiles for leaderboard"
  ON public.profiles FOR SELECT
  USING (true);


-- ============================================
-- 2. DIAGNOSTIC RESULTS TABLE
-- Diagnostika testi natijalari
-- ============================================
CREATE TABLE IF NOT EXISTS public.diagnostic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  answers JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diagnostic results"
  ON public.diagnostic_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diagnostic results"
  ON public.diagnostic_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ============================================
-- 3. QUIZ RESULTS TABLE
-- Test natijalari (har bir topik, har bir bo'lim)
-- ============================================
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL,
  part_id INTEGER NOT NULL DEFAULT 1,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz results"
  ON public.quiz_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results"
  ON public.quiz_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view all quiz results for leaderboard"
  ON public.quiz_results FOR SELECT
  USING (true);


-- ============================================
-- 4. PRACTICE RESULTS TABLE
-- Amaliyot (practice/lab) natijalari
-- ============================================
CREATE TABLE IF NOT EXISTS public.practice_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id INTEGER NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 100,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own practice results"
  ON public.practice_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice results"
  ON public.practice_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view all practice results for leaderboard"
  ON public.practice_results FOR SELECT
  USING (true);


-- ============================================
-- 5. TRIGGER: Yangi user royxatdan otganda avtomatik profil yaratish
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_emoji)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_emoji', '🎯')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- 6. FUNCTION: Diagnostikani tugatish
-- ============================================
CREATE OR REPLACE FUNCTION public.complete_diagnostic(
  p_score INTEGER,
  p_total INTEGER,
  p_answers JSONB DEFAULT '[]'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.diagnostic_results (user_id, score, total_questions, percentage, answers)
  VALUES (
    auth.uid(),
    p_score,
    p_total,
    ROUND((p_score::NUMERIC / NULLIF(p_total, 0)) * 100, 2),
    p_answers
  );

  UPDATE public.profiles
  SET
    diagnostic_completed = true,
    diagnostic_score = p_score,
    diagnostic_total = p_total,
    diagnostic_completed_at = now(),
    updated_at = now()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 7. VIEW: Reyting jadvali (Leaderboard)
-- ============================================
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.avatar_emoji,
  p.group_name,
  p.diagnostic_score,
  COALESCE(quiz_stats.total_quiz_xp, 0) AS total_quiz_xp,
  COALESCE(quiz_stats.total_quizzes, 0) AS total_quizzes,
  COALESCE(quiz_stats.avg_quiz_percentage, 0) AS avg_quiz_percentage,
  COALESCE(practice_stats.total_practice_xp, 0) AS total_practice_xp,
  COALESCE(practice_stats.total_practices, 0) AS total_practices,
  (
    COALESCE(quiz_stats.total_quiz_xp, 0) +
    COALESCE(practice_stats.total_practice_xp, 0) +
    COALESCE(p.diagnostic_score, 0)
  ) AS total_xp,
  COALESCE(quiz_stats.unique_topics, 0) AS topics_completed,
  GREATEST(1, FLOOR(
    (COALESCE(quiz_stats.total_quiz_xp, 0) +
     COALESCE(practice_stats.total_practice_xp, 0) +
     COALESCE(p.diagnostic_score, 0)) / 100
  ) + 1) AS level,
  p.created_at
FROM public.profiles p
LEFT JOIN (
  SELECT
    user_id,
    SUM(xp_earned) AS total_quiz_xp,
    COUNT(*) AS total_quizzes,
    ROUND(AVG(percentage), 2) AS avg_quiz_percentage,
    COUNT(DISTINCT topic_id) AS unique_topics
  FROM public.quiz_results
  GROUP BY user_id
) quiz_stats ON quiz_stats.user_id = p.id
LEFT JOIN (
  SELECT
    user_id,
    SUM(xp_earned) AS total_practice_xp,
    COUNT(*) AS total_practices
  FROM public.practice_results
  GROUP BY user_id
) practice_stats ON practice_stats.user_id = p.id
WHERE p.diagnostic_completed = true
ORDER BY total_xp DESC;


-- ============================================
-- 8. INDEXES (tezlik uchun)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_topic_id ON public.quiz_results(topic_id);
CREATE INDEX IF NOT EXISTS idx_practice_results_user_id ON public.practice_results(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_results_user_id ON public.diagnostic_results(user_id);
