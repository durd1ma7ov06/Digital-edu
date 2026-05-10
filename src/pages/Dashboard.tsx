import { motion } from 'framer-motion'
import { Zap, Flame, BookOpen, Trophy, TrendingUp, Target } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useI18nStore } from '../store/useI18nStore'
import { curriculum } from '../data'

function CircularProgress({ value, max, size = 120, label, color }: { value: number; max: number; size?: number; label: string; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="progress-ring">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeDasharray={circ}
        />
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fill="white" fontSize="20" fontWeight="700" className="font-sans">
          {Math.round(pct)}%
        </text>
      </svg>
      <span className="text-xs text-white/50">{label}</span>
    </div>
  )
}

export default function Dashboard() {
  const { xp, level, streak, completedTopics, quizResults } = useAppStore()
  const { t, language } = useI18nStore()
  const totalTopics = curriculum.length
  const avgScore = quizResults.length > 0
    ? Math.round(quizResults.reduce((a, r) => a + (r.score / r.totalQuestions) * 100, 0) / quizResults.length)
    : 0

  const stats = [
    { icon: Zap, label: t('totalXp'), value: xp.toLocaleString(), color: '#00f0ff', bg: 'from-cyan-500/20 to-transparent' },
    { icon: TrendingUp, label: t('level'), value: level, color: '#a855f7', bg: 'from-purple-500/20 to-transparent' },
    { icon: Flame, label: t('dayStreak'), value: streak, color: '#f97316', bg: 'from-orange-500/20 to-transparent' },
    { icon: BookOpen, label: t('topicsDone'), value: `${completedTopics.length}/${totalTopics}`, color: '#3b82f6', bg: 'from-blue-500/20 to-transparent' },
    { icon: Target, label: t('avgScore'), value: `${avgScore}%`, color: '#22c55e', bg: 'from-green-500/20 to-transparent' },
    { icon: Trophy, label: t('quizzesTaken'), value: quizResults.length, color: '#ec4899', bg: 'from-pink-500/20 to-transparent' },
  ]

  const recentResults = quizResults.slice(-5).reverse()

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <header className="relative py-10 px-8 rounded-3xl overflow-hidden glass-panel border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 mb-2"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-bold text-cyan-400 tracking-[0.2em] uppercase">System Online</span>
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="text-4xl font-black tracking-tighter"
            >
              {t('dashboard')} <span className="text-white/20">/</span> <span className="cyber-gradient-text">CORE</span>
            </motion.h1>
            <p className="text-white/40 text-sm mt-2 max-w-md leading-relaxed">{t('welcome')}</p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-xl">
              {level}
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{t('level')}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: `${(xp % 100)}%` }} />
                </div>
                <span className="text-xs font-mono text-cyan-400">{xp % 100}/100 XP</span>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-2xl border border-white/5 transition-all duration-500 group-hover:border-white/10 group-hover:bg-white/[0.04]" />
            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${s.bg} rounded-l-full opacity-40`} />
            
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/40 group-hover:text-white transition-colors">
                  <s.icon size={18} style={{ color: s.color }} />
                </div>
                <div className="text-[10px] font-bold text-white/10 uppercase tracking-tighter group-hover:text-white/20">Stat.0{i+1}</div>
              </div>
              <p className="text-3xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left">{s.value}</p>
              <p className="text-xs font-bold text-white/30 mt-1 uppercase tracking-widest">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Progress Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.7 }} 
          className="glass-panel p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4">
            <TrendingUp size={24} className="text-white/5" />
          </div>
          <h2 className="text-xl font-black mb-10 tracking-tight flex items-center gap-3">
            <span className="w-1.5 h-6 bg-cyan-400 rounded-full" />
            {t('progressOverview')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 justify-items-center">
            <CircularProgress value={completedTopics.length} max={totalTopics} label={t('topicsDone')} color="#00f0ff" />
            <CircularProgress value={xp % 100} max={100} label="Current LVL XP" color="#a855f7" />
            <CircularProgress value={avgScore} max={100} label={t('avgScore')} color="#22c55e" />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.8 }} 
          className="glass-panel p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-3">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
              {t('recentActivity')}
            </h2>
            <button className="text-[10px] font-bold text-white/20 hover:text-cyan-400 uppercase tracking-widest transition-colors">View All</button>
          </div>
          
          {recentResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                <Target size={20} className="text-white/10" />
              </div>
              <p className="text-sm text-white/20 font-medium italic">{t('noActivity')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentResults.map((r, i) => {
                const topic = curriculum.find(t => t.id === r.topicId)
                const pct = Math.round((r.score / r.totalQuestions) * 100)
                return (
                  <div key={i} className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-xl shadow-inner border border-white/5">
                        {topic?.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white/90 group-hover:text-cyan-400 transition-colors">{topic?.title ? topic.title[language] : ''}</p>
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{new Date(r.completedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-sm font-black ${pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {pct}%
                        </div>
                        <p className="text-[10px] font-bold text-white/20 uppercase">{r.score}/{r.totalQuestions}</p>
                      </div>
                      <ChevronRight size={16} className="text-white/10 group-hover:text-white/40 transition-all" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
