import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlanningPage } from '../pages/PlanningPage'
import type { FinanceData } from '../types/finance'

const data: FinanceData = {
  version: 3,
  welcomeCompleted: true,
  occurrenceRecords: [],
  investments: [],
  items: [
    {
      id: 'rent',
      title: 'Aluguel',
      type: 'expense',
      kind: 'recurring',
      amount: 180_000,
      category: 'Moradia',
      recurrence: { active: true, dayOfMonth: 10, startMonth: '2026-01' },
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-01T12:00:00.000Z',
    },
  ],
}

function renderPage() {
  render(
    <PlanningPage
      data={data}
      onAdd={vi.fn(() => true)}
      onUpdate={vi.fn(() => true)}
      onDelete={vi.fn()}
      onImport={vi.fn(() => true)}
    />,
  )
}

describe('PlanningPage item dialog', () => {
  it('keeps the form hidden until the user starts a new item', () => {
    renderPage()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar nova transação' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Adicionar ao planejamento' })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the same dialog with the selected item in edit mode', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Editar Aluguel' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Aluguel' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Aluguel')).toBeInTheDocument()
  })
})
