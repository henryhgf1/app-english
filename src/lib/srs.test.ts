import { describe, expect, it } from 'vitest'
import { DAY_MS, describeInterval, newSrs, schedule } from './srs'

const NOW = 1_700_000_000_000

describe('SM-2 scheduling', () => {
  it('starts a new card as due immediately', () => {
    const srs = newSrs(NOW)
    expect(srs).toEqual({ ease: 2.5, interval: 0, repetitions: 0, dueAt: NOW })
  })

  it('schedules 1 day, then 6 days, then multiplies by ease', () => {
    const first = schedule(newSrs(NOW), 'good', NOW)
    expect(first.interval).toBe(1)
    expect(first.dueAt).toBe(NOW + DAY_MS)

    const second = schedule(first, 'good', NOW + DAY_MS)
    expect(second.interval).toBe(6)

    const third = schedule(second, 'good', NOW + 7 * DAY_MS)
    expect(third.interval).toBe(15)
  })

  it('resets the card after "again" and brings it back in one minute', () => {
    const reviewed = schedule({ ...newSrs(NOW), repetitions: 4, interval: 30 }, 'again', NOW)
    expect(reviewed.repetitions).toBe(0)
    expect(reviewed.interval).toBe(0)
    expect(reviewed.dueAt).toBe(NOW + 60_000)
    expect(reviewed.ease).toBe(2.3)
  })

  it('lowers ease on hard and raises it on easy, keeping it between 1.3 and 2.5', () => {
    const hard = schedule(newSrs(NOW), 'hard', NOW)
    expect(hard.ease).toBe(2.35)

    const easy = schedule(newSrs(NOW), 'easy', NOW)
    expect(easy.ease).toBe(2.5)
    expect(easy.interval).toBe(4)

    const floor = schedule({ ease: 1.3, interval: 10, repetitions: 3, dueAt: NOW }, 'hard', NOW)
    expect(floor.ease).toBe(1.3)
  })

  it('describes intervals in a human friendly way', () => {
    expect(describeInterval(0)).toBe('1 minute')
    expect(describeInterval(1)).toBe('1 day')
    expect(describeInterval(12)).toBe('12 days')
    expect(describeInterval(60)).toBe('2 months')
  })
})
