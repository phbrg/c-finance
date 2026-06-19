import { useState } from 'react'
import type { Investment } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { projectInvestment } from '../../utils/investmentProjections'
import { ConfirmDialog } from '../ConfirmDialog'

interface InvestmentListProps {
  investments: Investment[]
  onEdit: (investment: Investment) => void
  onDelete: (id: string) => void
}

export function InvestmentList({ investments, onEdit, onDelete }: InvestmentListProps) {
  const [pendingDelete, setPendingDelete] = useState<Investment | null>(null)

  if (investments.length === 0) {
    return <div className="investment-empty"><strong>Sua carteira ainda está vazia.</strong><span>Cadastre uma reserva, caixinha ou aplicação para começar a projetar.</span></div>
  }

  return (
    <div className="investment-list">
      {investments.map((investment) => {
        const oneYear = projectInvestment(investment, 12)
        return (
          <article key={investment.id} className="investment-row">
            <div className="investment-monogram">{investment.name.slice(0, 1).toUpperCase()}</div>
            <div className="investment-main"><strong>{investment.name}</strong><small>{investment.institution} · {(investment.annualRateBps / 100).toLocaleString('pt-BR')}% a.a.</small>{investment.linkedFinancialItemId && <span>Aporte vinculado</span>}</div>
            <div><small>Saldo atual</small><strong>{formatCurrency(investment.currentBalance)}</strong></div>
            <div><small>Em 1 ano</small><strong>{formatCurrency(oneYear.balance)}</strong></div>
            <div><small>Aporte mensal</small><strong>{formatCurrency(investment.monthlyContribution)}</strong></div>
            <div className="row-actions"><button type="button" className="icon-button edit-button" aria-label={`Editar ${investment.name}`} onClick={() => onEdit(investment)}>✎</button><button type="button" className="icon-button" aria-label={`Excluir ${investment.name}`} onClick={() => setPendingDelete(investment)}>×</button></div>
          </article>
        )
      })}
      {pendingDelete && <ConfirmDialog title="Excluir investimento?" description={`“${pendingDelete.name}” será removido da carteira. O gasto planejado será mantido, mas ficará desvinculado.`} confirmLabel="Excluir" onCancel={() => setPendingDelete(null)} onConfirm={() => { onDelete(pendingDelete.id); setPendingDelete(null) }} />}
    </div>
  )
}
