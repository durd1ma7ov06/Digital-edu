import { motion } from 'framer-motion'
import { CheckCircle, Lock, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { curriculum } from '../data'
import { useAppStore } from '../store/useAppStore'
import { useI18nStore } from '../store/useI18nStore'

export default function Curriculum() {
  const navigate = useNavigate()
  const { completedTopics } = useAppStore()
  const { t, language } = useI18nStore()

  return (
    <div className="space-y-10 pb-20">
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 mb-2"
        >
          <div className="w-8 h-[1px] bg-cyan-500" />
          <span className="text-[10px] font-bold text-cyan-400 tracking-[0.3em] uppercase">Academic Path</span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-4xl font-black tracking-tighter"
        >
          <span className="cyber-gradient-text uppercase">{t('curriculum')}</span>
        </motion.h1>
        <p className="text-white/40 text-sm mt-3 max-w-xl leading-relaxed">{t('platformDesc')}</p>
      </div>

      <div className="relative space-y-4">
        {/* Connection Line */}
        <div className="absolute left-6 top-0 bottom-0 w-[1px] bg-gradient-to-b from-cyan-500/50 via-purple-500/50 to-transparent hidden sm:block" />

        {curriculum.map((topic, i) => {
          const done = completedTopics.includes(topic.id)
          const isLocked = i > 0 && !completedTopics.includes(curriculum[i-1].id) && !done
          
          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => !isLocked && navigate(`/topic/${topic.id}`)}
              className={`relative group sm:pl-16 ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              {/* Node Indicator */}
              <div className={`absolute left-[1.125rem] top-1/2 -translate-y-1/2 w-[1.75rem] h-[1.75rem] rounded-full border-4 border-[#0a0e1a] z-10 hidden sm:flex items-center justify-center transition-all duration-500 ${
                done ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 
                isLocked ? 'bg-white/10' : 'bg-cyan-500 group-hover:scale-125 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
              }`}>
                {done && <CheckCircle size={10} className="text-white" />}
                {isLocked && <Lock size={10} className="text-white/40" />}
              </div>

              <div className="glass-panel p-5 sm:p-6 transition-all duration-500 group-hover:bg-white/[0.06] group-hover:border-white/10 group-hover:translate-x-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 relative group-hover:rotate-6 transition-transform shadow-xl"
                    style={{ 
                      background: `linear-gradient(135deg, ${topic.color}20, ${topic.color}05)`,
                      border: `1px solid ${topic.color}30` 
                    }}
                  >
                    <div className="absolute inset-0 blur-lg opacity-20 transition-opacity group-hover:opacity-40" style={{ backgroundColor: topic.color }} />
                    <span className="relative z-10">{topic.icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-white/5 text-white/30 tracking-tighter">UNIT {String(i + 1).padStart(2, '0')}</span>
                      <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors truncate">{topic.title[language]}</h3>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed max-w-2xl">{topic.description[language]}</p>
                    
                    <div className="flex items-center gap-4 mt-4">
                      <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: done ? '100%' : '0%' }}
                          className="h-full bg-cyan-500" 
                        />
                      </div>
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{done ? 'Completed' : isLocked ? 'Locked' : 'In Progress'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {!isLocked && (
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:text-cyan-400 group-hover:bg-cyan-400/10 transition-all border border-white/5">
                        <ChevronRight size={20} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
