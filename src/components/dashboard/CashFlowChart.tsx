import type { FinancialOccurrence } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { dailyCashFlow } from '../../utils/projections'
import { daysInMonth } from '../../utils/recurrence'

export function CashFlowChart({ occurrences }: { occurrences: FinancialOccurrence[] }) {
  const data = dailyCashFlow(occurrences)
  const month = occurrences[0]?.dueDate.slice(0, 7)
  const monthDays = month ? daysInMonth(month) : 30
  const values = [0, ...data.map((point) => point.balance)]
  const rawMinimum = Math.min(...values)
  const rawMaximum = Math.max(...values)
  const padding = Math.max((rawMaximum - rawMinimum) * 0.12, 1)
  const minimum = rawMinimum < 0 ? rawMinimum - padding : 0
  const maximum = rawMaximum > 0 ? rawMaximum + padding : 0
  const span = Math.max(maximum - minimum, 1)
  const xForDay = (day: number) => ((day - 1) / Math.max(monthDays - 1, 1)) * 100
  const yForValue = (value: number) => 88 - ((value - minimum) / span) * 72
  const zeroY = yForValue(0)
  const chartPath = data.reduce(
    (path, point) => `${path} H ${xForDay(point.day)} V ${yForValue(point.balance)}`,
    `M 0 ${zeroY}`,
  ) + ` H 100`
  const areaPath = `${chartPath} L 100 ${zeroY} L 0 ${zeroY} Z`
  const lowestPoint = data.reduce((lowest, point) => point.balance < lowest.balance ? point : lowest, data[0])
  const largestOutflow = data.filter((point) => point.change < 0).reduce<(typeof data)[number] | null>(
    (largest, point) => !largest || point.change < largest.change ? point : largest,
    null,
  )
  const finalBalance = data.at(-1)?.balance ?? 0
  const axisDays = [...new Set([1, 8, 15, 22, monthDays])]

  return (
    <section className="workspace-card cashflow-card">
      <div className="card-heading cashflow-heading">
        <div>
          <span className="overline">Caminho do saldo</span>
          <h2>Como o dinheiro se movimenta no mês</h2>
          <p>Cada mudança representa os ganhos e gastos previstos para aquele dia.</p>
        </div>
        {data.length > 0 && <div className="cashflow-ending"><span>Saldo no fim do mês</span><strong className={finalBalance >= 0 ? 'amount-income' : 'amount-expense'}>{formatCurrency(finalBalance)}</strong></div>}
      </div>

      {data.length === 0 ? <div className="chart-empty">Adicione itens para visualizar o caminho do seu saldo.</div> : (
        <>
          <div className="cashflow-visual">
            <div className="cashflow-y-labels" aria-hidden="true">
              <span>{formatCurrency(rawMaximum)}</span>
              <span>{formatCurrency(0)}</span>
              <span>{formatCurrency(rawMinimum)}</span>
            </div>
            <div className="cashflow-plot">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Saldo projetado ao longo dos dias do mês">
                <line x1="0" y1="16" x2="100" y2="16" className="chart-grid" />
                <line x1="0" y1="52" x2="100" y2="52" className="chart-grid" />
                <line x1="0" y1="88" x2="100" y2="88" className="chart-grid" />
                <line x1="0" y1={zeroY} x2="100" y2={zeroY} className="cashflow-zero-line" />
                <path d={areaPath} className={finalBalance >= 0 ? 'cashflow-area positive' : 'cashflow-area negative'} />
                <path d={chartPath} className={finalBalance >= 0 ? 'chart-line positive' : 'chart-line negative'} />
              </svg>
              {data.map((point) => (
                <span
                  aria-hidden="true"
                  className={`cashflow-point ${point.change >= 0 ? 'income' : 'expense'}`}
                  key={point.day}
                  style={{ left: `${xForDay(point.day)}%`, top: `${yForValue(point.balance)}%` }}
                  title={`Dia ${point.day}: ${point.change >= 0 ? '+' : '-'}${formatCurrency(Math.abs(point.change))}. Saldo: ${formatCurrency(point.balance)}`}
                />
              ))}
              <div className="cashflow-x-axis" aria-hidden="true">{axisDays.map((day) => <span key={day} style={{ left: `${xForDay(day)}%` }}>{day}</span>)}</div>
            </div>
          </div>

          <div className="cashflow-highlights">
            <div><span>Menor saldo previsto</span><strong className={lowestPoint.balance >= 0 ? '' : 'amount-expense'}>{formatCurrency(lowestPoint.balance)}</strong><small>após as movimentações do dia {lowestPoint.day}</small></div>
            <div><span>Maior saída em um dia</span><strong>{largestOutflow ? formatCurrency(Math.abs(largestOutflow.change)) : 'Nenhuma'}</strong><small>{largestOutflow ? `prevista para o dia ${largestOutflow.day}` : 'sem gastos neste mês'}</small></div>
            <div><span>Dias com movimentação</span><strong>{data.length}</strong><small>agrupados no gráfico acima</small></div>
          </div>
        </>
      )}
    </section>
  )
}
