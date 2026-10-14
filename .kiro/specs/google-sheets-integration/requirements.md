# Requirements Document

## Introduction

This feature adds Google Sheets data import functionality to the DigitalEdu platform. The system will allow administrators and teachers to import educational content (lessons, quizzes, practice exercises, and student data) from a specified Google Sheets spreadsheet into the Supabase PostgreSQL database. This streamlines content management by enabling bulk data entry and updates through familiar spreadsheet interfaces.

The target Google Sheets URL: https://docs.google.com/spreadsheets/d/1aJGuP1Dkj_hJYb76d4zwimz20zUcjcOK0oUOY2SEqPM/edit?pli=1&gid=0#gid=0

## Glossary

- **System**: The DigitalEdu Google Sheets Integration Module
- **Google_Sheets_API**: Google's API service for reading spreadsheet data
- **Import_Service**: Backend service responsible for fetching and processing Google Sheets data
- **Data_Mapper**: Component that transforms spreadsheet rows into database entities
- **Content_Item**: Database entity representing educational material (lesson, quiz, or practice)
- **Admin**: User with administrator role
- **Teacher**: User with teacher role
- **Authorized_User**: User with either admin or teacher role
- **Spreadsheet_URL**: The Google Sheets document URL containing data to import
- **Import_Job**: A single execution of the data import process
- **Validation_Error**: Error occurring when spreadsheet data does not match expected schema
- **Import_Log**: Record of import operations including success/failure status

## Requirements

### Requirement 1: Google Sheets API Authentication

**User Story:** As an administrator, I want the system to authenticate with Google Sheets API, so that it can access spreadsheet data securely.

#### Acceptance Criteria

1. THE System SHALL use OAuth 2.0 credentials to authenticate with Google_Sheets_API
2. THE System SHALL store API credentials securely in environment variables
3. WHEN authentication fails, THE System SHALL log the error and return a descriptive error message
4. THE System SHALL refresh expired authentication tokens automatically
5. WHEN API rate limits are reached, THE System SHALL implement exponential backoff retry logic

### Requirement 2: Spreadsheet Data Reading

**User Story:** As a teacher, I want to import data from a specific Google Sheets URL, so that I can bulk-add educational content without manual database entry.

#### Acceptance Criteria

1. WHEN a valid Spreadsheet_URL is provided, THE Import_Service SHALL fetch all worksheets from the spreadsheet
2. THE Import_Service SHALL read column headers from the first row of each worksheet
3. THE Import_Service SHALL read all data rows excluding the header row
4. WHEN the spreadsheet contains multiple sheets, THE Import_Service SHALL process each sheet independently
5. WHEN a worksheet is empty, THE Import_Service SHALL skip it and log a warning
6. THE Import_Service SHALL handle spreadsheets with up to 10000 rows per worksheet

### Requirement 3: Data Schema Validation

**User Story:** As a developer, I want spreadsheet data to be validated against expected schemas, so that only correctly formatted data is imported into the database.

#### Acceptance Criteria

1. THE Data_Mapper SHALL define expected column schemas for each content type (lessons, quizzes, practices)
2. WHEN a worksheet header does not match the expected schema, THE System SHALL return a Validation_Error listing missing or unexpected columns
3. WHEN a data cell contains an invalid value for its column type, THE System SHALL return a Validation_Error specifying the row and column
4. THE System SHALL validate required fields are not empty
5. THE System SHALL validate foreign key references exist in the database before import
6. FOR ALL validation errors, THE System SHALL collect all errors and return them in a single response

### Requirement 4: Content Items Import

**User Story:** As a teacher, I want to import curriculum content from Google Sheets, so that I can add multiple lessons, quizzes, and practice exercises at once.

#### Acceptance Criteria

1. WHEN a worksheet named "Lessons" is present, THE Data_Mapper SHALL transform rows into Content_Item entities with content_type='material'
2. WHEN a worksheet named "Quizzes" is present, THE Data_Mapper SHALL transform rows into Content_Item entities with content_type='test'
3. WHEN a worksheet named "Practices" is present, THE Data_Mapper SHALL transform rows into Content_Item entities with content_type='practice'
4. THE Data_Mapper SHALL parse JSON columns (questions, practice) from spreadsheet cells
5. THE System SHALL set created_by field to the ID of the user initiating the import
6. THE System SHALL set created_at and updated_at timestamps automatically
7. WHEN an import creates new Content_Item records, THE System SHALL return the count of successfully created items

