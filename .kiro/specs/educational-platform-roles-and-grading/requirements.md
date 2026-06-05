# Requirements Document

## Introduction

This feature consolidates the educational platform's role management, teacher role request workflow, practice file upload with grading, and XP-based leaderboard system. It builds on the existing Supabase infrastructure (profiles table, RLS policies, auth trigger, leaderboard_view) to deliver a complete roles-and-grading pipeline for the DigitalEdu platform.

## Glossary

- **Platform**: The DigitalEdu web application (React + Vite + TypeScript + Supabase)
- **Student**: A registered user with the default 'student' role who completes quizzes, practices, and uploads assignments
- **Teacher**: A user with the 'teacher' role who reviews and grades student submissions
- **Admin**: A user with the 'admin' role who manages content, approves role requests, and assigns roles
- **Role_Request**: A database record representing a student's request to become a teacher, pending admin approval
- **Submission**: A file upload record linked to a practice content item, containing file metadata, status, score, and feedback
- **Leaderboard**: A ranked view of students ordered by total XP (quiz_xp + practice_xp + diagnostic_score)
- **XP**: Experience points earned from graded submissions, quizzes, and diagnostic tests
- **Supabase_Storage**: The file storage service used for hosting uploaded practice files
- **RPC**: Remote Procedure Call function exposed by Supabase for secure server-side operations

## Requirements

### Requirement 1: Default Student Role Assignment

**User Story:** As a new user, I want to be automatically assigned the student role upon registration, so that I can immediately access student features without manual intervention.

#### Acceptance Criteria

1. WHEN a new user completes registration, THE Platform SHALL create a profile record with the role set to 'student'
2. THE Platform SHALL assign the 'student' role via the auth trigger before the user's first session begins
3. IF the profile creation fails during registration, THEN THE Platform SHALL display an error message and prevent access to authenticated features

### Requirement 2: Teacher Role Request Workflow

**User Story:** As a student, I want to submit a request to become a teacher, so that an admin can review and approve my role upgrade.

#### Acceptance Criteria

1. WHEN a Student submits a role request, THE Platform SHALL create a Role_Request record with status 'pending' and the requesting user's ID
2. THE Platform SHALL allow only users with the 'student' role to submit a teacher role request
3. IF a Student already has a pending Role_Request, THEN THE Platform SHALL reject the duplicate request and inform the user
4. WHEN an Admin approves a Role_Request, THE Platform SHALL update the Role_Request status to 'approved' and change the user's profile role to 'teacher'
5. WHEN an Admin rejects a Role_Request, THE Platform SHALL update the Role_Request status to 'rejected'
6. THE Platform SHALL display the current status of a user's Role_Request (pending, approved, rejected) to that user

### Requirement 3: Admin Role Management

**User Story:** As an admin, I want to assign or change user roles via the set_user_role RPC, so that I can manage platform access without direct database manipulation.

#### Acceptance Criteria

1. WHEN an Admin calls the set_user_role RPC with a valid user ID and role, THE Platform SHALL update the target user's role in the profiles table
2. THE Platform SHALL restrict the set_user_role RPC to users with the 'admin' role only
3. IF a non-admin user attempts to call set_user_role, THEN THE Platform SHALL reject the request with an authorization error
4. THE Platform SHALL allow role assignment to 'teacher' or 'student' values only
5. THE Platform SHALL prevent changing the role of another admin user

### Requirement 4: Admin Content Management

**User Story:** As an admin, I want to create, read, update, and delete topics, tests, and practice exercises, so that I can manage all educational content on the platform.

#### Acceptance Criteria

1. THE Platform SHALL allow Admin users to create content items of type 'material', 'test', or 'practice'
2. WHEN an Admin creates a content item, THE Platform SHALL store the item with the admin's user ID as created_by
3. THE Platform SHALL allow Admin users to update any existing content item's title, description, body, questions, or practice fields
4. THE Platform SHALL allow Admin users to delete any content item
5. IF a non-admin user attempts to create, update, or delete a content item, THEN THE Platform SHALL reject the operation with an authorization error

### Requirement 5: Practice File Upload

**User Story:** As a student, I want to upload Word files for practice assignments, so that my teacher can review and grade my work.

#### Acceptance Criteria

1. WHEN a Student uploads a file for a practice assignment, THE Platform SHALL accept only files with .doc or .docx extensions
2. THE Platform SHALL reject uploaded files that exceed 10 MB in size
3. WHEN a valid file is uploaded, THE Platform SHALL store the file in Supabase_Storage and create a Submission record with status 'pending'
4. THE Platform SHALL associate each Submission with the uploading Student's user ID and the target content item ID
5. IF a Student already has a Submission for a given content item, THEN THE Platform SHALL replace the existing file and reset the Submission status to 'pending'
6. IF the file upload to Supabase_Storage fails, THEN THE Platform SHALL display an error message and retain no partial Submission record

### Requirement 6: Teacher Grading of Submissions

**User Story:** As a teacher, I want to review student submissions and assign a score with feedback, so that students receive evaluated results for their practice work.

#### Acceptance Criteria

1. THE Platform SHALL allow Teacher and Admin users to view all Submissions across all students
2. WHEN a Teacher grades a Submission, THE Platform SHALL record the score (0-100), feedback text (max 2000 characters), grading user ID, and grading timestamp
3. WHEN a Submission is graded, THE Platform SHALL update the Submission status from 'pending' to 'graded'
4. THE Platform SHALL allow Teachers to filter Submissions by status (pending, graded, all), student group, and content item
5. IF a non-teacher and non-admin user attempts to grade a Submission, THEN THE Platform SHALL reject the operation with an authorization error

### Requirement 7: XP Earned from Graded Submissions

**User Story:** As a student, I want to earn XP when my submission is graded, so that my effort is reflected on the leaderboard.

#### Acceptance Criteria

1. WHEN a Submission is graded, THE Platform SHALL add XP to the student's practice_xp total based on the score awarded
2. THE Platform SHALL calculate practice XP using the formula: xp_earned = round((score / 100) * 50)
3. THE Platform SHALL include practice XP from graded submissions in the leaderboard_view total_xp calculation

### Requirement 8: Leaderboard Visibility

**User Story:** As a user, I want to view the leaderboard showing all students ranked by total XP, so that I can see how I compare with peers.

#### Acceptance Criteria

1. THE Platform SHALL display the leaderboard to all authenticated users regardless of role
2. THE Platform SHALL rank students by total_xp in descending order, where total_xp equals quiz_xp + practice_xp + diagnostic_score
3. THE Platform SHALL show each student's full name, avatar emoji, group name, total XP, and level on the leaderboard
4. WHEN a new quiz result, practice result, or graded submission is recorded, THE Platform SHALL reflect the updated XP in the leaderboard within the next page load
