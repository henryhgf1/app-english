import { addDays, format, parseISO, startOfDay, subDays } from 'date-fns'

export function dayKey(value: number | Date): string {
  return format(value, 'yyyy-MM-dd')
}

export interface Streak {
  current: number
  longest: number
  activeDays: number
}

export function computeStreak(timestamps: number[], now = Date.now()): Streak {
  const days = new Set(timestamps.map((timestamp) => dayKey(timestamp)))
  if (!days.size) return { current: 0, longest: 0, activeDays: 0 }

  let cursor = startOfDay(now)
  if (!days.has(dayKey(cursor))) cursor = subDays(cursor, 1)
  let current = 0
  while (days.has(dayKey(cursor))) {
    current++
    cursor = subDays(cursor, 1)
  }

  const sorted = [...days].sort()
  let longest = 0
  let run = 0
  let previous = ''
  for (const day of sorted) {
    run = previous && day === dayKey(addDays(parseISO(previous), 1)) ? run + 1 : 1
    longest = Math.max(longest, run)
    previous = day
  }

  return { current, longest, activeDays: days.size }
}

export interface DayCount {
  key: string
  label: string
  count: number
}

export function reviewsByDay(timestamps: number[], days: number, now = Date.now()): DayCount[] {
  const counts = new Map<string, number>()
  for (const timestamp of timestamps) {
    const key = dayKey(timestamp)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from({ length: days }, (_, index) => {
    const date = subDays(startOfDay(now), days - 1 - index)
    const key = dayKey(date)
    return { key, label: format(date, 'd'), count: counts.get(key) ?? 0 }
  })
}

export function accuracy(timestamps: { grade: string }[]): number {
  if (!timestamps.length) return 0
  const confident = timestamps.filter((log) => log.grade === 'good' || log.grade === 'easy').length
  return Math.round((confident / timestamps.length) * 100)
}
