import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  full_name: string
  avatar_emoji: string
  group_name: string
  diagnostic_completed: boolean
  diagnostic_score: number
  diagnostic_total: number
  diagnostic_completed_at: string | null
  created_at: string
  updated_at: string
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
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean

  // Auth actions
  initialize: () => Promise<void>
  signUp: (email: string, password: string, fullName: string, groupName?: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>

  // Profile actions
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>

  // Diagnostic
  completeDiagnostic: (score: number, total: number, answers?: any[]) => Promise<void>

  // Quiz results
  saveQuizResult: (topicId: number, partId: number, score: number, totalQuestions: number) => Promise<void>

  // Practice results
  savePracticeResult: (topicId: number, score: number, maxScore: number) => Promise<void>

  // Leaderboard
  fetchLeaderboard: () => Promise<LeaderboardEntry[]>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        set({ user: session.user })
        await get().fetchProfile()
      }
    } catch (err) {
      console.error('Auth init error:', err)
    } finally {
      set({ loading: false, initialized: true })
    }

    // Auth state o'zgarishlarini tinglash
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        set({ user: session.user })
        await get().fetchProfile()
      } else {
        set({ user: null, profile: null })
      }
    })
  },

  signUp: async (email, password, fullName, groupName = '') => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            avatar_emoji: '🎯',
          },
        },
      })

      if (error) {
        set({ loading: false })
        return { error: error.message }
      }

      // Profil yaratiladi trigger orqali, lekin group_name ni yangilash kerak
      if (data.user && groupName) {
        await supabase
          .from('profiles')
          .update({ group_name: groupName })
          .eq('id', data.user.id)
      }

      set({ user: data.user, loading: false })
      await get().fetchProfile()
      return { error: null }
    } catch (err: any) {
      set({ loading: false })
      return { error: err.message || 'Xatolik yuz berdi' }
    }
  },

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        set({ loading: false })
        return { error: error.message }
      }

      set({ user: data.user, loading: false })
      await get().fetchProfile()
      return { error: null }
    } catch (err: any) {
      set({ loading: false })
      return { error: err.message || 'Xatolik yuz berdi' }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  fetchProfile: async () => {
    const { user } = get()
    if (!user) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!error && data) {
      set({ profile: data as Profile })
    }
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (!error) {
      await get().fetchProfile()
    }
  },

  completeDiagnostic: async (score, total, answers = []) => {
    try {
      const { error } = await supabase.rpc('complete_diagnostic', {
        p_score: score,
        p_total: total,
        p_answers: answers,
      })

      if (error) {
        console.error('Diagnostic save error:', error)
        return
      }

      // Profilni yangilash
      await get().fetchProfile()
    } catch (err) {
      console.error('Diagnostic error:', err)
    }
  },

  saveQuizResult: async (topicId, partId, score, totalQuestions) => {
    const { user } = get()
    if (!user) return

    const percentage = Math.round((score / totalQuestions) * 100)
    const xpEarned = score * 10

    const { error } = await supabase.from('quiz_results').insert({
      user_id: user.id,
      topic_id: topicId,
      part_id: partId,
      score,
      total_questions: totalQuestions,
      percentage,
      xp_earned: xpEarned,
    })

    if (error) {
      console.error('Quiz result save error:', error)
    }
  },

  savePracticeResult: async (topicId, score, maxScore) => {
    const { user } = get()
    if (!user) return

    const xpEarned = Math.round((score / maxScore) * 50)

    const { error } = await supabase.from('practice_results').insert({
      user_id: user.id,
      topic_id: topicId,
      score,
      max_score: maxScore,
      xp_earned: xpEarned,
    })

    if (error) {
      console.error('Practice result save error:', error)
    }
  },

  fetchLeaderboard: async () => {
    const { data, error } = await supabase
      .from('leaderboard_view')
      .select('*')
      .order('total_xp', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Leaderboard fetch error:', error)
      return []
    }

    return (data || []) as LeaderboardEntry[]
  },
}))
