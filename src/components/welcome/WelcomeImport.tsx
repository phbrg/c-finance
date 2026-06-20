import { useRef, useState, type ChangeEvent } from 'react'

interface WelcomeImportProps {
  onImport: (content: string) => boolean
  onImported: () => void
}

export function WelcomeImport({ onImport, onImported }: WelcomeImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setFileName(file.name)
    if (file.size > 10 * 1024 * 1024) {
      setError('O arquivo ultrapassa o limite de 10 MB.')
      return
    }
    try {
      const content = await file.text()
      if (onImport(content)) onImported()
    } catch {
      setError('Não foi possível ler o arquivo selecionado.')
    }
  }

  return (
    <div className="welcome-import">
      <div>
        <span className="welcome-section-number">Já usa o c-finance?</span>
        <h2>Continue de onde parou.</h2>
        <p>Importe seu backup e recupere planejamento, lançamentos e investimentos neste navegador.</p>
      </div>
      <div className="welcome-import-action">
        <button type="button" className="welcome-import-button" onClick={() => inputRef.current?.click()}>
          <span aria-hidden="true">↑</span>
          <strong>Importar meus dados</strong>
          <small>{fileName ?? 'Selecione um backup JSON do c-finance'}</small>
        </button>
        <input ref={inputRef} className="sr-only" type="file" accept="application/json,.json" onChange={handleFile} />
        {error && <p role="alert">{error}</p>}
      </div>
    </div>
  )
}
