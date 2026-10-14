import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import { googleSheetsDb } from '../lib/googleSheetsDb';
import type { SubmissionWithContent } from '../types/submission';
import { useI18nStore } from '../store/useI18nStore';
import { useAuthStore } from '../store/useAuthStore';
import { generateAcademicDocxBlob } from '../utils/documentGenerator';

const labels = {
  uz: {
    pending: "Kutilmoqda",
    graded: "Baholangan",
    score: "Baho",
    feedback: "Taqriz",
    download: "Faylni yuklash",
    downloading: "Yuklanmoqda...",
    exportWord: "Word formatda yuklash",
    exporting: "Tayyorlanmoqda...",
  },
  ru: {
    pending: "В ожидании",
    graded: "Оценено",
    score: "Оценка",
    feedback: "Отзыв",
    download: "Скачать файл",
    downloading: "Загрузка...",
    exportWord: "Скачать в Word",
    exporting: "Подготовка...",
  },
  en: {
    pending: "Pending",
    graded: "Graded",
    score: "Score",
    feedback: "Feedback",
    download: "Download file",
    downloading: "Downloading...",
    exportWord: "Export as Word",
    exporting: "Preparing...",
  },
}

interface SubmissionCardProps {
  submission: SubmissionWithContent;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission }) => {
  const { language } = useI18nStore();
  const { profile } = useAuthStore();
  const L = labels[language];
  const isPending = submission.status === 'pending';
  const isGraded = submission.status === 'graded';

  const [downloadingFile, setDownloadingFile] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);

  const formattedDate = new Date(submission.created_at).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getDocData = () => {
    const studentName = profile?.full_name || "Talaba";
    const groupName = profile?.group_name || "Guruhsiz";
    const topicTitle = submission.content_items?.title || "Raqamli amaliyot ishi";
    const topicId = submission.content_items?.topic_id || 1;
    const date = new Date(submission.created_at).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return {
      title: topicTitle,
      studentName,
      groupName,
      date,
      topicId,
    };
  };

  const handleDownloadFile = async () => {
    setDownloadingFile(true);
    try {
      const res = await googleSheetsDb.downloadFile(submission.id);
      if (res.success && res.data?.fileData) {
        const fileData = res.data.fileData;
        if (fileData.startsWith('data:')) {
          const link = document.createElement('a');
          link.href = fileData;
          link.download = res.data.fileName || submission.file_name || 'topshiriq.docx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        } else if (fileData.startsWith('http')) {
          window.open(fileData, '_blank');
          return;
        }
      }
      throw new Error('No direct stream');
    } catch (err) {
      console.warn('Storage download failed, falling back to client-generated docx:', err);
      // Fallback: Generate the 4-page academic docx
      try {
        const docData = getDocData();
        const blob = await generateAcademicDocxBlob(docData, language);
        
        const safeStudentName = docData.studentName.replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s\u0400-\u04FF\u0600-\u06FF]/g, '').replace(/\s+/g, '_');
        const safeTopic = docData.title.substring(0, 30).replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s\u0400-\u04FF\u0600-\u06FF]/g, '').replace(/\s+/g, '_');
        saveAs(blob, `Mustaqil_ish_${safeTopic}_${safeStudentName}.docx`);
      } catch (genErr) {
        console.error('Failed to generate fallback document:', genErr);
      }
    } finally {
      setDownloadingFile(false);
    }
  };

  const handleExportWord = async () => {
    setExportingWord(true);
    try {
      const docData = getDocData();
      const blob = await generateAcademicDocxBlob(docData, language);

      const safeStudentName = docData.studentName.replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s\u0400-\u04FF\u0600-\u06FF]/g, '').replace(/\s+/g, '_');
      const safeTopic = docData.title.substring(0, 30).replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s\u0400-\u04FF\u0600-\u06FF]/g, '').replace(/\s+/g, '_');
      saveAs(blob, `Mustaqil_ish_${safeTopic}_${safeStudentName}.docx`);
    } catch (err) {
      console.error('Word export error:', err);
    } finally {
      setExportingWord(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm hover:bg-white/[0.07] transition-all duration-300">
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
          <span className={`text-lg font-semibold ${
            submission.score >= 70
              ? 'text-green-300'
              : submission.score >= 40
              ? 'text-yellow-300'
              : 'text-red-300'
          }`}>{submission.score}/100</span>
        </div>
      )}

      {isGraded && submission.feedback && (
        <div className="mb-2 rounded-lg bg-white/5 p-2">
          <p className="text-sm text-white/60 mb-1">{L.feedback}:</p>
          <p className="text-sm text-white/90">{submission.feedback}</p>
        </div>
      )}

      <p className="text-xs text-white/50 mt-2 mb-3">{formattedDate}</p>

      {/* Download and Export buttons */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
        <button
          onClick={handleDownloadFile}
          disabled={downloadingFile}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold hover:bg-cyan-500/20 transition-colors disabled:opacity-50"
        >
          {downloadingFile ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Download size={12} />
          )}
          {downloadingFile ? L.downloading : L.download}
        </button>
        <button
          onClick={handleExportWord}
          disabled={exportingWord}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-xs font-bold hover:bg-green-500/20 transition-colors disabled:opacity-50"
        >
          {exportingWord ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <FileDown size={12} />
          )}
          {exportingWord ? L.exporting : L.exportWord}
        </button>
      </div>
    </div>
  );
};

export default SubmissionCard;
