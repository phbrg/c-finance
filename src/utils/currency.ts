const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100)
}

export function parseCurrencyToCents(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null

  const cents = Math.round(Number(normalized) * 100)
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null
}

export function parseNonNegativeCurrencyToCents(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const cents = Math.round(Number(normalized) * 100)
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : null
}
