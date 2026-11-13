/**
 * "Nice" axis ticks (1, 2, 5 × 10^n). Zero is always included, unless `includeZero` is false:
 * a balance that lives between R$ 8 mil and R$ 9 mil should not get an axis that starts at 0.
 */
export function niceTicks(min: number, max: number, target = 4, includeZero = true): number[] {
  const low = includeZero ? Math.min(min, 0) : min
  const high = includeZero ? Math.max(max, 0) : max
  if (low === high) return [includeZero ? 0 : low]
  const rawStep = (high - low) / target
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude
  const ticks: number[] = []
  for (let value = Math.floor(low / step) * step; value < high + step; value += step) {
    ticks.push(Math.round(value))
  }
  return ticks
}

/** Short money label for axes, in reais: 1500000 cents -> "R$ 15 mil". */
export function compactMoney(cents: number): string {
  const reais = cents / 100
  const abs = Math.abs(reais)
  const sign = reais < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}R$ ${trim(abs / 1_000_000)} mi`
  if (abs >= 1_000) return `${sign}R$ ${trim(abs / 1_000)} mil`
  return `${sign}R$ ${Math.round(abs)}`
}

// Two decimals, so neighbouring ticks of a narrow range (8,05 mil / 8,1 mil) never read the same.
function trim(value: number): string {
  return value.toFixed(2).replace('.', ',').replace(/,00$/, '').replace(/(,\d)0$/, '$1')
}
