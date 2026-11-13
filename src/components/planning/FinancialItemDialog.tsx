import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { CreditCard, FinancialItem, FinancialItemDraft } from '../../types/finance'
import { FinancialItemForm, type ItemSubmitOptions } from './FinancialItemForm'

interface FinancialItemDialogProps {
  editingItem: FinancialItem | null
  categorySuggestions: string[]
  cards?: CreditCard[]
  month: string
  onSubmit: (draft: FinancialItemDraft, options?: ItemSubmitOptions) => boolean
  onClose: () => void
}

export function FinancialItemDialog({ editingItem, categorySuggestions, cards, month, onSubmit, onClose }: FinancialItemDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
      previouslyFocused?.focus()
    }
  }, [onClose])

  return createPortal(
    <div className="sheet-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <div
        ref={dialogRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="financial-item-dialog-title"
      >
        <FinancialItemForm
          key={editingItem?.id ?? 'new-item'}
          onSubmit={onSubmit}
          editingItem={editingItem}
          categorySuggestions={categorySuggestions}
          cards={cards}
          month={month}
          onCancel={onClose}
        />
      </div>
    </div>,
    document.body,
  )
}
