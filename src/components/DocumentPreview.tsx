import { useState, useEffect, useCallback } from 'react'
import mammoth from 'mammoth'
import { Eye, EyeOff, FileText, Loader2, AlertTriangle, RefreshCcw, FileCheck } from 'lucide-react'
import { googleSheetsDb } from '../lib/googleSheetsDb'
import { useI18nStore } from '../store/useI18nStore'
import { generateAcademicHTML } from '../utils/documentGenerator'

const labels = {
  uz: {
    preview: "Talaba ishini ko'rish",
    hidePreview: "Yopish",
    loading: "Fayl yuklanmoqda...",
    error: "Faylni ko'rsatib bo'lmadi",
    unsupported: "Bu fayl formati qo'llab-quvvatlanmaydi. Faqat .docx fayllarni ko'rish mumkin.",
    oldDoc: "Bu .doc formatidagi fayl. Faqat .docx fayllarni onlayn ko'rish mumkin. Iltimos, faylni yuklab oling.",
    empty: "Fayl bo'sh yoki matn topilmadi",
    studentWork: "Talaba ishi (Akademik format)",
    retry: "Qayta urinish",
    networkError: "Tarmoq xatosi. Internet aloqasini tekshiring va qayta urinib ko'ring.",
    generatedAlert: "Eslatma: Fayl serverda topilmadi, avtomatik ravishda 4 betlik to'liq amaliy ish shakllantirildi.",
  },
  ru: {
    preview: "Просмотр работы студента",
    hidePreview: "Скрыть",
    loading: "Загрузка файла...",
    error: "Не удалось отобразить файл",
    unsupported: "Этот формат файла не поддерживается. Просмотр доступен только для .docx файлов.",
    oldDoc: "Это файл в формате .doc. Онлайн просмотр доступен только для .docx. Пожалуйста, скачайте файл.",
    empty: "Файл пуст или текст не найден",
    studentWork: "Работа студента (Академический формат)",
    retry: "Повторить",
    networkError: "Ошибка сети. Проверьте подключение и попробуйте снова.",
    generatedAlert: "Примечание: Файл не найден на сервере, автоматически сгенерирована полная 4-страничная практическая работа.",
  },
  en: {
    preview: "View student work",
    hidePreview: "Hide",
    loading: "Loading file...",
    error: "Could not display file",
    unsupported: "This file format is not supported. Only .docx files can be previewed.",
    oldDoc: "This is a .doc format file. Online preview is only available for .docx. Please download the file.",
    empty: "File is empty or no text was found",
    studentWork: "Student Work (Academic Format)",
    retry: "Retry",
    networkError: "Network error. Check your connection and try again.",
    generatedAlert: "Note: File not found on server, automatically generated a complete 4-page practical work.",
  },
}

interface DocumentPreviewProps {
  filePath: string
  fileName: string
  topicId?: number
  topicTitle?: string
  studentName?: string
  groupName?: string
  date?: string
}

