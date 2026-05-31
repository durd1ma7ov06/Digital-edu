import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RotateCcw, AlertTriangle, Globe, User, Palette, Volume2, VolumeX,
  Sun, Moon, Monitor, Bell, BellOff, Shield, Info, Zap, BookOpen,
  Trophy, Target, ChevronRight, Sparkles, Heart, Camera, Trash2, ImagePlus,
  GraduationCap
} from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { useI18nStore } from '../store/useI18nStore'
import { useAuthStore } from '../store/useAuthStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useRoleRequestStore } from '../store/useRoleRequestStore'
import { curriculum } from '../data'

/* ─── EMOJI PICKER ─── */
const EMOJI_OPTIONS = [
  '🎯', '🚀', '💡', '🔥', '⚡', '🌟', '💎', '🎓', '🧠', '👨‍💻',
  '👩‍💻', '🦊', '🐱', '🐼', '🦁', '🐲', '🌈', '🎨', '🎮', '🏆',
  '🌍', '📚', '🔬', '🎵', '🛡️', '🪐', '🍀', '❤️', '🦄', '🐝',
]

/* ─── THEME OPTIONS ─── */
const ACCENT_COLORS = [
  { name: 'Cyan', value: '#00f0ff' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Yellow', value: '#facc15' },
]

/* ─── SECTION COMPONENT ─── */
function Section({ title, icon: Icon, children, delay = 0, color = '#00f0ff' }: {
  title: string; icon: any; children: React.ReactNode; delay?: number; color?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-panel p-4 sm:p-6 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-[0.03]"
        style={{ background: `radial-gradient(circle, ${color}, transparent)` }} />
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <h2 className="text-sm font-semibold text-white/80">{title}</h2>
      </div>
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

/* ─── TOGGLE SWITCH ─── */
function Toggle({ enabled, onToggle, color = '#00f0ff' }: { enabled: boolean; onToggle: () => void; color?: string }) {
  return (
    <button onClick={onToggle}
      className="relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0"
      style={{ background: enabled ? `${color}30` : 'rgba(255,255,255,0.06)', border: `1px solid ${enabled ? `${color}40` : 'rgba(255,255,255,0.08)'}` }}>
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-[3px] w-[18px] h-[18px] rounded-full"
        style={{ background: enabled ? color : 'rgba(255,255,255,0.3)' }}
      />
    </button>
  )
}

/* ─── SETTING ROW ─── */
function SettingRow({ icon: Icon, label, desc, children, color = '#00f0ff' }: {
  icon: any; label: string; desc?: string; children: React.ReactNode; color?: string
}) {
  return (
    <div className="flex items-center justify-between py-3 px-1 group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon size={16} className="flex-shrink-0 opacity-50 group-hover:opacity-80 transition-opacity" style={{ color }} />
        <div className="min-w-0">
          <p className="text-sm text-white/75 font-medium">{label}</p>
          {desc && <p className="text-[11px] text-white/25 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { resetProgress, xp, level, streak, completedTopics, quizResults, achievements } = useAppStore()
  const { t, language, setLanguage } = useI18nStore()
  const { profile, updateProfile } = useAuthStore()
  const { myRequest, fetchMyRequest } = useRoleRequestStore()
  const navigate = useNavigate()
  const [showConfirm, setShowConfirm] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const {
    soundEnabled, notificationsEnabled: notifEnabled, animationsEnabled: animEnabled, accentColor,
    profileImage, toggleSound, toggleNotifications, toggleAnimations, setAccentColor, setProfileImage
  } = useSettingsStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile?.role === 'student') {
      fetchMyRequest()
    }
  }, [profile?.role])

  const totalTopics = curriculum.length
  const avgScore = quizResults.length > 0
    ? Math.round(quizResults.reduce((a, r) => a + (r.score / r.totalQuestions) * 100, 0) / quizResults.length)
    : 0
  const totalQuestions = quizResults.reduce((a, r) => a + r.totalQuestions, 0)
  const totalCorrect = quizResults.reduce((a, r) => a + r.score, 0)

  const handleReset = () => {
    resetProgress()
    setShowConfirm(false)
  }

  const handleEmojiSelect = async (emoji: string) => {
    setShowEmojiPicker(false)
    if (profile) {
      await updateProfile({ avatar_emoji: emoji })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500 * 1024) {
      alert(language === 'uz' ? 'Rasm hajmi 500KB dan kichik bo\'lishi kerak' : language === 'ru' ? 'Размер изображения должен быть менее 500КБ' : 'Image must be less than 500KB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const size = 200
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')!
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2, sy = (img.height - min) / 2
        ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.clip()
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        setProfileImage(canvas.toDataURL('image/webp', 0.8))
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const labels = {
    uz: {
      title: 'Sozlamalar',
      subtitle: "O'quv jarayoningizni sozlang",
      profile: 'Profil',
      appearance: "Ko'rinish",
      language: 'Til',
      sound: 'Ovoz effektlari',
      soundDesc: "Testlarda ovoz effektlarini yoqish",
      notifications: 'Bildirishnomalar',
      notifDesc: "Kunlik eslatmalarni olish",
      animations: 'Animatsiyalar',
      animDesc: "Interfeys animatsiyalarini yoqish",
      accentColor: 'Asosiy rang',
      stats: "Batafsil statistika",
      about: "Platforma haqida",
      danger: "Xavfli zona",
      resetBtn: "Barcha natijalarni tozalash",
      resetWarn: "Bu amalni QAYTARIB BO'LMAYDI! Barcha natijalaringiz o'chib ketadi!",
      confirm: "Tasdiqlash",
      cancel: "Bekor qilish",
      totalXp: "Umumiy XP",
      levelLabel: "Daraja",
      topicsDone: "Mavzular",
      quizzesTaken: "Testlar",
      avgScore: "O'rtacha ball",
      streakLabel: "Faollik",
      achievementsLabel: "Yutuqlar",
      questionsLabel: "Savollar",
      accuracy: "Aniqlik",
      changeAvatar: "Avatarni o'zgartirish",
      version: 'Versiya',
      builtWith: "React, TypeScript, Tailwind CSS, Framer Motion, Zustand bilan yaratilgan",
      platform: "DigitalEdu — raqamli pedagogika platformasi",
    },
    ru: {
      title: 'Настройки',
      subtitle: 'Настройте процесс обучения',
      profile: 'Профиль',
      appearance: 'Внешний вид',
      language: 'Язык',
      sound: 'Звуковые эффекты',
      soundDesc: 'Включить звуки в тестах',
      notifications: 'Уведомления',
      notifDesc: 'Получать ежедневные напоминания',
      animations: 'Анимации',
      animDesc: 'Включить анимации интерфейса',
      accentColor: 'Акцентный цвет',
      stats: 'Подробная статистика',
      about: 'О платформе',
      danger: 'Опасная зона',
      resetBtn: 'Сбросить весь прогресс',
      resetWarn: 'Это действие НЕЛЬЗЯ ОТМЕНИТЬ! Все ваши данные будут удалены!',
      confirm: 'Подтвердить',
      cancel: 'Отмена',
      totalXp: 'Общий XP',
      levelLabel: 'Уровень',
      topicsDone: 'Темы',
      quizzesTaken: 'Тесты',
      avgScore: 'Средний балл',
      streakLabel: 'Серия дней',
      achievementsLabel: 'Достижения',
      questionsLabel: 'Вопросы',
      accuracy: 'Точность',
      changeAvatar: 'Сменить аватар',
      version: 'Версия',
      builtWith: 'Создано с React, TypeScript, Tailwind CSS, Framer Motion, Zustand',
      platform: 'DigitalEdu — платформа цифровой педагогики',
    },
    en: {
      title: 'Settings',
      subtitle: 'Customize your learning experience',
      profile: 'Profile',
      appearance: 'Appearance',
      language: 'Language',
      sound: 'Sound Effects',
      soundDesc: 'Enable sounds during quizzes',
      notifications: 'Notifications',
      notifDesc: 'Receive daily reminders',
      animations: 'Animations',
      animDesc: 'Enable interface animations',
      accentColor: 'Accent Color',
      stats: 'Detailed Statistics',
      about: 'About Platform',
      danger: 'Danger Zone',
      resetBtn: 'Reset All Progress',
      resetWarn: 'This action CANNOT be undone! All your data will be erased!',
      confirm: 'Confirm',
      cancel: 'Cancel',
      totalXp: 'Total XP',
      levelLabel: 'Level',
      topicsDone: 'Topics',
      quizzesTaken: 'Quizzes',
      avgScore: 'Avg Score',
      streakLabel: 'Day Streak',
      achievementsLabel: 'Achievements',
      questionsLabel: 'Questions',
      accuracy: 'Accuracy',
      changeAvatar: 'Change Avatar',
      version: 'Version',
      builtWith: 'Built with React, TypeScript, Tailwind CSS, Framer Motion, Zustand',
      platform: 'DigitalEdu — Digital Pedagogy Platform',
    },
  }
  const L = labels[language]

  const statsGrid = [
    { label: L.totalXp, value: xp.toLocaleString(), icon: Zap, color: '#00f0ff' },
    { label: L.levelLabel, value: level, icon: Trophy, color: '#a855f7' },
    { label: L.topicsDone, value: `${completedTopics.length}/${totalTopics}`, icon: BookOpen, color: '#3b82f6' },
    { label: L.quizzesTaken, value: quizResults.length, icon: Target, color: '#f97316' },
    { label: L.avgScore, value: `${avgScore}%`, icon: Sparkles, color: '#22c55e' },
    { label: L.streakLabel, value: `${streak} 🔥`, icon: Heart, color: '#ec4899' },
    { label: L.achievementsLabel, value: `${achievements.length}/12`, icon: Trophy, color: '#facc15' },
    { label: L.accuracy, value: totalQuestions > 0 ? `${Math.round((totalCorrect / totalQuestions) * 100)}%` : '—', icon: Target, color: '#06b6d4' },
  ]

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      {/* Header */}
      <div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-extrabold">
          <span className="cyber-gradient-text">⚙️ {L.title}</span>
        </motion.h1>
        <p className="text-white/40 text-sm mt-1">{L.subtitle}</p>
      </div>

      {/* ─── PROFILE SECTION ─── */}
      <Section title={L.profile} icon={User} delay={0.05} color="#a855f7">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        <div className="flex items-center gap-4 mb-4">
          <div className="relative group">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/15 to-cyan-500/15 border-2 border-white/10 flex items-center justify-center text-3xl cursor-pointer hover:border-purple-500/30 transition-all overflow-hidden"
              onClick={() => !profileImage && setShowEmojiPicker(!showEmojiPicker)}>
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{profile?.avatar_emoji || '🎯'}</span>
              )}
            </motion.div>
            {/* Camera button */}
            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-purple-500/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-purple-500/40 hover:bg-purple-500/50 transition-all">
              <Camera size={12} className="text-purple-200" />
            </motion.button>
            {/* Remove image button */}
            {profileImage && (
              <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.15 }}
                onClick={() => setProfileImage(null)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500/40 backdrop-blur-sm rounded-full flex items-center justify-center border border-red-500/40 hover:bg-red-500/60 transition-all">
                <Trash2 size={9} className="text-red-200" />
              </motion.button>
            )}
          </div>
          <div>
            <p className="text-white/80 font-semibold text-lg">{profile?.full_name || 'Student'}</p>
            <p className="text-xs text-white/30">{profile?.group_name || 'DigitalEdu User'}</p>
            <div className="flex gap-3 mt-1.5">
              <button onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-cyan-400/70 hover:text-cyan-400 transition-colors flex items-center gap-1">
                <ImagePlus size={10} /> {language === 'uz' ? 'Rasm yuklash' : language === 'ru' ? 'Загрузить фото' : 'Upload Photo'}
              </button>
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-[11px] text-purple-400/70 hover:text-purple-400 transition-colors">
                {L.changeAvatar} →
              </button>
            </div>
          </div>
        </div>

        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden">
              <div className="grid grid-cols-10 gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                {EMOJI_OPTIONS.map(e => (
                  <motion.button key={e} whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.9 }}
                    onClick={() => handleEmojiSelect(e)}
                    className={`text-xl p-1.5 rounded-lg hover:bg-white/10 transition-colors ${profile?.avatar_emoji === e ? 'bg-purple-500/20 ring-1 ring-purple-500/40' : ''}`}>
                    {e}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>

      {/* ─── LANGUAGE & APPEARANCE ─── */}
      <Section title={L.appearance} icon={Palette} delay={0.1} color="#3b82f6">
        {/* Language */}
        <SettingRow icon={Globe} label={L.language} color="#3b82f6">
          <div className="flex gap-1.5 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
            {(['uz', 'ru', 'en'] as const).map(lang => (
              <button key={lang} onClick={() => setLanguage(lang)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-300 ${language === lang
                  ? 'bg-blue-500/20 text-blue-400 shadow-sm shadow-blue-500/10'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]'}`}>
                {lang === 'uz' ? "O'zbekcha" : lang === 'ru' ? 'Русский' : 'English'}
              </button>
            ))}
          </div>
        </SettingRow>

        <div className="border-t border-white/[0.04] my-1" />

        {/* Sound */}
        <SettingRow icon={soundEnabled ? Volume2 : VolumeX} label={L.sound} desc={L.soundDesc} color="#22c55e">
          <Toggle enabled={soundEnabled} onToggle={toggleSound} color="#22c55e" />
        </SettingRow>

        <div className="border-t border-white/[0.04] my-1" />

        {/* Notifications */}
        <SettingRow icon={notifEnabled ? Bell : BellOff} label={L.notifications} desc={L.notifDesc} color="#f97316">
          <Toggle enabled={notifEnabled} onToggle={toggleNotifications} color="#f97316" />
        </SettingRow>

        <div className="border-t border-white/[0.04] my-1" />

        {/* Animations */}
        <SettingRow icon={Sparkles} label={L.animations} desc={L.animDesc} color="#a855f7">
          <Toggle enabled={animEnabled} onToggle={toggleAnimations} color="#a855f7" />
        </SettingRow>

        <div className="border-t border-white/[0.04] my-1" />

        {/* Accent Color */}
        <SettingRow icon={Palette} label={L.accentColor} color="#ec4899">
          <div className="flex gap-1.5">
            {ACCENT_COLORS.map(c => (
              <button key={c.value} onClick={() => setAccentColor(c.value)}
                className={`w-6 h-6 rounded-full transition-all duration-300 ${accentColor === c.value ? 'ring-2 ring-offset-2 ring-offset-[#0a0e1a] scale-110' : 'hover:scale-110'}`}
                style={{ background: c.value, ringColor: c.value }}
                title={c.name} />
            ))}
          </div>
        </SettingRow>
      </Section>

      {/* ─── STATISTICS ─── */}
      <Section title={L.stats} icon={Zap} delay={0.15} color="#00f0ff">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statsGrid.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.04 }}
              className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300 group">
              <s.icon size={16} style={{ color: s.color }} className="mx-auto mb-2 opacity-60 group-hover:opacity-100 transition-opacity" />
              <p className="text-lg font-bold text-white/90">{s.value}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        {quizResults.length > 0 && (
          <div className="mt-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-white/40">{L.questionsLabel}: {totalCorrect}/{totalQuestions}</span>
              <span className="text-xs font-bold" style={{ color: '#00f0ff' }}>
                {totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
              <motion.div initial={{ width: 0 }}
                animate={{ width: `${totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #00f0ff, #a855f7)' }} />
            </div>
          </div>
        )}
      </Section>

      {/* ─── ABOUT ─── */}
      <Section title={L.about} icon={Info} delay={0.2} color="#22c55e">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎓</span>
              <div>
                <p className="text-sm font-medium text-white/70">{L.platform}</p>
                <p className="text-[10px] text-white/25">{L.builtWith}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
            <span className="text-xs text-white/40">{L.version}</span>
            <span className="text-xs font-mono text-green-400/60 bg-green-500/5 px-2 py-0.5 rounded-md">v2.0.0</span>
          </div>
        </div>
      </Section>

      {/* ─── TEACHER ROLE REQUEST (students only) ─── */}
      {profile?.role === 'student' && (
        <Section title={language === 'uz' ? "O'qituvchi bo'lish" : language === 'ru' ? 'Запрос роли преподавателя' : 'Request Teacher Role'} icon={GraduationCap} delay={0.22} color="#8b5cf6">
          <div className="space-y-3">
            {myRequest && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-xs text-white/40">
                  {language === 'uz' ? 'Holat' : language === 'ru' ? 'Статус' : 'Status'}:
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                  myRequest.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                  myRequest.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {myRequest.status === 'pending'
                    ? (language === 'uz' ? 'Kutilmoqda' : language === 'ru' ? 'На рассмотрении' : 'Pending')
                    : myRequest.status === 'approved'
                    ? (language === 'uz' ? 'Tasdiqlangan' : language === 'ru' ? 'Одобрено' : 'Approved')
                    : (language === 'uz' ? 'Rad etilgan' : language === 'ru' ? 'Отклонено' : 'Rejected')
                  }
                </span>
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate('/request-teacher')}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-purple-400/80 bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 hover:border-purple-500/20 transition-all group"
            >
              <div className="flex items-center gap-2">
                <GraduationCap size={14} />
                <span>{language === 'uz' ? "O'qituvchi rolini so'rash" : language === 'ru' ? 'Запросить роль преподавателя' : 'Request Teacher Role'}</span>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          </div>
        </Section>
      )}

      {/* ─── DANGER ZONE ─── */}
      <Section title={L.danger} icon={Shield} delay={0.25} color="#ef4444">
        <AnimatePresence mode="wait">
          {!showConfirm ? (
            <motion.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(true)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400/70 bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 hover:border-red-500/20 transition-all group">
              <div className="flex items-center gap-2">
                <RotateCcw size={14} />
                <span>{L.resetBtn}</span>
              </div>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          ) : (
            <motion.div key="confirm" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="p-5 rounded-xl bg-red-500/5 border border-red-500/15 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-400">{L.resetWarn}</p>
                  <p className="text-xs text-white/25 mt-1">XP: {xp} | {L.topicsDone}: {completedTopics.length} | {L.quizzesTaken}: {quizResults.length}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors border border-red-500/20">
                  {L.confirm}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/50 hover:bg-white/10 transition-colors border border-white/[0.06]">
                  {L.cancel}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Section>
    </div>
  )
}
