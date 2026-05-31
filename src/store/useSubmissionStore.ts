import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { validatePracticeFile } from '../utils/fileValidation';
import type { Submission, SubmissionWithProfile, GradingFilters } from '../types/submission';

const BUCKET_NAME = 'practice-files';

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

export const useSubmissionStore = create<SubmissionState>()((set, get) => ({
  submissions: [],
  mySubmissions: [],
  loading: false,
  filters: {
    status: 'all',
    group: '',
    contentItemId: '',
  },

  fetchAllSubmissions: async () => {
    set({ loading: true });
    try {
      let query = supabase
        .from('submissions')
        .select(`
          *,
          profiles:user_id (full_name, group_name, avatar_emoji),
          content_items:content_item_id (title)
        `)
        .order('created_at', { ascending: false });

      const { filters } = get();

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.contentItemId) {
        query = query.eq('content_item_id', filters.contentItemId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Fetch submissions error:', error);
        return;
      }

      let results = (data || []) as SubmissionWithProfile[];

      // Client-side group filtering (since group_name is on the joined profile)
      if (filters.group) {
        results = results.filter(
          (s) => s.profiles?.group_name === filters.group
        );
      }

      set({ submissions: results });
    } finally {
      set({ loading: false });
    }
  },

  fetchMySubmissions: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch my submissions error:', error);
        return;
      }

      set({ mySubmissions: (data || []) as Submission[] });
    } finally {
      set({ loading: false });
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  uploadFile: async (file: File, contentItemId: string) => {
    // Validate the file
    const validation = validatePracticeFile(file);
    if (!validation.valid) {
      return { error: validation.error || 'Invalid file' };
    }

    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'User not authenticated' };

      const filePath = `${user.id}/${contentItemId}/${file.name}`;

      // Check if there's an existing submission for this content item
      const { data: existing } = await supabase
        .from('submissions')
        .select('id, file_path')
        .eq('user_id', user.id)
        .eq('content_item_id', contentItemId)
        .maybeSingle();

      // If existing, delete old file from storage
      if (existing?.file_path) {
        await supabase.storage.from(BUCKET_NAME).remove([existing.file_path]);
      }

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        return { error: uploadError.message };
      }

      // Upsert submission record
      if (existing) {
        const { error: updateError } = await supabase
          .from('submissions')
          .update({
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            status: 'pending',
            score: null,
            feedback: null,
            graded_by: null,
            graded_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          return { error: updateError.message };
        }
      } else {
        const { error: insertError } = await supabase
          .from('submissions')
          .insert({
            user_id: user.id,
            content_item_id: contentItemId,
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            status: 'pending',
          });

        if (insertError) {
          return { error: insertError.message };
        }
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Upload failed' };
    } finally {
      set({ loading: false });
    }
  },

  gradeSubmission: async (submissionId: string, score: number, feedback: string) => {
    set({ loading: true });
    try {
      const { error } = await supabase.rpc('grade_submission', {
        p_submission_id: submissionId,
        p_score: score,
        p_feedback: feedback || null,
      });

      if (error) {
        return { error: error.message };
      }

      // Refresh submissions list after grading
      await get().fetchAllSubmissions();

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Grading failed' };
    } finally {
      set({ loading: false });
    }
  },
}));
