import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FinancialItemForm } from '../components/planning/FinancialItemForm'
import type { FinancialItem } from '../types/finance'

describe('FinancialItemForm', () => {
  it('keeps the last submitted financial type selected', () => {
    const onSubmit = vi.fn(() => true)
    render(<FinancialItemForm onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Ganho' }))
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Salary' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Valor R$' }), { target: { value: '5000,00' } })
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'Income' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Ganho' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('loads an existing item and submits its edited values', () => {
    const item: FinancialItem = {
      id: 'rent',
      title: 'Rent',
      type: 'expense',
      kind: 'recurring',
      amount: 180_000,
      category: 'Home',
      recurrence: { dayOfMonth: 10, startMonth: '2026-01', endMonth: '2026-12', active: true },
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-01T12:00:00.000Z',
    }
    const onSubmit = vi.fn(() => true)
    render(<FinancialItemForm editingItem={item} onSubmit={onSubmit} onCancel={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Rent' })).toBeInTheDocument()
    expect(screen.getByLabelText('Termina em opcional')).toHaveValue('2026-12')
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'New rent' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Valor R$' }), { target: { value: '1900,00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      title: 'New rent',
      amount: 190_000,
      dayOfMonth: 10,
      endMonth: '2026-12',
    }))
  })
})
