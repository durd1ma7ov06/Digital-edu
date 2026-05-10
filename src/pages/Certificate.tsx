import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, Download, CheckCircle, Lock, Sparkles, User, GraduationCap } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useI18nStore } from '../store/useI18nStore'
import { curriculum } from '../data'

/* ─── tiny confetti ─── */
function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2,
    dur: 2 + Math.random() * 3,
    color: ['#00f0ff', '#a855f7', '#facc15', '#22c55e', '#ec4899', '#f97316'][i % 6],
    size: 4 + Math.random() * 8,
  }))
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: 0, rotate: 360 + Math.random() * 360 }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'linear' }}
          style={{ position: 'absolute', width: p.size, height: p.size, borderRadius: p.size > 8 ? '50%' : '2px', background: p.color }}
        />
      ))}
    </div>
  )
}

/* ─── progress ring ─── */
function Ring({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 40, circ = 2 * Math.PI * r, off = circ - (pct / 100) * circ
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <motion.circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: off }}
          transition={{ duration: 1.5, ease: 'easeOut' }} />
        <text x="50" y="50" textAnchor="middle" dy="0.35em" fill="white" fontSize="16" fontWeight="700"
          style={{ transform: 'rotate(90deg)', transformOrigin: '50px 50px' }}>{Math.round(pct)}%</text>
      </svg>
      <span className="text-xs text-white/50">{label}</span>
    </div>
  )
}

