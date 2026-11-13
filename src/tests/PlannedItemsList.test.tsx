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

const noop = { onCreate: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() }
const pastOneTime: FinancialItem = { ...item(1), id: 'old', title: 'Conserto', kind: 'one-time', recurrence: undefined, dueDate: '2020-01-10' }

describe('planned items list', () => {
  it('shows items progressively instead of rendering the full history', () => {
    render(<PlannedItemsList items={Array.from({ length: 20 }, (_, index) => item(index + 1))} {...noop} />)
    expect(screen.getByText('Item 18')).toBeInTheDocument()
    expect(screen.queryByText('Item 19')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Mostrar mais/ }))
    expect(screen.getByText('Item 20')).toBeInTheDocument()
  })

  it('filters items by search', () => {
    render(<PlannedItemsList items={[item(1), item(2)]} {...noop} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Renda' } })
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument()
  })

  it('keeps a past one-time item in Vigentes while its occurrence is pending', () => {
    const { rerender } = render(<PlannedItemsList items={[pastOneTime]} records={[]} {...noop} />)
    expect(screen.getByText('Conserto')).toBeInTheDocument()
    rerender(<PlannedItemsList items={[pastOneTime]} records={[{ key: 'old:2020-01', status: 'completed' }]} {...noop} />)
    expect(screen.queryByText('Conserto')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Encerrados/ }))
    expect(screen.getByText('Conserto')).toBeInTheDocument()
  })

  it('shows installments of a purchase and how many are left', () => {
    const purchase: FinancialItem = { ...item(1), title: 'Geladeira', kind: 'one-time', recurrence: undefined, dueDate: '2999-01-10', amount: 300_000, installments: 3 }
    render(<PlannedItemsList items={[purchase]} {...noop} />)
    expect(screen.getByText(/faltam 3/)).toBeInTheDocument()
    expect(screen.getByText(/^3x de/)).toHaveTextContent(/1\.000,00/)
  })

  it('warns that confirmed entries disappear on delete', () => {
    const onDelete = vi.fn()
    render(<PlannedItemsList items={[item(1)]} {...noop} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Item 1' }))
    expect(screen.getByText(/lançamentos já confirmados dele também somem/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onDelete).toHaveBeenCalledWith('item-1')
  })

  it('shows the card badge on an expense paid with a card', () => {
    const cards = [{ id: 'c1', name: 'Nubank', closingDay: 5, dueDay: 12, createdAt: '', updatedAt: '' }]
    render(<PlannedItemsList items={[{ ...item(1), cardId: 'c1' }, item(3)]} cards={cards} {...noop} />)
    expect(screen.getAllByText('Nubank')).toHaveLength(1)
  })
})
