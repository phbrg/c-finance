import { useRef, useState, type ChangeEvent } from 'react'
import { downloadFinanceBackup } from '../../services/financeBackupService'
import type { FinanceData } from '../../types/finance'
import { ConfirmDialog } from '../ConfirmDialog'

interface FinanceBackupActionsProps {
  data: FinanceData
  onImport: (content: string) => boolean
}

export function FinanceBackupActions({ data, onImport }: FinanceBackupActionsProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingContent, setPendingContent] = useState<string | null>(null)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || file.size > 10 * 1024 * 1024) return
    setPendingContent(await file.text())
  }

  return (
    <>
      <div className="header-actions">
        <button type="button" className="button-secondary" onClick={() => downloadFinanceBackup(data)}>Exportar</button>
        <button type="button" className="button-secondary" onClick={() => inputRef.current?.click()}>Importar</button>
        <input ref={inputRef} className="sr-only" type="file" accept="application/json,.json" onChange={handleFile} />
      </div>
      {pendingContent !== null && (
        <ConfirmDialog
          title="Substituir os dados atuais?"
          description="O backup substituirá todo o planejamento e todas as confirmações salvas neste navegador."
          confirmLabel="Importar backup"
          onCancel={() => setPendingContent(null)}
          onConfirm={() => {
            onImport(pendingContent)
            setPendingContent(null)
          }}
        />
      )}
    </>
  )
}
