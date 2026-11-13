import type { ReactNode } from 'react'
import type { FinancialOccurrence } from '../../types/finance'
import { MovementRow, type StatusChange } from './MovementRow'
import { groupEntries, signedMoney, type GroupBy, type SortBy } from './monthView'

interface MovementBlockProps {
  label: string
  head: ReactNode
  entries: FinancialOccurrence[]
  groupBy: GroupBy
  sortBy: SortBy
  today: string
  selected: ReadonlySet<string>
  onToggle: (id: string) => void
  onStatusChange: StatusChange
  /** Purchases shown inside each invoice row, by invoice key. */
  invoiceLines: ReadonlyMap<string, FinancialOccurrence[]>
  isExpanded: (key: string) => boolean
  onExpand: (key: string, open: boolean) => void
}

/** What moves the balance: a header with its subtotal, then its rows. */
export function MovementBlock({ label, head, entries, groupBy, sortBy, invoiceLines, isExpanded, onExpand, ...row }: MovementBlockProps) {
  return (
    <section className="mv-block" aria-label={label}>
      <header className="mv-block-head">{head}</header>
      {groupEntries(entries, groupBy, sortBy).map((group) => (
        <div key={group.key} className="mv-group">
          {groupBy === 'category' && <h4 className="mv-group-head"><span>{group.label}</span><span className="money">{signedMoney(group.net)}</span></h4>}
          <ul className="mv-list">
            {group.entries.map((entry) => entry.invoice ? (
              <MovementRow
                key={entry.key}
                {...row}
                entry={entry}
                sortBy={sortBy}
                lines={invoiceLines.get(entry.key) ?? []}
                expanded={isExpanded(entry.key)}
                onExpand={(open) => onExpand(entry.key, open)}
              />
            ) : <MovementRow key={entry.key} {...row} entry={entry} />)}
          </ul>
        </div>
      ))}
    </section>
  )
}
