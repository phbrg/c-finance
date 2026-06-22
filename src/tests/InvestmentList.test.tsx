import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { InvestmentList } from '../components/investments/InvestmentList'
import type { Investment } from '../types/finance'

function investment(index: number): Investment {
  return {
    id: `investment-${index}`,
    name: `Aplicação ${index}`,
    institution: index % 2 === 0 ? 'Banco Azul' : 'Banco Cinza',
    currentBalance: (11 - index) * 10_000,
    balanceDate: '2026-06-22',
    annualRateBps: 1_000,
    monthlyContribution: index * 1_000,
    contributionDay: 10,
    createdAt: '2026-06-22T12:00:00.000Z',
    updatedAt: '2026-06-22T12:00:00.000Z',
  }
}

describe('investment list', () => {
  it('loads large portfolios progressively', () => {
    render(<InvestmentList investments={Array.from({ length: 10 }, (_, index) => investment(index + 1))} onEdit={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText('Aplicação 8')).toBeInTheDocument()
    expect(screen.queryByText('Aplicação 9')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Mostrar mais/ }))
    expect(screen.getByText('Aplicação 10')).toBeInTheDocument()
  })

  it('searches by institution without changing portfolio data', () => {
    render(<InvestmentList investments={[investment(1), investment(2)]} onEdit={vi.fn()} onDelete={vi.fn()} />)

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Banco Azul' } })
    expect(screen.getByText('Aplicação 2')).toBeInTheDocument()
    expect(screen.queryByText('Aplicação 1')).not.toBeInTheDocument()
  })
})
