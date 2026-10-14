export function sanitizeEmoji(emoji?: string | null, fallback = '🎓'): string {
  if (!emoji || typeof emoji !== 'string') return fallback
  const clean = emoji.trim()
  // Mojibake detection: Cyrillic letters (like рџ) or unicode replacement character 
  if (/[\u0400-\u04FF]/.test(clean) || clean.includes('') || clean.length > 5) {
    return fallback
  }
  return clean || fallback
}

export function getRoleEmoji(role?: string, emoji?: string | null): string {
  if (role === 'admin') return '👑'
  if (role === 'teacher') return '👨‍🏫'
  return sanitizeEmoji(emoji, '🎓')
}
