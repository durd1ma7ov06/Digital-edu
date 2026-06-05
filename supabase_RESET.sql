-- ============================================================================
-- DIGITALEDU — BAZANI TO'LIQ TOZALASH / RESET (POLNIY SBROS)
-- ============================================================================
-- DIQQAT!!! Bu fayl BARCHA narsani o'chiradi:
--   - barcha jadvallar, funksiyalar, view, trigger, storage
--   - BARCHA foydalanuvchilar (admin, teacher, student — hammasi)
--   - barcha yuklangan fayllar
--
-- Run qilgandan KEYIN supabase_full_setup.sql ni qaytadan run qiling.
-- ============================================================================

-- 1. Auth triggerni o'chirish
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Storage policy'larni o'chirish
DROP POLICY IF EXISTS "practice_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "practice_files_update" ON storage.objects;
DROP POLICY IF EXISTS "practice_files_select" ON storage.objects;
DROP POLICY IF EXISTS "practice_files_delete" ON storage.objects;
-- Eslatma: storage.objects'dan fayllar Storage API orqali o'chiriladi.
-- Bucket'ni o'chirish uchun avval Dashboard → Storage → practice-files → fayllarni qo'lda o'chiring,
-- yoki bucket'ni shundayligicha qoldiring (setup ON CONFLICT bilan qayta yaratmaydi).

-- 3. View o'chirish
DROP VIEW IF EXISTS public.leaderboard_view CASCADE;

-- 4. Barcha funksiyalarni o'chirish
DROP FUNCTION IF EXISTS public.set_user_role(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_own_profile(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.complete_diagnostic(INTEGER, INTEGER, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.submit_role_request() CASCADE;
DROP FUNCTION IF EXISTS public.review_role_request(UUID, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS public.grade_submission(UUID, INTEGER, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_teacher_or_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_submission_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.update_role_request_timestamp() CASCADE;

-- 5. Barcha jadvallarni o'chirish
DROP TABLE IF EXISTS public.role_requests CASCADE;
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.practice_results CASCADE;
DROP TABLE IF EXISTS public.quiz_results CASCADE;
DROP TABLE IF EXISTS public.diagnostic_results CASCADE;
DROP TABLE IF EXISTS public.content_items CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 6. BARCHA foydalanuvchilarni o'chirish (admin, teacher, student — hammasi)
DELETE FROM auth.identities;
DELETE FROM auth.users;

-- ============================================================================
-- ✅ BAZA TO'LIQ TOZALANDI!
-- Endi supabase_full_setup.sql ni qaytadan RUN qiling.
-- ============================================================================
