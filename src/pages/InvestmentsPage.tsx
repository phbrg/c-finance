import { useState } from 'react'
import { DashboardHeader } from '../components/layout/DashboardHeader'
import { InvestmentForm } from '../components/investments/InvestmentForm'
import { InvestmentList } from '../components/investments/InvestmentList'
import { InvestmentProjectionChart } from '../components/investments/InvestmentProjectionChart'
import type { FinanceData, Investment, InvestmentDraft } from '../types/finance'
import { formatCurrency } from '../utils/currency'
import { projectPortfolio } from '../utils/investmentProjections'

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
  const oneYear = projectPortfolio(data.investments, 12)
  const totalBalance = data.investments.reduce((sum, item) => sum + item.currentBalance, 0)
  const monthlyContribution = data.investments.reduce((sum, item) => sum + item.monthlyContribution, 0)

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
    <>
      <DashboardHeader title="Investimentos" description="Acompanhe reservas, caixinhas e a evolução estimada dos seus aportes." data={data} onImport={onImport} />
      <section className="investment-summary" aria-label="Resumo dos investimentos">
        <article><span>Patrimônio investido</span><strong>{formatCurrency(totalBalance)}</strong><small>Saldo informado hoje</small></article>
        <article><span>Aportes mensais</span><strong>{formatCurrency(monthlyContribution)}</strong><small>{data.investments.filter((item) => item.linkedFinancialItemId).length} vinculados ao planejamento</small></article>
        <article><span>Projeção em 1 ano</span><strong>{formatCurrency(oneYear.balance)}</strong><small>{formatCurrency(oneYear.earnings)} em rendimento estimado</small></article>
      </section>
      <div className="investment-toolbar"><label className="field"><span>Horizonte da projeção</span><select value={horizon} onChange={(event) => setHorizon(Number(event.target.value))}><option value="1">1 ano</option><option value="3">3 anos</option><option value="5">5 anos</option><option value="10">10 anos</option><option value="20">20 anos</option></select></label></div>
      <InvestmentProjectionChart investments={data.investments} years={horizon} />
      <div className="investments-layout">
        <InvestmentForm key={editingInvestment?.id ?? 'new-investment'} editingInvestment={editingInvestment} onSubmit={submit} onCancel={() => setEditingInvestment(null)} />
        <section className="workspace-card investments-list-card"><div className="card-heading"><div><span className="overline">Carteira</span><h2>Seus investimentos</h2></div><span className="count-badge">{data.investments.length}</span></div><InvestmentList investments={data.investments} onEdit={edit} onDelete={onDelete} /></section>
      </div>
    </>
  )
}
