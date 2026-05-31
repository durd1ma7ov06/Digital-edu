import { describe, it, expect } from 'vitest';
import { calculatePracticeXp } from './xpCalculation';

describe('calculatePracticeXp', () => {
  it('returns 0 XP for a score of 0', () => {
    expect(calculatePracticeXp(0)).toBe(0);
  });

  it('returns 50 XP for a perfect score of 100', () => {
    expect(calculatePracticeXp(100)).toBe(50);
  });

  it('returns 25 XP for a score of 50', () => {
    expect(calculatePracticeXp(50)).toBe(25);
  });

  it('correctly rounds the result', () => {
    // (33 / 100) * 50 = 16.5 → rounds to 17 (banker's rounding irrelevant here, Math.round rounds .5 up)
    expect(calculatePracticeXp(33)).toBe(17);
    // (67 / 100) * 50 = 33.5 → rounds to 34
    expect(calculatePracticeXp(67)).toBe(34);
  });

  it('produces values in [0, 50] for all valid scores', () => {
    for (let score = 0; score <= 100; score++) {
      const xp = calculatePracticeXp(score);
      expect(xp).toBeGreaterThanOrEqual(0);
      expect(xp).toBeLessThanOrEqual(50);
    }
  });
});
