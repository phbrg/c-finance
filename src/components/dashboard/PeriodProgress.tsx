import type { DashboardSummary } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'

interface PeriodProgressProps {
  summary: DashboardSummary
  cutoffDate: string
}

function progress(realized: number, expected: number): { label: string; width: number } {
  if (expected <= 0) return { label: 'Sem previsão', width: 0 }
  const percentage = (realized / expected) * 100
  return {
    label: `${percentage.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`,
    width: Math.min(Math.max(percentage, 0), 100),
  }
}

export function PeriodProgress({ summary, cutoffDate }: PeriodProgressProps) {
  const cutoffDay = Number(cutoffDate.slice(8, 10))
  const incomeProgress = progress(summary.receivedIncome, summary.expectedIncomeUntilCutoff)
  const expenseProgress = progress(summary.paidExpenses, summary.expectedExpensesUntilCutoff)

  return (
    <section className="workspace-card period-progress-card">
      <div className="card-heading period-progress-heading">
        <div>
          <span className="overline">Previsto × confirmado</span>
          <h2>Como está o mês até o dia {cutoffDay}</h2>
          <p>Esta leitura considera apenas movimentações com vencimento até a data de corte.</p>
        </div>
        <div className="confirmed-balance">
          <span>Saldo confirmado</span>
          <strong className={summary.realizedBalance >= 0 ? 'amount-income' : 'amount-expense'}>{formatCurrency(summary.realizedBalance)}</strong>
        </div>
      </div>

      <div className="period-progress-grid">
        <div className="progress-block income">
          <div className="progress-copy"><span>Ganhos recebidos</span><strong>{incomeProgress.label}</strong></div>
          <div className="progress-values"><strong>{formatCurrency(summary.receivedIncome)}</strong><span>de {formatCurrency(summary.expectedIncomeUntilCutoff)} previstos</span></div>
          <div className="progress-track"><span style={{ width: `${incomeProgress.width}%` }} /></div>
        </div>
        <div className="progress-block expense">
          <div className="progress-copy"><span>Gastos pagos</span><strong>{expenseProgress.label}</strong></div>
          <div className="progress-values"><strong>{formatCurrency(summary.paidExpenses)}</strong><span>de {formatCurrency(summary.expectedExpensesUntilCutoff)} previstos</span></div>
          <div className="progress-track"><span style={{ width: `${expenseProgress.width}%` }} /></div>
        </div>
      </div>
    </section>
  )
}