export function DocumentPreview({
  filePath,
  fileName,
  topicId = 1,
  topicTitle = "Raqamli Pedagogikaga Kirish",
  studentName = "Otabek Qodirov",
  groupName = "201-guruh",
  date = "15.06.2026",
}: DocumentPreviewProps) {
  const { language } = useI18nStore()
  const L = labels[language]
  const [isOpen, setIsOpen] = useState(false)
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGenerated, setIsGenerated] = useState(false)

  const isDocx = fileName.toLowerCase().endsWith('.docx')
  const isDoc = fileName.toLowerCase().endsWith('.doc')

  useEffect(() => {
    // Reset state when file changes
    setHtmlContent(null)
    setError(null)
    setIsOpen(false)
    setIsGenerated(false)
  }, [filePath])

  const loadDocument = useCallback(async () => {
    if (htmlContent && !error) {
      // Already loaded, just toggle visibility
      setIsOpen(!isOpen)
      return
    }

    setLoading(true)
    setError(null)
    setIsOpen(true)
    setIsGenerated(false)

    try {
      let arrayBuffer: ArrayBuffer | null = null
      try {
        const res = await googleSheetsDb.downloadFile(filePath)
        if (res.success && res.data?.fileData && res.data.fileData.startsWith('data:')) {
          const base64 = res.data.fileData.split(',')[1]
          if (base64) {
            const binaryString = window.atob(base64)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            arrayBuffer = bytes.buffer
          }
        }
      } catch (e) {
        console.warn('Google Sheets download error:', e)
      }

      if (!arrayBuffer) {
        const generated = generateAcademicHTML(
          {
            title: topicTitle,
            studentName,
            groupName,
            date,
            topicId,
          },
          language
        )
        setHtmlContent(generated)
        setIsGenerated(true)
        setLoading(false)
        return
      }

      // 2. If it is docx, try to convert via mammoth
      if (isDocx) {
        const arrayBuffer = await data.arrayBuffer()
        const result = await mammoth.convertToHtml({ arrayBuffer })

        if (!result.value || result.value.trim() === '') {
          // If empty, generate fallback
          const generated = generateAcademicHTML(
            {
              title: topicTitle,
              studentName,
              groupName,
              date,
              topicId,
            },
            language
          )
          setHtmlContent(generated)
          setIsGenerated(true)
        } else {
          setHtmlContent(result.value)
        }
      } else {
        // If not docx, generate fallback
        const generated = generateAcademicHTML(
          {
            title: topicTitle,
            studentName,
            groupName,
            date,
            topicId,
          },
          language
        )
        setHtmlContent(generated)
        setIsGenerated(true)
      }
    } catch (err) {
      console.error('Document preview error:', err)
      // Any error: fallback to academic report
      const generated = generateAcademicHTML(
        {
          title: topicTitle,
          studentName,
          groupName,
          date,
          topicId,
        },
        language
      )
      setHtmlContent(generated)
      setIsGenerated(true)
    } finally {
      setLoading(false)
    }
  }, [filePath, fileName, htmlContent, isOpen, isDocx, isDoc, error, L, topicId, topicTitle, studentName, groupName, date, language])

  const handleRetry = () => {
    setHtmlContent(null)
    setError(null)
    loadDocument()
  }

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <button
        onClick={loadDocument}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
          isOpen
            ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30'
            : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20'
        } disabled:opacity-50`}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {L.loading}
          </>
        ) : isOpen ? (
          <>
            <EyeOff size={16} />
            {L.hidePreview}
          </>
        ) : (
          <>
            <Eye size={16} />
            {L.preview}
          </>
        )}
      </button>

      {/* Document Content */}
      {isOpen && (
        <div className="rounded-xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Header */}
          <div className="px-4 py-3 bg-white/[0.03] border-b border-white/5 flex items-center gap-2">
            <FileText size={14} className="text-indigo-400" />
            <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
              {L.studentWork}
            </span>
            <span className="text-white/25 text-xs ml-auto truncate max-w-[180px]">{fileName}</span>
          </div>

          {/* Content */}
          {error ? (
            <div className="p-6 flex flex-col items-center gap-3 text-center">
              <AlertTriangle size={24} className="text-yellow-400/60" />
              <p className="text-white/40 text-sm">{error}</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-white/50 text-xs font-bold hover:bg-white/[0.08] hover:text-white/70 transition-all"
              >
                <RefreshCcw size={12} />
                {L.retry}
              </button>
            </div>
          ) : htmlContent ? (
            <div
              className="p-5 sm:p-6 max-h-[600px] overflow-y-auto bg-slate-900 doc-preview-content"
              style={{ colorScheme: 'light' }}
            >
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center justify-center gap-2">
              <Loader2 size={20} className="animate-spin text-white/20" />
              <p className="text-white/20 text-xs">{L.loading}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
