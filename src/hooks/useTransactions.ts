import { useMemo, useState } from 'react'
import { parseBackup } from '../services/backupService'
import { loadTransactions, saveTransactions } from '../services/transactionStorage'
import type { Transaction, TransactionDraft, TransactionFilters } from '../types/transaction'
import { calculateFinancialSummary, filterTransactions } from '../utils/financialCalculations'
import { createTransactionsFromDraft } from '../utils/installments'

function initialState(): { transactions: Transaction[]; error: string | null } {
  try {
    return { transactions: loadTransactions(), error: null }
  } catch (error: unknown) {
    return {
      transactions: [],
      error: error instanceof Error ? error.message : 'Não foi possível carregar os dados.',
    }
  }
}

export function useTransactions(filters: TransactionFilters) {
  const [state, setState] = useState(initialState)
  const [message, setMessage] = useState<string | null>(null)

  const commit = (next: Transaction[], successMessage: string): boolean => {
    try {
      saveTransactions(next)
      setState({ transactions: next, error: null })
      setMessage(successMessage)
      return true
    } catch (error: unknown) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Ocorreu um erro inesperado.',
      }))
      return false
    }
  }

  const addTransaction = (draft: TransactionDraft): boolean => {
    const created = createTransactionsFromDraft(draft)
    return commit([...state.transactions, ...created], 'Transação salva com sucesso.')
  }

  const deleteTransaction = (id: string): void => {
    commit(
      state.transactions.filter((transaction) => transaction.id !== id),
      'Transação excluída.',
    )
  }

  const importBackup = (content: string): boolean => {
    try {
      return commit(parseBackup(content), 'Backup importado com sucesso.')
    } catch (error: unknown) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Não foi possível importar o backup.',
      }))
      return false
    }
  }

  const filteredTransactions = useMemo(
    () => filterTransactions(state.transactions, filters),
    [state.transactions, filters],
  )
  const summary = useMemo(
    () => calculateFinancialSummary(filteredTransactions),
    [filteredTransactions],
  )

  return {
    transactions: state.transactions,
    filteredTransactions,
    summary,
    error: state.error,
    message,
    addTransaction,
    deleteTransaction,
    importBackup,
    clearFeedback: () => {
      setState((current) => ({ ...current, error: null }))
      setMessage(null)
    },
  }
}
