import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardCheck, Download, FileText, GraduationCap, RefreshCcw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import { useSubmissionStore } from '../store/useSubmissionStore'
import { useI18nStore } from '../store/useI18nStore'
import { SubmissionFilters } from '../components/SubmissionFilters'
import { GradingForm } from '../components/GradingForm'
import type { SubmissionWithProfile } from '../types/submission'

const labels = {
  uz: {
    grading: "Baholash",
    studentWorks: "Talabalar ishlari",
    description: "Yuborilgan amaliyot fayllarini ko'rib chiqish va baholash.",
    refresh: "Yangilash",
    total: "Jami ishlar",
    pending: "Kutilmoqda",
    graded: "Baholangan",
    submittedWorks: "Yuborilgan ishlar",
    submittedWorksDesc: "Faylni yuklab ko'ring va baholang.",
    loading: "Yuklanmoqda...",
    noWorks: "Ishlar topilmadi",
    student: "Talaba",
    noGroup: "Guruhsiz",
    statusPending: "Kutilmoqda",
    statusGraded: "Baholangan",
    unknown: "Noma'lum",
    download: "Yuklab olish",
    downloading: "Yuklanmoqda...",
    score: "Baho",
    gradingPanel: "Baholash paneli",
    topic: "Mavzu",
    file: "Fayl",
    size: "Hajm",
    submitted: "Yuborilgan",
    downloadFile: "Faylni yuklab olish",
    alreadyGraded: "Baholangan",
    scoreLabel: "Baho:",
    selectWork: "Baholash uchun chap paneldan ishni tanlang",
    noAccess: "Ruxsat yo'q",
    noAccessDesc: "Bu sahifa faqat teacher va admin uchun.",
  },
  ru: {
    grading: "Оценивание",
    studentWorks: "Работы студентов",
    description: "Просмотр и оценка отправленных практических файлов.",
    refresh: "Обновить",
    total: "Всего работ",
    pending: "Ожидают",
    graded: "Оценено",
    submittedWorks: "Отправленные работы",
    submittedWorksDesc: "Скачайте файл и оцените.",
    loading: "Загрузка...",
    noWorks: "Работы не найдены",
    student: "Студент",
    noGroup: "Без группы",
    statusPending: "Ожидает",
    statusGraded: "Оценено",
    unknown: "Неизвестно",
    download: "Скачать",
    downloading: "Скачивание...",
    score: "Оценка",
    gradingPanel: "Панель оценивания",
    topic: "Тема",
    file: "Файл",
    size: "Размер",
    submitted: "Отправлено",
    downloadFile: "Скачать файл",
    alreadyGraded: "Оценено",
    scoreLabel: "Оценка:",
    selectWork: "Выберите работу из левой панели для оценки",
    noAccess: "Доступ запрещён",
    noAccessDesc: "Эта страница доступна только преподавателям и администраторам.",
  },
  en: {
    grading: "Grading",
    studentWorks: "Student Works",
    description: "Review and grade submitted practice files.",
    refresh: "Refresh",
    total: "Total Works",
    pending: "Pending",
    graded: "Graded",
    submittedWorks: "Submitted Works",
    submittedWorksDesc: "Download files and grade them.",
    loading: "Loading...",
    noWorks: "No works found",
    student: "Student",
    noGroup: "No group",
    statusPending: "Pending",
    statusGraded: "Graded",
    unknown: "Unknown",
    download: "Download",
    downloading: "Downloading...",
    score: "Score",
    gradingPanel: "Grading Panel",
    topic: "Topic",
    file: "File",
    size: "Size",
    submitted: "Submitted",
    downloadFile: "Download file",
    alreadyGraded: "Graded",
    scoreLabel: "Score:",
    selectWork: "Select a work from the left panel to grade",
    noAccess: "Access Denied",
    noAccessDesc: "This page is only for teachers and admins.",
  },
}

