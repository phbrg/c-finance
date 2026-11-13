import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { backupNotice } from '../components/data/backupNotice'
import { DataPage } from '../pages/DataPage'
import { emptyFinanceData } from '../services/financeStorage'

const data = { ...emptyFinanceData(), welcomeCompleted: true }

describe('backupNotice', () => {
  const now = new Date('2026-06-30T12:00:00Z').getTime()
  it('warns when there is no backup', () => expect(backupNotice(null, now).warn).toBe(true))
  it('warns after 30 days', () => expect(backupNotice('2026-05-01T12:00:00Z', now).warn).toBe(true))
  it('is quiet for a recent backup', () => expect(backupNotice('2026-06-20T12:00:00Z', now).warn).toBe(false))
  it('labels the age in short words', () => {
    expect(backupNotice(null, now).value).toBe('nunca')
    expect(backupNotice('2026-06-30T08:00:00Z', now).value).toBe('hoje')
    expect(backupNotice('2026-06-29T08:00:00Z', now).value).toBe('ontem')
    expect(backupNotice('2026-06-27T12:00:00Z', now).value).toBe('há 3 dias')
  })
})

const cardProps = { onAddCard: vi.fn(() => true), onUpdateCard: vi.fn(() => true), onDeleteCard: vi.fn() }
const card = { id: 'c1', name: 'Nubank', closingDay: 5, dueDay: 12, limit: 500_000, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }

describe('DataPage', () => {
  it('saves and removes the opening balance', () => {
    const onSet = vi.fn()
    const { rerender } = render(<DataPage data={data} onImport={vi.fn()} onSetOpeningBalance={onSet} {...cardProps} />)

    fireEvent.change(screen.getByLabelText('Valor (R$)'), { target: { value: '1500,50' } })
    fireEvent.change(screen.getByLabelText('Mês de início'), { target: { value: '2026-03' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar saldo' }))
    expect(onSet).toHaveBeenCalledWith({ amount: 150050, month: '2026-03' })

    rerender(<DataPage data={{ ...data, openingBalance: { amount: 150050, month: '2026-03' } }} onImport={vi.fn()} onSetOpeningBalance={onSet} {...cardProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }))
    expect(onSet).toHaveBeenLastCalledWith(null)
  })

  it('rejects an invalid amount', () => {
    const onSet = vi.fn()
    render(<DataPage data={data} onImport={vi.fn()} onSetOpeningBalance={onSet} {...cardProps} />)
    fireEvent.change(screen.getByLabelText('Valor (R$)'), { target: { value: 'abc' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar saldo' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(onSet).not.toHaveBeenCalled()
  })

  it('asks for confirmation before importing a backup', async () => {
    const onImport = vi.fn()
    render(<DataPage data={data} onImport={onImport} onSetOpeningBalance={vi.fn()} {...cardProps} />)
    const file = new File(['{}'], 'backup.json', { type: 'application/json' })
    fireEvent.change(screen.getByLabelText('Arquivo de backup'), { target: { files: [file] } })

    const dialog = await screen.findByRole('alertdialog')
    expect(onImport).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole('button', { name: 'Importar backup' }))
    expect(onImport).toHaveBeenCalledWith('{}')
  })

  it('has no help section', () => {
    render(<DataPage data={data} onImport={vi.fn()} onSetOpeningBalance={vi.fn()} {...cardProps} />)
    expect(screen.queryByRole('heading', { name: 'Ajuda' })).not.toBeInTheDocument()
    expect(screen.queryAllByText(/\?$/)).toHaveLength(0)
  })

  it('summarizes the data at the top', () => {
    const items = [
      { id: 'i1', title: 'Salário', type: 'income', kind: 'one-time', amount: 1000, category: 'Trabalho', dueDate: '2026-06-05', createdAt: card.createdAt, updatedAt: card.createdAt },
      { id: 'i2', title: 'Aluguel', type: 'expense', kind: 'one-time', amount: 500, category: 'Moradia', dueDate: '2026-06-10', createdAt: card.createdAt, updatedAt: card.createdAt },
    ] as typeof data.items
    const { rerender } = render(<DataPage data={data} onImport={vi.fn()} onSetOpeningBalance={vi.fn()} {...cardProps} />)
    const stat = (label: string) => screen.getByText(label, { selector: '.stat span' }).parentElement as HTMLElement
    expect(stat('Lançamentos')).toHaveTextContent('0')
    expect(stat('Cartões')).toHaveTextContent('nenhum cadastrado')
    expect(stat('Último backup')).toHaveTextContent('nunca')
    expect(stat('Último backup')).toHaveClass('is-warning')
    expect(stat('Saldo inicial')).toHaveTextContent('não definido')

    window.localStorage.setItem('c-finance:last-backup', new Date().toISOString())
    rerender(<DataPage key="fresh" data={{ ...data, items, cards: [card], openingBalance: { amount: 150050, month: '2026-03' } }} onImport={vi.fn()} onSetOpeningBalance={vi.fn()} {...cardProps} />)
    expect(stat('Lançamentos')).toHaveTextContent(/^Lançamentos21 entrada e 1 saída$/)
    expect(stat('Cartões')).toHaveTextContent('Nubank')
    expect(stat('Último backup')).toHaveTextContent('hoje')
    expect(stat('Último backup')).not.toHaveClass('is-warning')
    expect(stat('Saldo inicial')).toHaveTextContent(/R\$\s1\.500,50/)
  })

  it('adds, edits and deletes cards', () => {
    const props = { onAddCard: vi.fn(() => true), onUpdateCard: vi.fn(() => true), onDeleteCard: vi.fn() }
    const { rerender } = render(<DataPage data={data} onImport={vi.fn()} onSetOpeningBalance={vi.fn()} {...props} />)
    expect(screen.getByText(/Nenhum cartão ainda/)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Nome do cartão'), { target: { value: 'Nubank' } })
    expect(screen.queryByLabelText(/fechamento/i)).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Dia do pagamento'), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText(/^Limite/), { target: { value: '5000,00' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar cartão' }))
    expect(props.onAddCard).toHaveBeenCalledWith({ name: 'Nubank', dueDay: 12, limit: 500_000 })

    rerender(<DataPage data={{ ...data, cards: [card] }} onImport={vi.fn()} onSetOpeningBalance={vi.fn()} {...props} />)
    expect(screen.getByText(/^Paga dia 12 · limite R\$\s5\.000,00$/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Editar Nubank' }))
    fireEvent.change(screen.getByLabelText('Dia do pagamento'), { target: { value: '15' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar cartão' }))
    expect(props.onUpdateCard).toHaveBeenCalledWith('c1', { name: 'Nubank', dueDay: 15, limit: 500_000 })

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Nubank' }))
    expect(props.onDeleteCard).not.toHaveBeenCalled()
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Excluir' }))
    expect(props.onDeleteCard).toHaveBeenCalledWith('c1')
  })

  it('rejects a card with an invalid day', () => {
    const props = { onAddCard: vi.fn(() => true), onUpdateCard: vi.fn(() => true), onDeleteCard: vi.fn() }
    render(<DataPage data={data} onImport={vi.fn()} onSetOpeningBalance={vi.fn()} {...props} />)
    fireEvent.change(screen.getByLabelText('Nome do cartão'), { target: { value: 'X' } })
    fireEvent.change(screen.getByLabelText('Dia do pagamento'), { target: { value: '32' } })
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar cartão' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(props.onAddCard).not.toHaveBeenCalled()
  })
})
