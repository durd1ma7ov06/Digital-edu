import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ClipboardList, Play } from 'lucide-react'
import { curriculum } from '../data'
import { useAppStore } from '../store/useAppStore'
import { useContentStore } from '../store/useContentStore'
import { useI18nStore } from '../store/useI18nStore'

export default function Quizzes() {
  const navigate = useNavigate()
  const { completedTopics, quizResults } = useAppStore()
  const { items, loading, fetchPublishedContent } = useContentStore()
  const { t, language } = useI18nStore()
  const customTests = items.filter((item) => item.content_type === 'test')

  useEffect(() => {
    fetchPublishedContent()
  }, [fetchPublishedContent])

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold">
          <span className="cyber-gradient-text">{t('quizzes')}</span>
        </motion.h1>
      </div>

      {customTests.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ClipboardList size={20} className="text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Admin qo'shgan testlar</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {customTests.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="glass-panel-hover p-5 sm:p-6 cursor-pointer group"
                onClick={() => navigate(`/custom-quiz/${item.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-300">
                    <ClipboardList size={26} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded-full">
                    New
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white/90 mb-2">{item.title}</h3>
                <p className="text-xs text-white/40 mb-4 line-clamp-2">{item.description || `${item.questions.length} ta savol`}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/25">{item.questions.length} questions</span>
                  <div className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity text-cyan-300">
                    <Play size={12} /> Start
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {loading && <div className="text-sm text-white/30">Qo'shimcha testlar yuklanmoqda...</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {curriculum.map((topic, i) => {
          const done = completedTopics.includes(topic.id)
          const results = quizResults.filter(r => r.topicId === topic.id)
          const bestScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : null

          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="glass-panel-hover p-5 sm:p-6 cursor-pointer group"
              onClick={() => navigate(`/quiz/${topic.id}`)}
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
              <p className="text-xs text-white/30 mb-4">{topic.testParts.reduce((acc, part) => acc + part.questions.length, 0)} questions</p>
              <div className="flex items-center justify-between">
                {bestScore !== null ? (
                  <span className="text-xs text-white/40">Best: {bestScore}</span>
                ) : (
                  <span className="text-xs text-white/20">Not attempted</span>
                )}
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
