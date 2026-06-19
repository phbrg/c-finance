import { useMemo, useState } from 'react'
import type { FinanceData, FinancialOccurrence, OccurrenceStatus } from '../types/finance'
import { DashboardHeader } from '../components/layout/DashboardHeader'
import { OccurrenceList } from '../components/transactions/OccurrenceList'

interface TransactionsPageProps {
  data: FinanceData
  month: string
  occurrences: FinancialOccurrence[]
  onMonthChange: (month: string) => void
  onStatusChange: (key: string, status: OccurrenceStatus) => void
  onImport: (content: string) => boolean
}

export function TransactionsPage({ data, month, occurrences, onMonthChange, onStatusChange, onImport }: TransactionsPageProps) {
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all')
  const [status, setStatus] = useState<'all' | OccurrenceStatus>('all')
  const [category, setCategory] = useState('all')
  const categories = useMemo(() => [...new Set(occurrences.map((item) => item.category))].sort(), [occurrences])
  const filtered = useMemo(
    () => occurrences.filter((item) =>
      (type === 'all' || item.type === type) &&
      (status === 'all' || item.status === status) &&
      (category === 'all' || item.category === category),
    ),
    [occurrences, type, status, category],
  )

  return (
    <>
      <DashboardHeader title="Lançamentos" description="Confirme o que realmente entrou e saiu da sua conta." data={data} onImport={onImport} />
      <section className="workspace-card">
        <div className="card-heading transactions-heading">
          <div><span className="overline">Movimentações do período</span><h2>Previsto × realizado</h2></div>
          <div className="transaction-filters">
            <label className="field compact-field"><span>Mês</span><input type="month" value={month} onChange={(event) => onMonthChange(event.target.value)} /></label>
            <label className="field"><span>Tipo</span><select value={type} onChange={(event) => setType(event.target.value as typeof type)}><option value="all">Todos</option><option value="income">Ganhos</option><option value="expense">Gastos</option></select></label>
            <label className="field"><span>Situação</span><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">Todas</option><option value="planned">Pendentes</option><option value="completed">Confirmados</option><option value="skipped">Ignorados</option></select></label>
            <label className="field"><span>Categoria</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Todas</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          </div>
        </div>
        <OccurrenceList occurrences={filtered} onStatusChange={onStatusChange} />
      </section>
    </>
  )
}
