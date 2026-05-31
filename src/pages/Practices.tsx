import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, GraduationCap, Play } from 'lucide-react'
import { curriculum } from '../data'
import { useAppStore } from '../store/useAppStore'
import { useContentStore } from '../store/useContentStore'
import { useI18nStore } from '../store/useI18nStore'

export default function Practices() {
  const navigate = useNavigate()
  const { completedTopics } = useAppStore()
  const { items, loading, fetchPublishedContent } = useContentStore()
  const { t, language } = useI18nStore()
  const customPractices = items.filter((item) => item.content_type === 'practice')

  useEffect(() => {
    fetchPublishedContent()
  }, [fetchPublishedContent])

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold">
          <span className="cyber-gradient-text">{t('practice')}</span>
        </motion.h1>
      </div>

      {customPractices.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <GraduationCap size={20} className="text-purple-400" />
            <h2 className="text-xl font-bold text-white">Admin qo'shgan amaliyotlar</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {customPractices.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="glass-panel-hover p-5 sm:p-6 cursor-pointer group"
                onClick={() => navigate(`/custom-practice/${item.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center text-purple-300">
                    <GraduationCap size={26} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 bg-purple-500/10 px-2 py-1 rounded-full">
                    New
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">{item.title}</h3>
                <p className="text-xs text-white/40 mb-4 line-clamp-2">{item.description || `${item.practice?.phases?.length || 0} bosqich`}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/25">{item.practice?.phases?.length || 0} phases</span>
                  <div className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity text-purple-300">
                    <Play size={12} /> Start
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="text-sm text-white/30">Qo'shimcha amaliyotlar yuklanmoqda...</div>}

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
