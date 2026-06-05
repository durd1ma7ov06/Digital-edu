import React, { useRef, useState } from 'react';
import { validatePracticeFile } from '../utils/fileValidation';
import { useSubmissionStore } from '../store/useSubmissionStore';
import { useI18nStore } from '../store/useI18nStore';

const labels = {
  uz: {
    uploading: "Yuklanmoqda...",
    uploadFile: "Fayl yuklash",
    uploadSuccess: "Fayl muvaffaqiyatli yuklandi!",
    uploadFailed: "Yuklash muvaffaqiyatsiz. Qayta urinib ko'ring.",
    invalidFile: "Yaroqsiz fayl",
    accepted: "Qabul qilinadi: .doc, .docx (maks 10 MB)",
    ariaLabel: "Amaliyot faylini yuklash",
  },
  ru: {
    uploading: "Загрузка...",
    uploadFile: "Загрузить файл",
    uploadSuccess: "Файл успешно загружен!",
    uploadFailed: "Загрузка не удалась. Попробуйте снова.",
    invalidFile: "Недопустимый файл",
    accepted: "Допустимые форматы: .doc, .docx (макс. 10 МБ)",
    ariaLabel: "Загрузить файл практики",
  },
  en: {
    uploading: "Uploading...",
    uploadFile: "Upload File",
    uploadSuccess: "File uploaded successfully!",
    uploadFailed: "Upload failed. Please try again.",
    invalidFile: "Invalid file",
    accepted: "Accepted: .doc, .docx (max 10 MB)",
    ariaLabel: "Upload practice file",
  },
}

interface FileUploadButtonProps {
  contentItemId: string;
  onUploadComplete?: (result: { error: string | null }) => void;
}

export default function FileUploadButton({ contentItemId, onUploadComplete }: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const { language } = useI18nStore();
  const L = labels[language];

  const uploadFile = useSubmissionStore((state) => state.uploadFile);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);
    setSuccess(false);
    setSelectedFileName(file.name);

    // Client-side validation
    const validation = validatePracticeFile(file);
    if (!validation.valid) {
      setError(validation.error || L.invalidFile);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Upload
    setUploading(true);
    try {
      const result = await uploadFile(file, contentItemId);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
      onUploadComplete?.(result);
    } catch {
      setError(L.uploadFailed);
      onUploadComplete?.({ error: 'Upload failed' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".doc,.docx"
        onChange={handleFileChange}
        className="hidden"
        aria-label={L.ariaLabel}
      />

      <button
        type="button"
        onClick={handleButtonClick}
        disabled={uploading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            {L.uploading}
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
            </svg>
            {L.uploadFile}
          </>
        )}
      </button>

      {selectedFileName && !error && !success && !uploading && (
        <p className="text-sm text-gray-500">{selectedFileName}</p>
      )}

      {error && (
        <p className="text-sm text-red-600 font-medium" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-600 font-medium" role="status">
          {L.uploadSuccess}
        </p>
      )}

      <p className="text-xs text-gray-400">{L.accepted}</p>
    </div>
  );
}
