# Design Document: Educational Platform Roles and Grading

## Introduction

This document describes the technical architecture for implementing role management, teacher role request workflow, practice file upload with grading, and XP-based leaderboard integration for the DigitalEdu platform. The design builds on existing Supabase infrastructure (profiles, content_items, auth trigger, leaderboard_view, RLS policies) and adds new tables, storage buckets, RPC functions, and React components.

## Architecture Overview

The system follows a layered architecture:

```
┌─────────────────────────────────────────────────────────┐
│  React UI Layer (Pages + Components)                    │
├─────────────────────────────────────────────────────────┤
│  Zustand State Layer (Stores)                           │
├─────────────────────────────────────────────────────────┤
│  Supabase Client SDK (supabase-js)                      │
├─────────────────────────────────────────────────────────┤
│  Supabase Backend (Auth, Database, Storage, RPC, RLS)   │
└─────────────────────────────────────────────────────────┘
```

All authorization is enforced at the database level via RLS policies and SECURITY DEFINER RPC functions. The frontend respects role-based routing but does not rely on it for security.

## Database Schema Changes

### New Table: `role_requests`

```sql
CREATE TABLE IF NOT EXISTS public.role_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, status) -- prevents duplicate pending requests via partial index below
);

-- Partial unique index: only one pending request per user at a time
CREATE UNIQUE INDEX idx_role_requests_pending_unique
  ON public.role_requests(user_id) WHERE status = 'pending';

CREATE INDEX idx_role_requests_status ON public.role_requests(status);
CREATE INDEX idx_role_requests_user ON public.role_requests(user_id);
```

### Existing Table: `submissions` (already defined in migration 001)

The `submissions` table from `001_submissions.sql` is used as-is. No schema changes needed.

### Leaderboard View Update

The existing `leaderboard_view` already aggregates `practice_results.xp_earned`. When a submission is graded, the grading RPC inserts a `practice_results` record with the calculated XP, making it automatically visible in the leaderboard.

## Supabase Storage Configuration

### Bucket: `practice-files`

```typescript
// Bucket configuration
const BUCKET_NAME = 'practice-files';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'application/msword',                                                    // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
];
```

**Storage path convention:** `{user_id}/{content_item_id}/{filename}`

**Storage RLS policies:**

```sql
-- Students can upload to their own folder
CREATE POLICY "practice_files_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'practice-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Students can update/replace their own files
CREATE POLICY "practice_files_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'practice-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Teachers/admins can read all files; students can read their own
CREATE POLICY "practice_files_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'practice-files'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_teacher_or_admin()
    )
  );

-- Students can delete their own files
CREATE POLICY "practice_files_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'practice-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

## RLS Policies for `role_requests`

```sql
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Students can view their own requests; admins can view all
CREATE POLICY "role_requests_select" ON public.role_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Only students can insert their own requests
CREATE POLICY "role_requests_insert" ON public.role_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student'
    )
  );

-- Only admins can update requests (approve/reject)
CREATE POLICY "role_requests_update" ON public.role_requests
  FOR UPDATE TO authenticated
  USING (public.is_admin());
```

## RPC Functions

### `submit_role_request()`

```sql
CREATE OR REPLACE FUNCTION public.submit_role_request()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role TEXT;
  v_request_id UUID;
