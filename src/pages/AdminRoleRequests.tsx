import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ShieldCheck, XCircle, Clock, UserCheck } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useRoleRequestStore } from '../store/useRoleRequestStore'
import { useI18nStore } from '../store/useI18nStore'

const labels = {
  uz: {
    roleRequests: "Rol so'rovlari",
    description: "Talabalar tomonidan yuborilgan teacher rol so'rovlarini boshqarish.",
    noAccess: "Ruxsat yo'q",
    noAccessDesc: "Bu sahifa faqat admin uchun.",
    approved: "So'rov tasdiqlandi",
    rejected: "So'rov rad etildi",
    pending: "Kutilayotgan so'rovlar",
    noPending: "Kutilayotgan so'rovlar yo'q",
    loading: "Yuklanmoqda...",
    approve: "Tasdiqlash",
    reject: "Rad etish",
    reviewed: "Ko'rib chiqilgan so'rovlar",
    statusApproved: "Tasdiqlangan",
    statusRejected: "Rad etilgan",
    unknownUser: "Noma'lum foydalanuvchi",
    noGroup: "Guruhsiz",
  },
  ru: {
    roleRequests: "Запросы ролей",
    description: "Управление запросами студентов на роль преподавателя.",
    noAccess: "Доступ запрещён",
    noAccessDesc: "Эта страница доступна только администраторам.",
    approved: "Запрос одобрен",
    rejected: "Запрос отклонён",
    pending: "Ожидающие запросы",
    noPending: "Ожидающих запросов нет",
    loading: "Загрузка...",
    approve: "Одобрить",
    reject: "Отклонить",
    reviewed: "Рассмотренные запросы",
    statusApproved: "Одобрено",
    statusRejected: "Отклонено",
    unknownUser: "Неизвестный пользователь",
    noGroup: "Без группы",
  },
  en: {
    roleRequests: "Role Requests",
    description: "Manage teacher role requests submitted by students.",
    noAccess: "Access Denied",
    noAccessDesc: "This page is only for admins.",
    approved: "Request approved",
    rejected: "Request rejected",
    pending: "Pending Requests",
    noPending: "No pending requests",
    loading: "Loading...",
    approve: "Approve",
    reject: "Reject",
    reviewed: "Reviewed Requests",
    statusApproved: "Approved",
    statusRejected: "Rejected",
    unknownUser: "Unknown user",
    noGroup: "No group",
  },
}

export default function AdminRoleRequests() {
  const { profile } = useAuthStore()
  const { allRequests, loading, fetchAllRequests, reviewRequest } = useRoleRequestStore()
  const { language } = useI18nStore()
  const L = labels[language]
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchAllRequests()
  }, [fetchAllRequests])

  const handleReview = async (requestId: string, approved: boolean) => {
    setError('')
    setMessage('')
    setProcessingId(requestId)

    const { error: reviewError } = await reviewRequest(requestId, approved)

    if (reviewError) {
      setError(reviewError)
    } else {
      setMessage(approved ? L.approved : L.rejected)
    }

    setProcessingId(null)
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white p-6">
        <ShieldCheck size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">{L.noAccess}</h1>
        <p className="text-white/60">{L.noAccessDesc}</p>
      </div>
    )
  }

  const pendingRequests = allRequests.filter((r) => r.status === 'pending')
  const reviewedRequests = allRequests.filter((r) => r.status !== 'pending')

  return (
    <div className="space-y-8 pb-12">
      <div>
        <div className="flex items-center gap-2 mb-2 text-cyan-400">
          <UserCheck size={18} />
          <span className="text-xs font-black uppercase tracking-[0.25em]">{L.roleRequests}</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">{L.roleRequests}</h1>
        <p className="text-white/50 mt-1">{L.description}</p>
      </div>

      {(message || error) && (
        <div className={`rounded-2xl border p-4 text-sm ${error ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-green-500/10 border-green-500/20 text-green-300'}`}>
          {error || message}
        </div>
      )}

      {/* Pending Requests */}
      <div className="glass-panel overflow-hidden border-white/5">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <Clock size={20} className="text-yellow-400" />
            <h2 className="text-xl font-bold text-white">{L.pending}</h2>
            {pendingRequests.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-400/20 text-yellow-300 text-xs font-bold">
                {pendingRequests.length}
              </span>
            )}
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-10 text-center text-white/30">{L.loading}</div>
          ) : pendingRequests.length === 0 ? (
            <div className="p-10 text-center text-white/30">{L.noPending}</div>
          ) : (
            pendingRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-400/15 flex items-center justify-center text-lg">
                    {request.profiles?.avatar_emoji || '👤'}
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">
                      {request.profiles?.full_name || L.unknownUser}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium">
                        {request.profiles?.group_name || L.noGroup}
                      </span>
                      <span className="text-white/30 text-xs">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleReview(request.id, true)}
                    disabled={processingId === request.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-400/20 text-green-300 text-sm font-bold hover:bg-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={16} /> {L.approve}
                  </button>
                  <button
                    onClick={() => handleReview(request.id, false)}
                    disabled={processingId === request.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-400/20 text-red-300 text-sm font-bold hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle size={16} /> {L.reject}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Reviewed Requests */}
      {reviewedRequests.length > 0 && (
        <div className="glass-panel overflow-hidden border-white/5">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-xl font-bold text-white">{L.reviewed}</h2>
          </div>

          <div className="divide-y divide-white/5">
            {reviewedRequests.map((request) => (
              <div
                key={request.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                    {request.profiles?.avatar_emoji || '👤'}
                  </div>
                  <div>
                    <div className="text-white/70 font-bold text-sm">
                      {request.profiles?.full_name || L.unknownUser}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs font-medium">
                        {request.profiles?.group_name || L.noGroup}
                      </span>
                      <span className="text-white/30 text-xs">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                  request.status === 'approved'
                    ? 'bg-green-500/10 border border-green-400/20 text-green-300'
                    : 'bg-red-500/10 border border-red-400/20 text-red-300'
                }`}>
                  {request.status === 'approved' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {request.status === 'approved' ? L.statusApproved : L.statusRejected}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
