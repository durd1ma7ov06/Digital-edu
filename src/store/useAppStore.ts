import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface QuizResult {
  topicId: number
  score: number
  totalQuestions: number
  completedAt: string
}

interface AppState {
  xp: number
  level: number
  streak: number
  completedTopics: number[]
  quizResults: QuizResult[]
  achievements: string[]
  lastActiveDate: string

  addXp: (amount: number) => void
  completeTopic: (topicId: number, score: number, total: number) => void
  unlockAchievement: (id: string) => void
  updateStreak: () => void
  resetProgress: () => void
}

const ACHIEVEMENTS_MAP: Record<string, { xpThreshold?: number; topicsThreshold?: number }> = {
  first_quiz: {},
  five_topics: { topicsThreshold: 5 },
  ten_topics: { topicsThreshold: 10 },
  twenty_topics: { topicsThreshold: 20 },
  all_topics: { topicsThreshold: 30 },
  xp_100: { xpThreshold: 100 },
  xp_500: { xpThreshold: 500 },
  xp_1000: { xpThreshold: 1000 },
  xp_2000: { xpThreshold: 2000 },
  perfect_score: {},
  streak_3: {},
  streak_7: {},
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      streak: 0,
      completedTopics: [],
      quizResults: [],
      achievements: [],
      lastActiveDate: '',

      addXp: (amount: number) => {
        set((state) => {
          const newXp = state.xp + amount
          const newLevel = Math.floor(newXp / 100) + 1
          const newAchievements = [...state.achievements]

          if (newXp >= 100 && !newAchievements.includes('xp_100')) newAchievements.push('xp_100')
          if (newXp >= 500 && !newAchievements.includes('xp_500')) newAchievements.push('xp_500')
          if (newXp >= 1000 && !newAchievements.includes('xp_1000')) newAchievements.push('xp_1000')
          if (newXp >= 2000 && !newAchievements.includes('xp_2000')) newAchievements.push('xp_2000')

          return { xp: newXp, level: newLevel, achievements: newAchievements }
        })
      },

      completeTopic: (topicId: number, score: number, total: number) => {
        set((state) => {
          const completedTopics = state.completedTopics.includes(topicId)
            ? state.completedTopics
            : [...state.completedTopics, topicId]

          const quizResults = [
            ...state.quizResults,
            { topicId, score, totalQuestions: total, completedAt: new Date().toISOString() },
          ]

          const newAchievements = [...state.achievements]

          if (!newAchievements.includes('first_quiz')) newAchievements.push('first_quiz')
          if (completedTopics.length >= 5 && !newAchievements.includes('five_topics')) newAchievements.push('five_topics')
          if (completedTopics.length >= 10 && !newAchievements.includes('ten_topics')) newAchievements.push('ten_topics')
          if (completedTopics.length >= 20 && !newAchievements.includes('twenty_topics')) newAchievements.push('twenty_topics')
          if (completedTopics.length >= 30 && !newAchievements.includes('all_topics')) newAchievements.push('all_topics')
          if (score === total && !newAchievements.includes('perfect_score')) newAchievements.push('perfect_score')

          const xpEarned = score * 10
          const newXp = state.xp + xpEarned
          const newLevel = Math.floor(newXp / 100) + 1

          if (newXp >= 100 && !newAchievements.includes('xp_100')) newAchievements.push('xp_100')
          if (newXp >= 500 && !newAchievements.includes('xp_500')) newAchievements.push('xp_500')
          if (newXp >= 1000 && !newAchievements.includes('xp_1000')) newAchievements.push('xp_1000')
          if (newXp >= 2000 && !newAchievements.includes('xp_2000')) newAchievements.push('xp_2000')

          return {
            completedTopics,
            quizResults,
            achievements: newAchievements,
            xp: newXp,
            level: newLevel,
          }
        })

        get().updateStreak()
      },

      unlockAchievement: (id: string) => {
        set((state) => {
          if (state.achievements.includes(id)) return state
          return { achievements: [...state.achievements, id] }
        })
      },

      updateStreak: () => {
        set((state) => {
          const today = new Date().toDateString()
          const lastDate = state.lastActiveDate
          const yesterday = new Date(Date.now() - 86400000).toDateString()

          let newStreak = state.streak
          const newAchievements = [...state.achievements]

          if (lastDate === today) {
            return state
          } else if (lastDate === yesterday) {
            newStreak += 1
          } else {
            newStreak = 1
          }

          if (newStreak >= 3 && !newAchievements.includes('streak_3')) newAchievements.push('streak_3')
          if (newStreak >= 7 && !newAchievements.includes('streak_7')) newAchievements.push('streak_7')

          return { streak: newStreak, lastActiveDate: today, achievements: newAchievements }
        })
      },

      resetProgress: () => {
        set({
          xp: 0,
          level: 1,
          streak: 0,
          completedTopics: [],
          quizResults: [],
          achievements: [],
          lastActiveDate: '',
        })
      },
    }),
    {
      name: 'learnify-cs-store',
    }
  )
)

export { ACHIEVEMENTS_MAP }
