import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, CheckCircle2, ClipboardCheck, Clock, GraduationCap, RefreshCcw, Search, Target, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore, type Profile } from '../store/useAuthStore'
import { useSubmissionStore } from '../store/useSubmissionStore'
import { useI18nStore } from '../store/useI18nStore'

const labels = {
  uz: {
    teacherPanel: 'Teacher panel',
    title: 'Talabalar nazorati',
    subtitle: "Testlar, amaliyotlar va guruhlar bo'yicha umumiy holat.",
    refresh: 'Yangilash',
    totalStudents: 'Jami talabalar',
    groups: 'Guruhlar',
    testResults: 'Test natijalari',
    practices: 'Amaliyotlar',
    average: "O'rtacha",
    grading: 'Baholash',
    pendingSubmissions: 'ta kutilayotgan topshiriq bor',
    noPendingSubmissions: "Hozircha kutilayotgan topshiriq yo'q",
    gradingPage: 'Baholash sahifasi',
    studentList: "Talabalar ro'yxati",
    studentListDesc: "Har bir talabaning umumiy o'zlashtirish holati.",
    searchPlaceholder: 'Talaba yoki guruh...',
    thStudent: 'Talaba',
    thGroup: 'Guruh',
    thTest: 'Test',
    thPractice: 'Amaliyot',
    thAverage: "O'rtacha",
    thLastActivity: "So'nggi faollik",
    loading: 'Yuklanmoqda...',
    noStudents: 'Talabalar topilmadi',
    defaultStudent: 'Talaba',
    noLogin: 'login yoq',
    noActivity: 'Hali yoq',
    recentTests: "So'nggi testlar",
    noResults: "Hozircha natija yo'q",
    noGroup: 'Guruhsiz',
    noAccess: "Ruxsat yo'q",
    noAccessDesc: 'Bu sahifa faqat teacher va admin uchun.',
  },
  ru: {
    teacherPanel: 'Панель учителя',
    title: 'Контроль студентов',
    subtitle: 'Общее состояние по тестам, практикам и группам.',
    refresh: 'Обновить',
    totalStudents: 'Всего студентов',
    groups: 'Группы',
    testResults: 'Результаты тестов',
    practices: 'Практики',
    average: 'Среднее',
    grading: 'Оценивание',
    pendingSubmissions: 'ожидающих заданий',
    noPendingSubmissions: 'Нет ожидающих заданий',
    gradingPage: 'Страница оценивания',
    studentList: 'Список студентов',
    studentListDesc: 'Общая успеваемость каждого студента.',
    searchPlaceholder: 'Студент или группа...',
    thStudent: 'Студент',
    thGroup: 'Группа',
    thTest: 'Тест',
    thPractice: 'Практика',
    thAverage: 'Среднее',
    thLastActivity: 'Последняя активность',
    loading: 'Загрузка...',
    noStudents: 'Студенты не найдены',
    defaultStudent: 'Студент',
    noLogin: 'нет логина',
    noActivity: 'Нет данных',
    recentTests: 'Последние тесты',
    noResults: 'Пока результатов нет',
    noGroup: 'Без группы',
    noAccess: 'Доступ запрещён',
    noAccessDesc: 'Эта страница только для учителей и админов.',
  },
  en: {
    teacherPanel: 'Teacher panel',
    title: 'Student Monitoring',
    subtitle: 'Overall status across tests, practices and groups.',
    refresh: 'Refresh',
    totalStudents: 'Total Students',
    groups: 'Groups',
    testResults: 'Test Results',
    practices: 'Practices',
    average: 'Average',
    grading: 'Grading',
    pendingSubmissions: 'pending submissions',
    noPendingSubmissions: 'No pending submissions',
    gradingPage: 'Grading page',
    studentList: 'Student List',
    studentListDesc: 'Overall performance of each student.',
    searchPlaceholder: 'Student or group...',
    thStudent: 'Student',
    thGroup: 'Group',
    thTest: 'Test',
    thPractice: 'Practice',
    thAverage: 'Average',
    thLastActivity: 'Last Activity',
    loading: 'Loading...',
    noStudents: 'No students found',
    defaultStudent: 'Student',
    noLogin: 'no login',
    noActivity: 'None yet',
    recentTests: 'Recent Tests',
    noResults: 'No results yet',
    noGroup: 'No group',
    noAccess: 'Access denied',
    noAccessDesc: 'This page is for teachers and admins only.',
  },
}

