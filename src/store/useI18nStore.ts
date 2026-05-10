import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Language = 'uz' | 'ru' | 'en'

export const translations = {
  uz: {
    dashboard: "Bosh sahifa",
    curriculum: "O'quv dasturi",
    quizzes: "Testlar",
    practice: "Amaliyot",
    leaderboard: "Reyting",
    achievements: "Yutuqlar",
    settings: "Sozlamalar",
    welcome: "Xush kelibsiz! O'quv jarayoningiz haqida umumiy ma'lumot.",
    totalXp: "Umumiy XP",
    level: "Daraja",
    dayStreak: "Kunlik faollik",
    topicsDone: "Tugallangan mavzular",
    avgScore: "O'rtacha ball",
    quizzesTaken: "Yechilgan testlar",
    progressOverview: "O'zlashtirish ko'rsatkichlari",
    recentActivity: "So'nggi faollik",
    noActivity: "Hali testlar yechilmadi. O'rganishni boshlang!",
    platformTitle: "DigitalEdu Pedagogika",
    platformDesc: "Bo'lajak pedagoglarni ko'p tillilik muhitda raqamli texnologiyalardan foydalanish metodikasini takomillashtirish platformasi",
    certificate: "Sertifikat"
  },
  ru: {
    dashboard: "Главная",
    curriculum: "Учебная программа",
    quizzes: "Тесты",
    practice: "Практика",
    leaderboard: "Рейтинг",
    achievements: "Достижения",
    settings: "Настройки",
    welcome: "Добро пожаловать! Ваш прогресс обучения.",
    totalXp: "Общий XP",
    level: "Уровень",
    dayStreak: "Дней подряд",
    topicsDone: "Изученные темы",
    avgScore: "Средний балл",
    quizzesTaken: "Пройденные тесты",
    progressOverview: "Обзор прогресса",
    recentActivity: "Последняя активность",
    noActivity: "Тесты еще не пройдены. Начните обучение!",
    platformTitle: "DigitalEdu Педагогика",
    platformDesc: "Платформа совершенствования методики использования цифровых технологий будущими педагогами в полиязычной среде",
    certificate: "Сертификат"
  },
  en: {
    dashboard: "Dashboard",
    curriculum: "Curriculum",
    quizzes: "Quizzes",
    practice: "Practice Lab",
    leaderboard: "Leaderboard",
    achievements: "Achievements",
    settings: "Settings",
    welcome: "Welcome back! Here's your learning overview.",
    totalXp: "Total XP",
    level: "Level",
    dayStreak: "Day Streak",
    topicsDone: "Topics Done",
    avgScore: "Avg Score",
    quizzesTaken: "Quizzes Taken",
    progressOverview: "Progress Overview",
    recentActivity: "Recent Activity",
    noActivity: "No quizzes taken yet. Start learning!",
    platformTitle: "DigitalEdu Pedagogy",
    platformDesc: "Improving the methodology of using digital technologies by future teachers in a multilingual environment",
    certificate: "Certificate"
  }
}

interface I18nState {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof typeof translations['en']) => string
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'uz',
      setLanguage: (lang: Language) => set({ language: lang }),
      t: (key) => translations[get().language][key] || translations['uz'][key]
    }),
    {
      name: 'learnify-lang-store',
    }
  )
)
