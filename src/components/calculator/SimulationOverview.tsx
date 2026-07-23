import type { FinancialItemDraft } from '../../types/finance'
import type { TransactionSimulation } from '../../utils/transactionSimulation'
import { CurrencyAmount, type CurrencyTone } from '../shared/CurrencyAmount'

export function SimulationOverview({ simulation, draft }: { simulation: TransactionSimulation; draft: FinancialItemDraft }) {
  const afterTone = balanceTone(simulation.after.projectedBalance)
  const impactTone: CurrencyTone = simulation.balanceImpact >= 0 ? 'positive' : 'negative'

  return (
    <section className="calculator-overview" aria-label="Resumo da simulação">
      <article className="metric-card calculator-metric neutral"><span>Saldo previsto atualmente</span><CurrencyAmount value={simulation.before.projectedBalance} tone={balanceTone(simulation.before.projectedBalance)} /><small>sem considerar este cenário</small></article>
      <article className={`metric-card calculator-metric result balance-${afterTone}`}><div className="metric-card-label"><span>Saldo após a simulação</span><em>{balanceLabel(simulation.after.projectedBalance)}</em></div><CurrencyAmount value={simulation.after.projectedBalance} tone={afterTone} /><small>previsão para o fim do mês</small></article>
      <article className={`metric-card calculator-metric impact ${simulation.balanceImpact >= 0 ? 'positive' : 'negative'}`}><span>Impacto direto no saldo</span><CurrencyAmount value={simulation.balanceImpact} tone={impactTone} /><small>{draft.kind === 'recurring' ? 'repetido nos próximos meses' : 'somente no mês selecionado'}</small></article>
      <article className={`metric-card calculator-metric ${draft.type}`}><span>{draft.type === 'expense' ? 'Gastos após a compra' : 'Ganhos após o aumento'}</span><CurrencyAmount value={draft.type === 'expense' ? simulation.after.expectedExpenses : simulation.after.expectedIncome} tone={draft.type === 'expense' ? 'expense' : 'income'} /><small>{relativeLabel(simulation, draft)}</small></article>
    </section>
  )
}

function balanceTone(value: number): CurrencyTone {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

function balanceLabel(value: number): string {
  if (value > 0) return 'Positivo'
  if (value < 0) return 'Negativo'
  return 'Zerado'
}

function relativeLabel(simulation: TransactionSimulation, draft: FinancialItemDraft): string {
  if (simulation.relativeImpactPercentage === null) return draft.type === 'expense' ? 'sem ganhos cadastrados para comparar' : 'primeiro ganho previsto no mês'
  const value = simulation.relativeImpactPercentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  return draft.type === 'expense' ? `equivale a ${value}% dos ganhos do mês` : `aumenta os ganhos previstos em ${value}%`
}
