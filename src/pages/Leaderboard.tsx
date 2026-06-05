import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, Medal, TrendingUp, RefreshCw, Trophy, Users } from 'lucide-react'
import { useAuthStore, type LeaderboardEntry } from '../store/useAuthStore'
import { useI18nStore } from '../store/useI18nStore'
import { generateFakeStudents } from '../data/fakeStudents'

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { fetchLeaderboard, user } = useAuthStore()
  const { t, language } = useI18nStore()

  const rankColors = ['#facc15', '#c0c0c0', '#cd7f32']

  const loadData = async () => {
    setLoading(true)
    const data = await fetchLeaderboard()
    // Ko'rinish uchun soxta talabalarni qo'shamiz va XP bo'yicha qayta saralaymiz.
    const merged = [...data, ...generateFakeStudents(108)].sort(
      (a, b) => b.total_xp - a.total_xp
    )
    setEntries(merged)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Trophy size={20} className="text-cyan-400 animate-pulse" />
          </div>
        </div>
        <p className="text-cyan-400/50 text-xs font-black uppercase tracking-[0.3em]">Syncing Rankings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="w-8 h-[1px] bg-purple-500" />
            <span className="text-[10px] font-bold text-purple-400 tracking-[0.3em] uppercase">Global Standing</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-4xl font-black tracking-tighter"
          >
            <span className="cyber-gradient-text uppercase">{t('title')}</span>
          </motion.h1>
          <p className="text-white/40 text-sm mt-2">{t('subtitle')} • {entries.length} Talabalar</p>
        </div>
        
        <motion.button
          onClick={loadData}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-bold uppercase tracking-widest text-white/50 hover:text-cyan-400 hover:border-cyan-500/30 transition-all group"
        >
          <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
          {t('refresh')}
        </motion.button>
      </div>

      {entries.length === 0 ? (
        <div className="glass-panel p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
          <Trophy size={64} className="mx-auto mb-6 text-white/5 animate-bounce" />
          <p className="text-white/30 text-lg font-medium">{t('noData')}</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Podium for Top 3 */}
          <div className="flex flex-col sm:flex-row items-end justify-center gap-4 sm:gap-0 pt-10">
            {/* 2nd Place */}
            {entries[1] && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-1 max-w-[200px] w-full"
              >
                <div className="text-center mb-4">
                  <div className="relative inline-block">
                    <div className="text-4xl mb-2">{entries[1].avatar_emoji}</div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-800 shadow-lg border-2 border-slate-400">2</div>
                  </div>
                  <p className="text-sm font-bold text-white/80 truncate px-2">{entries[1].full_name}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{entries[1].total_xp.toLocaleString()} XP</p>
                </div>
                <div className="h-24 bg-gradient-to-t from-slate-500/20 to-slate-500/5 border-x border-t border-white/5 rounded-t-2xl flex items-center justify-center backdrop-blur-md">
                   <Medal size={32} className="text-slate-400/30" />
                </div>
              </motion.div>
            )}

            {/* 1st Place */}
            {entries[0] && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 max-w-[240px] w-full z-10"
              >
                <div className="text-center mb-4">
                  <div className="relative inline-block">
                    <motion.div 
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="text-6xl mb-2"
                    >
                      {entries[0].avatar_emoji}
                    </motion.div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-sm font-black text-yellow-900 shadow-[0_0_20px_rgba(250,204,21,0.5)] border-4 border-yellow-500">1</div>
                    <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 w-8 h-8 drop-shadow-glow" />
                  </div>
                  <p className="text-lg font-black text-white truncate px-2">{entries[0].full_name}</p>
                  <p className="text-xs font-black text-yellow-400 uppercase tracking-widest">{entries[0].total_xp.toLocaleString()} XP</p>
                </div>
                <div className="h-32 bg-gradient-to-t from-yellow-500/20 to-yellow-500/5 border-x border-t border-yellow-500/30 rounded-t-3xl flex items-center justify-center backdrop-blur-md relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,0.1),transparent)]" />
                  <Trophy size={48} className="text-yellow-400/40 relative z-10" />
                </div>
              </motion.div>
            )}

            {/* 3rd Place */}
            {entries[2] && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex-1 max-w-[200px] w-full"
              >
                <div className="text-center mb-4">
                  <div className="relative inline-block">
                    <div className="text-4xl mb-2">{entries[2].avatar_emoji}</div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-700 flex items-center justify-center text-[10px] font-bold text-white shadow-lg border-2 border-orange-800">3</div>
                  </div>
                  <p className="text-sm font-bold text-white/80 truncate px-2">{entries[2].full_name}</p>
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">{entries[2].total_xp.toLocaleString()} XP</p>
                </div>
                <div className="h-20 bg-gradient-to-t from-orange-500/20 to-orange-500/5 border-x border-t border-white/5 rounded-t-2xl flex items-center justify-center backdrop-blur-md">
                   <Medal size={28} className="text-orange-500/20" />
                </div>
              </motion.div>
            )}
          </div>

          {/* List View */}
          <div className="glass-panel overflow-hidden border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">{t('rank')}</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest">{t('student')}</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-center">{t('level')}</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-center">{t('quizzes')}</th>
                    <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">{t('xp')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {entries.map((u, i) => (
                    <motion.tr
                      key={u.user_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`group hover:bg-white/[0.04] transition-colors ${u.user_id === user?.id ? 'bg-cyan-500/5' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <span className={`text-sm font-black ${i < 3 ? 'text-white' : 'text-white/20'}`}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center text-xl shadow-inner border border-white/5 group-hover:scale-110 transition-transform">
                            {u.avatar_emoji}
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${u.user_id === user?.id ? 'text-cyan-400' : 'text-white/80'}`}>
                              {u.full_name} {u.user_id === user?.id && <span className="text-[10px] ml-2 text-cyan-400/50 uppercase">YOU</span>}
                            </p>
                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-tighter">{u.group_name || 'STUDENT'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-white/40 uppercase">LVL {u.level}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-bold text-white/30">
                        {u.total_quizzes}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-black ${u.user_id === user?.id ? 'text-cyan-400' : 'text-white/60'}`}>
                          {u.total_xp.toLocaleString()}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
