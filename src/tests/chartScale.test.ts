import { describe, expect, it } from 'vitest'
import { compactMoney, niceTicks } from '../utils/chartScale'

describe('chart scale', () => {
  it('builds round ticks that include zero and cover the data', () => {
    expect(niceTicks(0, 1000, 4)).toEqual([0, 500, 1000])
    const ticks = niceTicks(-300, 1200, 4)
    expect(ticks).toContain(0)
    expect(ticks[0]).toBeLessThanOrEqual(-300)
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(1200)
  })

  it('handles flat data', () => {
    expect(niceTicks(0, 0)).toEqual([0])
    expect(niceTicks(850_000, 850_000, 2, false)).toEqual([850_000])
  })

  it('does not force a zero on a balance that stays far from it', () => {
    // The Dia a dia balance sits around R$ 8 to 9 mil: its axis must not drag a "R$ 0" in.
    const ticks = niceTicks(800_000, 900_000, 2, false)
    expect(ticks).not.toContain(0)
    expect(ticks[0]).toBeLessThanOrEqual(800_000)
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(900_000)
    expect(niceTicks(-100_000, 500_000, 2, false)).toContain(0) // still shows zero when the data crosses it
  })

  it('never labels two neighbouring ticks the same', () => {
    const labels = niceTicks(805_000, 815_000, 2, false).map(compactMoney)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('shortens money labels', () => {
    expect(compactMoney(1_500_000)).toBe('R$ 15 mil')
    expect(compactMoney(150_000)).toBe('R$ 1,5 mil')
    expect(compactMoney(805_000)).toBe('R$ 8,05 mil')
    expect(compactMoney(12_345)).toBe('R$ 123')
    expect(compactMoney(-250_000)).toBe('-R$ 2,5 mil')
    expect(compactMoney(250_000_000)).toBe('R$ 2,5 mi')
  })
})
