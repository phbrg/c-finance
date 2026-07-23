import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { FinancialItem, FinancialItemDraft, Investment } from '../../types/finance'
import { FinancialItemForm } from './FinancialItemForm'

interface FinancialItemDialogProps {
  editingItem: FinancialItem | null
  investments: Investment[]
  onSubmit: (draft: FinancialItemDraft) => boolean
  onClose: () => void
}

export function FinancialItemDialog({ editingItem, investments, onSubmit, onClose }: FinancialItemDialogProps) {
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
    <div className="financial-item-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <div
        ref={dialogRef}
        className="financial-item-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="financial-item-dialog-title"
      >
        <FinancialItemForm
          key={editingItem?.id ?? 'new-item'}
          onSubmit={onSubmit}
          editingItem={editingItem}
          investments={investments}
          onCancel={onClose}
        />
      </div>
    </div>,
    document.body,
  )
}
