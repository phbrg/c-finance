import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlanningPage } from '../pages/PlanningPage'
import type { FinanceData } from '../types/finance'

const data: FinanceData = {
  version: 5,
  welcomeCompleted: true,
  occurrenceRecords: [],
  cards: [],
  items: [
    {
      id: 'rent',
      title: 'Aluguel',
      type: 'expense',
      kind: 'recurring',
      amount: 180_000,
      amountChanges: [{ from: '2026-03', amount: 200_000 }],
      category: 'Moradia',
      recurrence: { active: true, dayOfMonth: 10, startMonth: '2026-01' },
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-01T12:00:00.000Z',
    },
  ],
}

function renderPage(onUpdate = vi.fn(() => true), pageData = data) {
  render(<PlanningPage data={pageData} month="2026-06" onAdd={vi.fn(() => true)} onUpdate={onUpdate} onDelete={vi.fn()} />)
  return onUpdate
}

describe('PlanningPage', () => {
  it('names the month in the summary', () => {
    renderPage()
    expect(screen.getByText('Em junho de 2026')).toBeInTheDocument()
    expect(screen.getAllByText(/2\.000,00/).length).toBeGreaterThan(0)
  })

  it('shows a short empty state without onboarding banner', () => {
    renderPage(undefined, { ...data, items: [] })
    expect(screen.getByText('Nada planejado ainda.')).toBeInTheDocument()
    expect(screen.queryByText(/Bem-vindo/)).not.toBeInTheDocument()
  })

  it('keeps the form hidden until the user starts a new item', () => {
    renderPage()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Novo item' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the selected item in edit mode and lists its value history', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Editar Aluguel' }))
    expect(screen.getByRole('heading', { name: 'Aluguel' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Histórico de valores' })).toHaveTextContent('A partir de março de 2026')
  })

  it('asks from which month a changed recurring amount applies and passes amountFrom', () => {
    const onUpdate = renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Editar Aluguel' }))
    fireEvent.change(screen.getByLabelText('Valor (R$)'), { target: { value: '2100,00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onUpdate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar a partir de junho de 2026' }))
    expect(onUpdate).toHaveBeenCalledWith('rent', expect.objectContaining({ amount: 210_000 }), { amountFrom: '2026-06' })
  })

  it('changes every month when asked', () => {
    const onUpdate = renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Editar Aluguel' }))
    fireEvent.change(screen.getByLabelText('Valor (R$)'), { target: { value: '2100,00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Alterar todos os meses' }))
    expect(onUpdate).toHaveBeenCalledWith('rent', expect.objectContaining({ amount: 210_000 }), undefined)
  })

  it('does not ask when the amount is unchanged and keeps the stored base value', () => {
    const onUpdate = renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Editar Aluguel' }))
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Aluguel novo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onUpdate).toHaveBeenCalledWith('rent', expect.objectContaining({ title: 'Aluguel novo', amount: 180_000 }), undefined)
  })
})