BEGIN
  SELECT role INTO v_user_role FROM public.profiles WHERE id = auth.uid();

  IF v_user_role != 'student' THEN
    RAISE EXCEPTION 'Only students can submit role requests';
  END IF;

  IF EXISTS (SELECT 1 FROM public.role_requests WHERE user_id = auth.uid() AND status = 'pending') THEN
    RAISE EXCEPTION 'You already have a pending role request';
  END IF;

  INSERT INTO public.role_requests (user_id, status)
  VALUES (auth.uid(), 'pending')
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;
```

### `review_role_request(p_request_id UUID, p_approved BOOLEAN)`

```sql
CREATE OR REPLACE FUNCTION public.review_role_request(p_request_id UUID, p_approved BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_status TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can review role requests';
  END IF;

  SELECT user_id, status INTO v_user_id, v_status
  FROM public.role_requests WHERE id = p_request_id;

  IF v_status != 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  IF p_approved THEN
    UPDATE public.role_requests
    SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
    WHERE id = p_request_id;

    UPDATE public.profiles
    SET role = 'teacher', updated_at = now()
    WHERE id = v_user_id;
  ELSE
    UPDATE public.role_requests
    SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
    WHERE id = p_request_id;
  END IF;
END;
$$;
```

### `grade_submission(p_submission_id UUID, p_score INTEGER, p_feedback TEXT)`

```sql
CREATE OR REPLACE FUNCTION public.grade_submission(
  p_submission_id UUID,
  p_score INTEGER,
  p_feedback TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_content_item_id UUID;
  v_topic_id INTEGER;
  v_xp INTEGER;
BEGIN
  IF NOT public.is_teacher_or_admin() THEN
    RAISE EXCEPTION 'Only teachers and admins can grade submissions';
  END IF;

  IF p_score < 0 OR p_score > 100 THEN
    RAISE EXCEPTION 'Score must be between 0 and 100';
  END IF;

  IF p_feedback IS NOT NULL AND length(p_feedback) > 2000 THEN
    RAISE EXCEPTION 'Feedback must not exceed 2000 characters';
  END IF;

  SELECT user_id, content_item_id INTO v_user_id, v_content_item_id
  FROM public.submissions WHERE id = p_submission_id AND status = 'pending';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Submission not found or already graded';
  END IF;

  -- Calculate XP: round((score / 100) * 50)
  v_xp := round((p_score::numeric / 100) * 50);

  -- Update submission
  UPDATE public.submissions
  SET score = p_score, feedback = p_feedback, graded_by = auth.uid(),
      graded_at = now(), status = 'graded', updated_at = now()
  WHERE id = p_submission_id;

  -- Get topic_id from content_item
  SELECT topic_id INTO v_topic_id FROM public.content_items WHERE id = v_content_item_id;

  -- Insert practice result for leaderboard XP
  INSERT INTO public.practice_results (user_id, topic_id, content_item_id, score, max_score, xp_earned)
  VALUES (v_user_id, COALESCE(v_topic_id, 0), v_content_item_id, p_score, 100, v_xp);
END;
$$;
```

### Grant Execution

```sql
GRANT EXECUTE ON FUNCTION public.submit_role_request() TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_role_request(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grade_submission(UUID, INTEGER, TEXT) TO authenticated;
```

## Zustand Store Updates

### New Store: `useSubmissionStore.ts`

```typescript
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Submission, SubmissionWithProfile, GradingFilters } from '../types/submission';

interface SubmissionState {
  submissions: SubmissionWithProfile[];
  mySubmissions: Submission[];
  loading: boolean;
  filters: GradingFilters;

  fetchAllSubmissions: () => Promise<void>;
  fetchMySubmissions: () => Promise<void>;
  setFilters: (filters: Partial<GradingFilters>) => void;
  uploadFile: (file: File, contentItemId: string) => Promise<{ error: string | null }>;
  gradeSubmission: (submissionId: string, score: number, feedback: string) => Promise<{ error: string | null }>;
}
```

### New Store: `useRoleRequestStore.ts`

```typescript
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface RoleRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  profiles?: { full_name: string; group_name: string; avatar_emoji: string };
}

interface RoleRequestState {
  myRequest: RoleRequest | null;
  allRequests: RoleRequest[];
  loading: boolean;

  fetchMyRequest: () => Promise<void>;
  submitRequest: () => Promise<{ error: string | null }>;
  fetchAllRequests: () => Promise<void>;
  reviewRequest: (requestId: string, approved: boolean) => Promise<{ error: string | null }>;
}
```

### Auth Store Update

The existing `useAuthStore` will have its `fetchProfile` method called after role request approval to refresh the local role state. No structural changes needed.

## Components and Pages

### New Pages

| Page | Route | Role Access | Purpose |
|------|-------|-------------|---------|
| `RoleRequestPage` | `/request-teacher` | student | Submit and view role request status |
| `AdminRoleRequests` | `/admin/role-requests` | admin | List and approve/reject pending role requests |
| `TeacherGrading` | `/teacher/grading` | teacher, admin | View and grade student submissions |
| `StudentSubmissions` | `/submissions` | student | View own submission history with grades |

### New Components

| Component | Purpose |
|-----------|---------|
| `FileUploadButton` | File picker with .doc/.docx validation and size check |
| `SubmissionCard` | Displays submission status, score, feedback |
| `GradingForm` | Score input (0-100), feedback textarea, submit button |
| `RoleRequestStatus` | Badge showing pending/approved/rejected status |
| `SubmissionFilters` | Dropdowns for status, group, content item filtering |

### Updated Pages

| Page | Changes |
|------|---------|
| `AdminPanel` | Add "Role Requests" tab with pending count badge |
| `TeacherPanel` | Add "Grading" section with pending submissions count |
| `PracticePlay` / `CustomPracticePlay` | Add file upload section for practice content items |
| `Settings` | Show "Request Teacher Role" button for students |

## File Upload Flow

```
Student selects file
  → Client validates extension (.doc/.docx) and size (≤10MB)
  → If existing submission for this content_item:
      → Delete old file from storage
      → Upload new file to `practice-files/{user_id}/{content_item_id}/{filename}`
      → Upsert submission record (status reset to 'pending')
  → If no existing submission:
      → Upload file to `practice-files/{user_id}/{content_item_id}/{filename}`
      → Insert submission record (status='pending')
  → If storage upload fails:
      → Show error toast
      → No DB record created/modified
```

## Grading Flow

```
Teacher opens grading panel
  → Fetches submissions with profile and content_item joins
  → Applies filters (status, group, content_item)
  → Selects a submission
  → Downloads/previews file via signed URL
  → Enters score (0-100) and feedback (≤2000 chars)
  → Calls grade_submission RPC
  → RPC atomically:
      1. Updates submission (score, feedback, graded_by, graded_at, status='graded')
      2. Calculates XP: round((score/100) * 50)
      3. Inserts practice_results record with xp_earned
  → Leaderboard view automatically reflects new XP on next query
```

## Role Request Flow

```
Student opens role request page
  → Fetches current request status (if any)
  → If no pending request: shows "Request Teacher Role" button
  → If pending: shows "Pending" status
  → If rejected: shows "Rejected" status, allows re-request
  → On submit: calls submit_role_request() RPC
  → Admin sees pending requests in admin panel
  → Admin approves/rejects via review_role_request() RPC
  → On approval: user's profile.role changes to 'teacher'
  → Next time user loads app, auth store refreshes profile with new role
```

## Error Handling

| Error Scenario | Handling Strategy |
|---------------|-------------------|
| File too large | Client-side validation, show inline error before upload |
| Invalid file type | Client-side validation on file extension |
| Storage upload failure | Catch error, show toast, no DB record created |
| Duplicate role request | RPC raises exception, store maps to user-friendly message |
| Unauthorized grading attempt | RLS/RPC rejects, frontend hides grading UI for non-teachers |
| Network timeout during upload | Show retry button, no partial state |
| Score out of range | Client-side validation + RPC validation (belt and suspenders) |

## Data Models (TypeScript)

### RoleRequest Type

```typescript
export interface RoleRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleRequestWithProfile extends RoleRequest {
  profiles: {
    full_name: string;
    group_name: string;
    avatar_emoji: string;
  };
}
```

### File Validation Utility

```typescript
export function validatePracticeFile(file: File): FileValidationResult {
  const allowedExtensions = ['.doc', '.docx'];
  const maxSize = 10 * 1024 * 1024; // 10 MB

  const extension = '.' + file.name.split('.').pop()?.toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: 'Only .doc and .docx files are accepted' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must not exceed 10 MB' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
}
```

### XP Calculation

```typescript
export function calculatePracticeXp(score: number): number {
  return Math.round((score / 100) * 50);
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Role request creation produces pending record

*For any* student user who calls `submit_role_request()`, the resulting `role_requests` record SHALL have `status = 'pending'` and `user_id` equal to the calling user's ID.

**Validates: Requirements 2.1**

### Property 2: Only students can submit role requests

*For any* user with role != 'student' (teacher or admin), calling `submit_role_request()` SHALL raise an authorization error and create no record.

**Validates: Requirements 2.2**

### Property 3: Duplicate pending request prevention

*For any* student who already has a `role_requests` record with `status = 'pending'`, calling `submit_role_request()` SHALL raise an error and the number of pending requests for that user SHALL remain exactly one.

**Validates: Requirements 2.3**

### Property 4: Role request review state transitions

*For any* pending role request, calling `review_role_request(id, true)` SHALL set request status to 'approved' AND user's profile role to 'teacher'; calling `review_role_request(id, false)` SHALL set request status to 'rejected' AND leave the user's profile role unchanged.

**Validates: Requirements 2.4, 2.5**

### Property 5: set_user_role admin-only authorization

*For any* non-admin authenticated user, calling `set_user_role` SHALL raise an authorization error regardless of the target user or role parameters.

**Validates: Requirements 3.2, 3.3**

### Property 6: set_user_role accepts only valid roles

*For any* role string not in {'teacher', 'student'}, calling `set_user_role` (even by an admin) SHALL raise an error and leave the target profile unchanged.

**Validates: Requirements 3.4**

### Property 7: Admin users cannot be re-roled

*For any* target user who has `role = 'admin'`, calling `set_user_role` SHALL leave their role as 'admin' regardless of the requested role.

**Validates: Requirements 3.5**

### Property 8: Non-admin content mutation rejection

*For any* user with role != 'admin', attempting to INSERT, UPDATE, or DELETE on `content_items` SHALL be rejected by RLS policies.

**Validates: Requirements 4.5**

### Property 9: File extension validation

*For any* filename string, `validatePracticeFile` SHALL return `valid = true` if and only if the file extension (case-insensitive) is '.doc' or '.docx'.

**Validates: Requirements 5.1**

### Property 10: File size validation

*For any* file with `size > 10485760` bytes, `validatePracticeFile` SHALL return `valid = false` with a size error message.

**Validates: Requirements 5.2**

### Property 11: Valid upload creates correct submission

*For any* valid file upload by a student for a content item, the resulting `submissions` record SHALL have `user_id` equal to the student's ID, `content_item_id` equal to the target, and `status = 'pending'`.

**Validates: Requirements 5.3, 5.4**

### Property 12: Re-upload replaces and resets status

*For any* student who already has a submission for a content item, uploading a new file SHALL result in exactly one submission record for that (user_id, content_item_id) pair with `status = 'pending'` and the new file path.

**Validates: Requirements 5.5**

### Property 13: Grading populates all fields and transitions status

*For any* pending submission, calling `grade_submission(id, score, feedback)` with valid parameters SHALL set `status = 'graded'`, `score` to the given value, `feedback` to the given text, `graded_by` to the calling user's ID, and `graded_at` to a non-null timestamp.

**Validates: Requirements 6.2, 6.3**

### Property 14: Non-teacher grading rejection

*For any* user with role = 'student', calling `grade_submission` SHALL raise an authorization error and leave the submission unchanged.

**Validates: Requirements 6.5**

### Property 15: XP formula correctness

*For any* integer score in [0, 100], `calculatePracticeXp(score)` SHALL equal `Math.round((score / 100) * 50)`, producing a value in [0, 50].

**Validates: Requirements 7.2**

### Property 16: Leaderboard ordering invariant

*For any* two adjacent entries in the leaderboard result, the first entry's `total_xp` SHALL be greater than or equal to the second entry's `total_xp`.

**Validates: Requirements 8.2**

### Property 17: Leaderboard entry completeness

*For any* entry in the leaderboard result, the fields `full_name`, `avatar_emoji`, `group_name`, `total_xp`, and `level` SHALL all be non-null.

**Validates: Requirements 8.3**
