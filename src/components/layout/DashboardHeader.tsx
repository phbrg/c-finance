import { FinanceBackupActions } from '../shared/FinanceBackupActions'
import type { FinanceData } from '../../types/finance'

interface DashboardHeaderProps {
  title: string
  description: string
  data: FinanceData
  onImport: (content: string) => boolean
}

export function DashboardHeader({ title, description, data, onImport }: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-copy">
        <span className="page-path">Área pessoal <i>/</i> {title}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <FinanceBackupActions data={data} onImport={onImport} />
    </header>
  )
}
