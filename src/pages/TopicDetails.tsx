import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { curriculum } from '../data'
import { useI18nStore } from '../store/useI18nStore'

export default function TopicDetails() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const { language } = useI18nStore()

  const topic = curriculum.find(t => t.id === Number(topicId))

  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-white/40">Topic not found</p>
        <button onClick={() => navigate('/curriculum')} className="btn-cyber">Back</button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/curriculum')} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors">
          <ArrowLeft size={16} /> {language === 'uz' ? 'Orqaga' : language === 'ru' ? 'Назад' : 'Back'}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{topic.icon}</span>
          <span className="text-sm font-bold text-white/80">{topic.title[language]}</span>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 sm:p-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <h2 className="text-3xl font-extrabold mb-8 cyber-gradient-text tracking-tight">
          {language === 'uz' ? 'Nazariy Ma\'lumotlar' : language === 'ru' ? 'Теоретические материалы' : 'Theoretical Materials'}
        </h2>
        
        {topic.theoryImage && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8 border border-white/10 shadow-2xl">
            <img src={topic.theoryImage} alt="Theory visual" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </motion.div>
        )}

        <div className="prose prose-invert max-w-none text-white/80 leading-relaxed text-justify text-lg space-y-6">
          {topic.theory[language].split('\n').map((paragraph, idx) => (
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (idx * 0.1) }} key={idx} className="bg-white/[0.02] p-3 sm:p-4 rounded-xl border border-white/5 shadow-inner">
              {paragraph}
            </motion.p>
          ))}
        </div>
        
        <div className="mt-12 flex justify-end">
          <button onClick={() => navigate('/quizzes')} className="btn-primary flex items-center gap-2 group shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            {language === 'uz' ? 'Test yechishga o\'tish' : language === 'ru' ? 'Перейти к тестам' : 'Go to Quizzes'} 
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
