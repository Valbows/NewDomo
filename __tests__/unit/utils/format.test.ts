// Simple utility functions for testing
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function formatScore(score: number): string {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'fair'
  return 'poor'
}

describe('Format Utilities', () => {
  describe('formatDuration', () => {
    it('formats seconds only', () => {
      expect(formatDuration(30)).toBe('30s')
    })

    it('formats minutes and seconds', () => {
      expect(formatDuration(90)).toBe('1m 30s')
    })

    it('formats hours, minutes, and seconds', () => {
      expect(formatDuration(3665)).toBe('1h 1m 5s')
    })

    it('handles zero duration', () => {
      expect(formatDuration(0)).toBe('0s')
    })
  })

  describe('formatPercentage', () => {
    it('formats decimal to percentage', () => {
      expect(formatPercentage(0.75)).toBe('75%')
    })

    it('rounds to nearest integer', () => {
      expect(formatPercentage(0.856)).toBe('86%')
    })

    it('handles zero', () => {
      expect(formatPercentage(0)).toBe('0%')
    })

    it('handles one', () => {
      expect(formatPercentage(1)).toBe('100%')
    })
  })

  describe('formatScore', () => {
    it('returns excellent for high scores', () => {
      expect(formatScore(90)).toBe('excellent')
      expect(formatScore(85)).toBe('excellent')
    })

    it('returns good for medium-high scores', () => {
      expect(formatScore(80)).toBe('good')
      expect(formatScore(70)).toBe('good')
    })

    it('returns fair for medium scores', () => {
      expect(formatScore(60)).toBe('fair')
      expect(formatScore(50)).toBe('fair')
    })

    it('returns poor for low scores', () => {
      expect(formatScore(40)).toBe('poor')
      expect(formatScore(0)).toBe('poor')
    })
  })
})