import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Eye, EyeOff, Lock, LogIn, Mail, ShieldCheck, Sparkles, User, UserPlus, Users } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [groupName, setGroupName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { signIn, signUp } = useAuthStore()

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode)
    setError('')
    setSuccess('')
    setPassword('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!identifier.trim()) {
      setError('Email kiriting')
      return
    }

    if (password.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lishi kerak")
      return
    }

    setSubmitting(true)

    if (mode === 'login') {
      const result = await signIn(identifier, password)
      if (result.error) setError(result.error)
    } else {
      if (!fullName.trim()) {
        setError("To'liq ism kiriting")
        setSubmitting(false)
        return
      }

      const result = await signUp(identifier, password, fullName, groupName)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess("Siz muvaffaqiyatli ro'yxatdan o'tdingiz! Endi tizimga kirishingiz mumkin.")
        setTimeout(() => {
          setMode('login')
          setPassword('')
          // Keep identifier (email) for easier login
        }, 2000)
      }
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#070912]">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
        <div className="scanline" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-600 blur-xl opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-3xl" />
            <BookOpen size={38} className="text-white relative z-10" />
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center text-cyan-600 shadow-xl">
              <Sparkles size={16} />
            </div>
          </div>

          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            <span className="cyber-gradient-text">DigitalEdu</span>
          </h1>
          <p className="text-white/45 text-sm font-medium">Rollar asosidagi ta'lim platformasi</p>
        </div>

        <div className="glass-panel p-6 sm:p-8 relative overflow-hidden">
          <div className="flex gap-2 mb-7 p-1.5 rounded-2xl bg-black/20 border border-white/5">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'bg-white/[0.08] text-cyan-400 border border-white/10'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              <LogIn size={16} /> Kirish
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                mode === 'register'
                  ? 'bg-white/[0.08] text-purple-400 border border-white/10'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              <UserPlus size={16} /> Ro'yxatdan o'tish
            </button>
          </div>

          {mode === 'login' && (
            <div className="mb-5 rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4 flex gap-3">
              <ShieldCheck size={18} className="text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white">Admin kirishi</p>
                <p className="text-xs text-white/45 mt-1">
                  Admin ham email va parol orqali kiradi. Admin roli bazada bir marta qo'lda beriladi.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-5"
                >
                  <label className="block">
                    <span className="text-xs font-bold text-white/45 mb-2 block">To'liq ism</span>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ism familiya"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/20 border border-white/5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-500/40"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-white/45 mb-2 block">Guruh</span>
                    <div className="relative">
                      <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Masalan: CS-101"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/20 border border-white/5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-500/40"
                      />
                    </div>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            <label className="block">
              <span className="text-xs font-bold text-white/45 mb-2 block">Email</span>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type="email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/20 border border-white/5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-white/45 mb-2 block">Parol</span>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parol"
                  required
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-black/20 border border-white/5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Parolni yashirish' : "Parolni ko'rsatish"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 rounded-2xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl ${
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
                  {mode === 'login' ? 'Tizimga kirish' : "Ro'yxatdan o'tish"}
                </>
              )}
            </button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: 10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium flex gap-3 items-start"
              >
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                </div>
                <div>
                  <p className="font-bold mb-1 text-red-200">Xatolik yuz berdi</p>
                  <p className="opacity-80">{error === 'Email not confirmed' ? "Email tasdiqlanmagan. Iltimos, pochtangizni tekshiring yoki admin bilan bog'laning." : error}</p>
                </div>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: 10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-300 text-xs font-medium flex gap-3 items-start"
              >
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold mb-1 text-green-200">Muvaffaqiyatli!</p>
                  <p className="opacity-80">{success}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-white/35 text-sm mt-7">
          {mode === 'login' ? "Hisobingiz yo'qmi?" : 'Hisobingiz bormi?'}{' '}
          <button
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-4"
          >
            {mode === 'login' ? "Ro'yxatdan o'tish" : 'Kirish'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
