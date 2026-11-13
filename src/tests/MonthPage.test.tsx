import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MonthPage } from '../pages/MonthPage'
import type { FinanceData, FinancialItem } from '../types/finance'

const now = '2026-10-01T12:00:00.000Z'
const recurring = (id: string, title: string, type: 'income' | 'expense', amount: number, category: string, day: number): FinancialItem => ({
  id, title, type, kind: 'recurring', amount, category, recurrence: { dayOfMonth: day, startMonth: '2026-01', active: true }, createdAt: now, updatedAt: now,
})

const data: FinanceData = {
  version: 5,
  welcomeCompleted: true,
  openingBalance: { amount: 100_000, month: '2026-10' },
  items: [
    recurring('salario', 'Salário', 'income', 500_000, 'Trabalho', 5),
    recurring('aluguel', 'Aluguel', 'expense', 150_000, 'Moradia', 10),
    recurring('mercado', 'Mercado', 'expense', 80_000, 'Mercado', 15),
    recurring('netflix', 'Netflix', 'expense', 5_000, 'Nubank', 1),
    { id: 'tv', title: 'TV', type: 'expense', kind: 'one-time', amount: 30_000, installments: 3, category: 'Nubank', dueDate: '2026-10-20', createdAt: now, updatedAt: now },
    // On the card (paid on the 12th): October gets the shoes, November 1/2 and the dinner, December 2/2.
    { id: 'sapato', title: 'Sapato', type: 'expense', kind: 'one-time', amount: 25_000, category: 'Roupa', cardId: 'c1', dueDate: '2026-10-20', createdAt: now, updatedAt: now },
    { id: 'celular', title: 'Celular', type: 'expense', kind: 'one-time', amount: 120_000, installments: 2, category: 'Tecnologia', cardId: 'c1', dueDate: '2026-11-03', createdAt: now, updatedAt: now },
    { id: 'jantar', title: 'Jantar', type: 'expense', kind: 'one-time', amount: 18_000, category: 'Restaurante', cardId: 'c1', dueDate: '2026-11-09', createdAt: now, updatedAt: now },
  ],
  cards: [{ id: 'c1', name: 'Nubank', dueDay: 12, limit: 800_000, createdAt: now, updatedAt: now }],
  occurrenceRecords: [],
}

const setup = () => {
  const onStatusChange = vi.fn()
  const onAddItem = vi.fn(() => true)
  const onMonthChange = vi.fn()
  render(<MonthPage data={data} month="2026-11" onMonthChange={onMonthChange} onStatusChange={onStatusChange} onAddItem={onAddItem} />)
  return { onStatusChange, onAddItem, onMonthChange }
}
const flat = (text: string | null) => (text ?? '').replace(/\s+/g, ' ')
const cents = (text: string | null) => Number(flat(text).replace(/\D/g, ''))
const labels = (scope: HTMLElement) => within(scope).getAllByRole('checkbox').map((box) => box.getAttribute('aria-label'))
const toggle = () => screen.getByRole('button', { name: 'Fatura Nubank' })
const purchases = () => screen.getByRole('list', { name: 'Compras da Fatura Nubank' })
const invoiceRow = () => screen.getByRole('checkbox', { name: 'Selecionar Fatura Nubank' }).closest('li')!

