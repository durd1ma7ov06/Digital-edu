import { useState } from 'react'
import { useSubmissionStore } from '../store/useSubmissionStore'
import { useI18nStore } from '../store/useI18nStore'

const labels = {
  uz: {
    score: "Baho (0-100)",
    feedback: "Izoh (ixtiyoriy)",
    feedbackPlaceholder: "Talabaga izoh yozing...",
    scoreError: "Baho 0 dan 100 gacha bo'lishi kerak",
    feedbackError: "Izoh 2000 belgidan oshmasligi kerak",
    grading: "Baholanmoqda...",
    grade: "Baholash",
  },
  ru: {
    score: "Оценка (0-100)",
    feedback: "Комментарий (необязательно)",
    feedbackPlaceholder: "Напишите комментарий студенту...",
    scoreError: "Оценка должна быть от 0 до 100",
    feedbackError: "Комментарий не должен превышать 2000 символов",
    grading: "Оценивание...",
    grade: "Оценить",
  },
  en: {
    score: "Score (0-100)",
    feedback: "Feedback (optional)",
    feedbackPlaceholder: "Write feedback for the student...",
    scoreError: "Score must be between 0 and 100",
    feedbackError: "Feedback must not exceed 2000 characters",
    grading: "Grading...",
    grade: "Grade",
  },
}

interface GradingFormProps {
  submissionId: string
  onSuccess: () => void
}

export function GradingForm({ submissionId, onSuccess }: GradingFormProps) {
  const { gradeSubmission, loading } = useSubmissionStore()
  const { language } = useI18nStore()
  const L = labels[language]
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const scoreNum = parseInt(score, 10)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      setError(L.scoreError)
      return
    }

    if (feedback.length > 2000) {
      setError(L.feedbackError)
      return
    }

    const { error: gradeError } = await gradeSubmission(submissionId, scoreNum, feedback)
    if (gradeError) {
      setError(gradeError)
    } else {
      setScore('')
      setFeedback('')
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-white/40 text-xs font-bold uppercase tracking-wider block mb-2">
          {L.score}
        </label>
        <input
          type="number"
          min={0}
          max={100}
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="0-100"
          required
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-white text-sm focus:outline-none focus:border-purple-500/30 placeholder:text-white/20"
        />
      </div>

      <div>
        <label className="text-white/40 text-xs font-bold uppercase tracking-wider block mb-2">
          {L.feedback}
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={L.feedbackPlaceholder}
          maxLength={2000}
          rows={4}
          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-white text-sm focus:outline-none focus:border-purple-500/30 placeholder:text-white/20 resize-none"
        />
        <p className="text-white/20 text-xs mt-1 text-right">{feedback.length}/2000</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <p className="text-red-300 text-xs">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !score}
        className="w-full px-4 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-200 text-sm font-bold hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? L.grading : L.grade}
      </button>
    </form>
  )
}
