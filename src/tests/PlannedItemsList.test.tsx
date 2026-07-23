import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlannedItemsList } from '../components/planning/PlannedItemsList'
import type { FinancialItem } from '../types/finance'

function item(index: number): FinancialItem {
  return {
    id: `item-${index}`,
    title: `Item ${index}`,
    type: index % 2 === 0 ? 'income' : 'expense',
    kind: 'recurring',
    amount: index * 1_000,
    category: index % 2 === 0 ? 'Renda' : 'Casa',
    recurrence: { active: true, dayOfMonth: index, startMonth: '2026-01' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('planned items list', () => {
  it('shows items progressively instead of rendering the full history', () => {
    render(<PlannedItemsList items={Array.from({ length: 10 }, (_, index) => item(index + 1))} onCreate={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('Item 8')).toBeInTheDocument()
    expect(screen.queryByText('Item 9')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Mostrar mais/ }))
    expect(screen.getByText('Item 10')).toBeInTheDocument()
  })

  it('filters items by search and type', () => {
    render(<PlannedItemsList items={[item(1), item(2)]} onCreate={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Renda' } })
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument()
  })
})
