import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, CheckCircle } from 'lucide-react'
import { curriculum } from '../data'
import { useAppStore } from '../store/useAppStore'
import { useI18nStore } from '../store/useI18nStore'

export default function Practices() {
  const navigate = useNavigate()
  const { completedTopics } = useAppStore()
  const { t, language } = useI18nStore()

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold">
          <span className="cyber-gradient-text">{t('practice')}</span>
        </motion.h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {curriculum.map((topic, i) => {
          const done = completedTopics.includes(topic.id)

          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="glass-panel-hover p-5 sm:p-6 cursor-pointer group"
              onClick={() => navigate(`/practice/${topic.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: `${topic.color}12`, border: `1px solid ${topic.color}20` }}
                >
                  {topic.icon}
                </div>
                {done && <CheckCircle size={18} className="text-green-400" />}
              </div>
              <h3 className="text-sm font-semibold text-white/90 mb-1">{topic.title[language]}</h3>
              <p className="text-xs text-white/30 mb-4">{language === 'uz' ? 'O\'yin amaliyoti' : language === 'ru' ? 'Игровая практика' : 'Game Practice'}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/20">{done ? 'Completed' : 'Available'}</span>
                <div className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: topic.color }}>
                  <Play size={12} /> Start
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
