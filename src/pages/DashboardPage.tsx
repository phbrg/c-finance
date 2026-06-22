import { useMemo } from 'react'
import { CashFlowChart } from '../components/dashboard/CashFlowChart'
import { CategoryChart } from '../components/dashboard/CategoryChart'
import { DashboardCards } from '../components/dashboard/DashboardCards'
import { FinancialInsights } from '../components/dashboard/FinancialInsights'
import { MonthlyComparison } from '../components/dashboard/MonthlyComparison'
import { PeriodProgress } from '../components/dashboard/PeriodProgress'
import { DashboardHeader } from '../components/layout/DashboardHeader'
import type { FinanceData, FinancialOccurrence } from '../types/finance'
import { calculateDashboardSummary } from '../utils/projections'
import { addMonth, daysInMonth } from '../utils/recurrence'

interface DashboardPageProps {
  data: FinanceData
  month: string
  cutoffDate: string
  occurrences: FinancialOccurrence[]
  occurrencesForMonth: (month: string) => FinancialOccurrence[]
  onMonthChange: (month: string) => void
  onCutoffChange: (date: string) => void
  onImport: (content: string) => boolean
  onGoToPlanning: () => void
}

export function DashboardPage({ data, month, cutoffDate, occurrences, occurrencesForMonth, onMonthChange, onCutoffChange, onImport, onGoToPlanning }: DashboardPageProps) {
  const summary = useMemo(() => calculateDashboardSummary(occurrences, cutoffDate), [occurrences, cutoffDate])
  const comparisonMonths = useMemo(
    () => Array.from({ length: 6 }, (_, index) => addMonth(month, index - 5)).map((item) => ({ month: item, occurrences: occurrencesForMonth(item) })),
    [month, occurrencesForMonth],
  )

  return (
    <div className="dashboard-page">
      <DashboardHeader title="Dashboard" description="Acompanhe o previsto, o realizado e os próximos passos." data={data} onImport={onImport} />
      {data.items.length === 0 ? (
        <section className="dashboard-first-run">
          <span className="overline">Primeiros passos</span>
          <h2>Sua visão financeira ainda está em branco.</h2>
          <p>Adicione seus ganhos e gastos fixos para gerar projeções, gráficos e análises úteis.</p>
          <button type="button" className="button-primary" onClick={onGoToPlanning}>Montar meu planejamento</button>
        </section>
      ) : (
        <>
          <section className="dashboard-context">
            <div className="dashboard-toolbar">
              <div><span>Período analisado</span><strong>{new Date(`${month}-02T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong></div>
              <label className="field compact-field"><span>Mês</span><input type="month" value={month} onInput={(event) => onMonthChange(event.currentTarget.value)} /></label>
              <label className="field compact-field"><span>Dados confirmados até</span><input type="date" min={`${month}-01`} max={`${month}-${String(daysInMonth(month)).padStart(2, '0')}`} value={cutoffDate} onInput={(event) => onCutoffChange(event.currentTarget.value)} /></label>
            </div>
            <p className="cutoff-help"><strong>Como funciona:</strong> os valores “confirmados” consideram os status registrados até a data escolhida. As projeções sempre representam o mês inteiro.</p>
          </section>
          <DashboardCards summary={summary} cutoffDate={cutoffDate} />
          <PeriodProgress summary={summary} cutoffDate={cutoffDate} />
          <div className="dashboard-grid-primary">
            <CashFlowChart occurrences={occurrences} />
            <FinancialInsights summary={summary} occurrences={occurrences} />
          </div>
          <div className="dashboard-grid-secondary">
            <MonthlyComparison months={comparisonMonths} />
            <CategoryChart occurrences={occurrences} />
          </div>
        </>
      )}
    </div>
  )
}
