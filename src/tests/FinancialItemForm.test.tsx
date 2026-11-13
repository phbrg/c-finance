import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FinancialItemForm } from '../components/planning/FinancialItemForm'

function fill(title: string, amount: string, category: string) {
  fireEvent.change(screen.getByLabelText('Título'), { target: { value: title } })
  fireEvent.change(screen.getByLabelText(/^Valor/), { target: { value: amount } })
  fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: category } })
}

describe('FinancialItemForm', () => {
  it('keeps the last submitted type selected', () => {
    const onSubmit = vi.fn(() => true)
    render(<FinancialItemForm onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ganho' }))
    fill('Salário', '5000,00', 'Renda')
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Ganho' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('suggests existing categories', () => {
    const { container } = render(<FinancialItemForm onSubmit={vi.fn()} categorySuggestions={['Moradia', 'Mercado']} />)
    expect([...container.querySelectorAll('datalist option')].map((option) => option.getAttribute('value'))).toEqual(['Moradia', 'Mercado'])
  })

  it('splits a one-time expense into installments of the total', () => {
    const onSubmit = vi.fn(() => true)
    render(<FinancialItemForm onSubmit={onSubmit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Uma vez' }))
    fill('Geladeira', '3000,00', 'Casa')
    fireEvent.change(screen.getByLabelText(/^Parcelas/), { target: { value: '3' } })

    expect(screen.getByLabelText(/^Valor total/)).toBeInTheDocument()
    expect(screen.getByText(/3x de/)).toHaveTextContent(/1\.000,00/)
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 300_000, installments: 3, kind: 'one-time' }), undefined)
  })

  it('offers installments only for one-time expenses', () => {
    render(<FinancialItemForm onSubmit={vi.fn()} />)
    expect(screen.queryByLabelText(/^Parcelas/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Uma vez' }))
    expect(screen.getByLabelText(/^Parcelas/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ganho' }))
    expect(screen.queryByLabelText(/^Parcelas/)).not.toBeInTheDocument()
  })

  it('lets an expense be paid with a card, and keeps installments', () => {
    const onSubmit = vi.fn(() => true)
    const cards = [{ id: 'c1', name: 'Nubank', closingDay: 5, dueDay: 12, createdAt: '', updatedAt: '' }]
    render(<FinancialItemForm onSubmit={onSubmit} cards={cards} />)
    fireEvent.click(screen.getByRole('button', { name: 'Uma vez' }))
    fill('TV', '2000,00', 'Casa')
    fireEvent.change(screen.getByLabelText('Pago com'), { target: { value: 'c1' } })
    fireEvent.change(screen.getByLabelText(/^Parcelas/), { target: { value: '4' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ cardId: 'c1', installments: 4 }), undefined)
  })

  it('hides Pago com without cards or for income', () => {
    const cards = [{ id: 'c1', name: 'Nubank', closingDay: 5, dueDay: 12, createdAt: '', updatedAt: '' }]
    const { unmount } = render(<FinancialItemForm onSubmit={vi.fn()} />)
    expect(screen.queryByLabelText('Pago com')).not.toBeInTheDocument()
    unmount()
    render(<FinancialItemForm onSubmit={vi.fn()} cards={cards} />)
    expect(screen.getByLabelText('Pago com')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ganho' }))
    expect(screen.queryByLabelText('Pago com')).not.toBeInTheDocument()
  })
})
