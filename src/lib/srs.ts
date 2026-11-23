import type { Grade, Srs } from './types'

export const DAY_MS = 86_400_000

export function newSrs(now = Date.now()): Srs {
  return { ease: 2.5, interval: 0, repetitions: 0, dueAt: now }
}

function clampEase(value: number): number {
  return Math.min(2.5, Math.max(1.3, Math.round(value * 100) / 100))
}

export function schedule(current: Srs, grade: Grade, now = Date.now()): Srs {
  const previousRepetitions = current.repetitions
  const repetitions = grade === 'again' ? 0 : previousRepetitions + 1

  let ease = current.ease
  let interval = current.interval
  let dueAt: number

  if (grade === 'again') {
    ease = clampEase(ease - 0.2)
    interval = 0
    dueAt = now + 60_000
  } else {
    if (grade === 'hard') {
      ease = clampEase(ease - 0.15)
      interval = repetitions === 1 ? 1 : Math.max(1, Math.round(interval * 1.2))
    } else if (grade === 'good') {
      interval = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(interval * ease)
    } else {
      ease = clampEase(ease + 0.15)
      interval = repetitions === 1 ? 4 : repetitions === 2 ? 10 : Math.round(interval * ease * 1.3)
    }
    dueAt = now + interval * DAY_MS
  }

  return { ease, interval, repetitions, dueAt, lastReviewedAt: now }
}

export function isDue(dueAt: number, now = Date.now()): boolean {
  return dueAt <= now
}

export function describeInterval(days: number): string {
  if (days === 0) return '1 minute'
  if (days === 1) return '1 day'
  if (days < 30) return `${days} days`
  const months = Math.round(days / 30)
  return months === 1 ? '1 month' : `${months} months`
}
