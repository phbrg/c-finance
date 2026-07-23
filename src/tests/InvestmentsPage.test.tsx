import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { InvestmentsPage } from '../pages/InvestmentsPage'
import type { FinanceData } from '../types/finance'

const data: FinanceData = {
  version: 3,
  welcomeCompleted: true,
  items: [],
  occurrenceRecords: [],
  investments: [],
}

describe('InvestmentsPage dialog', () => {
  it('opens the investment form only after the user requests it', () => {
    render(
      <InvestmentsPage
        data={data}
        onAdd={vi.fn(() => true)}
        onUpdate={vi.fn(() => true)}
        onDelete={vi.fn()}
        onImport={vi.fn(() => true)}
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar investimento' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Adicionar investimento' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
