import type { FinanceData } from '../../types/finance'
import { FinanceBackupActions } from '../shared/FinanceBackupActions'

interface Props {
  data: FinanceData
  onImport: (content: string) => boolean
  onExported: () => void
}

export function BackupPanel({ data, onImport, onExported }: Props) {
  return (
    <section className="panel data-panel" aria-labelledby="backup-title">
      <div className="panel-head"><h2 id="backup-title">Backup</h2></div>
      <p className="muted">Tudo fica salvo só neste navegador. Se você limpar os dados dele ou trocar de computador, perde o que não estiver num arquivo de backup. Guarde o arquivo em outro lugar.</p>
      <FinanceBackupActions data={data} onImport={onImport} onExported={onExported} />
    </section>
  )
}
