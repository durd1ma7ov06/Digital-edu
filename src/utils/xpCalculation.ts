/**
 * Calculates XP earned from a practice submission score.
 * Formula: Math.round((score / 100) * 50)
 * Produces a value in [0, 50] for valid scores in [0, 100].
 *
 * @param score - The grading score (0-100)
 * @returns The XP earned (0-50)
 */
export function calculatePracticeXp(score: number): number {
  return Math.round((score / 100) * 50);
}