describe('MonthPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-12T12:00:00'))
  })
  afterEach(() => vi.useRealTimers())

  it('sums the selected rows', () => {
    setup()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar Salário' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar Aluguel' }))
    const text = flat(screen.getByRole('region', { name: 'Soma da seleção' }).textContent)
    expect(text).toContain('2 selecionados')
    expect(text).toContain('Entradas R$ 5.000,00')
    expect(text).toContain('Saídas R$ 1.500,00')
    expect(text).toContain('Total líquido + R$ 3.500,00')
  })

  it('shows which installment lands in the month', () => {
    setup()
    expect(screen.getByTitle('Parcela 2 de 3')).toHaveTextContent('2/3')
  })

  it('filters by type and search', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Saídas' }))
    expect(screen.queryByText('Salário')).not.toBeInTheDocument()
    expect(screen.getByText('Aluguel')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'netflix' } })
    expect(screen.queryByText('Aluguel')).not.toBeInTheDocument()
    expect(screen.getByText('1 movimento')).toBeInTheDocument()
  })

  it('confirms with one click, with the real amount and date, and in bulk', () => {
    const { onStatusChange } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Mercado' }))
    expect(onStatusChange).toHaveBeenLastCalledWith('mercado:2026-11', 'completed')

    fireEvent.click(screen.getByRole('button', { name: 'Mais opções de Aluguel' }))
    fireEvent.change(screen.getByLabelText('Valor real'), { target: { value: '1450,90' } })
    fireEvent.change(screen.getByLabelText('Data real'), { target: { value: '2026-11-11' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onStatusChange).toHaveBeenLastCalledWith('aluguel:2026-11', 'completed', { amount: 145_090, paidDate: '2026-11-11' })

    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar Salário' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selecionar TV' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar selecionados' }))
    expect(onStatusChange).toHaveBeenCalledWith('salario:2026-11', 'completed')
    expect(onStatusChange).toHaveBeenCalledWith('tv:2026-11', 'completed')
  })

  it('filtering a category shows its total on top and per month in the chart', () => {
    setup()
    expect(screen.queryByRole('list', { name: /Total por mês/ })).not.toBeInTheDocument()
    fireEvent.click(within(screen.getByRole('list', { name: 'Gastos por categoria' })).getByRole('button', { name: /Nubank/ }))
    expect(screen.queryByText('Aluguel')).not.toBeInTheDocument()
    expect(flat(document.querySelector('.month-category-total')!.textContent)).toBe('Nubank em novembro: R$ 150,00 · 2 lançamentos')

    const chart = screen.getByRole('list', { name: 'Total por mês em Nubank' })
    expect(within(chart).getAllByRole('button')).toHaveLength(9)
    expect(within(chart).getByRole('button', { name: /^Novembro de 2026: R\$\s150,00$/ })).toHaveAttribute('aria-pressed', 'true')
    expect(within(chart).getByRole('button', { name: /^Dezembro de 2026: R\$\s150,00$/ })).toBeInTheDocument()
    expect(within(chart).getByRole('button', { name: /^Janeiro de 2027: R\$\s50,00$/ })).toBeInTheDocument()
  })

  it('simulates a purchase and registers it', () => {
    const { onAddItem } = setup()
    fireEvent.click(screen.getByText('Posso gastar?'))
    const form = within(screen.getByRole('form', { name: 'Simular compra' }))

    fireEvent.change(form.getByLabelText('Valor total'), { target: { value: '3000' } })
    fireEvent.change(form.getByLabelText('Parcelas'), { target: { value: '3' } })
    expect(form.getByText(/^Cabe\. O mês mais apertado é/)).toBeInTheDocument()
    expect(form.getByText(/^3x de R\$\s1\.000,00$/)).toBeInTheDocument()

    fireEvent.change(form.getByLabelText('Valor total'), { target: { value: '100000' } })
    expect(form.getByText(/^Não cabe: deixa novembro negativo em/)).toBeInTheDocument()

    fireEvent.change(form.getByLabelText('Valor total'), { target: { value: '3000' } })
    fireEvent.change(form.getByLabelText('Categoria'), { target: { value: 'Nubank' } })
    fireEvent.change(form.getByLabelText('O que é'), { target: { value: 'Geladeira' } })
    fireEvent.click(form.getByRole('button', { name: 'Registrar essa compra' }))
    expect(onAddItem).toHaveBeenCalledWith({
      title: 'Geladeira', type: 'expense', kind: 'one-time', amount: 300_000, category: 'Nubank', dueDate: '2026-11-12', installments: 3,
    })
  })

  it('turns the invoice row into the dropdown of the month purchases, with nothing repeated', () => {
    const { onStatusChange } = setup()
    const cash = within(screen.getByRole('region', { name: 'Entradas e saídas' }))
    expect(cash.getAllByRole('checkbox', { name: 'Selecionar Fatura Nubank' })).toHaveLength(1)
    expect(screen.queryByRole('region', { name: 'Cartão Nubank' })).not.toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Próxima fatura|fecha|No cartão/)
    expect(flat(invoiceRow().textContent)).toContain('2 compras')
    expect(screen.getAllByText((_, node) => node?.classList.contains('mv-amount') === true && flat(node.textContent) === '− R$ 780,00')).toHaveLength(1)

    // Closed by default: the purchases only exist inside it.
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('checkbox', { name: 'Selecionar Jantar' })).not.toBeInTheDocument()
    fireEvent.click(toggle())
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    expect(purchases()).toHaveAttribute('id', toggle().getAttribute('aria-controls'))
    expect(invoiceRow()).toContainElement(purchases())
    expect(labels(purchases())).toEqual(['Selecionar Celular', 'Selecionar Jantar'])
    expect(within(purchases()).getByTitle('Parcela 1 de 2')).toHaveTextContent('1/2')

    fireEvent.click(within(invoiceRow()).getByRole('button', { name: 'Confirmar Fatura Nubank' }))
    expect(onStatusChange).toHaveBeenLastCalledWith('card:c1:2026-11', 'completed')
  })

  it('lists only purchases of the open month, each with its date, adding up to the invoice', () => {
    for (const [month, rows, total] of [
      ['2026-10', ['20 ter Sapato'], 25_000],
      ['2026-11', ['03 ter Celular', '09 seg Jantar'], 78_000],
      ['2026-12', ['03 qui Celular'], 60_000],
    ] as const) {
      const view = render(<MonthPage data={data} month={month} onMonthChange={vi.fn()} onStatusChange={vi.fn()} onAddItem={vi.fn(() => true)} />)
      fireEvent.click(toggle())
      const items = within(purchases()).getAllByRole('listitem')
      expect(items.map((row) => `${[...row.querySelector('time')!.children].map((part) => part.textContent).join(' ')} ${row.querySelector('.mv-name')!.textContent}`)).toEqual(rows)
      for (const row of items) expect(row.querySelector('time')!.getAttribute('dateTime')!.slice(0, 7)).toBe(month)
      expect(items.reduce((sum, row) => sum + cents(row.querySelector('.mv-amount')!.textContent), 0)).toBe(total)
      expect(cents(invoiceRow().querySelector(':scope > .mv-line .mv-amount')!.textContent)).toBe(total)
      expect(invoiceRow().querySelector('time')!.getAttribute('dateTime')).toBe(`${month}-12`)
      // Purchases are settled by the invoice: nothing to confirm.
      expect(within(purchases()).queryByRole('button')).not.toBeInTheDocument()
      view.unmount()
    }
  })

  it('shows the day on every row of the cash list, even on the same day', () => {
    const sameDay = { ...data, items: [...data.items, recurring('gas', 'Gás', 'expense', 9_000, 'Moradia', 10)] }
    render(<MonthPage data={sameDay} month="2026-11" onMonthChange={vi.fn()} onStatusChange={vi.fn()} onAddItem={vi.fn(() => true)} />)
    for (const title of ['Aluguel', 'Gás']) {
      const row = screen.getByRole('checkbox', { name: `Selecionar ${title}` }).closest('li')!
      expect(row.querySelector('time b')).toHaveTextContent('10')
    }
  })

  it('sums purchases without counting an invoice and its own purchases twice', () => {
    setup()
    fireEvent.click(toggle())
    within(purchases()).getAllByRole('checkbox').forEach((box) => fireEvent.click(box))
    const sum = () => flat(screen.getByRole('region', { name: 'Soma da seleção' }).textContent)
    expect(sum()).toContain('2 selecionados')
    expect(sum()).toContain('Saídas R$ 780,00')
    expect(screen.getByRole('button', { name: 'Confirmar selecionados' })).toBeDisabled()

    const invoice = screen.getByRole('checkbox', { name: 'Selecionar Fatura Nubank' })
    const line = within(purchases()).getByRole('checkbox', { name: 'Selecionar Jantar' })
    fireEvent.click(invoice)
    expect(line).not.toBeChecked()
    expect(sum()).toContain('1 selecionado')
    expect(sum()).toContain('Saídas R$ 780,00')
    fireEvent.click(line)
    expect(invoice).not.toBeChecked()
    expect(sum()).toContain('Saídas R$ 180,00')

    // Select all takes the invoice, not the purchases inside it.
    fireEvent.click(screen.getByRole('button', { name: 'Limpar' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Selecionar todos/ }))
    expect(line).not.toBeChecked()
    expect(sum()).toContain('Saídas R$ 3.230,00')
  })

  it('pays the invoice on its payment day with the amount really paid', () => {
    const { onStatusChange } = setup()
    expect(flat(invoiceRow().textContent)).toContain('R$ 780,00')
    fireEvent.click(within(invoiceRow()).getByRole('button', { name: 'Mais opções de Fatura Nubank' }))
    fireEvent.change(within(invoiceRow()).getByLabelText('Valor pago'), { target: { value: '770' } })
    fireEvent.click(within(invoiceRow()).getByRole('button', { name: 'Confirmar' }))
    expect(onStatusChange).toHaveBeenLastCalledWith('card:c1:2026-11', 'completed', { amount: 77_000, paidDate: '2026-11-12' })
  })

  it('shows the undo button on a paid invoice', () => {
    const onStatusChange = vi.fn()
    const paid = { ...data, occurrenceRecords: [{ key: 'card:c1:2026-11', status: 'completed' as const }] }
    render(<MonthPage data={paid} month="2026-11" onMonthChange={vi.fn()} onStatusChange={onStatusChange} onAddItem={vi.fn(() => true)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer pagamento de Fatura Nubank' }))
    expect(onStatusChange).toHaveBeenLastCalledWith('card:c1:2026-11', 'planned')
  })

  it('filtering a card opens its invoice and shows the essentials of the month', () => {
    setup()
    expect(screen.queryByRole('region', { name: 'Fatura do Nubank' })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Cartão'), { target: { value: 'c1' } })

    expect(screen.queryByRole('checkbox', { name: 'Selecionar Aluguel' })).not.toBeInTheDocument()
    expect(screen.getByText('3 movimentos')).toBeInTheDocument()
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    expect(labels(purchases())).toEqual(['Selecionar Celular', 'Selecionar Jantar'])
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'jantar' } })
    expect(labels(purchases())).toEqual(['Selecionar Jantar'])
    expect(flat(invoiceRow().textContent)).toContain('1 de 2 compras · R$ 180,00')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '' } })

    const panel = screen.getByRole('region', { name: 'Fatura do Nubank' })
    expect(flat(panel.textContent)).toContain('paga dia 12')
    expect(flat(within(panel).getByText('Fatura de novembro').parentElement!.textContent)).toContain('R$ 780,00')
    expect(flat(panel.textContent)).toContain('R$ 1.380,00')
    expect(within(panel).getByRole('meter', { name: 'Limite usado' })).toBeInTheDocument()
    expect(within(panel).queryByRole('list')).not.toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Próxima|aberta|fecha/)

    const months = screen.getByRole('list', { name: 'Fatura do Nubank por mês' })
    expect(within(months).getAllByRole('button')).toHaveLength(9)
    expect(within(months).getByRole('button', { name: /^Fatura de Outubro de 2026: R\$\s250,00$/ })).toBeInTheDocument()
    expect(within(months).getByRole('button', { name: /^Fatura de Novembro de 2026: R\$\s780,00$/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('a category filter shows the invoice holding matching purchases, and select all takes those purchases', () => {
    setup()
    fireEvent.change(within(screen.getByRole('region', { name: 'Filtros' })).getByLabelText('Categoria'), { target: { value: 'Restaurante' } })
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    expect(labels(purchases())).toEqual(['Selecionar Jantar'])
    fireEvent.click(screen.getByRole('checkbox', { name: /Selecionar todos/ }))
    expect(screen.getByRole('checkbox', { name: 'Selecionar Fatura Nubank' })).not.toBeChecked()
    expect(flat(screen.getByRole('region', { name: 'Soma da seleção' }).textContent)).toContain('Saídas R$ 180,00')
  })

  it('simulates a purchase on the card against its limit', () => {
    const { onAddItem } = setup()
    fireEvent.click(screen.getByText('Posso gastar?'))
    const form = within(screen.getByRole('form', { name: 'Simular compra' }))
    fireEvent.change(form.getByLabelText('Pagar com'), { target: { value: 'c1' } })
    fireEvent.change(form.getByLabelText('Valor total'), { target: { value: '7000' } })
    expect(flat(form.getByText(/^Limite do Nubank:/).textContent)).toBe('Limite do Nubank: R$ 1.380,00 → R$ 8.380,00 de R$ 8.000,00')
    // Bought today (12/11), it goes into the November invoice, paid today too.
    expect(form.getByText(/^Não cabe: deixa novembro negativo em R\$\s1\.930,00\. E passa R\$\s380,00 do limite do Nubank\.$/)).toBeInTheDocument()

    fireEvent.change(form.getByLabelText('O que é'), { target: { value: 'Sofá' } })
    fireEvent.change(form.getByLabelText('Categoria'), { target: { value: 'Casa' } })
    fireEvent.click(form.getByRole('button', { name: 'Registrar essa compra' }))
    expect(onAddItem).toHaveBeenCalledWith({
      title: 'Sofá', type: 'expense', kind: 'one-time', amount: 700_000, category: 'Casa', dueDate: '2026-11-12', installments: 1, cardId: 'c1',
    })
  })
})
