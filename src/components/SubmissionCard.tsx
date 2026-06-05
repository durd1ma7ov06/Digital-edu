import React from 'react';
import type { Submission } from '../types/submission';
import { useI18nStore } from '../store/useI18nStore';

const labels = {
  uz: {
    pending: "Kutilmoqda",
    graded: "Baholangan",
    score: "Ball",
    feedback: "Izoh",
  },
  ru: {
    pending: "Ожидает",
    graded: "Оценено",
    score: "Балл",
    feedback: "Отзыв",
  },
  en: {
    pending: "Pending",
    graded: "Graded",
    score: "Score",
    feedback: "Feedback",
  },
}

interface SubmissionCardProps {
  submission: Submission;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission }) => {
  const { language } = useI18nStore();
  const L = labels[language];
  const isPending = submission.status === 'pending';
  const isGraded = submission.status === 'graded';

  const formattedDate = new Date(submission.created_at).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-white/70 truncate max-w-[200px]" title={submission.file_name}>
          📄 {submission.file_name}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isPending
              ? 'bg-yellow-500/20 text-yellow-300'
              : 'bg-green-500/20 text-green-300'
          }`}
        >
          {isPending ? L.pending : L.graded}
        </span>
      </div>

      {isGraded && submission.score !== null && (
        <div className="mb-2">
          <span className="text-sm text-white/60">{L.score}: </span>
          <span className="text-lg font-semibold text-white">{submission.score}/100</span>
        </div>
      )}

      {isGraded && submission.feedback && (
        <div className="mb-2 rounded-lg bg-white/5 p-2">
          <p className="text-sm text-white/60 mb-1">{L.feedback}:</p>
          <p className="text-sm text-white/90">{submission.feedback}</p>
        </div>
      )}

      <p className="text-xs text-white/50 mt-2">{formattedDate}</p>
    </div>
  );
};

export default SubmissionCard;
