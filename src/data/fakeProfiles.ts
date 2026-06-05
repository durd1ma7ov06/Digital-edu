import type { Profile } from '../store/useAuthStore'

// Teacher Panel uchun soxta talabalar — faqat ko'rinish maqsadida.
// Bu profillar profiles jadvaliga yozilmaydi, faqat UI'da ko'rinadi.

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

// Oddiy deterministik pseudo-random (LCG)
function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function generateFakeProfiles(count = 108): Profile[] {
  const rand = seeded(123456789)
  const profiles: Profile[] = []
  const now = new Date().toISOString()

  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]
    const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]
    const emoji = EMOJIS[Math.floor(rand() * EMOJIS.length)]
    const group = GROUPS[Math.floor(rand() * GROUPS.length)]
    const fullName = `${first} ${last}`
    const username = `${first.toLowerCase()}${Math.floor(rand() * 999) + 1}`

    profiles.push({
      id: `fake-profile-${i + 1}`,
      username,
      full_name: fullName,
      avatar_emoji: emoji,
      group_name: group,
      role: 'student',
      diagnostic_completed: rand() > 0.3, // 70% diagnostik topshirgan
      diagnostic_score: Math.floor(rand() * 18) + 7, // 7-24 ball
      diagnostic_total: 25,
      diagnostic_completed_at: rand() > 0.3 ? now : null,
      created_at: now,
      updated_at: now,
    })
  }

  return profiles
}
