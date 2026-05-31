import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

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

function usernameFromEmail(email: string) {
  return email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'student'
}

// Profilni olib keladi va qaytaradi (state'ni o'zgartirmaydi)
async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('[loadProfile] error:', error.message)
    return null
  }
  return (data as Profile | null) || null
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
        const profile = await loadProfile(session.user.id)
        set({ user: session.user, profile })
      } else {
        set({ user: null, profile: null })
      }

      // Faqat tashqi o'zgarishlarni kuzatish (signIn/signOut o'zi state'ni boshqaradi)
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null })
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          set({ user: session.user })
        }
      })
    } catch (err) {
      console.error('Auth init error:', err)
      set({ user: null, profile: null })
    } finally {
      set({ loading: false, initialized: true })
    }
  },

  signUp: async (email, password, fullName, groupName = '') => {
    set({ loading: true })
    try {
      const cleanEmail = email.trim().toLowerCase()
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: usernameFromEmail(cleanEmail),
            full_name: fullName.trim(),
            group_name: groupName.trim(),
            avatar_emoji: '🎯',
          },
        },
      })

      if (error) {
        set({ loading: false })
        return { error: error.message }
      }

      await supabase.auth.signOut()
      set({ user: null, profile: null, loading: false })
      return { error: null }
    } catch (err) {
      set({ loading: false })
      return { error: err instanceof Error ? err.message : 'Xatolik yuz berdi' }
    }
  },

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (error) {
        set({ loading: false })
        return { error: error.message }
      }

      // Profilni yuklash
      const profile = await loadProfile(data.user.id)

      // State'ni to'liq o'rnatish
      set({ user: data.user, profile, loading: false, initialized: true })

      // To'g'ri sahifaga to'liq reload bilan o'tish (session localStorage'da saqlangan)
      const target = profile?.role === 'admin' ? '/admin'
                   : profile?.role === 'teacher' ? '/teacher'
                   : '/'
      window.location.assign(target)

      return { error: null }
    } catch (err) {
      set({ loading: false })
      return { error: err instanceof Error ? err.message : 'Xatolik yuz berdi' }
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, loading: false, initialized: true })
    window.location.assign('/auth')
  },

  fetchProfile: async () => {
    const { user } = get()
    if (!user) return
    const profile = await loadProfile(user.id)
    if (profile) {
      set({ profile })
    }
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return

    const { error } = await supabase.rpc('update_own_profile', {
      p_full_name: updates.full_name ?? null,
      p_group_name: updates.group_name ?? null,
      p_avatar_emoji: updates.avatar_emoji ?? null,
    })

    if (error) {
      console.error('Profile update error:', error)
      return
    }

    await get().fetchProfile()
  },

  completeDiagnostic: async (score, total, answers = []) => {
    const { error } = await supabase.rpc('complete_diagnostic', {
      p_score: score,
      p_total: total,
      p_answers: answers,
    })

    if (error) {
      console.error('Diagnostic save error:', error)
      return
    }

    await get().fetchProfile()
  },

  saveQuizResult: async (topicId, partId, score, totalQuestions, contentItemId = null) => {
    const { user } = get()
    if (!user) return

    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0
    const xpEarned = score * 10

    const { error } = await supabase.from('quiz_results').insert({
      user_id: user.id,
      topic_id: topicId,
      content_item_id: contentItemId,
      part_id: partId,
      score,
      total_questions: totalQuestions,
      percentage,
      xp_earned: xpEarned,
    })

    if (error) console.error('Quiz result save error:', error)
  },

  savePracticeResult: async (topicId, score, maxScore, contentItemId = null) => {
    const { user } = get()
    if (!user) return

    const xpEarned = maxScore > 0 ? Math.round((score / maxScore) * 50) : 0

    const { error } = await supabase.from('practice_results').insert({
      user_id: user.id,
      topic_id: topicId,
      content_item_id: contentItemId,
      score,
      max_score: maxScore,
      xp_earned: xpEarned,
    })

    if (error) console.error('Practice result save error:', error)
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
