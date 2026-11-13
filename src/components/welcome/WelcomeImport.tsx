import { useRef, useState, type ChangeEvent } from 'react'
import { readFinanceBackupFile } from '../../services/financeBackupService'

interface WelcomeImportProps {
  onImport: (content: string) => boolean
  onImported: () => void
}

export function WelcomeImport({ onImport, onImported }: WelcomeImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      setError(null)
      if (onImport(await readFinanceBackupFile(file))) onImported()
    } catch (readError: unknown) {
      setError(readError instanceof Error ? readError.message : 'Não foi possível ler o arquivo.')
    }
  }

  return (
    <>
      <button type="button" className="btn" onClick={() => inputRef.current?.click()}>Importar backup</button>
      <input ref={inputRef} className="sr-only" type="file" aria-label="Arquivo de backup" accept="application/json,.json" onChange={handleFile} />
      {error && <p className="backup-error" role="alert">{error}</p>}
    </>
  )
}
