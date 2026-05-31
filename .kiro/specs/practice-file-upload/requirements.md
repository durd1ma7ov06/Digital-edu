# Requirements Document

## Introduction

Ushbu hujjat "DigitalEdu" ta'lim platformasida amaliyot topshiriqlari uchun fayl yuklash tizimini tavsiflaydi. Talabalar amaliyot vazifalariga Word/PDF fayllarini yuklaydilar, teacherlar esa ularni tekshirib ball qo'yadilar. Qo'yilgan ballar umumiy reyting tizimiga qo'shiladi va hammaga ko'rinadi.

## Glossary

- **Platform**: DigitalEdu React + Supabase ta'lim ilovasi
- **File_Upload_System**: Talabalar amaliyot fayllari yuklash uchun mas'ul tizim komponenti
- **Grading_System**: Teacherlar fayl tekshirib ball qo'yish uchun mas'ul tizim komponenti
- **Leaderboard_Service**: Barcha ballarni yig'ib reyting ko'rsatuvchi xizmat
- **Storage_Bucket**: Supabase Storage'da fayllar saqlanadigan joy (bucket)
- **Submission**: Talaba tomonidan yuklangan bitta fayl va unga tegishli metadata
- **Student**: Ro'yxatdan o'tgan va "student" roliga ega foydalanuvchi
- **Teacher**: Admin tomonidan "teacher" roli berilgan foydalanuvchi
- **Admin**: Tizimni boshqaruvchi foydalanuvchi
- **Practice_Assignment**: Admin tomonidan yaratilgan amaliyot vazifasi (content_items jadvalidagi practice tipidagi yozuv)

## Requirements

### Requirement 1: Practice Assignment File Upload

**User Story:** As a Student, I want to upload a Word or PDF file for a practice assignment, so that my teacher can review my work and give me a grade.

#### Acceptance Criteria

1. WHEN a Student selects a Practice_Assignment, THE File_Upload_System SHALL display a file upload interface with a file picker and submit button.
2. WHEN a Student selects a file for upload, THE File_Upload_System SHALL accept only files with .doc, .docx, or .pdf extensions and reject any file with a different extension by displaying an error message indicating the allowed file types.
3. WHEN a Student selects a file larger than 10 MB, THE File_Upload_System SHALL display an error message indicating the maximum allowed file size of 10 MB and prevent the file from being submitted.
4. WHEN a Student submits a valid file, THE File_Upload_System SHALL upload the file to the Storage_Bucket and create a Submission record with status "pending", associating it with the Student's user ID and the selected Practice_Assignment ID.
5. WHEN a Student has already submitted a file for a Practice_Assignment, THE File_Upload_System SHALL allow the Student to re-upload a new file, replacing the previous Submission record and removing the previous file from the Storage_Bucket.
6. IF the file upload fails due to a network or server error, THEN THE File_Upload_System SHALL display an error message indicating the nature of the failure, retain the selected file reference, and provide a retry option without requiring the Student to re-select the file.
7. WHILE a file upload is in progress, THE File_Upload_System SHALL display a progress indicator and disable the submit button to prevent duplicate submissions.
8. IF the Student's session expires during the upload process, THEN THE File_Upload_System SHALL display an error message indicating the session has expired and redirect the Student to the authentication page.

### Requirement 2: Submission Status Visibility

**User Story:** As a Student, I want to see the status of my submissions, so that I know whether my work has been reviewed and what grade I received.

#### Acceptance Criteria

1. WHEN a Student views a Practice_Assignment, THE Platform SHALL display the current Submission status as one of: "not submitted", "pending", "graded".
2. WHEN a Submission has status "graded", THE Platform SHALL display the score as a numeric value within the range 0 to 100 and, if Teacher feedback text is present, display the feedback text (maximum 2000 characters).
3. THE Platform SHALL display a list of all Practice_Assignments with their corresponding Submission statuses on the Student practice page, sorted by assignment creation date in descending order, and load within 3 seconds.
4. IF the Platform cannot retrieve Submission status data due to a network or server error, THEN THE Platform SHALL display an error message indicating that status information is temporarily unavailable and provide a retry option.
5. WHEN a Student views a Practice_Assignment with status "pending", THE Platform SHALL display the date and time the Submission was submitted.

### Requirement 3: Teacher Grading Interface

**User Story:** As a Teacher, I want to view uploaded student files and assign grades, so that I can evaluate student work and provide feedback.

#### Acceptance Criteria

