import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, X, Trophy, RotateCcw, BrainCircuit, PlayCircle } from 'lucide-react'
import { curriculum } from '../data'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'
import { useI18nStore } from '../store/useI18nStore'

export default function QuizPlay() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const { completeTopic } = useAppStore()
  const { saveQuizResult } = useAuthStore()
  const { language } = useI18nStore()

  const topic = curriculum.find(t => t.id === Number(topicId))
  const [activePart, setActivePart] = useState<number | null>(null)
  
  // Quiz state
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [answers, setAnswers] = useState<(number | null)[]>([])

  useEffect(() => {
    if (activePart !== null && topic) {
      const part = topic.testParts.find(p => p.id === activePart)
      if (part) setAnswers(new Array(part.questions.length).fill(null))
    }
  }, [activePart, topic])

  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-white/40">Topic not found</p>
        <button onClick={() => navigate('/quizzes')} className="btn-cyber">Back</button>
      </div>
    )
  }

  const currentPart = activePart ? topic.testParts.find(p => p.id === activePart) : null;
  const q = currentPart ? currentPart.questions[current] : null;
  const total = currentPart ? currentPart.questions.length : 0;
  const optionLetters = ['A', 'B', 'C', 'D']

  const handleSelect = (idx: number) => {
    if (confirmed) return
    setSelected(idx)
  }

  const handleConfirm = () => {
    if (selected === null || !q) return
    setConfirmed(true)
    const newAnswers = [...answers]
    newAnswers[current] = selected
    setAnswers(newAnswers)
    if (selected === q.answer) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (!q) return;
    if (current < total - 1) {
      setCurrent(c => c + 1)
      setSelected(null)
      setConfirmed(false)
    } else {
      const finalScore = score + (selected === q.answer && confirmed && !finished ? 1 : 0)
      setFinished(true)
      completeTopic(topic.id, finalScore, total)
      // Supabase ga ham saqlash
      saveQuizResult(topic.id, activePart || 1, finalScore, total)
    }
  }

  const handleRestart = () => {
    setCurrent(0)
    setSelected(null)
    setConfirmed(false)
    setScore(0)
    setFinished(false)
    setAnswers(new Array(total).fill(null))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/quizzes')} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors">
          <ArrowLeft size={16} /> {language === 'uz' ? 'Orqaga' : language === 'ru' ? 'Назад' : 'Back'}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{topic.icon}</span>
          <span className="text-sm font-bold text-white/80">{topic.title[language]}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!activePart && (
          <motion.div key="quiz-parts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="glass-panel p-5 sm:p-8">
            <h2 className="text-2xl font-bold mb-6 text-center text-white/90 flex items-center justify-center gap-3">
              <BrainCircuit className="text-cyan-400" />
              {language === 'uz' ? 'Test Bo\'limlari' : language === 'ru' ? 'Разделы тестов' : 'Test Sections'}
            </h2>
            <p className="text-center text-white/50 mb-8 text-sm">
              {language === 'uz' ? 'Har bir bo\'limda 25 tadan savol mavjud' : language === 'ru' ? 'В каждом разделе по 25 вопросов' : 'Each section contains 25 questions'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topic.testParts.map((part) => (
                <motion.button
                  key={part.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActivePart(part.id);
                    setCurrent(0);
                    setSelected(null);
                    setConfirmed(false);
                    setScore(0);
                    setFinished(false);
                  }}
                  className="p-4 sm:p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-cyan-500/50 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
                      {part.id}
                    </div>
                    <span className="text-lg font-medium text-white/80 group-hover:text-white transition-colors">
                      {part.title[language]}
                    </span>
                  </div>
                  <PlayCircle size={24} className="text-white/20 group-hover:text-cyan-400 transition-colors" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {activePart && q && (
          <motion.div key="quiz-play" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {finished ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 px-2">
                <div className="glass-panel p-6 sm:p-10 text-center max-w-md w-full">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                    <Trophy size={64} className={`mx-auto mb-4 ${Math.round((score / total) * 100) >= 70 ? 'text-yellow-400' : 'text-white/30'}`} />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-2">{language === 'uz' ? 'Test yakunlandi!' : language === 'ru' ? 'Тест завершен!' : 'Quiz Complete!'}</h2>
                  <div className="text-5xl font-extrabold mb-2">
                    <span className={Math.round((score / total) * 100) >= 70 ? 'text-green-400' : 'text-yellow-400'}>{score}</span>
                    <span className="text-white/20">/{total}</span>
                  </div>
                  <p className="text-white/30 text-sm mb-6">{Math.round((score / total) * 100)}% {language === 'uz' ? 'to\'g\'ri' : language === 'ru' ? 'правильно' : 'correct'}</p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={handleRestart} className="btn-cyber flex items-center gap-2"><RotateCcw size={14} /> {language === 'uz' ? 'Qayta' : language === 'ru' ? 'Заново' : 'Retry'}</button>
                    <button onClick={() => setActivePart(null)} className="btn-primary">{language === 'uz' ? 'Bo\'limlar' : language === 'ru' ? 'Разделы' : 'Sections'}</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setActivePart(null)} className="text-sm text-white/40 hover:text-white transition-colors">
                    &larr; {language === 'uz' ? 'Bo\'limlarga qaytish' : language === 'ru' ? 'К разделам' : 'Back to sections'}
                  </button>
                  <div className="text-sm text-white/30">{language === 'uz' ? 'Ball' : language === 'ru' ? 'Счет' : 'Score'}: <span className="text-white/70 font-bold">{score}</span></div>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-cyan-400">{currentPart?.title[language]}</span>
                  <span className="text-sm font-medium text-white/50">{language === 'uz' ? 'Savol' : language === 'ru' ? 'Вопрос' : 'Question'} {current + 1} / {total}</span>
                </div>
                
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${topic.color}, ${topic.color}88)` }}
                    animate={{ width: `${((current + 1) / total) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    className="glass-panel p-5 sm:p-8 mt-6"
                  >
                    <h2 className="text-lg font-semibold text-white mb-6 leading-relaxed">{q.q[language]}</h2>
                    <div className="grid gap-3">
                      {q.options[language].map((opt, idx) => {
                        let cls = 'p-3 sm:p-4 rounded-xl border text-sm font-medium transition-all duration-300 cursor-pointer text-left w-full flex items-center gap-3 '
                        if (!confirmed) {
                          cls += selected === idx
                            ? 'bg-white/[0.08] border-cyan-400/40 text-white shadow-[0_0_20px_rgba(0,240,255,0.1)]'
                            : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:bg-white/[0.05] hover:border-white/[0.12]'
                        } else {
                          if (idx === q.answer) cls += 'bg-green-500/10 border-green-400/40 text-green-300'
                          else if (idx === selected) cls += 'bg-red-500/10 border-red-400/40 text-red-300'
                          else cls += 'bg-white/[0.01] border-white/[0.04] text-white/30'
                        }
                        return (
                          <motion.button key={idx} onClick={() => handleSelect(idx)} whileTap={{ scale: 0.98 }} className={cls}>
                            <span className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center text-xs font-bold shrink-0">
                              {optionLetters[idx]}
                            </span>
                            <span>{opt}</span>
                            {confirmed && idx === q.answer && <Check size={16} className="ml-auto text-green-400" />}
                            {confirmed && idx === selected && idx !== q.answer && <X size={16} className="ml-auto text-red-400" />}
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="flex justify-end mt-6">
                  {!confirmed ? (
                    <button onClick={handleConfirm} disabled={selected === null} className="btn-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2">
                      <Check size={14} /> {language === 'uz' ? 'Tasdiqlash' : language === 'ru' ? 'Подтвердить' : 'Confirm'}
                    </button>
                  ) : (
                    <button onClick={handleNext} className="btn-primary flex items-center gap-2">
                      {current < total - 1 ? <><ArrowRight size={14} /> {language === 'uz' ? 'Keyingisi' : language === 'ru' ? 'Далее' : 'Next'}</> : <><Trophy size={14} /> {language === 'uz' ? 'Yakunlash' : language === 'ru' ? 'Завершить' : 'Finish'}</>}
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
