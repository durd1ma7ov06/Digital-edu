import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSubmissionStore } from '../store/useSubmissionStore';
import { useI18nStore } from '../store/useI18nStore';
import SubmissionCard from '../components/SubmissionCard';

const labels = {
  uz: {
    mySubmissions: "Mening ishlarim",
    total: "Jami",
    submission: "ish",
    pending: "kutilmoqda",
    graded: "baholangan",
    noSubmissions: "Sizda hali ishlar yo'q. Amaliyot topshiriqlarini bajaring va fayl yuklang.",
  },
  ru: {
    mySubmissions: "Мои работы",
    total: "Всего",
    submission: "работ",
    pending: "ожидают",
    graded: "оценено",
    noSubmissions: "У вас пока нет работ. Выполните практические задания и загрузите файл.",
  },
  en: {
    mySubmissions: "My Submissions",
    total: "Total",
    submission: "submissions",
    pending: "pending",
    graded: "graded",
    noSubmissions: "You have no submissions yet. Complete practice tasks and upload a file.",
  },
}

export default function StudentSubmissions() {
  const { mySubmissions, loading, fetchMySubmissions } = useSubmissionStore();
  const { language } = useI18nStore();
  const L = labels[language];

  useEffect(() => {
    fetchMySubmissions();
  }, [fetchMySubmissions]);

  const pendingCount = mySubmissions.filter((s) => s.status === 'pending').length;
  const gradedCount = mySubmissions.filter((s) => s.status === 'graded').length;

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-extrabold"
          >
            <span className="cyber-gradient-text">{L.mySubmissions}</span>
          </motion.h1>
          <p className="text-white/40 text-sm mt-1">
            {L.total}: {mySubmissions.length} {L.submission}
          </p>
        </div>

        {/* Stats pills */}
        <div className="flex gap-3 flex-wrap">
          <div className="px-4 py-2 rounded-xl text-xs font-bold bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
            ⏳ {pendingCount} {L.pending}
          </div>
          <div className="px-4 py-2 rounded-xl text-xs font-bold bg-green-500/10 border border-green-500/30 text-green-400">
            ✅ {gradedCount} {L.graded}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : mySubmissions.length === 0 ? (
        <div className="glass-panel p-8 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-white/50 text-sm">
            {L.noSubmissions}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mySubmissions.map((submission, i) => (
            <motion.div
              key={submission.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <SubmissionCard submission={submission} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