1. WHEN a Teacher opens the grading panel, THE Grading_System SHALL display a list of all pending Submissions with Student name, group, Practice_Assignment title, and submission date, sorted by submission date in descending order (newest first).
2. WHEN a Teacher selects a Submission, THE Grading_System SHALL provide a download link to the uploaded file that initiates the file download within 3 seconds.
3. IF a Teacher selects a Submission whose uploaded file is unavailable or has been deleted from storage, THEN THE Grading_System SHALL display an error message indicating the file is unavailable and disable the download link.
4. WHEN a Teacher assigns a score to a Submission, THE Grading_System SHALL accept only a numeric integer score between 0 and 100 inclusive and reject any non-numeric or out-of-range input by displaying a validation error message indicating the acceptable range.
5. WHEN a Teacher submits a grade, THE Grading_System SHALL update the Submission status to "graded", store the score, and store optional feedback text of no more than 2000 characters.
6. WHEN a Teacher has graded a Submission, THE Grading_System SHALL allow the Teacher to update the score and feedback, replacing the previously stored values with the new ones.
7. THE Grading_System SHALL allow filtering Submissions by status (pending, graded), by Student group, and by Practice_Assignment, and SHALL display only Submissions matching all selected filter criteria simultaneously.
8. IF no Submissions match the applied filters, THEN THE Grading_System SHALL display a message indicating that no submissions were found for the selected filter criteria.

### Requirement 4: Leaderboard Integration

**User Story:** As a Student, I want my file submission grades to be reflected in the overall leaderboard, so that my total effort is recognized.

#### Acceptance Criteria

1. WHEN a Teacher grades a Submission with a score between 0 and 100, THE Leaderboard_Service SHALL include the graded score in the Student total XP calculation within 5 seconds of the grade being saved.
2. THE Leaderboard_Service SHALL calculate file submission XP as: score multiplied by 0.5, rounded down to the nearest integer (e.g., score 80 earns 40 XP, score 79 earns 39 XP).
3. THE Leaderboard_Service SHALL display file submission XP as a separate column labeled "File XP" alongside quiz XP and practice XP in the leaderboard table view.
4. IF a Teacher updates the grade of a previously graded Submission, THEN THE Leaderboard_Service SHALL replace the previous file submission XP for that Submission with the newly calculated XP in the Student total.
5. IF a Submission score is outside the range 0 to 100, THEN THE Leaderboard_Service SHALL reject the score and not update the Student total XP.

### Requirement 5: Storage and Security

**User Story:** As an Admin, I want file uploads to be secure and access-controlled, so that only authorized users can upload or download files.

#### Acceptance Criteria

1. THE Storage_Bucket SHALL allow only authenticated Students to upload files to their own submission path, restricting each file to a maximum size of 10 MB.
2. THE Storage_Bucket SHALL allow only Teachers and Admins to download any submitted file.
3. THE Storage_Bucket SHALL allow Students to download only their own submitted files.
4. WHEN a Student re-uploads a file for the same assignment, THE File_Upload_System SHALL delete the previous file from the Storage_Bucket before storing the new one, so that at most one file per student per assignment exists at any time.
5. IF an unauthenticated user attempts to upload or download a file, THEN THE Storage_Bucket SHALL reject the request and return an access-denied error indication.
6. IF a file upload exceeds 10 MB or uses a disallowed file type, THEN THE File_Upload_System SHALL reject the upload and display an error message indicating the size limit or listing the allowed file types.

### Requirement 6: Database Schema for Submissions

**User Story:** As a Developer, I want a well-structured database table to store submission data, so that the system can track file uploads, grades, and statuses reliably.

#### Acceptance Criteria

1. THE Platform SHALL store each Submission with the following fields: id (UUID, primary key, auto-generated), user_id (UUID, NOT NULL, foreign key referencing profiles.id with ON DELETE CASCADE), content_item_id (UUID, NOT NULL, foreign key referencing content_items.id with ON DELETE CASCADE), file_path (TEXT, NOT NULL), file_name (TEXT, NOT NULL, maximum 255 characters), file_size (INTEGER, NOT NULL, between 1 and 10485760 bytes), status (TEXT, NOT NULL, default 'pending', constrained to one of 'pending', 'graded'), score (INTEGER, nullable, between 0 and 100), feedback (TEXT, nullable, maximum 2000 characters), graded_by (UUID, nullable, foreign key referencing profiles.id), graded_at (TIMESTAMPTZ, nullable), created_at (TIMESTAMPTZ, NOT NULL, default now()), and updated_at (TIMESTAMPTZ, NOT NULL, default now()).
2. THE Platform SHALL enforce that each Student has at most one active Submission per Practice_Assignment using a unique constraint on (user_id, content_item_id).
3. THE Platform SHALL enforce row-level security on the submissions table such that: Students can SELECT only rows where user_id matches their auth.uid(), Students can INSERT only rows where user_id matches their auth.uid(), Teachers and Admins (identified by the is_teacher_or_admin() helper function) can SELECT all rows, and Teachers and Admins can UPDATE the score, feedback, graded_by, graded_at, and status fields on any row.
4. IF a Student attempts to INSERT a Submission with a file_size exceeding 10485760 bytes or a file_name exceeding 255 characters, THEN THE Platform SHALL reject the insertion with a constraint violation error.
5. WHEN the score, feedback, graded_by, or graded_at fields are updated on a Submission, THE Platform SHALL automatically set the updated_at field to the current timestamp.
