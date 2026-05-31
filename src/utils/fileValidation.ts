import type { FileValidationResult } from '../types/submission';

const ALLOWED_EXTENSIONS = ['.doc', '.docx'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export function validatePracticeFile(file: File): FileValidationResult {
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'Only .doc and .docx files are accepted' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size must not exceed 10 MB' };
  }

  return { valid: true };
}

export type { FileValidationResult };
