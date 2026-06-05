import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Clock, Play, RotateCcw, Square, Target, Trophy, Upload } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useContentStore, type ContentItem, type ContentPracticePhase } from '../store/useContentStore'
import { useSubmissionStore } from '../store/useSubmissionStore'
import FileUploadButton from '../components/FileUploadButton'

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${rest.toString().padStart(2, '0')}`
}

export default function CustomPracticePlay() {
  const { contentId } = useParams()
  const navigate = useNavigate()
  const { fetchContentItem } = useContentStore()
  const { savePracticeResult } = useAuthStore()
  const { mySubmissions, fetchMySubmissions } = useSubmissionStore()

  const [item, setItem] = useState<ContentItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [completedPhases, setCompletedPhases] = useState<number[]>([])
  const [activePhase, setActivePhase] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [saved, setSaved] = useState(false)

  // Existing submission for this content item
  const existingSubmission = mySubmissions.find(
    (s) => s.content_item_id === contentId
  )

  useEffect(() => {
    fetchMySubmissions()
  }, [fetchMySubmissions])

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

  useEffect(() => {
    if (activePhase === null || timeLeft <= 0) return
    const interval = window.setInterval(() => {
      setTimeLeft((value) => value - 1)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [activePhase, timeLeft])

  const phases: ContentPracticePhase[] = item?.practice?.phases || []
  const isFinished = phases.length > 0 && completedPhases.length === phases.length

  const startPhase = (index: number) => {
    setActivePhase(index)
    setTimeLeft((phases[index]?.durationMinutes || 1) * 60)
  }

  const completePhase = async (index: number) => {
    const nextCompleted = completedPhases.includes(index)
      ? completedPhases
      : [...completedPhases, index]

    setCompletedPhases(nextCompleted)
    setActivePhase(null)
    setTimeLeft(0)

    if (item && nextCompleted.length === phases.length && !saved) {
      setSaved(true)
      await savePracticeResult(item.topic_id || 0, nextCompleted.length, phases.length, item.id)
    }
  }

  const restart = () => {
    setCompletedPhases([])
    setActivePhase(null)
    setTimeLeft(0)
    setSaved(false)
  }

  if (loading) {
    return <div className="py-20 text-center text-white/40">Yuklanmoqda...</div>
  }

  if (!item || item.content_type !== 'practice' || phases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-white/40">Amaliyot topilmadi</p>
        <button onClick={() => navigate('/practice')} className="btn-cyber">Orqaga</button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/practice')} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors">
          <ArrowLeft size={16} /> Orqaga
        </button>
        <div className="text-sm font-bold text-white/80 truncate max-w-[65%]">{item.title}</div>
      </div>

      {isFinished ? (
        <div className="glass-panel p-8 sm:p-10 text-center max-w-md mx-auto">
          <Trophy size={64} className="mx-auto mb-4 text-yellow-400" />
          <h1 className="text-2xl font-black text-white mb-3">Amaliyot yakunlandi</h1>
          <p className="text-white/45 text-sm mb-7">Barcha bosqichlar bajarildi va natija teacher paneliga saqlandi.</p>
          <div className="flex justify-center gap-3">
            <button onClick={restart} className="btn-cyber flex items-center gap-2"><RotateCcw size={14} /> Qayta</button>
            <button onClick={() => navigate('/practice')} className="btn-primary">Amaliyotlarga qaytish</button>
          </div>
        </div>
      ) : (
        <>
          <div className="glass-panel p-6 border-white/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 flex items-center justify-center shrink-0">
                <Target size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">{item.title}</h1>
                <p className="text-white/55 text-sm mt-2 leading-relaxed">{item.description}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {phases.map((phase, index) => {
              const isCompleted = completedPhases.includes(index)
              const isActive = activePhase === index
              const isDisabled = activePhase !== null && !isActive && !isCompleted

              return (
                <motion.div
                  key={`${phase.title}-${index}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'bg-green-500/5 border-green-500/30'
                      : isActive
                        ? 'bg-cyan-500/10 border-cyan-500/50'
                        : 'glass-panel hover:border-cyan-500/30'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className={`text-xl font-bold ${isCompleted ? 'text-green-300' : isActive ? 'text-cyan-300' : 'text-white'}`}>
                          {phase.title}
                        </h2>
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-white/5 text-white/60">
                          <Clock size={12} /> {phase.duration}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed">{phase.description}</p>
                      {phase.tools.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {phase.tools.map((tool) => (
                            <span key={tool} className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-lg text-xs font-medium">
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      {isActive ? (
                        <>
                          <div className="min-w-[82px] px-4 py-2 bg-black/40 rounded-xl border border-cyan-500/30 text-center">
                            <span className={`text-2xl font-mono font-bold ${timeLeft <= 10 && timeLeft > 0 ? 'text-red-400' : 'text-cyan-300'}`}>
                              {formatTime(timeLeft)}
                            </span>
                          </div>
                          <button onClick={() => completePhase(index)} className="px-4 py-3 rounded-xl bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500 hover:text-white font-bold transition-all flex items-center gap-2">
                            <Square size={16} className="fill-current" /> Tugatish
                          </button>
                        </>
                      ) : isCompleted ? (
                        <div className="w-12 h-12 rounded-xl bg-green-500 text-white flex items-center justify-center">
                          <Check size={24} />
                        </div>
                      ) : (
                        <button
                          onClick={() => startPhase(index)}
                          disabled={isDisabled}
                          className="px-5 py-3 rounded-xl border border-cyan-500/40 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-all flex items-center gap-2"
                        >
                          <Play size={16} className="fill-current" /> Boshlash
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </>
      )}

      {/* File Upload Section */}
      {contentId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 mt-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Upload size={20} className="text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Amaliyot faylini yuklash</h3>
          </div>

          {existingSubmission && (
            <div className={`mb-4 p-3 rounded-xl border text-sm ${
              existingSubmission.status === 'graded'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
            }`}>
              <p className="font-medium">
                {existingSubmission.status === 'graded' ? 'Baholangan' : 'Kutilmoqda'}
                {existingSubmission.score !== null && existingSubmission.score !== undefined && (
                  <span className="ml-2">— Ball: {existingSubmission.score}/100</span>
                )}
              </p>
              {existingSubmission.feedback && (
                <p className="mt-1 text-white/60">{existingSubmission.feedback}</p>
              )}
              {existingSubmission.file_name && (
                <p className="mt-1 text-white/40 text-xs">Fayl: {existingSubmission.file_name}</p>
              )}
            </div>
          )}

          <FileUploadButton
            contentItemId={contentId}
            onUploadComplete={() => fetchMySubmissions()}
          />
        </motion.div>
      )}
    </div>
  )
}
