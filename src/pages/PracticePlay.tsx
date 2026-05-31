import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, RotateCcw, Target, MonitorSmartphone, Users, AlertCircle, Clock, Star, LayoutList, Play, Square, Upload } from 'lucide-react'
import { curriculum } from '../data'
import { useAuthStore } from '../store/useAuthStore'
import { useI18nStore } from '../store/useI18nStore'
import { useSubmissionStore } from '../store/useSubmissionStore'
import FileUploadButton from '../components/FileUploadButton'

export default function PracticePlay() {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const { language } = useI18nStore()
  const { savePracticeResult } = useAuthStore()
  const { mySubmissions, fetchMySubmissions } = useSubmissionStore()

  const topic = curriculum.find(t => t.id === Number(topicId))
  const contentItemId = topicId ? `topic-practice-${topicId}` : ''
  
  // Game state
  const [completedPhases, setCompletedPhases] = useState<number[]>([])
  const [activePhase, setActivePhase] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [saved, setSaved] = useState(false)

  // Fetch existing submission status
  const existingSubmission = mySubmissions.find(
    (s) => s.content_item_id === contentItemId
  )

  useEffect(() => {
    fetchMySubmissions()
  }, [fetchMySubmissions])

  useEffect(() => {
    if (activePhase === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activePhase, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-white/40">Topic not found</p>
        <button onClick={() => navigate('/practice')} className="btn-cyber">Back</button>
      </div>
    )
  }

  const lab = topic.practice[language];
  const totalPhases = lab.phases.length;
  const isFinished = completedPhases.length === totalPhases;

  const handleStartPhase = (idx: number) => {
    setActivePhase(idx);
    setTimeLeft(lab.phases[idx].durationMinutes * 60); // convert minutes to seconds
  }

  const handleCompletePhase = async (idx: number) => {
    setActivePhase(null);
    setTimeLeft(0);
    const nextCompleted = completedPhases.includes(idx) ? completedPhases : [...completedPhases, idx]
    if (!completedPhases.includes(idx)) {
      setCompletedPhases(nextCompleted);
    }

    if (topic && nextCompleted.length === totalPhases && !saved) {
      setSaved(true)
      await savePracticeResult(topic.id, nextCompleted.length, totalPhases)
    }
  }

  const handleRestart = () => {
    setCompletedPhases([])
    setActivePhase(null)
    setTimeLeft(0)
    setSaved(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/practice')} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors">
          <ArrowLeft size={16} /> {language === 'uz' ? 'Orqaga' : language === 'ru' ? 'Назад' : 'Back'}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{topic.icon}</span>
          <span className="text-sm font-bold text-white/80">{topic.title[language]}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isFinished ? (
          <motion.div key="finished" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 sm:p-10 text-center flex flex-col items-center gap-6 max-w-lg mx-auto">
            <MonitorSmartphone size={64} className="text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">{language === 'uz' ? 'Amaliyot muvaffaqiyatli yakunlandi!' : language === 'ru' ? 'Практика успешно завершена!' : 'Practice successfully completed!'}</h2>
            <p className="text-white/60">
              {language === 'uz' ? 'Barcha bosqichlar yakunlandi va natijalar tahlil qilindi.' : language === 'ru' ? 'Все этапы завершены, результаты проанализированы.' : 'All phases completed and results analyzed.'}
            </p>
            <div className="flex gap-4 mt-4">
              <button onClick={handleRestart} className="btn-cyber flex items-center gap-2"><RotateCcw size={14} /> {language === 'uz' ? 'Qayta boshlash' : language === 'ru' ? 'Начать заново' : 'Restart'}</button>
              <button onClick={() => navigate('/practice')} className="btn-primary">{language === 'uz' ? 'Amaliyotlarga qaytish' : language === 'ru' ? 'Вернуться к практикам' : 'Back to practices'}</button>
            </div>
          </motion.div>
        ) : (
          <div key="play" className="space-y-6 max-w-4xl mx-auto">
            {/* Context Info */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-5 sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <Target size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">{language === 'uz' ? 'Maqsad' : language === 'ru' ? 'Цель' : 'Objective'}</h3>
                      <p className="text-white/70 leading-relaxed text-sm">{lab.objective}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">{language === 'uz' ? 'Guruh Vazifasi' : language === 'ru' ? 'Групповое задание' : 'Group Task'}</h3>
                      <p className="text-white/70 leading-relaxed text-sm">{lab.groupTask}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4 items-start p-4 bg-white/[0.02] border border-white/5 rounded-2xl h-full">
                    <div className="text-yellow-400 mt-1 shrink-0"><AlertCircle size={18} /></div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-3">{language === 'uz' ? 'Qat\'iy Shartlar' : language === 'ru' ? 'Строгие условия' : 'Strict Conditions'}</h3>
                      <ul className="space-y-2">
                        {lab.conditions.map((cond, i) => (
                          <li key={i} className="text-sm text-white/60 flex items-start gap-2">
                            <span className="w-1 h-1 bg-yellow-400/50 rounded-full mt-2 shrink-0"></span>
                            {cond}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5">
                <div className="flex gap-4 items-start">
                  <div className="text-green-400 mt-1 shrink-0"><Star size={18} /></div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3">{language === 'uz' ? 'Baholash Mezonlari' : language === 'ru' ? 'Критерии оценки' : 'Evaluation Criteria'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {lab.evaluationCriteria.map((crit, i) => (
                        <div key={i} className="bg-white/[0.03] p-3 rounded-xl border border-white/5 text-sm text-white/70 flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                          {crit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Interactive Phases */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
              <div className="flex items-center gap-3 mb-6 px-2">
                <LayoutList className="text-cyan-400" size={24} />
                <h2 className="text-2xl font-bold text-white">
                  {language === 'uz' ? 'Amaliyot Bosqichlari' : language === 'ru' ? 'Этапы практики' : 'Practice Phases'}
                </h2>
              </div>

              {lab.phases.map((phase, idx) => {
                const isCompleted = completedPhases.includes(idx);
                const isActive = activePhase === idx;
                const isDisabled = activePhase !== null && activePhase !== idx && !isCompleted;
                
                return (
                  <motion.div 
                    key={idx}
                    className={`p-5 sm:p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden ${isCompleted ? 'bg-green-500/5 border-green-500/30' : isActive ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_30px_rgba(0,240,255,0.1)]' : 'glass-panel hover:border-cyan-500/30'}`}
                  >
                    {isCompleted && <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>}
                    {isActive && <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 animate-pulse"></div>}
                    
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className={`text-xl font-bold ${isCompleted ? 'text-green-400' : isActive ? 'text-cyan-300' : 'text-white/90'}`}>{phase.title}</h3>
                          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-white/60'}`}>
                            <Clock size={12} /> {phase.duration}
                          </span>
                        </div>
                        <p className={`text-base leading-relaxed ${isCompleted ? 'text-white/60' : 'text-white/80'}`}>
                          {phase.description}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {phase.tools.map((tool, ti) => (
                            <span key={ti} className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-lg text-xs font-medium">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-3">
                        {isActive ? (
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center min-w-[80px] px-4 py-2 bg-black/40 rounded-xl border border-cyan-500/30">
                              <span className={`text-2xl font-mono font-bold tracking-wider ${timeLeft <= 10 && timeLeft > 0 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`}>
                                {formatTime(timeLeft)}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCompletePhase(idx)}
                              className="flex items-center gap-2 px-4 py-3 bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500 hover:text-white rounded-xl font-bold transition-all"
                            >
                              <Square size={18} className="fill-current" /> {language === 'uz' ? 'Tugatish' : language === 'ru' ? 'Завершить' : 'Finish'}
                            </button>
                          </div>
                        ) : isCompleted ? (
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-500 border-2 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                            <Check size={24} />
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartPhase(idx)}
                            disabled={isDisabled}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-bold transition-all duration-300 ${isDisabled ? 'bg-white/5 border-white/10 text-white/20 cursor-not-allowed' : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500 hover:text-white hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]'}`}
                          >
                            <Play size={18} className="fill-current" /> {language === 'uz' ? 'Boshlash' : language === 'ru' ? 'Начать' : 'Start'}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* File Upload Section */}
      {contentItemId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6 mt-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Upload size={20} className="text-cyan-400" />
            <h3 className="text-lg font-bold text-white">
              {language === 'uz' ? 'Amaliyot faylini yuklash' : language === 'ru' ? 'Загрузить файл практики' : 'Upload Practice File'}
            </h3>
          </div>

          {existingSubmission && (
            <div className={`mb-4 p-3 rounded-xl border text-sm ${
              existingSubmission.status === 'graded'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
            }`}>
              <p className="font-medium">
                {existingSubmission.status === 'graded'
                  ? (language === 'uz' ? 'Baholangan' : language === 'ru' ? 'Оценено' : 'Graded')
                  : (language === 'uz' ? 'Kutilmoqda' : language === 'ru' ? 'На проверке' : 'Pending review')}
                {existingSubmission.score !== null && existingSubmission.score !== undefined && (
                  <span className="ml-2">— {language === 'uz' ? 'Ball' : language === 'ru' ? 'Балл' : 'Score'}: {existingSubmission.score}/100</span>
                )}
              </p>
              {existingSubmission.feedback && (
                <p className="mt-1 text-white/60">{existingSubmission.feedback}</p>
              )}
              {existingSubmission.file_name && (
                <p className="mt-1 text-white/40 text-xs">
                  {language === 'uz' ? 'Fayl' : language === 'ru' ? 'Файл' : 'File'}: {existingSubmission.file_name}
                </p>
              )}
            </div>
          )}

          <FileUploadButton
            contentItemId={contentItemId}
            onUploadComplete={() => fetchMySubmissions()}
          />
        </motion.div>
      )}
    </div>
  )
}