export default function TeacherGrading() {
  const { profile } = useAuthStore()
  const { language } = useI18nStore()
  const L = labels[language]
  const { submissions, loading, fetchAllSubmissions, filters } = useSubmissionStore()
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithProfile | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    fetchAllSubmissions()
  }, [filters])

  const handleDownloadFile = async (submission: SubmissionWithProfile) => {
    setDownloadingId(submission.id)
    try {
      const { data, error } = await supabase.storage
        .from('practice-files')
        .createSignedUrl(submission.file_path, 300) // 5 min expiry

      if (error) {
        console.error('Download error:', error)
        return
      }

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } finally {
      setDownloadingId(null)
    }
  }

  const handleGradeSuccess = () => {
    setSelectedSubmission(null)
    fetchAllSubmissions()
  }

  if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white p-6">
        <GraduationCap size={64} className="text-purple-500 mb-4" />
        <h1 className="text-2xl font-bold">{L.noAccess}</h1>
        <p className="text-white/60">{L.noAccessDesc}</p>
      </div>
    )
  }

  const pendingCount = submissions.filter((s) => s.status === 'pending').length
  const gradedCount = submissions.filter((s) => s.status === 'graded').length

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2 text-purple-400">
            <ClipboardCheck size={18} />
            <span className="text-xs font-black uppercase tracking-[0.25em]">{L.grading}</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">{L.studentWorks}</h1>
          <p className="text-white/50 mt-1">{L.description}</p>
        </div>

        <button
          onClick={() => fetchAllSubmissions()}
          className="btn-cyber flex items-center justify-center gap-2"
        >
          <RefreshCcw size={16} /> {L.refresh}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: L.total, value: submissions.length, color: 'text-cyan-300', bg: 'bg-cyan-500/10' },
          { label: L.pending, value: pendingCount, color: 'text-yellow-300', bg: 'bg-yellow-500/10' },
          { label: L.graded, value: gradedCount, color: 'text-green-300', bg: 'bg-green-500/10' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-panel p-5 border-white/5"
          >
            <div className={`text-2xl font-black ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-white/40 text-xs font-bold uppercase tracking-wider">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <SubmissionFilters />

      {/* Content area */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        {/* Submissions list */}
        <div className="glass-panel overflow-hidden border-white/5">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-bold text-white">{L.submittedWorks}</h2>
            <p className="text-white/40 text-sm mt-1">{L.submittedWorksDesc}</p>
          </div>

          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-10 text-center text-white/30">{L.loading}</div>
            ) : submissions.length === 0 ? (
              <div className="p-10 text-center text-white/30">{L.noWorks}</div>
            ) : (
              submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`p-5 hover:bg-white/[0.02] transition-colors cursor-pointer ${
                    selectedSubmission?.id === submission.id ? 'bg-purple-500/5 border-l-2 border-purple-500' : ''
                  }`}
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-400/15 flex items-center justify-center">
                        {submission.profiles?.avatar_emoji || '📄'}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm">
                          {submission.profiles?.full_name || L.student}
                        </p>
                        <p className="text-white/35 text-xs mt-0.5">
                          {submission.profiles?.group_name || L.noGroup}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          submission.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-300'
                            : 'bg-green-500/10 text-green-300'
                        }`}
                      >
                        {submission.status === 'pending' ? L.statusPending : L.statusGraded}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-white/50 text-xs">
                      <FileText size={12} />
                      <span>{submission.content_items?.title || L.unknown}</span>
                    </div>
                    <span className="text-white/25 text-xs">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-white/30 text-xs truncate max-w-[200px]">
                      {submission.file_name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownloadFile(submission)
                      }}
                      disabled={downloadingId === submission.id}
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
                    >
                      <Download size={12} />
                      {downloadingId === submission.id ? L.downloading : L.download}
                    </button>
                  </div>

                  {submission.status === 'graded' && submission.score !== null && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-white/50 text-xs">{L.scoreLabel}</span>
                      <span
                        className={`text-sm font-black ${
                          submission.score >= 70
                            ? 'text-green-300'
                            : submission.score >= 40
                            ? 'text-yellow-300'
                            : 'text-red-300'
                        }`}
                      >
                        {submission.score}/100
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Grading panel */}
        <div className="glass-panel overflow-hidden border-white/5">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <ClipboardCheck className="text-purple-400" size={20} />
              {L.gradingPanel}
            </h2>
          </div>

          <div className="p-6">
            {selectedSubmission ? (
              <div className="space-y-5">
                {/* Selected submission details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-400/15 flex items-center justify-center text-lg">
                      {selectedSubmission.profiles?.avatar_emoji || '📄'}
                    </div>
                    <div>
                      <p className="text-white font-bold">
                        {selectedSubmission.profiles?.full_name || L.student}
                      </p>
                      <p className="text-white/40 text-xs">
                        {selectedSubmission.profiles?.group_name || L.noGroup}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/[0.03] rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs">{L.topic}:</span>
                      <span className="text-white/70 text-xs font-bold">
                        {selectedSubmission.content_items?.title || L.unknown}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs">{L.file}:</span>
                      <span className="text-white/70 text-xs truncate max-w-[180px]">
                        {selectedSubmission.file_name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs">{L.size}:</span>
                      <span className="text-white/70 text-xs">
                        {(selectedSubmission.file_size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-xs">{L.submitted}:</span>
                      <span className="text-white/70 text-xs">
                        {new Date(selectedSubmission.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadFile(selectedSubmission)}
                    disabled={downloadingId === selectedSubmission.id}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-bold hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
                  >
                    <Download size={16} />
                    {downloadingId === selectedSubmission.id ? L.downloading : L.downloadFile}
                  </button>
                </div>

                {/* Grading form */}
                {selectedSubmission.status === 'pending' ? (
                  <GradingForm
                    submissionId={selectedSubmission.id}
                    onSuccess={handleGradeSuccess}
                  />
                ) : (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 space-y-2">
                    <p className="text-green-300 text-sm font-bold">✓ {L.alreadyGraded}</p>
                    <p className="text-white/60 text-sm">
                      {L.scoreLabel} <span className="font-bold text-white">{selectedSubmission.score}/100</span>
                    </p>
                    {selectedSubmission.feedback && (
                      <p className="text-white/50 text-xs mt-2">{selectedSubmission.feedback}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText size={48} className="text-white/10 mb-4" />
                <p className="text-white/30 text-sm">{L.selectWork}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
