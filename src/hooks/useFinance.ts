import { useEffect, useRef, useState } from 'react'
import { parseFinanceBackup } from '../services/financeBackupService'
import { emptyFinanceData, FINANCE_STORAGE_KEY, loadFinanceData, saveFinanceData } from '../services/financeStorage'
import type { CreditCardDraft, FinanceData, FinancialItemDraft, OccurrenceStatus, OpeningBalance } from '../types/finance'
import {
  addCard,
  addFinancialItem,
  changeOccurrenceStatus,
  deleteCard,
  deleteFinancialItem,
  setOpeningBalance,
  updateCard,
  updateFinancialItem,
} from '../utils/financeMutations'

type State = { data: FinanceData; error: string | null }

// On corrupted data the error stays and the stored text is untouched (loadFinanceData already kept a copy).
function initialState(): State {
  try {
    return { data: loadFinanceData(), error: null }
  } catch (error: unknown) {
    return { data: emptyFinanceData(), error: error instanceof Error ? error.message : 'Erro inesperado.' }
  }
}

const errorText = (error: unknown, fallback = 'Erro inesperado.') => error instanceof Error ? error.message : fallback
const now = () => new Date().toISOString()
const newId = () => crypto.randomUUID()

export function useFinance() {
  const [state, setState] = useState(initialState)
  // Latest saved data. Several calls in the same click (confirm all selected) must build on each other,
  // not on the data of the render they were created in.
  const latest = useRef(state.data)
  const [message, setMessage] = useState<string | null>(null)

  // Another tab saved: reload so this one does not overwrite it with stale data.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== FINANCE_STORAGE_KEY && event.key !== null) return
      const reloaded = initialState()
      latest.current = reloaded.data
      setState(reloaded)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const fail = (text: string) => {
    setState((current) => ({ ...current, error: text }))
    return false
  }

  const commit = (data: FinanceData | null, successMessage: string, notFound = 'Não encontrei esse item.'): boolean => {
    if (!data) return fail(notFound)
    try {
      saveFinanceData(data)
      latest.current = data
      setState({ data, error: null })
      setMessage(successMessage)
      return true
    } catch (error: unknown) {
      return fail(errorText(error))
    }
  }

  return {
    data: state.data,
    error: state.error,
    message,
    clearFeedback: () => {
      setState((current) => ({ ...current, error: null }))
      setMessage(null)
    },
    addItem: (draft: FinancialItemDraft) => commit(
      addFinancialItem(latest.current, draft, { id: newId(), timestamp: now() }),
      'Lançamento adicionado.',
    ),
    updateItem: (id: string, draft: FinancialItemDraft, options?: { amountFrom?: string }) => commit(
      updateFinancialItem(latest.current, id, draft, now(), options),
      'Lançamento atualizado.',
    ),
    deleteItem: (id: string): void => {
      commit(deleteFinancialItem(latest.current, id), 'Lançamento excluído.')
    },
    setOccurrenceStatus: (
      key: string,
      status: OccurrenceStatus,
      details?: { amount?: number; paidDate?: string },
    ): void => {
      commit(
        changeOccurrenceStatus(latest.current, key, status, now(), details),
        status === 'completed' ? 'Marcado como feito.' : status === 'skipped' ? 'Marcado como ignorado.' : 'Voltou para pendente.',
      )
    },
    addCard: (draft: CreditCardDraft) => commit(
      addCard(latest.current, draft, { id: newId(), timestamp: now() }),
      'Cartão adicionado.',
    ),
    updateCard: (id: string, draft: CreditCardDraft) => commit(
      updateCard(latest.current, id, draft, now()),
      'Cartão atualizado.',
      'Não encontrei esse cartão.',
    ),
    deleteCard: (id: string): void => {
      commit(deleteCard(latest.current, id), 'Cartão excluído. As compras viraram gastos comuns.')
    },
    setOpeningBalance: (value: OpeningBalance | null): void => {
      commit(setOpeningBalance(latest.current, value), value ? 'Saldo inicial salvo.' : 'Saldo inicial removido.')
    },
    completeWelcome: () => commit({ ...latest.current, welcomeCompleted: true }, 'Tudo pronto.'),
    importBackup: (content: string): boolean => {
      try {
        return commit({ ...parseFinanceBackup(content), welcomeCompleted: true }, 'Backup importado.')
      } catch (error: unknown) {
        return fail(errorText(error, 'Backup inválido.'))
      }
    },
  }
}
