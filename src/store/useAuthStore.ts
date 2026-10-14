import { create } from 'zustand'
import { googleSheetsDb } from '../lib/googleSheetsDb'

export type UserRole = 'admin' | 'teacher' | 'student'

export interface Profile {
  id: string
  username: string | null
  full_name: string
  avatar_emoji: string
  group_name: string
  role: UserRole
  diagnostic_completed: boolean
  diagnostic_score: number
  diagnostic_total: number
  diagnostic_completed_at: string | null
  created_at: string
  updated_at: string
}

export interface UserSession {
  id: string
  email: string
}

export interface LeaderboardEntry {
  user_id: string
  full_name: string
  avatar_emoji: string
  group_name: string
  diagnostic_score: number
  total_quiz_xp: number
  total_quizzes: number
  avg_quiz_percentage: number
  total_practice_xp: number
  total_practices: number
  total_xp: number
  topics_completed: number
  level: number
}

interface AuthState {
  user: UserSession | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  signUp: (email: string, password: string, fullName: string, groupName?: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  completeDiagnostic: (score: number, total: number, answers?: unknown[]) => Promise<void>
  saveQuizResult: (topicId: number, partId: number, score: number, totalQuestions: number, contentItemId?: string | null) => Promise<void>
  savePracticeResult: (topicId: number, score: number, maxScore: number, contentItemId?: string | null) => Promise<void>
  fetchLeaderboard: () => Promise<LeaderboardEntry[]>
}

const SESSION_KEY = 'digitaledu_auth_session'

function getStoredSession(): { user: UserSession; profile: Profile } | null {
  try {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return null
    const session = JSON.parse(stored) as { user: UserSession; profile: Profile }
    if (session && session.user && session.profile) {
      return session
    }
  } catch (e) {
    console.warn('Session parse error:', e)
  }
  return null
}

const initialSession = getStoredSession()

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: initialSession?.user || null,
  profile: initialSession?.profile || null,
  loading: false,
  initialized: true,

  initialize: async () => {
    try {
      const session = getStoredSession()
      if (session) {
        set({ user: session.user, profile: session.profile, loading: false, initialized: true })

        // Refresh profile from Google Sheets in background
        try {
          const res = await googleSheetsDb.getProfile(session.user.id)
          if (res.success && res.data?.profile) {
            set({ profile: res.data.profile })
            localStorage.setItem(
              SESSION_KEY,
              JSON.stringify({ user: session.user, profile: res.data.profile })
            )
          }
        } catch (e) {
          console.warn('Background profile refresh error:', e)
        }
      } else {
        set({ user: null, profile: null, loading: false, initialized: true })
      }
    } catch (err) {
      console.error('Auth initialize error:', err)
      set({ user: null, profile: null, loading: false, initialized: true })
    }
  },

  signUp: async (email, password, fullName, groupName = '') => {
    set({ loading: true })
    try {
      const res = await googleSheetsDb.signUp(email, password, fullName, groupName, 'student')
      if (!res.success || !res.data) {
        set({ loading: false })
        return { error: res.error || 'Ro\'yxatdan o\'tishda xatolik yuz berdi' }
      }

      const { user, profile } = res.data
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, profile }))
      set({ user, profile, loading: false, initialized: true })

      return { error: null }
    } catch (err) {
      set({ loading: false })
      return { error: err instanceof Error ? err.message : 'Xatolik yuz berdi' }
    }
  },

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      const res = await googleSheetsDb.signIn(email, password)
      if (!res.success || !res.data) {
        set({ loading: false })
        return { error: res.error || 'Email yoki parol xato' }
      }

      const { user, profile } = res.data
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, profile }))

      set({ user, profile, loading: false, initialized: true })

      return { error: null }
    } catch (err) {
      set({ loading: false })
      return { error: err instanceof Error ? err.message : 'Kirishda xatolik yuz berdi' }
    }
  },

  signOut: async () => {
    localStorage.removeItem(SESSION_KEY)
    set({ user: null, profile: null, loading: false, initialized: true })
    window.location.assign('/auth')
  },

  fetchProfile: async () => {
    const { user } = get()
    if (!user) return
    const res = await googleSheetsDb.getProfile(user.id)
    if (res.success && res.data?.profile) {
      set({ profile: res.data.profile })
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ user, profile: res.data.profile })
      )
    }
  },

  updateProfile: async (updates) => {
    const { user, profile } = get()
    if (!user || !profile) return

    const res = await googleSheetsDb.updateProfile(user.id, updates)
    if (res.success) {
      const updatedProfile = { ...profile, ...updates, updated_at: new Date().toISOString() }
      set({ profile: updatedProfile })
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, profile: updatedProfile }))
    }
  },

  completeDiagnostic: async (score, total, answers = []) => {
    const { user, profile } = get()
    if (!user || !profile) return

    const res = await googleSheetsDb.completeDiagnostic(user.id, score, total, answers)
    if (res.success) {
      const updatedProfile: Profile = {
        ...profile,
        diagnostic_completed: true,
        diagnostic_score: score,
        diagnostic_total: total,
        diagnostic_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      set({ profile: updatedProfile })
      localStorage.setItem(SESSION_KEY, JSON.stringify({ user, profile: updatedProfile }))
    }
  },

  saveQuizResult: async (topicId, partId, score, totalQuestions, contentItemId = null) => {
    const { user } = get()
    if (!user) return
    await googleSheetsDb.saveQuizResult(user.id, topicId, partId, score, totalQuestions, contentItemId)
  },

  savePracticeResult: async (topicId, score, maxScore, contentItemId = null) => {
    const { user } = get()
    if (!user) return
    await googleSheetsDb.savePracticeResult(user.id, topicId, score, maxScore, contentItemId)
  },

  fetchLeaderboard: async () => {
    return googleSheetsDb.getLeaderboard()
  },
}))
