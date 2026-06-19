import { useRef, useState, type ChangeEvent } from 'react'
import { downloadBackup } from '../services/backupService'
import type { Transaction } from '../types/transaction'
import { ConfirmDialog } from './ConfirmDialog'

interface BackupActionsProps {
  transactions: Transaction[]
  onImport: (content: string) => boolean
}

export function BackupActions({ transactions, onImport }: BackupActionsProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingContent, setPendingContent] = useState<string | null>(null)
  const [readError, setReadError] = useState<string | null>(null)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setReadError('O arquivo excede o limite de 10 MB.')
      return
    }
    try {
      setPendingContent(await file.text())
      setReadError(null)
    } catch {
      setReadError('Não foi possível ler o arquivo selecionado.')
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="button-secondary" disabled={transactions.length === 0} onClick={() => downloadBackup(transactions)}>Exportar JSON</button>
        <button type="button" className="button-secondary" onClick={() => inputRef.current?.click()}>Importar JSON</button>
        <input ref={inputRef} className="sr-only" type="file" accept="application/json,.json" onChange={handleFile} />
      </div>
      {readError && <p className="mt-2 text-right text-xs text-rose-400" role="alert">{readError}</p>}
      {pendingContent !== null && (
        <ConfirmDialog
          title="Substituir dados atuais?"
          description="A importação substituirá todas as transações deste navegador pelos dados do backup. Essa ação não pode ser desfeita."
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
