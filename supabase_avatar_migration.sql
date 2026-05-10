-- ============================================
-- AVATAR IMAGE MIGRATION
-- Bu SQL ni Supabase Dashboard -> SQL Editor ga nusxalab "Run" bosing
-- ============================================

-- 1. profiles jadvaliga avatar_url ustun qo'shish
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';

-- 2. leaderboard_view ni yangilash (avatar_url ni qo'shish)
-- Avval eski view ni o'chiramiz (ustun tartibini o'zgartirish uchun shart)
DROP VIEW IF EXISTS public.leaderboard_view;
CREATE VIEW public.leaderboard_view AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.avatar_emoji,
  p.avatar_url,
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


-- 3. Storage bucket yaratish (SQL orqali)
-- ESLATMA: Agar bu ishlamasa, Supabase Dashboard -> Storage -> New Bucket -> "avatars" yarating
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage RLS policies
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
