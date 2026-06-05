import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BrainCircuit, ArrowRight, Check, X, Trophy, Sparkles, Clock, Target, Globe } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'
import { useI18nStore } from '../store/useI18nStore'

// Diagnostika test savollari — pedagogika asoslari bo'yicha
const diagnosticQuestions = [
  {
    q: {
      uz: "Pedagogikaning asosiy maqsadi nima?",
      ru: "Какова основная цель педагогики?",
      en: "What is the main goal of pedagogy?"
    },
    options: {
      uz: ["Bilim berish va shaxsni rivojlantirish", "Faqat imtihonlarga tayyorlash", "Faqat axloqiy tarbiya", "Sport mashg'ulotlari"],
      ru: ["Передача знаний и развитие личности", "Только подготовка к экзаменам", "Только нравственное воспитание", "Спортивные занятия"],
      en: ["Knowledge transfer and personal development", "Only exam preparation", "Only moral education", "Sports activities"]
    },
    answer: 0
  },
  {
    q: {
      uz: "Ta'lim jarayonining asosiy komponentlari qaysilar?",
      ru: "Каковы основные компоненты процесса обучения?",
      en: "What are the main components of the learning process?"
    },
    options: {
      uz: ["O'qituvchi, o'quvchi, ta'lim mazmuni", "Faqat darslik", "Faqat sinf xonasi", "Faqat baholash"],
      ru: ["Учитель, ученик, содержание образования", "Только учебник", "Только классная комната", "Только оценивание"],
      en: ["Teacher, student, educational content", "Only textbook", "Only classroom", "Only assessment"]
    },
    answer: 0
  },
  {
    q: {
      uz: "Interaktiv ta'lim usuli nima?",
      ru: "Что такое интерактивный метод обучения?",
      en: "What is an interactive teaching method?"
    },
    options: {
      uz: ["Faqat ma'ruza o'qish", "O'quvchilar faol ishtirok etadigan o'qitish usuli", "Faqat kitob o'qish", "Imtihon topshirish"],
      ru: ["Только чтение лекций", "Метод обучения с активным участием учеников", "Только чтение книг", "Сдача экзаменов"],
      en: ["Only lecturing", "Teaching method with active student participation", "Only reading books", "Taking exams"]
    },
    answer: 1
  },
  {
    q: {
      uz: "Bloom taksonomiyasining eng past darajasi qaysi?",
      ru: "Какой самый низкий уровень таксономии Блума?",
      en: "What is the lowest level of Bloom's taxonomy?"
    },
    options: {
      uz: ["Tahlil qilish", "Eslab qolish", "Baholash", "Yaratish"],
      ru: ["Анализ", "Запоминание", "Оценка", "Создание"],
      en: ["Analyzing", "Remembering", "Evaluating", "Creating"]
    },
    answer: 1
  },
  {
    q: {
      uz: "Raqamli texnologiyalar ta'limda qanday rol o'ynaydi?",
      ru: "Какую роль играют цифровые технологии в образовании?",
      en: "What role do digital technologies play in education?"
    },
    options: {
      uz: ["Hech qanday ta'siri yo'q", "O'qitishni samarali va qiziqarli qiladi", "Faqat o'yin uchun", "Faqat kattalar uchun"],
      ru: ["Не оказывают никакого влияния", "Делают обучение эффективным и интересным", "Только для игр", "Только для взрослых"],
      en: ["No impact at all", "Makes learning effective and engaging", "Only for games", "Only for adults"]
    },
    answer: 1
  },
  {
    q: {
      uz: "Formativ baholash nima?",
      ru: "Что такое формативное оценивание?",
      en: "What is formative assessment?"
    },
    options: {
      uz: ["Yakuniy imtihon", "O'quv jarayonida muntazam tekshirish", "Faqat baho qo'yish", "Diplom berish"],
      ru: ["Итоговый экзамен", "Регулярная проверка в процессе обучения", "Только выставление оценок", "Выдача дипломов"],
      en: ["Final exam", "Regular checking during the learning process", "Only grading", "Issuing diplomas"]
    },
    answer: 1
  },
  {
    q: {
      uz: "Differensial ta'lim nima?",
      ru: "Что такое дифференцированное обучение?",
      en: "What is differentiated instruction?"
    },
    options: {
      uz: ["Barcha o'quvchilarga bir xil dars berish", "O'quvchilar qobiliyatiga qarab ta'limni moslashtirish", "Faqat aqlli o'quvchilar uchun dars", "Faqat zaif o'quvchilar uchun dars"],
      ru: ["Одинаковый урок для всех", "Адаптация обучения к способностям учеников", "Занятия только для одаренных", "Занятия только для слабых"],
      en: ["Same lesson for everyone", "Adapting instruction to students' abilities", "Lessons only for gifted students", "Lessons only for weak students"]
    },
    answer: 1
  },
  {
    q: {
      uz: "O'quv jarayonida motivatsiyaning ahamiyati nimada?",
      ru: "Какова роль мотивации в учебном процессе?",
      en: "What is the importance of motivation in the learning process?"
    },
    options: {
      uz: ["Ahamiyati yo'q", "O'quvchining bilimga intilishini oshiradi", "Faqat o'qituvchiga kerak", "Faqat sport uchun"],
      ru: ["Не имеет значения", "Повышает стремление ученика к знаниям", "Нужна только учителю", "Только для спорта"],
      en: ["Not important", "Increases student's desire for knowledge", "Only needed by teacher", "Only for sports"]
    },
    answer: 1
  },
  {
    q: {
      uz: "Konstruktivizm nazariyasi nimani taklif etadi?",
      ru: "Что предлагает теория конструктивизма?",
      en: "What does constructivism theory propose?"
    },
    options: {
      uz: ["Bilim o'quvchi tomonidan faol quriladi", "Bilim faqat yodlash orqali olinadi", "O'qituvchi yagona bilim manbai", "Kitoblar keraksiz"],
      ru: ["Знание активно конструируется учеником", "Знание получается только зубрежкой", "Учитель единственный источник знаний", "Книги не нужны"],
      en: ["Knowledge is actively constructed by the learner", "Knowledge is gained only by memorization", "Teacher is the sole source of knowledge", "Books are unnecessary"]
    },
    answer: 0
  },
  {
    q: {
      uz: "LMS (Learning Management System) nima?",
      ru: "Что такое LMS (система управления обучением)?",
      en: "What is an LMS (Learning Management System)?"
    },
    options: {
      uz: ["Ijtimoiy tarmoq", "Ta'lim jarayonini boshqarish tizimi", "O'yin dasturi", "Hisob-kitob dasturi"],
      ru: ["Социальная сеть", "Система управления образовательным процессом", "Игровая программа", "Бухгалтерская программа"],
      en: ["Social network", "System for managing the educational process", "Gaming software", "Accounting software"]
    },
    answer: 1
  },
]

