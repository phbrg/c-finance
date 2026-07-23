import type { FinancialItemDraft } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import type { TransactionSimulation } from '../../utils/transactionSimulation'

export function SimulationInsights({ simulation, draft }: { simulation: TransactionSimulation; draft: FinancialItemDraft }) {
  const afterBalance = simulation.after.projectedBalance
  const ratioChange = simulation.expenseRatioBefore !== null && simulation.expenseRatioAfter !== null
    ? simulation.expenseRatioAfter - simulation.expenseRatioBefore
    : null

  return (
    <section className="workspace-card calculator-insights-card">
      <div className="card-heading"><div><span className="overline">Leitura do cenário</span><h2>O que estes números significam</h2><p>Uma interpretação rápida para ajudar na decisão.</p></div></div>
      <div className="calculator-insight-list">
        <article className={afterBalance < 0 ? 'danger' : 'positive'}><span>Fechamento do mês</span><strong>{afterBalance < 0 ? 'Saldo negativo' : 'Saldo preservado'}</strong><p>{afterBalance < 0 ? `Faltariam ${formatCurrency(Math.abs(afterBalance))} para fechar o mês no azul.` : `Ainda restariam ${formatCurrency(afterBalance)} depois deste cenário.`}</p></article>
        <article><span>{draft.type === 'expense' ? 'Peso sobre a renda' : 'Variação dos ganhos'}</span><strong>{simulation.relativeImpactPercentage === null ? 'Sem base' : `${simulation.relativeImpactPercentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}</strong><p>{simulation.relativeImpactPercentage === null ? 'Cadastre ganhos no mês para criar esta comparação.' : draft.type === 'expense' ? 'Parcela dos ganhos previstos consumida por esta compra.' : 'Crescimento em relação aos ganhos previstos antes da simulação.'}</p></article>
        <article className={ratioChange !== null && ratioChange > 10 ? 'warning' : ''}><span>Comprometimento</span><strong>{simulation.expenseRatioAfter === null ? '—' : `${simulation.expenseRatioAfter.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}</strong><p>{ratioChange === null ? 'Sem renda prevista para calcular gastos sobre ganhos.' : `${ratioChange >= 0 ? '+' : ''}${ratioChange.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} pontos percentuais no mês.`}</p></article>
      </div>
      <p className="calculator-insight-note">Esta é uma projeção baseada no seu planejamento atual. Ela não verifica saldo bancário, limite de cartão, juros ou imprevistos.</p>
    </section>
  )
}
