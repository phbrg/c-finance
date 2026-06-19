import { useEffect } from 'react'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="dialog-backdrop" onMouseDown={onCancel}>
      <div
        className="dialog-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-rose-950 text-xl text-rose-400">!</div>
        <h2 id="dialog-title" className="text-xl font-bold text-slate-100">{title}</h2>
        <p id="dialog-description" className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="button-secondary" onClick={onCancel} autoFocus>Cancelar</button>
          <button type="button" className="button-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
