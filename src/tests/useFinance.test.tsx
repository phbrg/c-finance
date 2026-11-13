import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FINANCE_STORAGE_KEY } from '../services/financeStorage'
import { useFinance } from '../hooks/useFinance'

const stamp = '2026-01-01T00:00:00.000Z'
const item = (id: string, amount: number) => ({
  id, title: id, type: 'expense', kind: 'recurring', amount, category: 'Casa',
  recurrence: { dayOfMonth: 10, startMonth: '2026-01', active: true }, createdAt: stamp, updatedAt: stamp,
})

function seed() {
  window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify({
    version: 5, welcomeCompleted: true, items: [item('a', 100), item('b', 200), item('c', 300)], occurrenceRecords: [],
  }))
}

describe('useFinance called several times in a row', () => {
  it('keeps every confirmation when several are made in the same click', () => {
    seed()
    const { result } = renderHook(() => useFinance())
    act(() => {
      for (const id of ['a', 'b', 'c']) result.current.setOccurrenceStatus(`${id}:2026-11`, 'completed')
    })
    const done = result.current.data.occurrenceRecords.filter((record) => record.status === 'completed').map((record) => record.key)
    expect(done.sort()).toEqual(['a:2026-11', 'b:2026-11', 'c:2026-11'])
    const stored = JSON.parse(window.localStorage.getItem(FINANCE_STORAGE_KEY) ?? '{}')
    expect(stored.occurrenceRecords).toHaveLength(3)
  })

  it('keeps every item when several are added in a row', () => {
    seed()
    const { result } = renderHook(() => useFinance())
    const draft = { title: 'x', type: 'expense' as const, kind: 'one-time' as const, amount: 100, category: 'Casa', dueDate: '2026-11-20' }
    act(() => {
      result.current.addItem({ ...draft, title: 'um' })
      result.current.addItem({ ...draft, title: 'dois' })
    })
    expect(result.current.data.items.map((entry) => entry.title)).toEqual(expect.arrayContaining(['um', 'dois']))
    expect(result.current.data.items).toHaveLength(5)
  })

  it('adds, updates and deletes a card; deleting turns purchases into common expenses', () => {
    seed()
    const { result } = renderHook(() => useFinance())
    let ok = false
    act(() => { ok = result.current.addCard({ name: 'Nubank', dueDay: 12 }) })
    expect(ok).toBe(true)
    const [card] = result.current.data.cards
    act(() => { ok = result.current.updateCard(card.id, { name: 'Roxinho', dueDay: 12, limit: 100_000 }) })
    expect(ok).toBe(true)
    expect(result.current.data.cards[0]).toMatchObject({ name: 'Roxinho', limit: 100_000 })
    act(() => { ok = result.current.updateCard('nope', { name: 'x', dueDay: 1 }) })
    expect(ok).toBe(false)
    act(() => {
      result.current.addItem({ title: 'TV', type: 'expense', kind: 'one-time', amount: 100, category: 'Casa', dueDate: '2026-11-20', cardId: card.id })
    })
    expect(result.current.data.items.find((entry) => entry.title === 'TV')?.cardId).toBe(card.id)
    act(() => result.current.deleteCard(card.id))
    expect(result.current.data.cards).toEqual([])
    expect(result.current.data.items.find((entry) => entry.title === 'TV')).not.toHaveProperty('cardId')
  })
})