interface QuizResultRow {
  id: string
  user_id: string
  topic_id: number
  score: number
  total_questions: number
  percentage: number
  completed_at: string
  profiles?: Pick<Profile, 'full_name' | 'group_name' | 'avatar_emoji'>
  content_items?: { title: string | null } | null
}

interface PracticeResultRow {
  id: string
  user_id: string
  topic_id: number
  score: number
  max_score: number
  completed_at: string
  content_items?: { title: string | null } | null
}

export default function TeacherPanel() {
  const [students, setStudents] = useState<Profile[]>([])
  const [quizResults, setQuizResults] = useState<QuizResultRow[]>([])
  const [practiceResults, setPracticeResults] = useState<PracticeResultRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { submissions, fetchAllSubmissions } = useSubmissionStore()
  const { language } = useI18nStore()
  const L = labels[language]

  const pendingSubmissionsCount = useMemo(
    () => submissions.filter((s) => s.status === 'pending').length,
    [submissions]
  )

  useEffect(() => {
    fetchTeacherData()
    fetchAllSubmissions()
  }, [])

  const fetchTeacherData = async () => {
    setLoading(true)

    const [{ data: studentData }, { data: quizData }, { data: practiceData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('group_name', { ascending: true }),
      supabase
        .from('quiz_results')
        .select('*, profiles(full_name, group_name, avatar_emoji), content_items(title)')
        .order('completed_at', { ascending: false })
        .limit(200),
      supabase
        .from('practice_results')
        .select('*, content_items(title)')
        .order('completed_at', { ascending: false })
        .limit(200),
    ])

    setStudents((studentData || []) as Profile[])
    setQuizResults((quizData || []) as QuizResultRow[])
    setPracticeResults((practiceData || []) as PracticeResultRow[])
    setLoading(false)
  }

  const studentRows = useMemo(() => {
    const query = search.toLowerCase()

    return students
      .filter((student) =>
        student.full_name?.toLowerCase().includes(query) ||
        student.group_name?.toLowerCase().includes(query) ||
        student.username?.toLowerCase().includes(query)
      )
      .map((student) => {
        const studentQuizzes = quizResults.filter((result) => result.user_id === student.id)
        const studentPractices = practiceResults.filter((result) => result.user_id === student.id)
        const avgScore = studentQuizzes.length > 0
          ? Math.round(studentQuizzes.reduce((sum, result) => sum + Number(result.percentage || 0), 0) / studentQuizzes.length)
          : 0
        const lastQuiz = studentQuizzes[0]?.completed_at
        const lastPractice = studentPractices[0]?.completed_at
        const lastActivity = [lastQuiz, lastPractice].filter(Boolean).sort().reverse()[0] || null

        return {
          student,
          quizzes: studentQuizzes.length,
          practices: studentPractices.length,
          avgScore,
          lastActivity,
        }
      })
  }, [students, quizResults, practiceResults, search])

  const stats = useMemo(() => {
    const activeGroups = new Set(students.map((student) => student.group_name).filter(Boolean)).size
    const avgScore = quizResults.length > 0
      ? Math.round(quizResults.reduce((sum, result) => sum + Number(result.percentage || 0), 0) / quizResults.length)
      : 0

    return {
      totalStudents: students.length,
      activeGroups,
      completedTests: quizResults.length,
      completedPractices: practiceResults.length,
      avgScore,
    }
  }, [students, quizResults, practiceResults])

  if (profile?.role !== 'teacher' && profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white p-6">
        <GraduationCap size={64} className="text-purple-500 mb-4" />
        <h1 className="text-2xl font-bold">{L.noAccess}</h1>
        <p className="text-white/60">{L.noAccessDesc}</p>
      </div>
    )
  }

  const latestResults = quizResults.slice(0, 10)

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2 text-purple-400">
            <GraduationCap size={18} />
            <span className="text-xs font-black uppercase tracking-[0.25em]">{L.teacherPanel}</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">{L.title}</h1>
          <p className="text-white/50 mt-1">{L.subtitle}</p>
        </div>

        <button onClick={fetchTeacherData} className="btn-cyber flex items-center justify-center gap-2">
          <RefreshCcw size={16} /> {L.refresh}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: L.totalStudents, value: stats.totalStudents, icon: Users, color: 'text-cyan-300', bg: 'bg-cyan-500/10' },
          { label: L.groups, value: stats.activeGroups, icon: GraduationCap, color: 'text-purple-300', bg: 'bg-purple-500/10' },
          { label: L.testResults, value: stats.completedTests, icon: CheckCircle2, color: 'text-green-300', bg: 'bg-green-500/10' },
          { label: L.practices, value: stats.completedPractices, icon: Target, color: 'text-pink-300', bg: 'bg-pink-500/10' },
          { label: L.average, value: `${stats.avgScore}%`, icon: BarChart3, color: 'text-blue-300', bg: 'bg-blue-500/10' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-panel p-5 border-white/5"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon size={20} />
            </div>
            <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
            <div className="text-white/40 text-xs font-bold uppercase tracking-wider">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Baholash (Grading) section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-6 border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-300 flex items-center justify-center">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{L.grading}</h2>
            <p className="text-white/50 text-sm">
              {pendingSubmissionsCount > 0
                ? `${pendingSubmissionsCount} ${L.pendingSubmissions}`
                : L.noPendingSubmissions}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/teacher/grading')}
          className="btn-cyber flex items-center justify-center gap-2"
        >
          <ClipboardCheck size={16} />
          {L.gradingPage}
          {pendingSubmissionsCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-orange-500/20 text-orange-300">
              {pendingSubmissionsCount}
            </span>
          )}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        <div className="glass-panel overflow-hidden border-white/5">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">{L.studentList}</h2>
              <p className="text-white/40 text-sm mt-1">{L.studentListDesc}</p>
            </div>
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={L.searchPlaceholder}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-white text-sm focus:outline-none focus:border-purple-500/30"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] text-white/40 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">{L.thStudent}</th>
                  <th className="px-6 py-4">{L.thGroup}</th>
                  <th className="px-6 py-4">{L.thTest}</th>
                  <th className="px-6 py-4">{L.thPractice}</th>
                  <th className="px-6 py-4">{L.thAverage}</th>
                  <th className="px-6 py-4">{L.thLastActivity}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-white/30">{L.loading}</td>
                  </tr>
                ) : studentRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-white/30">{L.noStudents}</td>
                  </tr>
                ) : (
                  studentRows.map((row) => (
                    <tr key={row.student.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-400/15 flex items-center justify-center">
                            {row.student.avatar_emoji || '🎯'}
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm">{row.student.full_name || L.defaultStudent}</div>
                            <div className="text-white/35 text-xs">@{row.student.username || L.noLogin}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/60 text-xs">{row.student.group_name || '-'}</td>
                      <td className="px-6 py-4 text-white/70 text-sm font-bold">{row.quizzes}</td>
                      <td className="px-6 py-4 text-white/70 text-sm font-bold">{row.practices}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${row.avgScore >= 70 ? 'bg-green-500' : row.avgScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${row.avgScore}%` }}
                            />
                          </div>
                          <span className="text-white/70 text-xs font-bold">{row.avgScore}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white/35 text-xs">
                        {row.lastActivity ? new Date(row.lastActivity).toLocaleString() : L.noActivity}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel overflow-hidden border-white/5">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Clock className="text-cyan-400" size={20} />
              {L.recentTests}
            </h2>
          </div>

          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-10 text-center text-white/30">{L.loading}</div>
            ) : latestResults.length === 0 ? (
              <div className="p-10 text-center text-white/30">{L.noResults}</div>
            ) : (
              latestResults.map((result) => (
                <div key={result.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-white font-bold text-sm">{result.profiles?.full_name || L.defaultStudent}</p>
                      <p className="text-white/35 text-xs mt-1">{result.profiles?.group_name || L.noGroup}</p>
                    </div>
                    <span className={`text-sm font-black ${Number(result.percentage) >= 70 ? 'text-green-300' : Number(result.percentage) >= 40 ? 'text-yellow-300' : 'text-red-300'}`}>
                      {Math.round(Number(result.percentage || 0))}%
                    </span>
                  </div>
                  <p className="text-white/50 text-xs mt-3">
                    {result.content_items?.title || `Mavzu ID: ${result.topic_id}`} - {result.score}/{result.total_questions}
                  </p>
                  <p className="text-white/25 text-xs mt-2">{new Date(result.completed_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
