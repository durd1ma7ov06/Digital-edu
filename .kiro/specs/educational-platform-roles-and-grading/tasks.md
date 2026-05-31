# Implementation Plan: Educational Platform Roles and Grading

## Overview

This plan implements role management, teacher role request workflow, practice file upload with grading, and XP-based leaderboard integration. The implementation builds on existing Supabase infrastructure (profiles, content_items, submissions, leaderboard_view) and uses React + Vite + TypeScript + Supabase + Tailwind + Zustand.

## Tasks

- [x] 1. Database migration and RPC functions
  - [x] 1.1 Create role_requests table, indexes, and RLS policies migration
    - Create `src/migrations/002_role_requests.sql` with the role_requests table schema
    - Include partial unique index for pending requests, status and user indexes
    - Add RLS policies: students see own, admins see all, students insert own, admins update
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 1.2 Create RPC functions migration for role requests and grading
    - Create `src/migrations/003_rpc_functions.sql`
    - Implement `submit_role_request()` RPC (student-only, duplicate check)
    - Implement `review_role_request(p_request_id UUID, p_approved BOOLEAN)` RPC (admin-only)
    - Implement `grade_submission(p_submission_id UUID, p_score INTEGER, p_feedback TEXT)` RPC (teacher/admin-only, XP calculation, practice_results insert)
    - Add GRANT EXECUTE for all three functions to authenticated role
    - _Requirements: 2.1, 2.4, 2.5, 6.2, 6.3, 7.1, 7.2_

  - [x] 1.3 Create storage bucket policies migration
    - Create `src/migrations/004_storage_policies.sql`
    - Define `practice-files` bucket configuration
    - Add INSERT, UPDATE, SELECT, DELETE RLS policies for storage.objects
    - _Requirements: 5.3, 5.5_

- [x] 2. TypeScript types and utility functions
  - [x] 2.1 Create RoleRequest types
    - Create `src/types/roleRequest.ts` with `RoleRequest` and `RoleRequestWithProfile` interfaces
    - _Requirements: 2.1, 2.6_

  - [x] 2.2 Create file validation utility
    - Create `src/utils/fileValidation.ts` with `validatePracticeFile()` function
    - Validate file extension (.doc, .docx only) and size (≤10 MB) and empty file check
    - Export `FileValidationResult` type (reuse from types/submission.ts)
    - _Requirements: 5.1, 5.2_

  - [x] 2.3 Create XP calculation utility
    - Create `src/utils/xpCalculation.ts` with `calculatePracticeXp(score: number): number`
    - Formula: `Math.round((score / 100) * 50)`
    - _Requirements: 7.2_

  - [ ]* 2.4 Write property test for file validation (Property 9, 10)
    - **Property 9: File extension validation** — validatePracticeFile returns valid=true iff extension is .doc or .docx
    - **Property 10: File size validation** — files > 10MB return valid=false
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 2.5 Write property test for XP calculation (Property 15)
    - **Property 15: XP formula correctness** — for any score in [0,100], calculatePracticeXp(score) === Math.round((score/100)*50) and result is in [0,50]
    - **Validates: Requirements 7.2**

- [x] 3. Checkpoint - Ensure types and utilities compile
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Zustand stores
  - [x] 4.1 Create useRoleRequestStore
    - Create `src/store/useRoleRequestStore.ts`
    - Implement: `myRequest`, `allRequests`, `loading` state
    - Implement: `fetchMyRequest()`, `submitRequest()`, `fetchAllRequests()`, `reviewRequest()`
    - Use `submit_role_request` and `review_role_request` RPCs
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6_

  - [x] 4.2 Create useSubmissionStore
    - Create `src/store/useSubmissionStore.ts`
    - Implement: `submissions`, `mySubmissions`, `loading`, `filters` state
    - Implement: `fetchAllSubmissions()` with profile/content_item joins
    - Implement: `fetchMySubmissions()` for student's own submissions
    - Implement: `setFilters()` for status, group, contentItemId filtering
    - Implement: `uploadFile(file, contentItemId)` — validate, upload to storage, upsert submission record
    - Implement: `gradeSubmission(submissionId, score, feedback)` — call grade_submission RPC
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4_

- [x] 5. New pages implementation
  - [x] 5.1 Create RoleRequestPage
    - Create `src/pages/RoleRequestPage.tsx`
    - Show current request status (pending/approved/rejected) or submit button
    - Call `useRoleRequestStore.submitRequest()` on form submit
    - Allow re-request if previously rejected
    - _Requirements: 2.1, 2.3, 2.6_

  - [x] 5.2 Create AdminRoleRequests page
    - Create `src/pages/AdminRoleRequests.tsx`
    - List all pending role requests with student name, group, date
    - Approve/reject buttons calling `useRoleRequestStore.reviewRequest()`
    - _Requirements: 2.4, 2.5_

  - [x] 5.3 Create TeacherGrading page
    - Create `src/pages/TeacherGrading.tsx`
    - Display filterable list of submissions (SubmissionFilters component)
    - Show submission details with file download link (signed URL)
    - Integrate GradingForm component for score + feedback entry
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 5.4 Create StudentSubmissions page
    - Create `src/pages/StudentSubmissions.tsx`
    - Show student's own submission history with status, score, feedback
    - Use SubmissionCard component for each entry
    - _Requirements: 5.4, 6.3_