const optionLetters = ['A', 'B', 'C', 'D']

export default function DiagnosticTest() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(diagnosticQuestions.length).fill(null))
  const [started, setStarted] = useState(false)

  const { completeDiagnostic, profile } = useAuthStore()
  const { language, setLanguage } = useI18nStore()

  const total = diagnosticQuestions.length
  const q = diagnosticQuestions[current]

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: { uz: 'Diagnostika Testi', ru: 'Диагностический Тест', en: 'Diagnostic Test' },
      subtitle: { uz: 'Platformadan to\'liq foydalanish uchun diagnostika testini topshiring', ru: 'Пройдите диагностический тест для полного доступа к платформе', en: 'Complete the diagnostic test for full platform access' },
      start: { uz: 'Testni boshlash', ru: 'Начать тест', en: 'Start Test' },
      desc1: { uz: 'Bu test sizning pedagogika sohasidagi bilimingizni aniqlaydi', ru: 'Этот тест определит ваши знания в области педагогики', en: 'This test will assess your knowledge in pedagogy' },
      desc2: { uz: `Jami ${total} ta savol`, ru: `Всего ${total} вопросов`, en: `Total ${total} questions` },
      desc3: { uz: 'Natija profilingizga saqlanadi', ru: 'Результат сохранится в профиле', en: 'Results will be saved to your profile' },
      question: { uz: 'Savol', ru: 'Вопрос', en: 'Question' },
      confirm: { uz: 'Tasdiqlash', ru: 'Подтвердить', en: 'Confirm' },
      next: { uz: 'Keyingisi', ru: 'Далее', en: 'Next' },
      finish: { uz: 'Yakunlash', ru: 'Завершить', en: 'Finish' },
      completed: { uz: 'Diagnostika yakunlandi!', ru: 'Диагностика завершена!', en: 'Diagnostic Complete!' },
      correct: { uz: "to'g'ri", ru: 'правильно', en: 'correct' },
      continue: { uz: 'Platformaga kirish', ru: 'Войти в платформу', en: 'Enter Platform' },
      welcome: { uz: `Xush kelibsiz, ${profile?.full_name || ''}!`, ru: `Добро пожаловать, ${profile?.full_name || ''}!`, en: `Welcome, ${profile?.full_name || ''}!` },
      score: { uz: 'Ball', ru: 'Счет', en: 'Score' },
    }
    return translations[key]?.[language] || translations[key]?.en || key
  }

  const handleSelect = (idx: number) => {
    if (confirmed) return
    setSelected(idx)
  }

  const handleConfirm = () => {
    if (selected === null) return
    setConfirmed(true)
    const newAnswers = [...answers]
    newAnswers[current] = selected
    setAnswers(newAnswers)
    if (selected === q.answer) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (current < total - 1) {
      setCurrent(c => c + 1)
      setSelected(null)
      setConfirmed(false)
    } else {
      const finalScore = score + (selected === q.answer && confirmed ? 0 : 0)
      setFinished(true)
    }
  }

  const handleComplete = async () => {
    await completeDiagnostic(score, total, answers)
    navigate('/', { replace: true })
  }

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,240,255,0.08) 0%, transparent 60%), #0a0a12' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          {/* Language Switcher */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <Globe size={14} className="text-white/30 ml-2" />
              {(['uz', 'ru', 'en'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                    language === lang
                      ? 'bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/10'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {lang === 'uz' ? "O'zbekcha" : lang === 'ru' ? 'Русский' : 'English'}
                </button>
              ))}
            </div>
          </div>
          <div
            className="rounded-2xl p-6 sm:p-10 text-center backdrop-blur-xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(0,240,255,0.2))',
                border: '1px solid rgba(168,85,247,0.3)',
              }}
            >
              <BrainCircuit size={36} className="text-purple-400" />
            </motion.div>

            <h1 className="text-2xl font-extrabold text-white mb-2">{t('title')}</h1>
            <p className="text-white/40 text-sm mb-8">{t('subtitle')}</p>

            <p className="text-white/60 text-sm mb-2">{t('welcome')}</p>

            <div className="space-y-3 mb-8 text-left">
              {['desc1', 'desc2', 'desc3'].map((key, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  {i === 0 && <Target size={16} className="text-cyan-400 shrink-0" />}
                  {i === 1 && <Clock size={16} className="text-purple-400 shrink-0" />}
                  {i === 2 && <Sparkles size={16} className="text-yellow-400 shrink-0" />}
                  <span className="text-white/60 text-sm">{t(key)}</span>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={() => setStarted(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(0,240,255,0.15))',
                border: '1px solid rgba(168,85,247,0.3)',
                color: '#a855f7',
                boxShadow: '0 0 30px rgba(168,85,247,0.15)',
              }}
            >
              <BrainCircuit size={16} /> {t('start')}
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (finished) {
    const pct = Math.round((score / total) * 100)
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,240,255,0.08) 0%, transparent 60%), #0a0a12' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div
            className="rounded-2xl p-6 sm:p-10 text-center backdrop-blur-xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <Trophy size={64} className={`mx-auto mb-4 ${pct >= 70 ? 'text-yellow-400' : 'text-white/40'}`} />
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-2">{t('completed')}</h2>

            <div className="text-5xl font-extrabold my-4">
              <span className={pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400'}>{score}</span>
              <span className="text-white/20">/{total}</span>
            </div>

            <p className="text-white/40 text-sm mb-8">{pct}% {t('correct')}</p>

            <motion.button
              onClick={handleComplete}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, rgba(0,240,255,0.25), rgba(34,197,94,0.15))',
                border: '1px solid rgba(0,240,255,0.3)',
                color: '#00f0ff',
                boxShadow: '0 0 30px rgba(0,240,255,0.15)',
              }}
            >
              <Sparkles size={16} /> {t('continue')}
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,240,255,0.08) 0%, transparent 60%), #0a0a12' }}>
      <div className="w-full max-w-2xl space-y-6">
        {/* Language Switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit size={20} className="text-purple-400" />
            <span className="text-sm font-bold text-white/80">{t('title')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              {(['uz', 'ru', 'en'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                    language === lang
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="text-sm text-white/30">
              {t('score')}: <span className="text-white/70 font-bold">{score}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-cyan-400">{t('question')} {current + 1} / {total}</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #a855f7, #00f0ff)' }}
            animate={{ width: `${((current + 1) / total) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="rounded-2xl p-6 sm:p-8 backdrop-blur-xl mt-6"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h2 className="text-lg font-semibold text-white mb-6 leading-relaxed">{q.q[language]}</h2>
            <div className="grid gap-3">
              {q.options[language].map((opt, idx) => {
                let cls = 'p-4 rounded-xl border text-sm font-medium transition-all duration-300 cursor-pointer text-left w-full flex items-center gap-3 '
                if (!confirmed) {
                  cls += selected === idx
                    ? 'bg-white/[0.08] border-purple-400/40 text-white shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                    : 'bg-white/[0.02] border-white/[0.06] text-white/60 hover:bg-white/[0.05] hover:border-white/[0.12]'
                } else {
                  if (idx === q.answer) cls += 'bg-green-500/10 border-green-400/40 text-green-300'
                  else if (idx === selected) cls += 'bg-red-500/10 border-red-400/40 text-red-300'
                  else cls += 'bg-white/[0.01] border-white/[0.04] text-white/30'
                }
                return (
                  <motion.button key={idx} onClick={() => handleSelect(idx)} whileTap={{ scale: 0.98 }} className={cls}>
                    <span className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center text-xs font-bold shrink-0">
                      {optionLetters[idx]}
                    </span>
                    <span>{opt}</span>
                    {confirmed && idx === q.answer && <Check size={16} className="ml-auto text-green-400" />}
                    {confirmed && idx === selected && idx !== q.answer && <X size={16} className="ml-auto text-red-400" />}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex justify-end mt-6">
          {!confirmed ? (
            <button
              onClick={handleConfirm}
              disabled={selected === null}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                background: 'rgba(168,85,247,0.15)',
                border: '1px solid rgba(168,85,247,0.3)',
                color: '#a855f7',
              }}
            >
              <Check size={14} /> {t('confirm')}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{
                background: 'rgba(0,240,255,0.15)',
                border: '1px solid rgba(0,240,255,0.3)',
                color: '#00f0ff',
              }}
            >
              {current < total - 1 ? (
                <><ArrowRight size={14} /> {t('next')}</>
              ) : (
                <><Trophy size={14} /> {t('finish')}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
