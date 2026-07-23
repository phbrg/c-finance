import { useMemo, useState } from 'react'
import type { Investment } from '../../types/finance'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/date'
import { estimateInvestmentBalance, projectInvestment } from '../../utils/investmentProjections'
import { filterInvestments, type InvestmentSort } from '../../utils/portfolio'
import { ConfirmDialog } from '../ConfirmDialog'

interface InvestmentListProps {
  investments: Investment[]
  referenceDate: string
  onEdit: (investment: Investment) => void
  onDelete: (id: string) => void
}

const PAGE_SIZE = 8

export function InvestmentList({ investments, referenceDate, onEdit, onDelete }: InvestmentListProps) {
  const [pendingDelete, setPendingDelete] = useState<Investment | null>(null)
  const [query, setQuery] = useState('')
  const [institution, setInstitution] = useState('all')
  const [sort, setSort] = useState<InvestmentSort>('balance')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const institutions = useMemo(() => [...new Set(investments.map((item) => item.institution))].sort(), [investments])
  const filtered = useMemo(() => filterInvestments(investments, query, institution, sort), [investments, query, institution, sort])
  const visible = filtered.slice(0, visibleCount)
  const remainingCount = Math.max(filtered.length - visible.length, 0)
  const totalBalance = investments.reduce((sum, item) => sum + estimateInvestmentBalance(item, referenceDate).estimatedBalance, 0)
  const hasFilters = Boolean(query || institution !== 'all' || sort !== 'balance')
  const resetVisible = () => setVisibleCount(PAGE_SIZE)
  const clearFilters = () => {
    setQuery('')
    setInstitution('all')
    setSort('balance')
    resetVisible()
  }

  if (investments.length === 0) {
    return <div className="investment-empty"><span aria-hidden="true">◇</span><strong>Sua carteira ainda está vazia.</strong><small>Cadastre uma reserva, caixinha ou aplicação para começar a projetar.</small></div>
  }

  return (
    <>
      <div className="investment-list-filters">
        <label className="investment-search"><span className="sr-only">Buscar investimento</span><i aria-hidden="true">⌕</i><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); resetVisible() }} placeholder="Buscar por nome ou instituição" /></label>
        <label className="field"><span>Instituição</span><select value={institution} onChange={(event) => { setInstitution(event.target.value); resetVisible() }}><option value="all">Todas</option>{institutions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="field"><span>Ordenar</span><select value={sort} onChange={(event) => { setSort(event.target.value as InvestmentSort); resetVisible() }}><option value="balance">Maior saldo</option><option value="contribution">Maior aporte</option><option value="rate">Maior taxa</option><option value="name">Nome</option></select></label>
      </div>
      <div className="investment-results-meta"><span>{filtered.length} {filtered.length === 1 ? 'investimento encontrado' : 'investimentos encontrados'}</span>{hasFilters && <button type="button" onClick={clearFilters}>Limpar filtros</button>}</div>

      {filtered.length === 0 ? <div className="investment-filter-empty"><strong>Nenhum investimento encontrado.</strong><span>Tente ajustar a busca ou os filtros selecionados.</span><button type="button" className="button-secondary" onClick={clearFilters}>Limpar filtros</button></div> : (
        <div className="investment-table">
          <div className="investment-table-header" aria-hidden="true"><span>Aplicação</span><span>Carteira</span><span>Estimado hoje</span><span>Em 1 ano</span><span>Aporte</span><span>Ações</span></div>
          <div className="investment-list">
            {visible.map((investment) => {
              const current = estimateInvestmentBalance(investment, referenceDate)
              const oneYear = projectInvestment(investment, 12, current.estimatedBalance)
              const allocation = totalBalance > 0 ? (current.estimatedBalance / totalBalance) * 100 : 0
              return (
                <article key={investment.id} className="investment-row">
                  <div className="investment-identity"><div className="investment-monogram">{investment.name.slice(0, 1).toUpperCase()}</div><div className="investment-main"><strong>{investment.name}</strong><small>{investment.institution} · {(investment.annualRateBps / 100).toLocaleString('pt-BR')}% a.a.</small>{investment.linkedFinancialItemId && <span>Aporte vinculado</span>}</div></div>
                  <div className="investment-allocation" data-label="Na carteira"><strong>{allocation.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong></div>
                  <div className="investment-current" data-label="Estimado hoje"><strong>{formatCurrency(current.estimatedBalance)}</strong><small>{current.accruedEarnings > 0 ? `+ ${formatCurrency(current.accruedEarnings)} desde ${formatDate(investment.balanceDate)}` : `Informado em ${formatDate(investment.balanceDate)}`}</small></div>
                  <div className="investment-year" data-label="Em 1 ano"><strong>{formatCurrency(oneYear.balance)}</strong><small>+ {formatCurrency(oneYear.earnings)} em rendimento</small></div>
                  <div className="investment-contribution" data-label="Aporte mensal"><strong>{formatCurrency(investment.monthlyContribution)}</strong><small>dia {investment.contributionDay}</small></div>
                  <div className="row-actions"><button type="button" className="icon-button edit-button" aria-label={`Editar ${investment.name}`} onClick={() => onEdit(investment)}><span aria-hidden="true">✎</span><span className="investment-action-label">Editar</span></button><button type="button" className="icon-button" aria-label={`Excluir ${investment.name}`} onClick={() => setPendingDelete(investment)}><span aria-hidden="true">×</span><span className="investment-action-label">Excluir</span></button></div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      {remainingCount > 0 && <button type="button" className="investment-show-more" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Mostrar mais <span>{Math.min(remainingCount, PAGE_SIZE)} de {remainingCount}</span></button>}
      {pendingDelete && <ConfirmDialog title="Excluir investimento?" description={`“${pendingDelete.name}” será removido da carteira. O gasto planejado será mantido, mas ficará desvinculado.`} confirmLabel="Excluir" onCancel={() => setPendingDelete(null)} onConfirm={() => { onDelete(pendingDelete.id); setPendingDelete(null) }} />}
    </>
  )
}
