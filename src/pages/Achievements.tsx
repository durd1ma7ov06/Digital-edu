import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../store/useAppStore'
import { useI18nStore } from '../store/useI18nStore'

interface Achievement {
  id: string
  icon: string
  color: string
  titleUz: string
  titleRu: string
  titleEn: string
  descUz: string
  descRu: string
  descEn: string
  category: 'quiz' | 'xp' | 'streak' | 'topic'
  xpReward: number
  check: (state: ReturnType<typeof useAppStore.getState>) => boolean
}

const allAchievements: Achievement[] = [
  {
    id: 'first_quiz',
    icon: '🎯',
    color: '#00f0ff',
    titleUz: 'Birinchi qadam',
    titleRu: 'Первый шаг',
    titleEn: 'First Step',
    descUz: 'Birinchi testni yakunlang',
    descRu: 'Пройдите первый тест',
    descEn: 'Complete your first quiz',
    category: 'quiz',
    xpReward: 50,
    check: (s) => s.quizResults.length >= 1,
  },
  {
    id: 'five_topics',
    icon: '📗',
    color: '#22c55e',
    titleUz: 'Boshlovchi',
    titleRu: 'Начинающий',
    titleEn: 'Getting Started',
    descUz: '5 ta mavzuni tugatish',
    descRu: 'Завершить 5 тем',
    descEn: 'Complete 5 topics',
    category: 'topic',
    xpReward: 100,
    check: (s) => s.completedTopics.length >= 5,
  },
  {
    id: 'ten_topics',
    icon: '📘',
    color: '#3b82f6',
    titleUz: 'O\'rta daraja',
    titleRu: 'Средний уровень',
    titleEn: 'Halfway There',
    descUz: '10 ta mavzuni tugatish',
    descRu: 'Завершить 10 тем',
    descEn: 'Complete 10 topics',
    category: 'topic',
    xpReward: 200,
    check: (s) => s.completedTopics.length >= 10,
  },
  {
    id: 'twenty_topics',
    icon: '📙',
    color: '#f97316',
    titleUz: 'Deyarli usta',
    titleRu: 'Почти мастер',
    titleEn: 'Almost Master',
    descUz: '20 ta mavzuni tugatish',
    descRu: 'Завершить 20 тем',
    descEn: 'Complete 20 topics',
    category: 'topic',
    xpReward: 400,
    check: (s) => s.completedTopics.length >= 20,
  },
  {
    id: 'all_topics',
    icon: '👑',
    color: '#facc15',
    titleUz: 'CS Ustasi',
    titleRu: 'Мастер CS',
    titleEn: 'CS Master',
    descUz: 'Barcha 30 ta mavzuni tugatish',
    descRu: 'Завершить все 30 тем',
    descEn: 'Complete all 30 topics',
    category: 'topic',
    xpReward: 1000,
    check: (s) => s.completedTopics.length >= 30,
  },
  {
    id: 'xp_100',
    icon: '⚡',
    color: '#a855f7',
    titleUz: 'XP Ovchisi',
    titleRu: 'Охотник XP',
    titleEn: 'XP Hunter',
    descUz: '100 XP yig\'ish',
    descRu: 'Набрать 100 XP',
    descEn: 'Earn 100 XP',
    category: 'xp',
    xpReward: 0,
    check: (s) => s.xp >= 100,
  },
  {
    id: 'xp_500',
    icon: '🔥',
    color: '#ef4444',
    titleUz: 'XP Jangchisi',
    titleRu: 'Воин XP',
    titleEn: 'XP Warrior',
    descUz: '500 XP yig\'ish',
    descRu: 'Набрать 500 XP',
    descEn: 'Earn 500 XP',
    category: 'xp',
    xpReward: 0,
    check: (s) => s.xp >= 500,
  },
  {
    id: 'xp_1000',
    icon: '💎',
    color: '#06b6d4',
    titleUz: 'XP Afsonasi',
    titleRu: 'Легенда XP',
    titleEn: 'XP Legend',
    descUz: '1000 XP yig\'ish',
    descRu: 'Набрать 1000 XP',
    descEn: 'Earn 1000 XP',
    category: 'xp',
    xpReward: 0,
    check: (s) => s.xp >= 1000,
  },
  {
    id: 'xp_2000',
    icon: '🌟',
    color: '#facc15',
    titleUz: 'XP Xudosi',
    titleRu: 'Бог XP',
    titleEn: 'XP God',
    descUz: '2000 XP yig\'ish',
    descRu: 'Набрать 2000 XP',
    descEn: 'Earn 2000 XP',
    category: 'xp',
    xpReward: 0,
    check: (s) => s.xp >= 2000,
  },
  {
    id: 'perfect_score',
    icon: '💯',
    color: '#22c55e',
    titleUz: 'Mukammal natija',
    titleRu: 'Идеальный счёт',
    titleEn: 'Perfectionist',
    descUz: 'Testda 10/10 olish',
    descRu: 'Набрать 10/10 в тесте',
    descEn: 'Get 10/10 on a quiz',
    category: 'quiz',
    xpReward: 150,
    check: (s) => s.quizResults.some(r => r.score === r.totalQuestions && r.totalQuestions >= 5),
  },
  {
    id: 'streak_3',
    icon: '🔥',
    color: '#f97316',
    titleUz: '3 kunlik faollik',
    titleRu: '3 дня подряд',
    titleEn: 'On Fire',
    descUz: '3 kun ketma-ket o\'rganish',
    descRu: '3-дневная серия',
    descEn: '3-day streak',
    category: 'streak',
    xpReward: 75,
    check: (s) => s.streak >= 3,
  },
  {
    id: 'streak_7',
    icon: '🚀',
    color: '#ec4899',
    titleUz: '7 kunlik faollik',
    titleRu: '7 дней подряд',
    titleEn: 'Unstoppable',
    descUz: '7 kun ketma-ket o\'rganish',
    descRu: '7-дневная серия',
    descEn: '7-day streak',
    category: 'streak',
    xpReward: 200,
    check: (s) => s.streak >= 7,
  },
]

