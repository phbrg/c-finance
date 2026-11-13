import { compactMoney } from '../../utils/chartScale'

export interface MonthBar {
  key: string
  label: string
  /** Accessible name of the column. */
  name: string
  value: number
}

interface MonthBarsProps {
  bars: MonthBar[]
  label: string
  tone: 'income' | 'expense'
  selected: string
  onSelect: (key: string) => void
}

/** One total per month, written above its bar: columns are buttons so the value stays readable and clickable. */
export function MonthBars({ bars, label, tone, selected, onSelect }: MonthBarsProps) {
  const max = Math.max(1, ...bars.map((bar) => bar.value))
  return (
    <ol className={`month-bars is-${tone}`} aria-label={label}>
      {bars.map((bar) => (
        <li key={bar.key}>
          <button type="button" aria-pressed={bar.key === selected} aria-label={bar.name} onClick={() => onSelect(bar.key)}>
            <span className="month-bar-value">{bar.value ? compactMoney(bar.value).replace('R$ ', '') : '–'}</span>
            <span className="month-bar-track"><span style={{ height: `${(bar.value / max) * 100}%` }} /></span>
            <span className="month-bar-label">{bar.label}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}
