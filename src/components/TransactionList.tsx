import { useState } from 'react'
import type { Transaction } from '../types/transaction'
import { formatCurrency } from '../utils/currency'
import { formatDate } from '../utils/date'
import { ConfirmDialog } from './ConfirmDialog'

interface TransactionListProps {
  transactions: Transaction[]
  onDelete: (id: string) => void
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null)

  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">↗</div>
        <h3 className="mt-4 font-bold text-slate-200">Nenhuma transação encontrada</h3>
        <p className="mt-1 text-sm text-slate-400">Cadastre um lançamento ou experimente alterar os filtros.</p>
      </div>
    )
  }

  return (
    <>
      <div className="transaction-list">
        {transactions.map((transaction) => (
          <article key={transaction.id} className="transaction-row">
            <div className={`transaction-mark ${transaction.type}`} aria-hidden="true">
              {transaction.type === 'income' ? '↓' : '↑'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate font-semibold text-slate-200">{transaction.title}</h3>
                {transaction.installment && (
                  <span className="tag">{transaction.installment.current}/{transaction.installment.total}</span>
                )}
              </div>
              <p className="mt-1 truncate text-sm text-slate-400">
                {transaction.category} · {formatDate(transaction.paymentDate)}
                {transaction.notes && ` · ${transaction.notes}`}
              </p>
            </div>
            <p className={`whitespace-nowrap font-bold ${transaction.type === 'income' ? 'text-cyan-400' : 'text-slate-200'}`}>
              {transaction.type === 'income' ? '+' : '−'} {formatCurrency(transaction.amount)}
            </p>
            <button type="button" className="delete-button" onClick={() => setPendingDelete(transaction)} aria-label={`Excluir ${transaction.title}`} title="Excluir transação">×</button>
          </article>
        ))}
      </div>
      {pendingDelete && (
        <ConfirmDialog
          title="Excluir transação?"
          description={`“${pendingDelete.title}” será removida permanentemente deste navegador.${pendingDelete.installment ? ' As outras parcelas não serão alteradas.' : ''}`}
          confirmLabel="Excluir"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            onDelete(pendingDelete.id)
            setPendingDelete(null)
          }}
        />
      )}
    </>
  )
}