const categoryColors: Record<string, string> = {
  quiz: '#00f0ff',
  xp: '#a855f7',
  streak: '#f97316',
  topic: '#22c55e',
  all: '#ffffff',
}

const categoryLabels: Record<string, Record<string, string>> = {
  all: { uz: 'Hammasi', ru: 'Все', en: 'All' },
  quiz: { uz: 'Test', ru: 'Тест', en: 'Quiz' },
  xp: { uz: 'XP', ru: 'XP', en: 'XP' },
  streak: { uz: 'Faollik', ru: 'Серия', en: 'Streak' },
  topic: { uz: 'Mavzu', ru: 'Тема', en: 'Topic' },
}

interface PopupAchievement {
  id: string
  icon: string
  color: string
  title: string
  xpReward: number
}

export default function Achievements() {
  const state = useAppStore()
  const { achievements, unlockAchievement, addXp } = state
  const { language } = useI18nStore()
  const [filter, setFilter] = useState<'all' | 'quiz' | 'xp' | 'streak' | 'topic'>('all')
  const [popup, setPopup] = useState<PopupAchievement | null>(null)
  const [justUnlocked, setJustUnlocked] = useState<string[]>([])

  // Auto-check and award achievements on load
  useEffect(() => {
    const currentState = useAppStore.getState()
    const newlyUnlocked: PopupAchievement[] = []

    for (const a of allAchievements) {
      if (!currentState.achievements.includes(a.id) && a.check(currentState)) {
        unlockAchievement(a.id)
        if (a.xpReward > 0) addXp(a.xpReward)
        newlyUnlocked.push({
          id: a.id,
          icon: a.icon,
          color: a.color,
          title: language === 'uz' ? a.titleUz : language === 'ru' ? a.titleRu : a.titleEn,
          xpReward: a.xpReward,
        })
        setJustUnlocked(prev => [...prev, a.id])
      }
    }

    // Show popups one by one
    if (newlyUnlocked.length > 0) {
      let delay = 0
      for (const item of newlyUnlocked) {
        setTimeout(() => {
          setPopup(item)
          setTimeout(() => setPopup(null), 3000)
        }, delay)
        delay += 3500
      }
    }
  }, [])

  const filtered = allAchievements.filter(a => filter === 'all' || a.category === filter)
  const unlockedCount = allAchievements.filter(a => achievements.includes(a.id)).length
  const totalXpFromAchievements = allAchievements
    .filter(a => achievements.includes(a.id))
    .reduce((sum, a) => sum + a.xpReward, 0)

  const getTitle = (a: Achievement) =>
    language === 'uz' ? a.titleUz : language === 'ru' ? a.titleRu : a.titleEn
  const getDesc = (a: Achievement) =>
    language === 'uz' ? a.descUz : language === 'ru' ? a.descRu : a.descEn

  const labels = {
    uz: {
      title: 'Yutuqlar',
      unlocked: 'ochilgan',
      totalXp: 'Yutuqlardan XP',
      progress: 'Jarayon',
      locked: 'QULFLANGAN',
      unlockedBadge: 'OCHILDI',
      newBadge: 'YANGI!',
      xpReward: 'XP mukofot',
    },
    ru: {
      title: 'Достижения',
      unlocked: 'открыто',
      totalXp: 'XP за достижения',
      progress: 'Прогресс',
      locked: 'ЗАБЛОКИРОВАНО',
      unlockedBadge: 'ОТКРЫТО',
      newBadge: 'НОВОЕ!',
      xpReward: 'Награда XP',
    },
    en: {
      title: 'Achievements',
      unlocked: 'unlocked',
      totalXp: 'XP from achievements',
      progress: 'Progress',
      locked: 'LOCKED',
      unlockedBadge: 'UNLOCKED',
      newBadge: 'NEW!',
      xpReward: 'XP Reward',
    },
  }
  const L = labels[language]

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Achievement Unlock Popup */}
      <AnimatePresence>
        {popup && (
          <motion.div
            key={popup.id}
            initial={{ opacity: 0, y: -60, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed top-6 right-6 z-[9999] flex items-center gap-4 px-6 py-4 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${popup.color}20, ${popup.color}08)`,
              border: `1px solid ${popup.color}40`,
              boxShadow: `0 0 40px ${popup.color}30`,
              backdropFilter: 'blur(20px)',
              minWidth: 280,
            }}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6 }}
              className="text-4xl"
            >
              {popup.icon}
            </motion.div>
            <div>
              <p className="text-xs font-bold tracking-widest" style={{ color: popup.color }}>
                🏆 {L.newBadge}
              </p>
              <p className="text-white font-bold text-sm">{popup.title}</p>
              {popup.xpReward > 0 && (
                <p className="text-xs mt-0.5" style={{ color: popup.color }}>
                  +{popup.xpReward} {L.xpReward}
                </p>
              )}
            </div>
            <motion.div
              className="absolute bottom-0 left-0 h-1 rounded-b-2xl"
              style={{ background: popup.color }}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-extrabold"
          >
            <span className="cyber-gradient-text">{L.title}</span>
          </motion.h1>
          <p className="text-white/40 text-sm mt-1">
            {unlockedCount}/{allAchievements.length} {L.unlocked}
          </p>
        </div>

        {/* Stats pills */}
        <div className="flex gap-3 flex-wrap">
          <div
            className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: '#a855f720', border: '1px solid #a855f740', color: '#a855f7' }}
          >
            ⚡ {totalXpFromAchievements} {L.totalXp}
          </div>
          <div
            className="px-4 py-2 rounded-xl text-xs font-bold"
            style={{ background: '#00f0ff20', border: '1px solid #00f0ff40', color: '#00f0ff' }}
          >
            🏆 {unlockedCount}/{allAchievements.length}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-panel p-3 sm:p-4">
        <div className="flex justify-between text-xs text-white/40 mb-2">
          <span>{L.progress}</span>
          <span>{Math.round((unlockedCount / allAchievements.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #00f0ff, #a855f7)' }}
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / allAchievements.length) * 100}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'quiz', 'xp', 'streak', 'topic'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300"
            style={
              filter === cat
                ? {
                    background: `${categoryColors[cat]}25`,
                    border: `1px solid ${categoryColors[cat]}60`,
                    color: categoryColors[cat],
                  }
                : {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.4)',
                  }
            }
          >
            {categoryLabels[cat][language]}
          </button>
        ))}
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((a, i) => {
          const unlocked = achievements.includes(a.id)
          const isNew = justUnlocked.includes(a.id)

          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`glass-panel p-4 sm:p-6 relative overflow-hidden transition-all duration-500 ${
                unlocked ? 'ring-1' : 'opacity-40 grayscale'
              }`}
              style={
                unlocked
                  ? {
                      borderColor: `${a.color}30`,
                      boxShadow: isNew ? `0 0 40px ${a.color}40` : `0 0 20px ${a.color}10`,
                    }
                  : {}
              }
            >
              {/* Background glow */}
              {unlocked && (
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-20"
                  style={{ background: `radial-gradient(circle, ${a.color}, transparent)` }}
                />
              )}

              {/* NEW badge */}
              {isNew && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 text-[9px] font-black px-2 py-0.5 rounded-full"
                  style={{ background: a.color, color: '#000' }}
                >
                  {L.newBadge}
                </motion.div>
              )}

              <div className="text-4xl mb-3">{a.icon}</div>
              <h3 className="text-sm font-bold text-white/90">{getTitle(a)}</h3>
              <p className="text-xs text-white/30 mt-1">{getDesc(a)}</p>

              <div className="flex items-center justify-between mt-3">
                {unlocked ? (
                  <span
                    className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${a.color}20`, color: a.color }}
                  >
                    ✓ {L.unlockedBadge}
                  </span>
                ) : (
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-white/20">
                    🔒 {L.locked}
                  </span>
                )}

                {a.xpReward > 0 && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: unlocked ? `${a.color}15` : 'rgba(255,255,255,0.04)',
                      color: unlocked ? a.color : 'rgba(255,255,255,0.2)',
                    }}
                  >
                    +{a.xpReward} XP
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
