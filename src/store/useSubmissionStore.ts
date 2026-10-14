import { create } from 'zustand'
import { googleSheetsDb } from '../lib/googleSheetsDb'
import { validatePracticeFile } from '../utils/fileValidation'
import { useAuthStore } from './useAuthStore'
import type { SubmissionWithProfile, SubmissionWithContent, GradingFilters } from '../types/submission'

interface SubmissionState {
  submissions: SubmissionWithProfile[]
  mySubmissions: SubmissionWithContent[]
  loading: boolean
  filters: GradingFilters

  fetchAllSubmissions: () => Promise<void>
  fetchMySubmissions: () => Promise<void>
  setFilters: (filters: Partial<GradingFilters>) => void
  uploadFile: (file: File, contentItemId: string) => Promise<{ error: string | null }>
  gradeSubmission: (submissionId: string, score: number, feedback: string) => Promise<{ error: string | null }>
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
    set({ loading: true })
    try {
      const { filters } = get()
      const data = await googleSheetsDb.getSubmissions(filters)
      set({ submissions: data })
    } catch (err) {
      console.error('Fetch submissions error:', err)
    } finally {
      set({ loading: false })
    }
  },

  fetchMySubmissions: async () => {
    set({ loading: true })
    try {
      const user = useAuthStore.getState().user
      if (!user) return

      const data = await googleSheetsDb.getMySubmissions(user.id)
      set({ mySubmissions: data as SubmissionWithContent[] })
    } catch (err) {
      console.error('Fetch my submissions error:', err)
    } finally {
      set({ loading: false })
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }))
  },

  uploadFile: async (file: File, contentItemId: string) => {
    const validation = validatePracticeFile(file)
    if (!validation.valid) {
      return { error: validation.error || 'Noto\'g\'ri fayl' }
    }

    set({ loading: true })
    try {
      const user = useAuthStore.getState().user
      if (!user) return { error: 'Foydalanuvchi tizimga kirmagan' }

      const res = await googleSheetsDb.uploadSubmission(user.id, contentItemId, file)
      if (!res.success) {
        return { error: res.error || 'Yuklashda xatolik yuz berdi' }
      }

      await get().fetchMySubmissions()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Yuklashda xatolik yuz berdi' }
    } finally {
      set({ loading: false })
    }
  },

  gradeSubmission: async (submissionId: string, score: number, feedback: string) => {
    set({ loading: true })
    try {
      const user = useAuthStore.getState().user
      const res = await googleSheetsDb.gradeSubmission(submissionId, score, feedback, user?.id || '')
      if (!res.success) {
        return { error: res.error || 'Baholashda xatolik yuz berdi' }
      }

      await get().fetchAllSubmissions()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Baholashda xatolik yuz berdi' }
    } finally {
      set({ loading: false })
    }
  },
}))
