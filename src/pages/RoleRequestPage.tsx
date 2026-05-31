import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { UserCheck, Clock, XCircle, CheckCircle, Send, RefreshCw } from 'lucide-react'
import { useRoleRequestStore } from '../store/useRoleRequestStore'
import { useI18nStore } from '../store/useI18nStore'

export default function RoleRequestPage() {
  const { myRequest, loading, fetchMyRequest, submitRequest } = useRoleRequestStore()
  const { language } = useI18nStore()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    fetchMyRequest()
  }, [fetchMyRequest])

  const labels = {
    uz: {
      title: "O'qituvchi rolini so'rash",
      subtitle: "O'qituvchi sifatida ishlash uchun so'rov yuboring",
      pending: "So'rovingiz ko'rib chiqilmoqda",
      pendingDesc: "Administrator so'rovingizni tez orada ko'rib chiqadi",
      approved: "So'rovingiz tasdiqlandi!",
      approvedDesc: "Siz endi o'qituvchi sifatida ishlashingiz mumkin",
      rejected: "So'rovingiz rad etildi",
      rejectedDesc: "Siz qaytadan so'rov yuborishingiz mumkin",
      submit: "So'rov yuborish",
      resubmit: "Qayta so'rov yuborish",
      submittedAt: "Yuborilgan vaqt",
      status: "Holat",
      error: "Xatolik yuz berdi",
      success: "So'rov muvaffaqiyatli yuborildi!",
    },
    ru: {
      title: 'Запрос роли преподавателя',
      subtitle: 'Отправьте запрос для работы в качестве преподавателя',
      pending: 'Ваш запрос на рассмотрении',
      pendingDesc: 'Администратор скоро рассмотрит ваш запрос',
      approved: 'Ваш запрос одобрен!',
      approvedDesc: 'Теперь вы можете работать как преподаватель',
      rejected: 'Ваш запрос отклонён',
      rejectedDesc: 'Вы можете отправить запрос повторно',
      submit: 'Отправить запрос',
      resubmit: 'Отправить повторно',
      submittedAt: 'Дата отправки',
      status: 'Статус',
      error: 'Произошла ошибка',
      success: 'Запрос успешно отправлен!',
    },
    en: {
      title: 'Request Teacher Role',
      subtitle: 'Submit a request to work as a teacher',
      pending: 'Your request is under review',
      pendingDesc: 'An administrator will review your request soon',
      approved: 'Your request has been approved!',
      approvedDesc: 'You can now work as a teacher',
      rejected: 'Your request was rejected',
      rejectedDesc: 'You can submit a new request',
      submit: 'Submit Request',
      resubmit: 'Submit Again',
      submittedAt: 'Submitted at',
      status: 'Status',
      error: 'An error occurred',
      success: 'Request submitted successfully!',
    },
  }
  const L = labels[language]

  const handleSubmit = async () => {
    setSubmitError(null)
    setSubmitSuccess(false)
    const { error } = await submitRequest()
    if (error) {
      setSubmitError(error)
    } else {
      setSubmitSuccess(true)
    }
  }

  const canSubmit = !myRequest || myRequest.status === 'rejected'
  const isPending = myRequest?.status === 'pending'
  const isApproved = myRequest?.status === 'approved'
  const isRejected = myRequest?.status === 'rejected'

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold"
        >
          <span className="cyber-gradient-text">🎓 {L.title}</span>
        </motion.h1>
        <p className="text-white/40 text-sm mt-1">{L.subtitle}</p>
      </div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 relative overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={24} className="text-cyan-400/60 animate-spin" />
          </div>
        ) : (
          <>
            {/* Pending Status */}
            {isPending && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <Clock size={28} className="text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-yellow-400">{L.pending}</h2>
                  <p className="text-sm text-white/40 mt-1">{L.pendingDesc}</p>
                </div>
                {myRequest && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                    <span className="text-xs text-white/30">{L.submittedAt}:</span>
                    <span className="text-xs text-yellow-400/70">
                      {new Date(myRequest.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Approved Status */}
            {isApproved && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <CheckCircle size={28} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-green-400">{L.approved}</h2>
                  <p className="text-sm text-white/40 mt-1">{L.approvedDesc}</p>
                </div>
              </div>
            )}

            {/* Rejected Status */}
            {isRejected && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <XCircle size={28} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-red-400">{L.rejected}</h2>
                  <p className="text-sm text-white/40 mt-1">{L.rejectedDesc}</p>
                </div>
              </div>
            )}

            {/* No Request Yet */}
            {!myRequest && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <UserCheck size={28} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white/80">{L.title}</h2>
                  <p className="text-sm text-white/40 mt-1">{L.subtitle}</p>
                </div>
              </div>
            )}

            {/* Submit / Re-submit Button */}
            {canSubmit && (
              <div className="mt-6 flex flex-col items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/20 hover:border-cyan-500/40 hover:from-cyan-500/30 hover:to-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  {isRejected ? L.resubmit : L.submit}
                </motion.button>

                {/* Error Message */}
                {submitError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 px-3 py-1.5 rounded-lg"
                  >
                    {submitError}
                  </motion.p>
                )}

                {/* Success Message */}
                {submitSuccess && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-green-400 bg-green-500/5 border border-green-500/10 px-3 py-1.5 rounded-lg"
                  >
                    {L.success}
                  </motion.p>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