/* ─── certificate canvas renderer ─── */
function drawCertificate(canvas: HTMLCanvasElement, name: string, date: string, lang: 'uz' | 'ru' | 'en', totalTopics: number, avgScore: number) {
  const ctx = canvas.getContext('2d')!
  const W = 1200, H = 850
  canvas.width = W; canvas.height = H

  // background
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0c1029'); bg.addColorStop(0.5, '#0f1535'); bg.addColorStop(1, '#0a0e1a')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  // outer gold border
  ctx.strokeStyle = '#c9a84c'; ctx.lineWidth = 4
  ctx.strokeRect(20, 20, W - 40, H - 40)
  // inner decorative border
  ctx.strokeStyle = 'rgba(201,168,76,0.3)'; ctx.lineWidth = 1.5
  ctx.strokeRect(35, 35, W - 70, H - 70)

  // corner ornaments
  const corners = [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]]
  corners.forEach(([cx, cy]) => {
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2)
    ctx.fillStyle = '#c9a84c'; ctx.fill()
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#0c1029'; ctx.fill()
  })

  // top glow
  const glow = ctx.createRadialGradient(W / 2, 80, 0, W / 2, 80, 300)
  glow.addColorStop(0, 'rgba(0,240,255,0.08)'); glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, 300)

  // award icon circle
  ctx.beginPath(); ctx.arc(W / 2, 110, 35, 0, Math.PI * 2)
  const iconGrad = ctx.createLinearGradient(W / 2 - 35, 75, W / 2 + 35, 145)
  iconGrad.addColorStop(0, 'rgba(0,240,255,0.15)'); iconGrad.addColorStop(1, 'rgba(168,85,247,0.15)')
  ctx.fillStyle = iconGrad; ctx.fill()
  ctx.strokeStyle = 'rgba(201,168,76,0.5)'; ctx.lineWidth = 2; ctx.stroke()

  // star in circle
  ctx.fillStyle = '#c9a84c'; ctx.font = '32px serif'; ctx.textAlign = 'center'
  ctx.fillText('★', W / 2, 120)

  // "CERTIFICATE" header
  ctx.font = '14px Inter, sans-serif'; ctx.letterSpacing = '8px'
  ctx.fillStyle = 'rgba(201,168,76,0.7)'; ctx.textAlign = 'center'
  ctx.fillText('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', W / 2, 170)

  const headerText = lang === 'uz' ? 'SERTIFIKAT' : lang === 'ru' ? 'СЕРТИФИКАТ' : 'CERTIFICATE'
  ctx.font = 'bold 48px Inter, sans-serif'; ctx.fillStyle = '#c9a84c'
  ctx.fillText(headerText, W / 2, 220)

  const subText = lang === 'uz' ? 'MUVAFFAQIYATLI YAKUNLASH' : lang === 'ru' ? 'ОБ УСПЕШНОМ ЗАВЕРШЕНИИ' : 'OF COMPLETION'
  ctx.font = '13px Inter, sans-serif'; ctx.fillStyle = 'rgba(201,168,76,0.6)'
  ctx.fillText(subText, W / 2, 248)

  ctx.fillText('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', W / 2, 272)

  // "This certifies that"
  const certText = lang === 'uz' ? 'Ushbu sertifikat quyidagi shaxsga beriladi:' : lang === 'ru' ? 'Настоящим удостоверяется, что:' : 'This is to certify that:'
  ctx.font = '16px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fillText(certText, W / 2, 320)

  // Name
  ctx.font = 'bold 42px Inter, sans-serif'
  const nameGrad = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0)
  nameGrad.addColorStop(0, '#00f0ff'); nameGrad.addColorStop(0.5, '#3b82f6'); nameGrad.addColorStop(1, '#a855f7')
  ctx.fillStyle = nameGrad
  ctx.fillText(name, W / 2, 380)

  // underline below name
  ctx.strokeStyle = 'rgba(201,168,76,0.3)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(W / 2 - 250, 400); ctx.lineTo(W / 2 + 250, 400); ctx.stroke()

  // description
  const desc1 = lang === 'uz'
    ? `"DigitalEdu Pedagogika" platformasida barcha ${totalTopics} ta mavzuni`
    : lang === 'ru'
    ? `успешно завершил(а) все ${totalTopics} тем на платформе`
    : `has successfully completed all ${totalTopics} topics on the`

  const desc2 = lang === 'uz'
    ? `muvaffaqiyatli yakunlaganligi uchun beriladi.`
    : lang === 'ru'
    ? `"DigitalEdu Педагогика".`
    : `"DigitalEdu Pedagogy" platform.`

  ctx.font = '15px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.fillText(desc1, W / 2, 440)
  ctx.fillText(desc2, W / 2, 462)

  // stats boxes
  const statsY = 510
  const stats = [
    { label: lang === 'uz' ? 'Mavzular' : lang === 'ru' ? 'Темы' : 'Topics', val: `${totalTopics}/${totalTopics}` },
    { label: lang === 'uz' ? "O'rtacha ball" : lang === 'ru' ? 'Средний балл' : 'Avg Score', val: `${avgScore}%` },
    { label: lang === 'uz' ? 'Daraja' : lang === 'ru' ? 'Уровень' : 'Level', val: 'Expert' },
  ]
  const boxW = 160, gap = 30, startX = W / 2 - (boxW * 3 + gap * 2) / 2
  stats.forEach((s, i) => {
    const bx = startX + i * (boxW + gap)
    ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.beginPath()
    const bR = 12
    ctx.roundRect(bx, statsY, boxW, 70, bR); ctx.fill()
    ctx.strokeStyle = 'rgba(201,168,76,0.15)'; ctx.lineWidth = 1; ctx.stroke()

    ctx.font = 'bold 22px Inter, sans-serif'; ctx.fillStyle = '#00f0ff'
    ctx.fillText(s.val, bx + boxW / 2, statsY + 32)
    ctx.font = '11px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fillText(s.label, bx + boxW / 2, statsY + 55)
  })

  // date & platform
  const footY = 650
  ctx.font = '12px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.3)'
  const dateLabel = lang === 'uz' ? 'Berilgan sana:' : lang === 'ru' ? 'Дата выдачи:' : 'Date Issued:'
  ctx.fillText(`${dateLabel} ${date}`, W / 2, footY)

  // divider
  ctx.strokeStyle = 'rgba(201,168,76,0.15)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(100, footY + 25); ctx.lineTo(W - 100, footY + 25); ctx.stroke()

  // signatures area
  const sigY = footY + 65
  // Left: Platform
  ctx.font = 'italic 18px serif'; ctx.fillStyle = 'rgba(201,168,76,0.6)'
  ctx.fillText('DigitalEdu', 250, sigY)
  ctx.strokeStyle = 'rgba(201,168,76,0.3)'; ctx.beginPath(); ctx.moveTo(150, sigY + 12); ctx.lineTo(350, sigY + 12); ctx.stroke()
  ctx.font = '11px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillText(lang === 'uz' ? 'Platforma' : lang === 'ru' ? 'Платформа' : 'Platform', 250, sigY + 30)

  // Right: Verified
  ctx.font = 'italic 18px serif'; ctx.fillStyle = 'rgba(201,168,76,0.6)'
  ctx.fillText('✓ Verified', W - 250, sigY)
  ctx.strokeStyle = 'rgba(201,168,76,0.3)'; ctx.beginPath(); ctx.moveTo(W - 350, sigY + 12); ctx.lineTo(W - 150, sigY + 12); ctx.stroke()
  ctx.font = '11px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillText(lang === 'uz' ? 'Tasdiqlangan' : lang === 'ru' ? 'Подтверждено' : 'Verified', W - 250, sigY + 30)

  // ID
  const certId = `DE-${Date.now().toString(36).toUpperCase()}`
  ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.fillText(`ID: ${certId}`, W / 2, H - 45)

  // bottom glow
  const btmGlow = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, 250)
  btmGlow.addColorStop(0, 'rgba(168,85,247,0.06)'); btmGlow.addColorStop(1, 'transparent')
  ctx.fillStyle = btmGlow; ctx.fillRect(0, H - 250, W, 250)
}

