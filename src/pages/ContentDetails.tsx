import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, ClipboardList, GraduationCap, Play } from 'lucide-react'
import { useContentStore, type ContentItem } from '../store/useContentStore'

export default function ContentDetails() {
  const { contentId } = useParams()
  const navigate = useNavigate()
  const { fetchContentItem } = useContentStore()
  const [item, setItem] = useState<ContentItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    async function load() {
      if (!contentId) return
      const data = await fetchContentItem(contentId)
      if (alive) {
        setItem(data)
        setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [contentId, fetchContentItem])

  if (loading) {
    return <div className="py-20 text-center text-white/40">Yuklanmoqda...</div>
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-white/40">Kontent topilmadi</p>
        <button onClick={() => navigate('/curriculum')} className="btn-cyber">Orqaga</button>
      </div>
    )
  }

  const Icon = item.content_type === 'test' ? ClipboardList : item.content_type === 'practice' ? GraduationCap : BookOpen

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <button onClick={() => navigate('/curriculum')} className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm transition-colors">
        <ArrowLeft size={16} /> O'quv dasturiga qaytish
      </button>

      <motion.article
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 sm:p-9 border-white/5"
      >
        <div className="flex items-start gap-4 mb-7">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 flex items-center justify-center shrink-0">
            <Icon size={26} />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">{item.content_type}</span>
            <h1 className="text-3xl font-black text-white mt-2">{item.title}</h1>
            {item.description && <p className="text-white/50 mt-3 leading-relaxed">{item.description}</p>}
          </div>
        </div>

        {item.content_type === 'material' ? (
          <div className="prose prose-invert max-w-none">
            {(item.body || item.description).split('\n').map((paragraph, index) => (
              <p key={index} className="text-white/75 leading-8 mb-4">{paragraph}</p>
            ))}
          </div>
        ) : item.content_type === 'test' ? (
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-white font-bold">Test tayyor</h2>
              <p className="text-white/45 text-sm mt-1">{item.questions?.length || 0} ta savol</p>
            </div>
            <button onClick={() => navigate(`/custom-quiz/${item.id}`)} className="btn-primary flex items-center justify-center gap-2">
              <Play size={16} /> Boshlash
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-white font-bold">Amaliyot tayyor</h2>
              <p className="text-white/45 text-sm mt-1">{item.practice?.phases?.length || 0} ta bosqich</p>
            </div>
            <button onClick={() => navigate(`/custom-practice/${item.id}`)} className="btn-primary flex items-center justify-center gap-2">
              <Play size={16} /> Boshlash
            </button>
          </div>
        )}
      </motion.article>
    </div>
  )
}
