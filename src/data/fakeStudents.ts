import type { LeaderboardEntry } from '../store/useAuthStore'

// Ko'rinish (son) uchun soxta talabalar — faqat leaderboardni to'ldirish maqsadida.
// Ma'lumotlar deterministik tarzda generatsiya qilinadi, shuning uchun har "refresh"da
// reyting o'zgarmaydi (Math.random ishlatilmagan).

const FIRST_NAMES = [
  'Aziz', 'Bekzod', 'Dilshod', 'Eldor', 'Farrux', 'Jasur', 'Kamron', 'Laziz',
  'Otabek', 'Rustam', 'Temur', 'Xurshid', 'Zafar', 'Akmal', 'Bobur', 'Elyor',
  'Husan', 'Ikrom', 'Javohir', 'Komil', 'Oybek', 'Ravshan', 'Shahzod', 'Tohir',
  'Umar', 'Vohid', 'Yorqin', 'Sardor', 'Sanjar', 'Murod', 'Nodir', 'Anvar',
  'Gulnora', 'Hilola', 'Iroda', 'Kamola', 'Madina', 'Nodira', 'Sevara', 'Umida',
  'Yulduz', 'Zarina', 'Dilnoza', 'Feruza', 'Gulbahor', 'Lola', 'Munisa', 'Nargiza',
  'Parvina', 'Shahnoza', 'Malika', 'Nilufar', 'Ozoda', 'Robiya', 'Sabina', 'Zilola',
]

const LAST_NAMES = [
  'Aliyev', 'Karimov', 'Rashidov', 'Yusupov', 'Nazarov', 'Sobirov', 'Tursunov',
  'Ergashev', 'Rahimov', 'Saidov', 'Ismoilov', 'Mirzayev', 'Abdullayev', 'Xolmatov',
  'Qosimov', 'Yo\'ldoshev', 'Hasanov', 'Umarov', 'Bekmurodov', 'Tashpulatov',
  'Sharipov', 'Mahmudov', 'Olimov', 'Tojiyev', 'Qodirov', 'Sultonov', 'Yoqubov',
  'Mamatov', 'Xudoyberdiyev', 'Toshmatov',
]

const EMOJIS = ['🎯', '🚀', '🔥', '⭐', '💡', '🎓', '🧠', '📚', '🏆', '⚡', '🌟', '💎', '🦅', '🐯', '🦊']

const GROUPS = ['101-guruh', '102-guruh', '103-guruh', '201-guruh', '202-guruh', '203-guruh', '301-guruh', '302-guruh']

// Oddiy deterministik pseudo-random (LCG) — seed orqali barqaror natija beradi.
function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 250) + 1)
}

export function generateFakeStudents(count = 108): LeaderboardEntry[] {
  const rand = seeded(987654321)
  const entries: LeaderboardEntry[] = []

  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]
    const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]
    const emoji = EMOJIS[Math.floor(rand() * EMOJIS.length)]
    const group = GROUPS[Math.floor(rand() * GROUPS.length)]

    // Yangi sayt uchun kichikroq qiymatlar — eng ko'pi ~150 XP atrofida bo'ladi.
    const totalQuizzes = Math.floor(rand() * 8) + 1  // 1-8 ta test
    const totalPractices = Math.floor(rand() * 6) + 0  // 0-5 ta amaliyot
    const totalQuizXp = totalQuizzes * (Math.floor(rand() * 12) + 3)  // har test ~3-15 XP
    const totalPracticeXp = totalPractices * (Math.floor(rand() * 10) + 2)  // har amaliyot ~2-12 XP
    const diagnosticScore = Math.floor(rand() * 8) + 2  // 2-9 ball (20-90 XP diagnostik)
    const totalXp = totalQuizXp + totalPracticeXp + diagnosticScore * 10
    const avgPercentage = Math.floor(rand() * 40) + 40  // 40-79% o'rtacha natija
    const topicsCompleted = Math.floor(rand() * 4) + 0  // 0-3 ta mavzu tugallangan

    entries.push({
      user_id: `fake-${i + 1}`,
      full_name: `${first} ${last}`,
      avatar_emoji: emoji,
      group_name: group,
      diagnostic_score: diagnosticScore,
      total_quiz_xp: totalQuizXp,
      total_quizzes: totalQuizzes,
      avg_quiz_percentage: avgPercentage,
      total_practice_xp: totalPracticeXp,
      total_practices: totalPractices,
      total_xp: totalXp,
      topics_completed: topicsCompleted,
      level: levelFromXp(totalXp),
    })
  }

  return entries
}
