import { useState } from 'react'
import { BackupPanel } from '../components/data/BackupPanel'
import { backupNotice } from '../components/data/backupNotice'
import { CardsPanel } from '../components/data/CardsPanel'
import { OpeningBalancePanel } from '../components/data/OpeningBalancePanel'
import { getLastBackupAt } from '../services/financeStorage'
import type { CreditCardDraft, FinanceData, OpeningBalance } from '../types/finance'
import { formatCurrency } from '../utils/currency'
import { monthLabel } from '../utils/planning'

interface DataPageProps {
  data: FinanceData
  onImport: (content: string) => boolean
  onSetOpeningBalance: (value: OpeningBalance | null) => void
  onAddCard: (draft: CreditCardDraft) => boolean
  onUpdateCard: (id: string, draft: CreditCardDraft) => boolean
  onDeleteCard: (id: string) => void
}

export function DataPage({ data, onImport, onSetOpeningBalance, onAddCard, onUpdateCard, onDeleteCard }: DataPageProps) {
  const { openingBalance, items, cards } = data
  const [lastBackupAt, setLastBackupAt] = useState(getLastBackupAt)
  const backup = backupNotice(lastBackupAt)
  const incomes = items.filter((item) => item.type === 'income').length

  return (
    <div className="page">
      <header className="page-header"><div><h1>Dados</h1><p>Backup, saldo inicial e cartões.</p></div></header>
      <section className="stats data-stats" aria-label="Resumo dos dados">
        <div className="stat">
          <i aria-hidden="true">#</i>
          <span>Lançamentos</span>
          <strong>{items.length}</strong>
          <small>{incomes} {incomes === 1 ? 'entrada' : 'entradas'} e {items.length - incomes} {items.length - incomes === 1 ? 'saída' : 'saídas'}</small>
        </div>
        <div className="stat">
          <i aria-hidden="true">▭</i>
          <span>Cartões</span>
          <strong>{cards.length}</strong>
          <small className="data-ellipsis">{cards.length ? cards.map((card) => card.name).join(', ') : 'nenhum cadastrado'}</small>
        </div>
        <div className={`stat${backup.warn ? ' is-warning' : ''}`}>
          <i aria-hidden="true">↓</i>
          <span>Último backup</span>
          <strong>{backup.value}</strong>
          <small>{backup.detail}</small>
        </div>
        <div className="stat">
          <i aria-hidden="true">$</i>
          <span>Saldo inicial</span>
          <strong className={openingBalance ? 'money' : 'data-unset'}>{openingBalance ? formatCurrency(openingBalance.amount) : 'não definido'}</strong>
          <small>{openingBalance ? `desde ${monthLabel(openingBalance.month)}` : 'os meses partem do zero'}</small>
        </div>
      </section>
      <div className="data-grid">
        <CardsPanel cards={cards} onAdd={onAddCard} onUpdate={onUpdateCard} onDelete={onDeleteCard} />
        <div className="data-col">
          <BackupPanel data={data} onImport={onImport} onExported={() => setLastBackupAt(getLastBackupAt())} />
          {/* key: remount the form when the stored value changes (import, remove) */}
          <OpeningBalancePanel key={openingBalance ? `${openingBalance.month}:${openingBalance.amount}` : 'none'} openingBalance={openingBalance} onSet={onSetOpeningBalance} />
        </div>
      </div>
    </div>
  )
}
