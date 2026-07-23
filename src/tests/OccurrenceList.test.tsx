import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { OccurrenceList } from '../components/transactions/OccurrenceList'
import type { FinancialOccurrence } from '../types/finance'

const occurrence: FinancialOccurrence = {
  key: 'rent:2026-06-10',
  itemId: 'rent',
  title: 'Aluguel',
  type: 'expense',
  kind: 'recurring',
  amount: 180_000,
  category: 'Moradia',
  dueDate: '2026-06-10',
  status: 'planned',
}

describe('occurrence list', () => {
  it('offers a direct action to confirm a pending occurrence', () => {
    const onStatusChange = vi.fn()
    render(<OccurrenceList occurrences={[occurrence]} onStatusChange={onStatusChange} />)

    expect(screen.getByText('Gasto')).toBeInTheDocument()
    expect(screen.getByText('Moradia')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Aluguel' }))
    expect(onStatusChange).toHaveBeenCalledWith(occurrence.key, 'completed')
  })

  it('shows the contextual empty state', () => {
    render(<OccurrenceList occurrences={[]} onStatusChange={vi.fn()} emptyTitle="Nada por aqui" emptyDescription="Altere os filtros" />)

    expect(screen.getByText('Nada por aqui')).toBeInTheDocument()
    expect(screen.getByText('Altere os filtros')).toBeInTheDocument()
  })
})
