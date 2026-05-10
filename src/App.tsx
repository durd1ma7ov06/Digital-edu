import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Curriculum from './pages/Curriculum'
import Quizzes from './pages/Quizzes'
import QuizPlay from './pages/QuizPlay'
import TopicDetails from './pages/TopicDetails'
import Practices from './pages/Practices'
import PracticePlay from './pages/PracticePlay'
import Leaderboard from './pages/Leaderboard'
import Achievements from './pages/Achievements'
import Settings from './pages/Settings'
import Certificate from './pages/Certificate'
import AuthPage from './pages/AuthPage'
import DiagnosticTest from './pages/DiagnosticTest'
import { useAuthStore } from './store/useAuthStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Bypassing auth for design development
  return <>{children}</>
}

export default function App() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Routes>
      {/* All routes are now accessible directly */}
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Dashboard />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/topic/:topicId" element={<TopicDetails />} />
        <Route path="/quiz/:topicId" element={<QuizPlay />} />
        <Route path="/practice" element={<Practices />} />
        <Route path="/practice/:topicId" element={<PracticePlay />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/certificate" element={<Certificate />} />
      </Route>

      <Route path="/auth" element={<Navigate to="/" replace />} />
      <Route path="/diagnostic" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
