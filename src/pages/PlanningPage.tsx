import { useState } from 'react'
import type { FinancialItem, FinancialItemDraft, FinanceData } from '../types/finance'
import { DashboardHeader } from '../components/layout/DashboardHeader'
import { FinancialItemDialog } from '../components/planning/FinancialItemDialog'
import { PlanningOverview } from '../components/planning/PlanningOverview'
import { PlannedItemsList } from '../components/planning/PlannedItemsList'

interface PlanningPageProps {
  data: FinanceData
  onAdd: (draft: FinancialItemDraft) => boolean
  onUpdate: (id: string, draft: FinancialItemDraft) => boolean
  onDelete: (id: string) => void
  onImport: (content: string) => boolean
}

export function PlanningPage({ data, onAdd, onUpdate, onDelete, onImport }: PlanningPageProps) {
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingItem(null)
  }

  const createItem = () => {
    setEditingItem(null)
    setIsFormOpen(true)
  }

  const editItem = (item: FinancialItem) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  const submitItem = (draft: FinancialItemDraft): boolean => {
    const saved = editingItem ? onUpdate(editingItem.id, draft) : onAdd(draft)
    if (saved) closeForm()
    return saved
  }

  return (
    <div className="planning-page">
      <DashboardHeader title="Planejamento" description="Construa sua base mensal de ganhos e compromissos." data={data} onImport={onImport} />
      {data.items.length === 0 && (
        <section className="welcome-banner">
          <span>Bem-vindo ao c-finance</span>
          <h2>Sua dashboard começa com uma boa visão do que entra e do que sai.</h2>
          <p>Cadastre ao menos um ganho e seus principais gastos fixos. Depois, acompanhe tudo pela dashboard.</p>
        </section>
      )}
      {data.items.length > 0 && <PlanningOverview items={data.items} />}
      <PlannedItemsList items={data.items} onCreate={createItem} onEdit={editItem} onDelete={onDelete} />
      {isFormOpen && (
        <FinancialItemDialog
          editingItem={editingItem}
          investments={data.investments}
          onSubmit={submitItem}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
