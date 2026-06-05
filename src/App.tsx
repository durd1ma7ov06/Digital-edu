import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Achievements from './pages/Achievements'
import AdminPanel from './pages/AdminPanel'
import AuthPage from './pages/AuthPage'
import Certificate from './pages/Certificate'
import ContentDetails from './pages/ContentDetails'
import Curriculum from './pages/Curriculum'
import CustomPracticePlay from './pages/CustomPracticePlay'
import CustomQuizPlay from './pages/CustomQuizPlay'
import Dashboard from './pages/Dashboard'
import DiagnosticTest from './pages/DiagnosticTest'
import Leaderboard from './pages/Leaderboard'
import PracticePlay from './pages/PracticePlay'
import Practices from './pages/Practices'
import QuizPlay from './pages/QuizPlay'
import Quizzes from './pages/Quizzes'
import AdminRoleRequests from './pages/AdminRoleRequests'
import RoleRequestPage from './pages/RoleRequestPage'
import Settings from './pages/Settings'
import StudentSubmissions from './pages/StudentSubmissions'
import TeacherGrading from './pages/TeacherGrading'
import TeacherPanel from './pages/TeacherPanel'
import TopicDetails from './pages/TopicDetails'
import { useAuthStore, type UserRole } from './store/useAuthStore'

function roleHome(role?: UserRole) {
  if (role === 'admin') return '/admin'
  if (role === 'teacher') return '/teacher'
  return '/'
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-900 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
        <p className="text-sm text-white/40">Yuklanmoqda...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const location = useLocation()
  const { user, profile, loading, initialized } = useAuthStore()

  if (!initialized || loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to={roleHome(profile.role)} replace />
  }

  return <>{children}</>
}

function AuthRoute() {
  const { user, profile, loading, initialized } = useAuthStore()

  if (!initialized || loading) {
    return <LoadingScreen />
  }

  if (user) {
    return <Navigate to={roleHome(profile?.role)} replace />
  }

  return <AuthPage />
}

export default function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Routes>
      <Route path="/auth" element={<AuthRoute />} />
      <Route
        path="/diagnostic"
        element={(
          <ProtectedRoute>
            <DiagnosticTest />
          </ProtectedRoute>
        )}
      />

      <Route
        element={(
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        )}
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/content/:contentId" element={<ContentDetails />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/topic/:topicId" element={<TopicDetails />} />
        <Route path="/quiz/:topicId" element={<QuizPlay />} />
        <Route path="/custom-quiz/:contentId" element={<CustomQuizPlay />} />
        <Route path="/practice" element={<Practices />} />
        <Route path="/practice/:topicId" element={<PracticePlay />} />
        <Route path="/custom-practice/:contentId" element={<CustomPracticePlay />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/certificate" element={<Certificate />} />
        <Route path="/request-teacher" element={<RoleRequestPage />} />
        <Route path="/submissions" element={<StudentSubmissions />} />
      </Route>

      <Route
        path="/admin"
        element={(
          <ProtectedRoute roles={['admin']}>
            <Layout />
          </ProtectedRoute>
        )}
      >
        <Route index element={<AdminPanel />} />
        <Route path="role-requests" element={<AdminRoleRequests />} />
      </Route>

      <Route
        path="/teacher"
        element={(
          <ProtectedRoute roles={['teacher', 'admin']}>
            <Layout />
          </ProtectedRoute>
        )}
      >
        <Route index element={<TeacherPanel />} />
        <Route path="grading" element={<TeacherGrading />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
