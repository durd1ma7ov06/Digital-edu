import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Award, BookOpen, Brain, ClipboardCheck, FileText, Globe, GraduationCap, LogOut, Medal, Rocket, Settings, ShieldCheck, Target, Trophy, UserCheck
} from 'lucide-react'
import { useI18nStore } from '../store/useI18nStore'
import { useAuthStore } from '../store/useAuthStore'
import { useSettingsStore } from '../store/useSettingsStore'

export default function Sidebar() {
  const { t, language, setLanguage } = useI18nStore()
  const { profile, signOut } = useAuthStore()
  const { profileImage } = useSettingsStore()
  
  const baseItems = [
    { to: '/', icon: Rocket, label: t('dashboard'), emoji: '🚀' },
    { to: '/curriculum', icon: BookOpen, label: t('curriculum'), emoji: '📚' },
    { to: '/quizzes', icon: Brain, label: t('quizzes'), emoji: '🧠' },
    { to: '/leaderboard', icon: Trophy, label: t('leaderboard'), emoji: '🏆' },
    { to: '/achievements', icon: Medal, label: t('achievements'), emoji: '🎖' },
    { to: '/certificate', icon: Award, label: t('certificate'), emoji: '🏅' },
    { to: '/settings', icon: Settings, label: t('settings'), emoji: '⚙️' },
  ]

  const navItems = [...baseItems]

  if (profile?.role === 'admin') {
    navItems.unshift({ to: '/admin', icon: ShieldCheck, label: language === 'uz' ? 'Admin Panel' : 'Admin Panel', emoji: '🛡️' })
    navItems.splice(1, 0, { to: '/teacher', icon: GraduationCap, label: language === 'uz' ? 'O\'qituvchi' : 'Teacher', emoji: '👨‍🏫' })
    navItems.splice(2, 0, { to: '/teacher/grading', icon: ClipboardCheck, label: language === 'uz' ? 'Baholash' : 'Grading', emoji: '✅' })
    navItems.splice(3, 0, { to: '/admin/role-requests', icon: UserCheck, label: language === 'uz' ? 'Rol so\'rovlari' : 'Role Requests', emoji: '📋' })
  } else if (profile?.role === 'teacher') {
    navItems.unshift({ to: '/teacher', icon: GraduationCap, label: language === 'uz' ? 'O\'qituvchi' : 'Teacher', emoji: '👨‍🏫' })
    navItems.splice(1, 0, { to: '/teacher/grading', icon: ClipboardCheck, label: language === 'uz' ? 'Baholash' : 'Grading', emoji: '✅' })
  } else if (profile?.role === 'student') {
    navItems.splice(1, 0, { to: '/submissions', icon: FileText, label: language === 'uz' ? 'Topshiriqlar' : 'Submissions', emoji: '📄' })
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-[260px] glass-sidebar z-50 flex-col py-8 px-4 hidden lg:flex">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-10 px-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)]">
              <Rocket className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none">
                <span className="cyber-gradient-text uppercase">DigitalEdu</span>
                <span className="text-white/90 block text-[10px] tracking-[0.2em] font-light mt-1">PEDAGOGIKA</span>
              </h1>
            </div>
          </div>
          <div className="h-[1px] w-full bg-gradient-to-r from-white/10 to-transparent mt-6" />
        </motion.div>

        <nav className="flex-1 flex flex-col gap-1">
          {navItems.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 w-full"
              >
                <item.icon size={18} />
                <span>{item.emoji} {item.label}</span>
              </motion.div>
            </NavLink>
          ))}
        </nav>

        <div className="px-2 pt-4 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-white/50" />
            <div className="flex gap-2">
              {(['uz', 'ru', 'en'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`text-xs px-2 py-1 rounded ${language === lang ? 'bg-cyber-glow/20 text-cyber-glow font-bold' : 'text-white/40 hover:text-white'}`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyber-glow/20 to-cyber-purple/20 flex items-center justify-center text-lg overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  profile?.avatar_emoji || '🎯'
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-white/70">{profile?.full_name || 'Student'}</p>
                <p className="text-[10px] text-white/30">{profile?.group_name || 'v2.0.0'}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title={language === 'uz' ? 'Chiqish' : language === 'ru' ? 'Выйти' : 'Sign Out'}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#0a0e1a]/85 backdrop-blur-xl border-t border-white/10 z-50 flex lg:hidden overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden items-center px-2 py-2 gap-1 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className="relative flex flex-col items-center justify-center min-w-[72px] h-[56px] px-1 rounded-2xl transition-all duration-300 snap-center shrink-0 group outline-none"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute inset-0 bg-cyber-glow/10 border border-cyber-glow/20 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <motion.div animate={{ y: isActive ? -2 : 0 }} className="flex flex-col items-center">
                  <item.icon size={20} className={`mb-1 transition-all duration-300 ${isActive ? 'text-cyber-glow scale-110 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : 'text-white/40 group-hover:text-white/70'}`} />
                  <span className={`text-[10px] truncate w-full text-center transition-all duration-300 ${isActive ? 'text-cyber-glow font-bold tracking-wide' : 'text-white/40 font-medium group-hover:text-white/70'}`}>{item.label}</span>
                </motion.div>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
