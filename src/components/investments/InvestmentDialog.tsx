import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Investment, InvestmentDraft } from '../../types/finance'
import { InvestmentForm } from './InvestmentForm'

interface InvestmentDialogProps {
  editingInvestment: Investment | null
  onSubmit: (draft: InvestmentDraft) => boolean
  onClose: () => void
}

export function InvestmentDialog({ editingInvestment, onSubmit, onClose }: InvestmentDialogProps) {
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
    <div className="investment-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <div ref={dialogRef} className="investment-dialog" role="dialog" aria-modal="true" aria-labelledby="investment-dialog-title">
        <InvestmentForm
          key={editingInvestment?.id ?? 'new-investment'}
          editingInvestment={editingInvestment}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </div>
    </div>,
    document.body,
  )
}
