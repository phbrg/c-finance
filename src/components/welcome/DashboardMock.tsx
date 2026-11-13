const stats = [
  { label: 'Entradas', value: 'R$ 5.900,00', tone: 'is-income' },
  { label: 'Saídas', value: 'R$ 3.214,90', tone: '' },
  { label: 'Falta pagar', value: 'R$ 1.180,00', tone: 'is-warning' },
  { label: 'Saldo previsto', value: 'R$ 6.685,10', tone: '' },
]

const rows = [
  { day: '05', title: 'Salário', meta: 'Trabalho', value: '+ R$ 5.000,00', income: true },
  { day: '09', title: 'Mercado', meta: 'Mercado', value: '− R$ 412,30', checked: true },
  { day: '11', title: 'Farmácia', meta: 'Saúde', value: '− R$ 86,90', checked: true },
  { day: '12', title: 'Fatura Nubank', meta: '4 compras', value: '− R$ 1.236,40', invoice: true },
]

// [day, height, isIncome] on a 30-day axis; heights are in viewBox units
const bars: Array<[number, number, boolean]> = [[5, 28, true], [8, 8, true], [9, 7, false], [10, 18, false], [11, 4, false], [12, 14, false], [15, 6, false], [20, 3, false], [25, 7, false]]

export function DashboardMock() {
  return (
    <div
      className="welcome-mock"
      role="img"
      aria-label="Exemplo do Dashboard com dados fictícios: números do mês, gráfico dia a dia e a lista de movimentações com dois itens marcados somando R$ 499,20."
    >
      <div className="mock-bar">
        <span className="mock-dots"><i /><i /><i /></span>
        <span>‹ Novembro de 2026 ›</span>
      </div>
      <div className="mock-body">
        <div className="mock-stats">
          {stats.map((stat) => (
            <div key={stat.label} className={`mock-stat ${stat.tone}`}><span>{stat.label}</span><strong>{stat.value}</strong></div>
          ))}
        </div>

        <div className="mock-chart">
          <span className="mock-title">Dia a dia</span>
          <svg viewBox="0 0 300 96" preserveAspectRatio="none">
            <path className="mock-grid" d="M0 6H300M0 40H300M0 74H300" />
            <path className="mock-line" d="M0 28 H45 L50 8 H75 L80 6 H85 L90 9 L100 17 L110 19 L120 25 H145 L150 27 H195 L200 28 H245 L250 31 H300" />
            {bars.map(([day, height, income]) => (
              <rect key={day} className={income ? 'up' : 'down'} x={day * 10 - 4} y={income ? 74 - height : 74} width="7" height={height} rx="1.5" />
            ))}
          </svg>
        </div>

        <div className="mock-list">
          <span className="mock-title">Movimentações</span>
          {rows.map((row) => (
            <div key={row.title} className={`mock-row${row.checked ? ' checked' : ''}`}>
              <span className="mock-check">{row.checked && <svg viewBox="0 0 12 12"><path d="M2.5 6.2 5 8.5l4.5-5" /></svg>}</span>
              <span className="mock-day">{row.day}</span>
              <span className="mock-name"><b>{row.title}</b><small>{row.meta}</small></span>
              <span className={`mock-value${row.income ? ' is-income' : ''}`}>{row.value}</span>
              {row.invoice ? <span className="mock-chevron">›</span> : <span className="mock-chevron" />}
            </div>
          ))}
          <div className="mock-selection">
            <strong>2 selecionados</strong>
            <span>Total <b>− R$ 499,20</b></span>
          </div>
        </div>
      </div>
    </div>
  )
}