### Requirement 5: Update Existing Records

**User Story:** As a teacher, I want to update existing content when reimporting data, so that I can maintain content without creating duplicates.

#### Acceptance Criteria

1. WHERE a worksheet contains an "id" column, THE System SHALL treat rows with IDs as updates to existing records
2. WHEN an ID is provided and the record exists, THE System SHALL update the existing record
3. WHEN an ID is provided but the record does not exist, THE System SHALL return a Validation_Error for that row
4. WHEN no ID is provided, THE System SHALL create a new record
5. THE System SHALL update the updated_at timestamp for all modified records

### Requirement 6: Import Authorization

**User Story:** As an administrator, I want only authorized users to perform imports, so that data integrity is maintained.

#### Acceptance Criteria

1. THE System SHALL allow only Authorized_User roles to initiate imports
2. WHEN an unauthenticated user attempts import, THE System SHALL return an authentication error
3. WHEN a student role attempts import, THE System SHALL return an authorization error
4. THE System SHALL log the user_id of each import initiator in the Import_Log

### Requirement 7: Import Progress and Logging

**User Story:** As a teacher, I want to see import progress and results, so that I know what succeeded or failed.

#### Acceptance Criteria

1. WHEN an Import_Job starts, THE System SHALL create an Import_Log record with status='in_progress'
2. WHEN an Import_Job completes successfully, THE System SHALL update the Import_Log status to 'completed'
3. WHEN an Import_Job fails, THE System SHALL update the Import_Log status to 'failed' and store the error message
4. THE System SHALL record the total number of rows processed, created, updated, and failed
5. THE System SHALL return a summary response containing row counts and any error messages
6. THE Import_Log SHALL retain records for at least 30 days

### Requirement 8: Error Handling and Rollback

**User Story:** As a teacher, I want failed imports to not corrupt the database, so that partial imports do not leave inconsistent data.

#### Acceptance Criteria

1. WHEN a Validation_Error occurs during import, THE System SHALL not write any data to the database
2. THE System SHALL use database transactions to ensure atomicity of import operations
3. IF any database write fails during import, THEN THE System SHALL roll back all changes from that Import_Job
4. THE System SHALL return detailed error information including row numbers and error descriptions
5. WHEN an import is rolled back, THE System SHALL log the rollback event in the Import_Log

### Requirement 9: User Interface for Import

**User Story:** As a teacher, I want a simple interface to trigger imports, so that I can import data without technical knowledge.

#### Acceptance Criteria

1. THE System SHALL provide a UI component accessible from the Teacher Panel and Admin Panel
2. THE UI SHALL display an input field for entering the Spreadsheet_URL
3. THE UI SHALL display a button to initiate the import
4. WHEN the import is in progress, THE UI SHALL display a loading indicator
5. WHEN the import completes, THE UI SHALL display the import summary with success and error counts
6. WHEN validation errors occur, THE UI SHALL display the list of errors in a readable format
7. THE UI SHALL support the platform's three languages (Uzbek, Russian, English)

### Requirement 10: Import Configuration

**User Story:** As an administrator, I want to configure import behavior, so that I can customize how imports work for our organization.

#### Acceptance Criteria

1. WHERE environment variables define import settings, THE System SHALL respect those configurations
2. THE System SHALL support configuration for maximum rows per import (default 10000)
3. THE System SHALL support configuration for import timeout duration (default 5 minutes)
4. THE System SHALL support configuration for enabling/disabling automatic record updates
5. WHEN configuration values are invalid, THE System SHALL use default values and log a warning

## Non-Functional Requirements

### Performance
- THE System SHALL complete imports of up to 1000 rows within 30 seconds
- THE System SHALL handle concurrent import requests from up to 5 users simultaneously

### Security
- THE System SHALL never expose Google API credentials in client-side code or API responses
- THE System SHALL validate and sanitize all spreadsheet data before database insertion

### Reliability
- THE System SHALL maintain 99% success rate for valid imports
- WHEN Google_Sheets_API is unavailable, THE System SHALL return a clear error message and retry up to 3 times

### Maintainability
- THE Data_Mapper SHALL use clear, documented mapping rules for each content type
- THE System SHALL log all import operations for debugging and audit purposes
