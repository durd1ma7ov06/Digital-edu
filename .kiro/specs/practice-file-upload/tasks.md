# Implementation Plan: Practice File Upload

## Overview

Implement a file upload system for practice assignments in DigitalEdu. Students upload Word/PDF files, teachers grade them via a dedicated panel, and scores integrate with the leaderboard as "File XP". The implementation uses Supabase Storage for files, a new `submissions` table with RLS, and a dedicated Zustand store.

## Tasks

- [ ] 1. Database schema and storage setup
  - [x] 1.1 Create submissions table, indexes, RLS policies, and auto-update trigger
    - Create the `submissions` table with all fields, constraints, and unique constraint on (user_id, content_item_id)
    - Create indexes on user_id, content_item_id, and status
    - Enable RLS and create policies for student select/insert/update and teacher update
    - Create the `update_submission_timestamp` trigger function
    - Output as a SQL migration file at `src/migrations/001_submissions.sql`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 1.2 Update leaderboard view to include File XP
    - Modify the `leaderboard_view` to join with submissions table and calculate `total_file_xp` as `SUM(FLOOR(score * 0.5))`
    - Add `total_file_xp` to the view columns and include it in total_xp calculation
    - Output as `src/migrations/002_leaderboard_file_xp.sql`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 1.3 Create Supabase storage bucket configuration
    - Document the bucket setup: name `submissions`, path pattern `{user_id}/{content_item_id}/{filename}`
    - Create storage policies for authenticated upload (own path only), teacher/admin download (any), student download (own only)
    - Output as `src/migrations/003_storage_bucket.sql`
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ] 2. Core types and validation logic
  - [x] 2.1 Create submission types and interfaces
    - Create `src/types/submission.ts` with `Submission`, `SubmissionWithProfile`, `FileValidationResult`, and `GradingFilters` interfaces
    - _Requirements: 6.1, 2.1_

  - [ ] 2.2 Implement file validation functions
    - Create `src/lib/fileValidation.ts` with `validateFileExtension`, `validateFileSize`, `validateFileName`, `validateFile` functions
    - Define constants: `ALLOWED_EXTENSIONS`, `MAX_FILE_SIZE`, `MAX_FILE_NAME_LENGTH`
    - _Requirements: 1.2, 1.3, 5.6_

  - [ ] 2.3 Implement score validation and XP calculation
    - Add `validateScore` and `calculateFileXP` functions to `src/lib/fileValidation.ts`
    - `calculateFileXP` returns `Math.floor(score * 0.5)`
    - _Requirements: 3.4, 4.2, 4.5_

  - [ ] 2.4 Write property test for file extension validation
    - **Property 1: File extension validation**
    - **Validates: Requirements 1.2, 5.6**

  - [ ] 2.5 Write property test for file size validation
    - **Property 2: File size validation**
    - **Validates: Requirements 1.3, 5.6, 6.4**

  - [ ] 2.6 Write property test for score validation
    - **Property 3: Score validation**
    - **Validates: Requirements 3.4, 4.5**

  - [ ] 2.7 Write property test for XP calculation consistency
    - **Property 5: XP calculation consistency**
    - **Validates: Requirements 4.2, 4.4**

- [ ] 3. Submission store
  - [ ] 3.1 Create useSubmissionStore with student actions
    - Create `src/store/useSubmissionStore.ts` using Zustand
    - Implement `fetchMySubmission`, `fetchMySubmissions`, and `submitFile` actions
    - Handle file upload to Supabase Storage with progress tracking
    - Handle re-upload: delete old file from storage before uploading new one
    - Upsert submission record in database
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 5.4_

  - [ ] 3.2 Add teacher actions to useSubmissionStore
    - Implement `fetchSubmissions` with filter support (status, group, contentItemId)
    - Implement `getDownloadUrl` using Supabase signed URLs
    - Implement `gradeSubmission` to update score, feedback, status, graded_by, graded_at
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.7_

  - [ ] 3.3 Write property test for filter correctness
    - **Property 4: Filter correctness**
    - **Validates: Requirements 3.7**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Student UI components
  - [ ] 5.1 Create FileUploadPanel component
    - Create `src/components/FileUploadPanel.tsx`
    - Implement file picker with drag-and-drop support
    - Show validation errors for invalid file type or size
    - Display upload progress indicator
    - Disable submit button during upload
    - Show retry button on network/server error without losing file reference
    - Handle session expiry with redirect to `/auth`
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 1.8_

  - [ ] 5.2 Create SubmissionStatus component
    - Create `src/components/SubmissionStatus.tsx`
    - Display submission status badge: "not submitted", "pending", "graded"
    - Show score (0-100) and feedback text when graded
    - Show submission date/time when pending
    - _Requirements: 2.1, 2.2, 2.5_

  - [ ] 5.3 Integrate FileUploadPanel and SubmissionStatus into PracticePlay page
    - Add FileUploadPanel to `src/pages/PracticePlay.tsx` for practice assignments
    - Show SubmissionStatus alongside the upload panel
    - Display error message with retry on network failures
    - _Requirements: 1.1, 2.1, 2.4_

  - [ ] 5.4 Update Practices page to show submission statuses
    - Modify `src/pages/Practices.tsx` to fetch and display submission statuses for all practice assignments
    - Sort assignments by creation date descending
    - Show loading and error states
    - _Requirements: 2.3, 2.4_

  - [ ] 5.5 Write property test for assignment list sort order
    - **Property 6: Assignment list sort order**
    - **Validates: Requirements 2.3**

- [ ] 6. Teacher grading UI
  - [ ] 6.1 Create GradingFilters component
    - Create `src/components/GradingFilters.tsx`
    - Filter by status (all, pending, graded), group, and practice assignment
    - _Requirements: 3.7, 3.8_

  - [ ] 6.2 Create GradingPanel component
    - Create `src/components/GradingPanel.tsx`
    - Display list of submissions with student name, group, assignment title, submission date
    - Sort by submission date descending (newest first)
    - Provide download link for uploaded files
    - Show error when file is unavailable, disable download link
    - Score input with validation (integer 0-100) and inline error messages
    - Feedback textarea (max 2000 characters)
    - Allow updating previously graded submissions
    - Show "Topshiriqlar topilmadi" when no submissions match filters
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8_

  - [ ] 6.3 Integrate GradingPanel into TeacherPanel page
    - Add grading section to `src/pages/TeacherPanel.tsx`
    - Wire GradingFilters and GradingPanel together
    - _Requirements: 3.1_

- [ ] 7. Leaderboard integration
  - [ ] 7.1 Update Leaderboard page to display File XP column
    - Modify `src/pages/Leaderboard.tsx` to show "File XP" as a separate column
    - Include file XP in total XP display
    - _Requirements: 4.3_

- [ ] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- SQL migration files should be run against Supabase in order (001, 002, 003)
- The project uses TypeScript, React, Supabase, Zustand, and Tailwind CSS
- Test dependencies (vitest, fast-check, @testing-library/react) need to be installed before running tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.2", "2.3"] },
    { "id": 2, "tasks": ["2.4", "2.5", "2.6", "2.7", "3.1"] },
    { "id": 3, "tasks": ["3.2", "5.1", "5.2"] },
    { "id": 4, "tasks": ["3.3", "5.3", "5.4", "6.1"] },
    { "id": 5, "tasks": ["5.5", "6.2"] },
    { "id": 6, "tasks": ["6.3", "7.1"] }
  ]
}
```
