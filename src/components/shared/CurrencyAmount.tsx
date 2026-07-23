import { formatCurrency } from '../../utils/currency'

export type CurrencyTone = 'positive' | 'negative' | 'neutral' | 'income' | 'expense' | 'warning'

interface CurrencyAmountProps {
  value: number
  tone: CurrencyTone
}

export function CurrencyAmount({ value, tone }: CurrencyAmountProps) {
  const number = formatCurrency(Math.abs(value)).replace(/^R\$\s*/, '')

  return (
    <strong className={`currency-amount ${tone}`} aria-label={formatCurrency(value)}>
      {value < 0 && <span className="currency-amount-sign">−</span>}
      <span className="currency-amount-symbol">R$</span>
      <span className="currency-amount-number">{number}</span>
    </strong>
  )
}
