export interface Submission {
  id: string;
  user_id: string;
  content_item_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  status: 'pending' | 'graded';
  score: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionWithProfile extends Submission {
  profiles: {
    full_name: string;
    group_name: string;
    avatar_emoji: string;
  };
  content_items: {
    title: string;
  };
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface GradingFilters {
  status: 'all' | 'pending' | 'graded';
  group: string;
  contentItemId: string;
}
