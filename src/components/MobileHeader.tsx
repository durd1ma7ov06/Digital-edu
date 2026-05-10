import { Globe, LogOut } from 'lucide-react'
import { useI18nStore } from '../store/useI18nStore'
import { useAuthStore } from '../store/useAuthStore'
import { useSettingsStore } from '../store/useSettingsStore'

export default function MobileHeader() {
  const { language, setLanguage } = useI18nStore()
  const { profile, signOut } = useAuthStore()
  const { profileImage } = useSettingsStore()

  return (
    <header className="lg:hidden fixed top-0 left-0 w-full h-16 bg-[#0a0e1a]/90 backdrop-blur-2xl border-b border-white/10 z-50 px-3 sm:px-4 flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2.5 sm:gap-3">
         <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] bg-gradient-to-br from-cyber-glow/20 to-cyber-purple/20 flex items-center justify-center text-lg overflow-hidden shrink-0 border border-white/5 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
           {profileImage ? (
             <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
           ) : (
             profile?.avatar_emoji || '🎯'
           )}
         </div>
         <div className="flex flex-col justify-center">
           <span className="text-[9px] sm:text-[10px] text-cyber-glow leading-none uppercase font-black tracking-widest opacity-90 mb-0.5">Digital Edu</span>
           <span className="text-[11px] sm:text-xs font-bold text-white/95 leading-tight truncate max-w-[100px] sm:max-w-[130px] drop-shadow-md">{profile?.full_name || 'Student'}</span>
         </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex bg-black/20 rounded-lg p-0.5 border border-white/10 shadow-inner">
          {(['uz', 'ru', 'en'] as const).map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`text-[9px] sm:text-[10px] font-black px-1.5 sm:px-2 py-1.5 rounded-md transition-all duration-300 ${language === lang ? 'bg-cyber-glow/25 text-cyber-glow shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'text-white/40 hover:text-white/80'}`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={signOut} className="p-1.5 sm:p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all active:scale-95 border border-transparent hover:border-red-500/20 shadow-sm flex items-center justify-center">
          <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
      </div>
    </header>
  )
}
