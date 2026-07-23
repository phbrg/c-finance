import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CalculatorPage } from '../pages/CalculatorPage'
import type { FinanceData, FinancialOccurrence } from '../types/finance'

const data: FinanceData = {
  version: 3,
  welcomeCompleted: true,
  items: [],
  occurrenceRecords: [],
  investments: [],
}

const salary: FinancialOccurrence = {
  key: 'salary:2026-07-05',
  itemId: 'salary',
  title: 'Salário',
  type: 'income',
  kind: 'recurring',
  amount: 500_000,
  category: 'Renda',
  dueDate: '2026-07-05',
  status: 'planned',
}

describe('CalculatorPage', () => {
  it('keeps the scenario temporary until the user explicitly adds it', () => {
    const onAdd = vi.fn(() => true)
    render(
      <CalculatorPage
        data={data}
        occurrencesForMonth={() => [salary]}
        onAdd={onAdd}
        onImport={vi.fn(() => true)}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Informe um valor para começar' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: 'Valor R$' }), { target: { value: '1000,00' } })

    expect(screen.getByRole('heading', { name: 'Onde o cenário muda seu saldo' })).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao planejamento' }))
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Nova simulação',
      type: 'expense',
      kind: 'one-time',
      amount: 100_000,
      category: 'Outros',
    }))
    expect(screen.getByRole('button', { name: 'Adicionada ao planejamento' })).toBeDisabled()
  })

  it('officializes a monthly scenario with an optional ending month', () => {
    const onAdd = vi.fn(() => true)
    render(
      <CalculatorPage
        data={data}
        occurrencesForMonth={() => [salary]}
        onAdd={onAdd}
        onImport={vi.fn(() => true)}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Todo mês' }))
    fireEvent.change(screen.getByLabelText('Começa em'), { target: { value: '2026-08' } })
    fireEvent.change(screen.getByLabelText(/Termina em/), { target: { value: '2026-10' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Valor R$' }), { target: { value: '250,00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar ao planejamento' }))

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      kind: 'recurring',
      amount: 25_000,
      startMonth: '2026-08',
      endMonth: '2026-10',
    }))
  })
})
