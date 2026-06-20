import { useState } from 'react'
import { parseFinanceBackup } from '../services/financeBackupService'
import { emptyFinanceData, loadFinanceData, saveFinanceData } from '../services/financeStorage'
import type {
  FinanceData,
  FinancialItem,
  FinancialItemDraft,
  Investment,
  InvestmentDraft,
  OccurrenceStatus,
} from '../types/finance'
import { generateOccurrences } from '../utils/recurrence'

function initialState(): { data: FinanceData; error: string | null } {
  try {
    return { data: loadFinanceData(), error: null }
  } catch (error: unknown) {
    return { data: emptyFinanceData(), error: error instanceof Error ? error.message : 'Erro inesperado.' }
  }
}

export function useFinance() {
  const [state, setState] = useState(initialState)
  const [message, setMessage] = useState<string | null>(null)

  const commit = (data: FinanceData, successMessage: string): boolean => {
    try {
      saveFinanceData(data)
      setState({ data, error: null })
      setMessage(successMessage)
      return true
    } catch (error: unknown) {
      setState((current) => ({ ...current, error: error instanceof Error ? error.message : 'Erro inesperado.' }))
      return false
    }
  }

  const addItem = (draft: FinancialItemDraft): boolean => {
    const timestamp = new Date().toISOString()
    const item = itemFromDraft(draft, {
      id: crypto.randomUUID(),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    const items = state.data.items.map((existing) =>
      draft.investmentId && existing.investmentId === draft.investmentId
        ? { ...existing, investmentId: undefined }
        : existing,
    )
    const investments = state.data.investments.map((investment) =>
      investment.id === draft.investmentId
        ? { ...investment, linkedFinancialItemId: item.id, monthlyContribution: item.amount, updatedAt: timestamp }
        : investment,
    )
    return commit(
      { ...state.data, items: [...items, item], investments },
      draft.investmentId ? 'Aporte adicionado e vinculado ao investimento.' : 'Item adicionado ao planejamento.',
    )
  }

  const updateItem = (id: string, draft: FinancialItemDraft): boolean => {
    const current = state.data.items.find((item) => item.id === id)
    if (!current) {
      setState((previous) => ({ ...previous, error: 'O item que você tentou editar não foi encontrado.' }))
      return false
    }

    const updated = itemFromDraft(draft, {
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    })
    const scheduleChanged = scheduleSignature(current) !== scheduleSignature(updated)
    const items = state.data.items
      .map((item) => item.id === id ? updated : item)
      .map((item) =>
        draft.investmentId && item.id !== id && item.investmentId === draft.investmentId
          ? { ...item, investmentId: undefined }
          : item,
      )
    const investments = state.data.investments.map((investment) => {
      if (investment.id === draft.investmentId) {
        return { ...investment, linkedFinancialItemId: id, monthlyContribution: draft.amount, updatedAt: updated.updatedAt }
      }
      if (investment.id === current.investmentId && current.investmentId !== draft.investmentId) {
        return { ...investment, linkedFinancialItemId: undefined, updatedAt: updated.updatedAt }
      }
      return investment
    })
    return commit(
      {
        ...state.data,
        items,
        investments,
        occurrenceRecords: scheduleChanged
          ? state.data.occurrenceRecords.filter((record) => !record.key.startsWith(`${id}:`))
          : state.data.occurrenceRecords,
      },
      scheduleChanged
        ? 'Item atualizado. As confirmações anteriores foram reiniciadas porque as datas mudaram.'
        : 'Item atualizado com sucesso.',
    )
  }

  const deleteItem = (id: string): void => {
    commit(
      {
        ...state.data,
        items: state.data.items.filter((item) => item.id !== id),
        investments: state.data.investments.map((investment) =>
          investment.linkedFinancialItemId === id
            ? { ...investment, linkedFinancialItemId: undefined, updatedAt: new Date().toISOString() }
            : investment,
        ),
        occurrenceRecords: state.data.occurrenceRecords.filter((record) => !record.key.startsWith(`${id}:`)),
      },
      'Item excluído.',
    )
  }

  const addInvestment = (draft: InvestmentDraft): boolean => {
    const timestamp = new Date().toISOString()
    const investmentId = crypto.randomUUID()
    const linkedItem = draft.createPlannedExpense && draft.monthlyContribution > 0
      ? createInvestmentItem(draft, investmentId, timestamp)
      : null
    const investment = investmentFromDraft(draft, {
      id: investmentId,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...(linkedItem ? { linkedFinancialItemId: linkedItem.id } : {}),
    })
    return commit(
      {
        ...state.data,
        investments: [...state.data.investments, investment],
        items: linkedItem ? [...state.data.items, linkedItem] : state.data.items,
      },
      linkedItem
        ? 'Investimento criado e aporte adicionado ao planejamento.'
        : 'Investimento adicionado à carteira.',
    )
  }

  const updateInvestment = (id: string, draft: InvestmentDraft): boolean => {
    const current = state.data.investments.find((investment) => investment.id === id)
    if (!current) return false
    const timestamp = new Date().toISOString()
    const currentLinkedItem = state.data.items.find((item) => item.id === current.linkedFinancialItemId)
    const shouldLink = draft.createPlannedExpense && draft.monthlyContribution > 0
    const linkedItem = shouldLink
      ? currentLinkedItem
        ? updateInvestmentItem(currentLinkedItem, draft, id, timestamp)
        : createInvestmentItem(draft, id, timestamp)
      : null
    const investment = investmentFromDraft(draft, {
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: timestamp,
      ...(linkedItem ? { linkedFinancialItemId: linkedItem.id } : {}),
    })
    const itemsWithoutOldLink = state.data.items
      .filter((item) => item.id !== currentLinkedItem?.id)
      .map((item) => item.investmentId === id ? { ...item, investmentId: undefined } : item)
    return commit(
      {
        ...state.data,
        investments: state.data.investments.map((item) => item.id === id ? investment : item),
        items: linkedItem ? [...itemsWithoutOldLink, linkedItem] : itemsWithoutOldLink,
      },
      'Investimento atualizado com sucesso.',
    )
  }

  const deleteInvestment = (id: string): void => {
    commit(
      {
        ...state.data,
        investments: state.data.investments.filter((investment) => investment.id !== id),
        items: state.data.items.map((item) =>
          item.investmentId === id ? { ...item, investmentId: undefined } : item,
        ),
      },
      'Investimento removido. O gasto planejado foi mantido e apenas desvinculado.',
    )
  }

  const completeWelcome = (): boolean =>
    commit({ ...state.data, welcomeCompleted: true }, 'Bem-vindo ao c-finance.')

  const setOccurrenceStatus = (key: string, status: OccurrenceStatus): void => {
    const record = {
      key,
      status,
      ...(status === 'completed' ? { completedAt: `${key.slice(-10)}T12:00:00.000Z` } : {}),
    }
    commit(
      {
        ...state.data,
        occurrenceRecords: [...state.data.occurrenceRecords.filter((item) => item.key !== key), record],
      },
      status === 'completed' ? 'Movimentação confirmada.' : 'Situação atualizada.',
    )
  }

  const importBackup = (content: string): boolean => {
    try {
      return commit(
        { ...parseFinanceBackup(content), welcomeCompleted: true },
        'Backup importado com sucesso.',
      )
    } catch (error: unknown) {
      setState((current) => ({ ...current, error: error instanceof Error ? error.message : 'Backup inválido.' }))
      return false
    }
  }

  return {
    data: state.data,
    items: state.data.items,
    investments: state.data.investments,
    error: state.error,
    message,
    addItem,
    updateItem,
    deleteItem,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    completeWelcome,
    setOccurrenceStatus,
    importBackup,
    occurrencesForMonth: (month: string) =>
      generateOccurrences(state.data.items, state.data.occurrenceRecords, month),
    clearFeedback: () => {
      setState((current) => ({ ...current, error: null }))
      setMessage(null)
    },
  }
}

function itemFromDraft(
  draft: FinancialItemDraft,
  identity: Pick<FinancialItem, 'id' | 'createdAt' | 'updatedAt'>,
): FinancialItem {
  return {
    ...identity,
    title: draft.title.trim(),
    type: draft.type,
    kind: draft.kind,
    amount: draft.amount,
    category: draft.category.trim(),
    ...(draft.notes?.trim() ? { notes: draft.notes.trim() } : {}),
    ...(draft.investmentId ? { investmentId: draft.investmentId } : {}),
    ...(draft.kind === 'recurring'
      ? {
          recurrence: {
            dayOfMonth: draft.dayOfMonth ?? 1,
            startMonth: draft.startMonth ?? new Date().toISOString().slice(0, 7),
            ...(draft.endMonth ? { endMonth: draft.endMonth } : {}),
            active: true,
          },
        }
      : { dueDate: draft.dueDate }),
  }
}

function investmentFromDraft(
  draft: InvestmentDraft,
  identity: Pick<Investment, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<Investment, 'linkedFinancialItemId'>>,
): Investment {
  return {
    ...identity,
    name: draft.name.trim(),
    institution: draft.institution.trim(),
    currentBalance: draft.currentBalance,
    balanceDate: draft.balanceDate,
    annualRateBps: draft.annualRateBps,
    monthlyContribution: draft.monthlyContribution,
    contributionDay: draft.contributionDay,
  }
}

function createInvestmentItem(draft: InvestmentDraft, investmentId: string, timestamp: string): FinancialItem {
  return {
    id: crypto.randomUUID(),
    title: `Aporte · ${draft.name.trim()}`,
    type: 'expense',
    kind: 'recurring',
    amount: draft.monthlyContribution,
    category: 'Investimentos',
    investmentId,
    recurrence: {
      dayOfMonth: draft.contributionDay,
      startMonth: draft.balanceDate.slice(0, 7),
      active: true,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function updateInvestmentItem(
  item: FinancialItem,
  draft: InvestmentDraft,
  investmentId: string,
  timestamp: string,
): FinancialItem {
  return {
    ...item,
    title: `Aporte · ${draft.name.trim()}`,
    amount: draft.monthlyContribution,
    category: 'Investimentos',
    investmentId,
    recurrence: {
      dayOfMonth: draft.contributionDay,
      startMonth: item.recurrence?.startMonth ?? draft.balanceDate.slice(0, 7),
      active: true,
    },
    dueDate: undefined,
    type: 'expense',
    kind: 'recurring',
    updatedAt: timestamp,
  }
}

function scheduleSignature(item: FinancialItem): string {
  return JSON.stringify({
    kind: item.kind,
    dueDate: item.dueDate,
    recurrence: item.recurrence
      ? {
          dayOfMonth: item.recurrence.dayOfMonth,
          startMonth: item.recurrence.startMonth,
          endMonth: item.recurrence.endMonth,
        }
      : undefined,
  })
}
