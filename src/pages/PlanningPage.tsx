import { useState } from 'react'
import type { FinancialItem, FinancialItemDraft, FinanceData } from '../types/finance'
import { DashboardHeader } from '../components/layout/DashboardHeader'
import { FinancialItemForm } from '../components/planning/FinancialItemForm'
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

  const editItem = (item: FinancialItem) => {
    setEditingItem(item)
    window.requestAnimationFrame(() => {
      document.getElementById('financial-item-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const submitItem = (draft: FinancialItemDraft): boolean => {
    if (!editingItem) return onAdd(draft)
    const saved = onUpdate(editingItem.id, draft)
    if (saved) setEditingItem(null)
    return saved
  }

  return (
    <>
      <DashboardHeader title="Planejamento" description="Construa sua base mensal de ganhos e compromissos." data={data} onImport={onImport} />
      {data.items.length === 0 && (
        <section className="welcome-banner">
          <span>Bem-vindo ao c-finance</span>
          <h2>Sua dashboard começa com uma boa visão do que entra e do que sai.</h2>
          <p>Cadastre ao menos um ganho e seus principais gastos fixos. Depois, acompanhe tudo pela dashboard.</p>
        </section>
      )}
      <div className="planning-layout">
        <FinancialItemForm key={editingItem?.id ?? 'new-item'} onSubmit={submitItem} editingItem={editingItem} investments={data.investments} onCancel={() => setEditingItem(null)} />
        <div className="planning-side">
          <PlannedItemsList items={data.items} onEdit={editItem} onDelete={onDelete} />
        </div>
      </div>
    </>
  )
}