- [x] 6. Reusable components
  - [x] 6.1 Create FileUploadButton component
    - Create `src/components/FileUploadButton.tsx`
    - File picker with .doc/.docx filter, client-side validation via `validatePracticeFile()`
    - Show inline error for invalid file type or size
    - Display upload progress and success/error state
    - _Requirements: 5.1, 5.2, 5.6_

  - [x] 6.2 Create SubmissionCard component
    - Create `src/components/SubmissionCard.tsx`
    - Display submission status badge (pending/graded), score, feedback, file name, date
    - _Requirements: 6.3_

  - [x] 6.3 Create GradingForm component
    - Create `src/components/GradingForm.tsx`
    - Score input (0-100) with validation, feedback textarea (max 2000 chars)
    - Submit button calling `useSubmissionStore.gradeSubmission()`
    - Show calculated XP preview using `calculatePracticeXp()`
    - _Requirements: 6.2, 7.2_

  - [x] 6.4 Create RoleRequestStatus component
    - Create `src/components/RoleRequestStatus.tsx`
    - Badge component showing pending (yellow), approved (green), rejected (red) status
    - _Requirements: 2.6_

  - [x] 6.5 Create SubmissionFilters component
    - Create `src/components/SubmissionFilters.tsx`
    - Dropdown filters: status (all/pending/graded), group, content item
    - Calls `useSubmissionStore.setFilters()` on change
    - _Requirements: 6.4_

- [x] 7. Checkpoint - Ensure all new pages and components compile
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integration with existing pages and routing
  - [x] 8.1 Update App.tsx with new routes
    - Add `/request-teacher` route (student access)
    - Add `/admin/role-requests` route (admin access)
    - Add `/teacher/grading` route (teacher, admin access)
    - Add `/submissions` route (student access)
    - Import and wire new page components
    - _Requirements: 2.1, 2.4, 6.1_

  - [x] 8.2 Update AdminPanel with role requests tab
    - Add "Role Requests" tab/section to `src/pages/AdminPanel.tsx`
    - Show pending request count badge
    - Link to `/admin/role-requests` page
    - _Requirements: 2.4, 2.5_

  - [x] 8.3 Update TeacherPanel with grading section
    - Add "Grading" section to `src/pages/TeacherPanel.tsx`
    - Show pending submissions count
    - Link to `/teacher/grading` page
    - _Requirements: 6.1_

  - [x] 8.4 Update PracticePlay and CustomPracticePlay with file upload
    - Add FileUploadButton section to `src/pages/PracticePlay.tsx`
    - Add FileUploadButton section to `src/pages/CustomPracticePlay.tsx`
    - Wire upload to `useSubmissionStore.uploadFile()`
    - Show existing submission status if already uploaded
    - _Requirements: 5.1, 5.3, 5.4, 5.5_

  - [x] 8.5 Update Settings page with role request button
    - Add "Request Teacher Role" button for students in `src/pages/Settings.tsx`
    - Show current request status if one exists
    - Link to `/request-teacher` page or trigger inline
    - _Requirements: 2.1, 2.6_

  - [x] 8.6 Update Sidebar navigation
    - Add "Submissions" link for students in `src/components/Sidebar.tsx`
    - Add "Grading" link for teachers in sidebar
    - Add "Role Requests" link for admins in sidebar
    - _Requirements: 2.4, 6.1_

- [x] 9. Checkpoint - Ensure full integration compiles and routes work
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 10. Property-based tests for business logic
  - [ ]* 10.1 Write property test for role request state transitions (Property 4)
    - **Property 4: Role request review state transitions** — approve sets status='approved' and role='teacher'; reject sets status='rejected' and role unchanged
    - **Validates: Requirements 2.4, 2.5**

  - [ ]* 10.2 Write property test for duplicate request prevention (Property 3)
    - **Property 3: Duplicate pending request prevention** — student with pending request cannot create another; count remains exactly one
    - **Validates: Requirements 2.3**

  - [ ]* 10.3 Write property test for grading field population (Property 13)
    - **Property 13: Grading populates all fields and transitions status** — after grading, status='graded', score/feedback/graded_by/graded_at all set
    - **Validates: Requirements 6.2, 6.3**

  - [ ]* 10.4 Write property test for leaderboard ordering (Property 16)
    - **Property 16: Leaderboard ordering invariant** — for any two adjacent entries, first.total_xp >= second.total_xp
    - **Validates: Requirements 8.2**

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The SQL migrations (tasks 1.1–1.3) should be run in Supabase SQL Editor before frontend work
- The `practice-files` storage bucket must be created in Supabase Dashboard
- Existing `001_submissions.sql` migration is already applied — no changes needed

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "2.1", "2.2", "2.3"] },
    { "id": 1, "tasks": ["2.4", "2.5", "4.1", "4.2"] },
    { "id": 2, "tasks": ["5.1", "5.2", "5.3", "5.4", "6.1", "6.2", "6.3", "6.4", "6.5"] },
    { "id": 3, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 4, "tasks": ["10.1", "10.2", "10.3", "10.4"] }
  ]
}
```