export default function Certificate() {
  const { completedTopics, quizResults } = useAppStore()
  const { language } = useI18nStore()
  const totalTopics = curriculum.length

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showCert, setShowCert] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const completedQuizTopics = new Set(quizResults.map(r => r.topicId))
  const allQuizzesDone = curriculum.every(t => completedQuizTopics.has(t.id))
  const allDone = completedTopics.length >= totalTopics && allQuizzesDone
  const progress = Math.round((completedTopics.length / totalTopics) * 100)
  const quizProgress = Math.round((completedQuizTopics.size / totalTopics) * 100)
  const avgScore = quizResults.length > 0
    ? Math.round(quizResults.reduce((a, r) => a + (r.score / r.totalQuestions) * 100, 0) / quizResults.length)
    : 0

  const labels = {
    uz: {
      title: 'Sertifikat',
      locked: 'Sertifikat olish uchun barcha mavzularni yakunlang',
      topicsProg: 'Mavzular',
      quizProg: 'Testlar',
      scoreProg: "O'rtacha ball",
      congrats: '🎉 Tabriklaymiz!',
      earned: 'Siz sertifikat olishga muvaffaq bo\'ldingiz!',
      enterName: 'To\'liq ism-familiyangizni kiriting:',
      fName: 'Ism',
      lName: 'Familiya',
      generate: 'Sertifikatni olish',
      download: 'Yuklab olish (PNG)',
      remaining: 'qoldi',
    },
    ru: {
      title: 'Сертификат',
      locked: 'Завершите все темы для получения сертификата',
      topicsProg: 'Темы',
      quizProg: 'Тесты',
      scoreProg: 'Средний балл',
      congrats: '🎉 Поздравляем!',
      earned: 'Вы заслужили сертификат!',
      enterName: 'Введите ваше полное имя:',
      fName: 'Имя',
      lName: 'Фамилия',
      generate: 'Получить сертификат',
      download: 'Скачать (PNG)',
      remaining: 'осталось',
    },
    en: {
      title: 'Certificate',
      locked: 'Complete all topics to unlock your certificate',
      topicsProg: 'Topics',
      quizProg: 'Quizzes',
      scoreProg: 'Avg Score',
      congrats: '🎉 Congratulations!',
      earned: 'You have earned your certificate!',
      enterName: 'Enter your full name:',
      fName: 'First Name',
      lName: 'Last Name',
      generate: 'Get Certificate',
      download: 'Download (PNG)',
      remaining: 'remaining',
    },
  }
  const L = labels[language]

  const handleGenerate = useCallback(() => {
    if (!firstName.trim() || !lastName.trim()) return
    setShowCert(true)
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 5000)
    setTimeout(() => {
      if (canvasRef.current) {
        const fullName = `${firstName.trim()} ${lastName.trim()}`
        const date = new Date().toLocaleDateString(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
        drawCertificate(canvasRef.current, fullName, date, language, totalTopics, avgScore)
      }
    }, 100)
  }, [firstName, lastName, language, totalTopics, avgScore])

  const handleDownload = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `DigitalEdu_Certificate_${firstName}_${lastName}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="space-y-6 lg:space-y-8 max-w-4xl mx-auto pb-10">
      {showConfetti && <Confetti />}

      {/* Header */}
      <div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold">
          <span className="cyber-gradient-text">🏅 {L.title}</span>
        </motion.h1>
      </div>

      <AnimatePresence mode="wait">
        {!allDone ? (
          /* ── LOCKED STATE ── */
          <motion.div key="locked" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* lock banner */}
            <div className="glass-panel p-6 sm:p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-purple-500/5" />
              <div className="relative z-10">
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
                  <Lock size={48} className="mx-auto mb-4 text-amber-400/60" />
                </motion.div>
                <h2 className="text-xl font-bold text-white/80 mb-2">{L.locked}</h2>
                <p className="text-white/30 text-sm">{totalTopics - completedTopics.length} {L.remaining}</p>
              </div>
            </div>

            {/* progress rings */}
            <div className="glass-panel p-6 sm:p-8">
              <div className="flex flex-wrap justify-center gap-10">
                <Ring pct={progress} label={L.topicsProg} color="#00f0ff" />
                <Ring pct={quizProgress} label={L.quizProg} color="#a855f7" />
                <Ring pct={avgScore} label={L.scoreProg} color="#22c55e" />
              </div>
            </div>

            {/* topic checklist */}
            <div className="glass-panel p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {curriculum.map(t => {
                  const done = completedTopics.includes(t.id) && completedQuizTopics.has(t.id)
                  return (
                    <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${done ? 'bg-green-500/5 border border-green-500/10' : 'bg-white/[0.02] border border-white/[0.04]'}`}>
                      {done ? <CheckCircle size={16} className="text-green-400 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border border-white/10 flex-shrink-0" />}
                      <span className={`text-xs ${done ? 'text-white/70' : 'text-white/30'}`}>{t.icon} {t.title[language]}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        ) : !showCert ? (
          /* ── NAME INPUT ── */
          <motion.div key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="glass-panel p-6 sm:p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5" />
              <div className="relative z-10">
                <motion.div animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}>
                  <Sparkles size={48} className="mx-auto mb-4 text-amber-400" />
                </motion.div>
                <h2 className="text-2xl font-extrabold text-white/90 mb-2">{L.congrats}</h2>
                <p className="text-white/50 mb-8">{L.earned}</p>

                <div className="max-w-md mx-auto space-y-4">
                  <p className="text-sm text-white/40 mb-4 flex items-center justify-center gap-2">
                    <User size={16} /> {L.enterName}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      id="cert-first-name"
                      type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                      placeholder={L.fName}
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all"
                    />
                    <input
                      id="cert-last-name"
                      type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                      placeholder={L.lName}
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.06] transition-all"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleGenerate}
                    disabled={!firstName.trim() || !lastName.trim()}
                    className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <GraduationCap size={18} /> {L.generate}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ── CERTIFICATE VIEW ── */
          <motion.div key="cert" initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', duration: 0.8 }} className="space-y-6">
            <div className="glass-panel p-4 sm:p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-cyan-500/5" />
              <div className="relative z-10">
                <canvas ref={canvasRef} className="w-full rounded-xl" style={{ maxWidth: 1200, margin: '0 auto', display: 'block' }} />
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleDownload}
                className="btn-cyber flex items-center gap-2">
                <Download size={16} /> {L.download}
              </motion.button>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setShowCert(false); setFirstName(''); setLastName('') }}
                className="btn-primary flex items-center gap-2 opacity-60 hover:opacity-100">
                <Award size={16} /> {language === 'uz' ? 'Qayta yaratish' : language === 'ru' ? 'Создать заново' : 'Regenerate'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
