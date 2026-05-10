import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, UserPlus, Mail, Lock, User, Users, Eye, EyeOff, Sparkles, BookOpen, Globe } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useI18nStore } from '../store/useI18nStore'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [groupName, setGroupName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { signIn, signUp } = useAuthStore()
  const { language, setLanguage } = useI18nStore()

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      welcome: { uz: 'Lernify CS ga Xush Kelibsiz', ru: 'Добро пожаловать в Lernify CS', en: 'Welcome to Lernify CS' },
      subtitle: { uz: 'Raqamli pedagogika va dasturlash', ru: 'Цифровая педагогика и программирование', en: 'Digital Pedagogy & Programming' },
      login: { uz: 'Kirish', ru: 'Войти', en: 'Log In' },
      register: { uz: "Ro'yxatdan o'tish", ru: 'Регистрация', en: 'Register' },
      email: { uz: 'Email', ru: 'Email', en: 'Email' },
      password: { uz: 'Parol', ru: 'Пароль', en: 'Password' },
      fullName: { uz: "To'liq ism", ru: 'Полное имя', en: 'Full Name' },
      group: { uz: 'Guruh nomi', ru: 'Название группы', en: 'Group Name' },
      noAccount: { uz: "Hisobingiz yo'qmi?", ru: 'Нет аккаунта?', en: "Don't have an account?" },
      hasAccount: { uz: 'Hisobingiz bormi?', ru: 'Есть аккаунт?', en: 'Already have an account?' },
      loginBtn: { uz: 'Tizimga kirish', ru: 'Войти в систему', en: 'Sign In' },
      registerBtn: { uz: "Ro'yxatdan o'tish", ru: 'Зарегистрироваться', en: 'Sign Up' },
      registerSuccess: { uz: "Ro'yxatdan muvaffaqiyatli o'tdingiz! Email ni tasdiqlang.", ru: 'Регистрация успешна! Подтвердите email.', en: 'Registration successful! Please confirm your email.' },
      passwordMin: { uz: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak', ru: 'Пароль должен содержать минимум 6 символов', en: 'Password must be at least 6 characters' },
    }
    return translations[key]?.[language] || translations[key]?.en || key
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.length < 6) {
      setError(t('passwordMin'))
      return
    }

    setSubmitting(true)

    if (mode === 'login') {
      const result = await signIn(email, password)
      if (result.error) setError(result.error)
    } else {
      if (!fullName.trim()) {
        setError(language === 'uz' ? 'Ism kiriting' : language === 'ru' ? 'Введите имя' : 'Enter your name')
        setSubmitting(false)
        return
      }
      const result = await signUp(email, password, fullName, groupName)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(t('registerSuccess'))
      }
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#070912' }}>
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="scanline" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Language Switcher */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
            {(['uz', 'ru', 'en'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  language === lang
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Logo Section */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 10 }}
            className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-3xl" />
            <BookOpen size={44} className="text-white relative z-10" />
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-cyan-600 shadow-xl">
              <Sparkles size={16} />
            </div>
          </motion.div>
          
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            <span className="cyber-gradient-text">LERNIFY</span>
            <span className="text-white/40 ml-2 font-light">CS</span>
          </h1>
          <p className="text-white/40 text-sm font-medium tracking-wide uppercase">
            {t('subtitle')}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel p-8 relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-8 p-1.5 rounded-2xl bg-black/20 border border-white/5">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess('') }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-500 flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'bg-white/[0.08] text-cyan-400 border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.2)]'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              <LogIn size={16} /> {t('login')}
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setSuccess('') }}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-500 flex items-center justify-center gap-2 ${
                mode === 'register'
                  ? 'bg-white/[0.08] text-purple-400 border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.2)]'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              <UserPlus size={16} /> {t('register')}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-5"
                >
                  <div className="group relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('fullName')}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/20 border border-white/5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-500/40 focus:bg-black/40 transition-all"
                    />
                  </div>
                  <div className="group relative">
                    <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors" />
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder={t('group')}
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/20 border border-white/5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-500/40 focus:bg-black/40 transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="group relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email')}
                required
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/20 border border-white/5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 focus:bg-black/40 transition-all"
              />
            </div>

            <div className="group relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password')}
                required
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-black/20 border border-white/5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 focus:bg-black/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-2xl text-sm font-bold transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-cyan-900/20'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-900/20'
              }`}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                  {mode === 'login' ? t('loginBtn') : t('registerBtn')}
                </>
              )}
            </motion.button>
          </form>

          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                {success}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-white/30 text-sm mt-8">
          {mode === 'login' ? t('noAccount') : t('hasAccount')}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
            className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors underline underline-offset-4"
          >
            {mode === 'login' ? t('register') : t('login')}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
