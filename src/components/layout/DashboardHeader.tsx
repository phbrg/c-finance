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
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <FinanceBackupActions data={data} onImport={onImport} />
    </header>
  )
}
