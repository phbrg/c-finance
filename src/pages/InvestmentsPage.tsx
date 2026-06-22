import { useState } from 'react'
import { DashboardHeader } from '../components/layout/DashboardHeader'
import { InvestmentForm } from '../components/investments/InvestmentForm'
import { InvestmentList } from '../components/investments/InvestmentList'
import { InvestmentProjectionChart } from '../components/investments/InvestmentProjectionChart'
import { PortfolioAllocation } from '../components/investments/PortfolioAllocation'
import type { FinanceData, Investment, InvestmentDraft } from '../types/finance'
import { formatCurrency } from '../utils/currency'
import { projectPortfolio } from '../utils/investmentProjections'
import { summarizePortfolio } from '../utils/portfolio'

interface InvestmentsPageProps {
  data: FinanceData
  onAdd: (draft: InvestmentDraft) => boolean
  onUpdate: (id: string, draft: InvestmentDraft) => boolean
  onDelete: (id: string) => void
  onImport: (content: string) => boolean
}

export function InvestmentsPage({ data, onAdd, onUpdate, onDelete, onImport }: InvestmentsPageProps) {
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)
  const [horizon, setHorizon] = useState(5)
  const summary = summarizePortfolio(data.investments)
  const projection = projectPortfolio(data.investments, horizon * 12)

  const submit = (draft: InvestmentDraft): boolean => {
    if (!editingInvestment) return onAdd(draft)
    const saved = onUpdate(editingInvestment.id, draft)
    if (saved) setEditingInvestment(null)
    return saved
  }

  const edit = (investment: Investment) => {
    setEditingInvestment(investment)
    window.requestAnimationFrame(() => document.getElementById('investment-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <div className="investments-page">
      <DashboardHeader title="Investimentos" description="Acompanhe reservas, caixinhas e a evolução estimada dos seus aportes." data={data} onImport={onImport} />

      <section className="investment-summary" aria-label="Resumo dos investimentos">
        <article className="balance"><span>Patrimônio investido</span><strong>{formatCurrency(summary.totalBalance)}</strong><small>saldo atual informado em {data.investments.length} {data.investments.length === 1 ? 'aplicação' : 'aplicações'}</small></article>
        <article className="contribution"><span>Aportes mensais</span><strong>{formatCurrency(summary.monthlyContribution)}</strong><small>{summary.linkedCount} {summary.linkedCount === 1 ? 'aporte vinculado' : 'aportes vinculados'} ao planejamento</small></article>
        <article className="projected"><span>Projeção em {horizon} {horizon === 1 ? 'ano' : 'anos'}</span><strong>{formatCurrency(projection.balance)}</strong><small>mantendo taxas e aportes informados</small></article>
        <article className="earnings"><span>Rendimento estimado</span><strong>{formatCurrency(projection.earnings)}</strong><small>taxa média de {(summary.weightedAnnualRateBps / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% ao ano</small></article>
      </section>

      <div className="investment-analytics-grid">
        <InvestmentProjectionChart investments={data.investments} years={horizon} onYearsChange={setHorizon} />
        <PortfolioAllocation investments={data.investments} />
      </div>

      <div className="investments-layout">
        <InvestmentForm key={editingInvestment?.id ?? 'new-investment'} editingInvestment={editingInvestment} onSubmit={submit} onCancel={() => setEditingInvestment(null)} />
        <section className="workspace-card investments-list-card">
          <div className="card-heading investments-list-heading"><div><span className="overline">Carteira</span><h2>Seus investimentos</h2><p>Consulte saldos, aportes, taxas e projeções individuais.</p></div><span className="count-badge">{data.investments.length}</span></div>
          <InvestmentList investments={data.investments} onEdit={edit} onDelete={onDelete} />
        </section>
      </div>
    </div>
  )
}
