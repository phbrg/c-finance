import { useState } from 'react'
import { DashboardHeader } from '../components/layout/DashboardHeader'
import { InvestmentDialog } from '../components/investments/InvestmentDialog'
import { InvestmentList } from '../components/investments/InvestmentList'
import { InvestmentOverview } from '../components/investments/InvestmentOverview'
import { InvestmentProjectionChart } from '../components/investments/InvestmentProjectionChart'
import { PortfolioAllocation } from '../components/investments/PortfolioAllocation'
import type { FinanceData, Investment, InvestmentDraft } from '../types/finance'
import { today } from '../utils/date'

interface InvestmentsPageProps {
  data: FinanceData
  onAdd: (draft: InvestmentDraft) => boolean
  onUpdate: (id: string, draft: InvestmentDraft) => boolean
  onDelete: (id: string) => void
  onImport: (content: string) => boolean
}

export function InvestmentsPage({ data, onAdd, onUpdate, onDelete, onImport }: InvestmentsPageProps) {
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [horizon, setHorizon] = useState(5)
  const referenceDate = today()

  const submit = (draft: InvestmentDraft): boolean => {
    const saved = editingInvestment ? onUpdate(editingInvestment.id, draft) : onAdd(draft)
    if (saved) closeForm()
    return saved
  }

  const edit = (investment: Investment) => {
    setEditingInvestment(investment)
    setIsFormOpen(true)
  }

  const create = () => {
    setEditingInvestment(null)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setEditingInvestment(null)
    setIsFormOpen(false)
  }

  return (
    <div className="investments-page">
      <DashboardHeader title="Investimentos" description="Acompanhe reservas, caixinhas e a evolução estimada dos seus aportes." data={data} onImport={onImport} />

      <InvestmentOverview investments={data.investments} years={horizon} referenceDate={referenceDate} />

      <div className="investment-analytics-grid">
        <InvestmentProjectionChart investments={data.investments} years={horizon} referenceDate={referenceDate} onYearsChange={setHorizon} />
        <PortfolioAllocation investments={data.investments} referenceDate={referenceDate} />
      </div>

      <section className="workspace-card investments-list-card">
        <div className="card-heading investments-list-heading"><div><span className="overline">Carteira</span><h2>Seus investimentos</h2><p>Compare o saldo informado com a estimativa de hoje, os aportes e o crescimento de cada aplicação.</p></div><div className="investment-heading-actions"><span className="count-badge">{data.investments.length}</span><button type="button" className="button-primary investment-create-button" onClick={create}><span aria-hidden="true">＋</span>Adicionar investimento</button></div></div>
        <InvestmentList investments={data.investments} referenceDate={referenceDate} onEdit={edit} onDelete={onDelete} />
      </section>

      {isFormOpen && <InvestmentDialog editingInvestment={editingInvestment} onSubmit={submit} onClose={closeForm} />}
    </div>
  )
}
