import { useState } from 'react'
import { parseFinanceBackup } from '../services/financeBackupService'
import { emptyFinanceData, loadFinanceData, saveFinanceData } from '../services/financeStorage'
import type { FinanceData, FinancialItemDraft, InvestmentDraft, OccurrenceStatus } from '../types/finance'
import {
  addFinancialItem,
  addPortfolioInvestment,
  changeOccurrenceStatus,
  deleteFinancialItem,
  deletePortfolioInvestment,
  updateFinancialItem,
  updatePortfolioInvestment,
} from '../utils/financeMutations'
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

  const addItem = (draft: FinancialItemDraft): boolean => commit(
    addFinancialItem(state.data, draft, { id: crypto.randomUUID(), timestamp: new Date().toISOString() }),
    draft.investmentId ? 'Aporte adicionado e vinculado ao investimento.' : 'Item adicionado ao planejamento.',
  )

  const updateItem = (id: string, draft: FinancialItemDraft): boolean => {
    const result = updateFinancialItem(state.data, id, draft, new Date().toISOString())
    if (!result) {
      setState((current) => ({ ...current, error: 'O item que você tentou editar não foi encontrado.' }))
      return false
    }
    return commit(
      result.data,
      result.scheduleChanged
        ? 'Item atualizado. As confirmações anteriores foram reiniciadas porque as datas mudaram.'
        : 'Item atualizado com sucesso.',
    )
  }

  const deleteItem = (id: string): void => {
    commit(deleteFinancialItem(state.data, id, new Date().toISOString()), 'Item excluído.')
  }

  const addInvestment = (draft: InvestmentDraft): boolean => commit(
    addPortfolioInvestment(
      state.data,
      draft,
      { id: crypto.randomUUID(), timestamp: new Date().toISOString() },
      crypto.randomUUID(),
    ),
    draft.createPlannedExpense && draft.monthlyContribution > 0
      ? 'Investimento criado e aporte adicionado ao planejamento.'
      : 'Investimento adicionado à carteira.',
  )

  const updateInvestment = (id: string, draft: InvestmentDraft): boolean => {
    const updated = updatePortfolioInvestment(
      state.data,
      id,
      draft,
      crypto.randomUUID(),
      new Date().toISOString(),
    )
    return updated ? commit(updated, 'Investimento atualizado com sucesso.') : false
  }

  const deleteInvestment = (id: string): void => {
    commit(
      deletePortfolioInvestment(state.data, id),
      'Investimento removido. O gasto planejado foi mantido e apenas desvinculado.',
    )
  }

  const completeWelcome = (): boolean => commit(
    { ...state.data, welcomeCompleted: true },
    'Bem-vindo ao c-finance.',
  )

  const setOccurrenceStatus = (key: string, status: OccurrenceStatus): void => {
    commit(
      changeOccurrenceStatus(state.data, key, status, new Date().toISOString()),
      status === 'completed' ? 'Movimentação confirmada.' : 'Situação atualizada.',
    )
  }

  const importBackup = (content: string): boolean => {
    try {
      return commit({ ...parseFinanceBackup(content), welcomeCompleted: true }, 'Backup importado com sucesso.')
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
    occurrencesForMonth: (month: string) => generateOccurrences(state.data.items, state.data.occurrenceRecords, month),
    clearFeedback: () => {
      setState((current) => ({ ...current, error: null }))
      setMessage(null)
    },
  }
}
