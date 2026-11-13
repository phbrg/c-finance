import { useMemo, useState } from 'react'
import type { FinancialItem, FinancialItemDraft, FinanceData } from '../types/finance'
import { FinancialItemDialog } from '../components/planning/FinancialItemDialog'
import type { ItemSubmitOptions } from '../components/planning/FinancialItemForm'
import { PlanningOverview } from '../components/planning/PlanningOverview'
import { PlannedItemsList } from '../components/planning/PlannedItemsList'
import { categorySuggestions } from '../utils/category'

interface PlanningPageProps {
  data: FinanceData
  month: string
  onAdd: (draft: FinancialItemDraft) => boolean
  onUpdate: (id: string, draft: FinancialItemDraft, options?: { amountFrom?: string }) => boolean
  onDelete: (id: string) => void
}

export function PlanningPage({ data, month, onAdd, onUpdate, onDelete }: PlanningPageProps) {
  const [editingItem, setEditingItem] = useState<FinancialItem | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const suggestions = useMemo(() => categorySuggestions(data.items.map((item) => item.category)), [data.items])

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingItem(null)
  }

  const openForm = (item: FinancialItem | null) => {
    setEditingItem(item)
    setIsFormOpen(true)
  }

  const submitItem = (draft: FinancialItemDraft, options?: ItemSubmitOptions): boolean => {
    const saved = editingItem ? onUpdate(editingItem.id, draft, options) : onAdd(draft)
    if (saved) closeForm()
    return saved
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Planejamento</h1>
          <p>O que entra e sai todo mês, e o que já tem data marcada.</p>
        </div>
      </header>
      {data.items.length > 0 && <PlanningOverview items={data.items} month={month} />}
      <PlannedItemsList
        items={data.items}
        records={data.occurrenceRecords}
        cards={data.cards}
        month={month}
        onCreate={() => openForm(null)}
        onEdit={openForm}
        onDelete={onDelete}
      />
      {isFormOpen && (
        <FinancialItemDialog
          editingItem={editingItem}
          categorySuggestions={suggestions}
          cards={data.cards}
          month={month}
          onSubmit={submitItem}
          onClose={closeForm}
        />
      )}
    </div>
  )
}
