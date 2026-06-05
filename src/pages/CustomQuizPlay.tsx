import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, RotateCcw, Trophy, X } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'
import { useContentStore, type ContentItem, type MultilingualQuestion } from '../store/useContentStore'
import { useI18nStore } from '../store/useI18nStore'

const optionLetters = ['A', 'B', 'C', 'D']

function getQuestionText(question: MultilingualQuestion, language: 'uz' | 'ru' | 'en') {
  return question.q?.[language] || question.q?.uz || ''
}

function getOptions(question: MultilingualQuestion, language: 'uz' | 'ru' | 'en') {
  return question.options?.[language] || question.options?.uz || []
}

export default function CustomQuizPlay() {
  const { contentId } = useParams()
  const navigate = useNavigate()
  const { language } = useI18nStore()
  const { fetchContentItem } = useContentStore()
  const { saveQuizResult } = useAuthStore()
  const { addXp } = useAppStore()

  const [item, setItem] = useState<ContentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let alive = true

    async function load() {
      if (!contentId) return
      const data = await fetchContentItem(contentId)
      if (alive) {
        setItem(data)
        setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [contentId, fetchContentItem])

  const questions = useMemo(() => item?.questions || [], [item])
  const question = questions[current]
  const total = questions.length

  const handleConfirm = () => {
    if (selected === null || !question) return
    setConfirmed(true)
    if (selected === question.answer) setScore((value) => value + 1)
  }

  const handleNext = async () => {
    if (current < total - 1) {
      setCurrent((value) => value + 1)
      setSelected(null)
      setConfirmed(false)
      return
    }

    setFinished(true)
    if (!saved && item) {
      const finalScore = score
      setSaved(true)
      addXp(finalScore * 10)
      await saveQuizResult(item.topic_id || 0, 1, finalScore, total, item.id)
    }
  }

  const restart = () => {
    setCurrent(0)
    setSelected(null)
    setConfirmed(false)
    setScore(0)
    setFinished(false)
    setSaved(false)
  }

  if (loading) {
    return <div className="py-20 text-center text-white/40">Yuklanmoqda...</div>
  }

  if (!item || item.content_type !== 'test' || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-white/40">Test topilmadi</p>
        <button onClick={() => navigate('/quizzes')} className="btn-cyber">Orqaga</button>
      </div>
    )
  }

  const options = question ? getOptions(question, language) : []

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/quizzes')} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors">
          <ArrowLeft size={16} /> Orqaga
        </button>
        <div className="text-sm font-bold text-white/80 truncate max-w-[65%]">{item.title}</div>
      </div>

      {finished ? (
        <div className="glass-panel p-8 sm:p-10 text-center max-w-md mx-auto">
          <Trophy size={64} className={`mx-auto mb-4 ${Math.round((score / total) * 100) >= 70 ? 'text-yellow-400' : 'text-white/35'}`} />
          <h1 className="text-2xl font-black text-white mb-3">Test yakunlandi</h1>
          <div className="text-5xl font-black mb-2">
            <span className="text-cyan-300">{score}</span>
            <span className="text-white/20">/{total}</span>
          </div>
          <p className="text-white/40 text-sm mb-7">{Math.round((score / total) * 100)}% natija</p>
          <div className="flex justify-center gap-3">
            <button onClick={restart} className="btn-cyber flex items-center gap-2"><RotateCcw size={14} /> Qayta</button>
            <button onClick={() => navigate('/quizzes')} className="btn-primary">Testlarga qaytish</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-cyan-400">Savol {current + 1} / {total}</span>
            <span className="text-sm text-white/40">Ball: <span className="text-white font-bold">{score}</span></span>
          </div>

          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-cyan-400 rounded-full"
              animate={{ width: `${((current + 1) / total) * 100}%` }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="glass-panel p-5 sm:p-8"
            >
              <h2 className="text-lg font-semibold text-white mb-6 leading-relaxed">{getQuestionText(question, language)}</h2>
              <div className="grid gap-3">
                {options.map((option, index) => {
                  let cls = 'p-4 rounded-xl border text-sm font-medium transition-all cursor-pointer text-left w-full flex items-center gap-3 '
                  if (!confirmed) {
                    cls += selected === index
                      ? 'bg-cyan-500/10 border-cyan-400/45 text-white'
                      : 'bg-white/[0.02] border-white/[0.06] text-white/65 hover:bg-white/[0.05]'
                  } else if (index === question.answer) {
                    cls += 'bg-green-500/10 border-green-400/45 text-green-300'
                  } else if (index === selected) {
                    cls += 'bg-red-500/10 border-red-400/45 text-red-300'
                  } else {
                    cls += 'bg-white/[0.01] border-white/[0.04] text-white/30'
                  }

                  return (
                    <button key={index} onClick={() => !confirmed && setSelected(index)} className={cls}>
                      <span className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center text-xs font-bold shrink-0">
                        {optionLetters[index] || index + 1}
                      </span>
                      <span>{option}</span>
                      {confirmed && index === question.answer && <Check size={16} className="ml-auto text-green-400" />}
                      {confirmed && index === selected && index !== question.answer && <X size={16} className="ml-auto text-red-400" />}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-end">
            {!confirmed ? (
              <button onClick={handleConfirm} disabled={selected === null} className="btn-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2">
                <Check size={14} /> Tasdiqlash
              </button>
            ) : (
              <button onClick={handleNext} className="btn-primary flex items-center gap-2">
                {current < total - 1 ? <><ArrowRight size={14} /> Keyingisi</> : <><Trophy size={14} /> Yakunlash</>}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
