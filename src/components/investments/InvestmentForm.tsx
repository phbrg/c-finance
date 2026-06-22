import { useState, type FormEvent } from 'react'
import { investmentDraftSchema } from '../../schemas/financeSchema'
import type { Investment, InvestmentDraft } from '../../types/finance'
import { parseNonNegativeCurrencyToCents } from '../../utils/currency'
import { today } from '../../utils/date'

interface InvestmentFormProps {
  editingInvestment?: Investment | null
  onSubmit: (draft: InvestmentDraft) => boolean
  onCancel?: () => void
}

const emptyForm = {
  name: '',
  institution: '',
  currentBalance: '0,00',
  balanceDate: today(),
  annualRate: '',
  monthlyContribution: '0,00',
  contributionDay: String(new Date().getDate()),
  createPlannedExpense: true,
}

export function InvestmentForm({ editingInvestment, onSubmit, onCancel }: InvestmentFormProps) {
  const [form, setForm] = useState(() => editingInvestment ? formFromInvestment(editingInvestment) : emptyForm)
  const [error, setError] = useState<string | null>(null)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const annualRate = Number(form.annualRate.replace(',', '.'))
    const result = investmentDraftSchema.safeParse({
      name: form.name,
      institution: form.institution,
      currentBalance: parseNonNegativeCurrencyToCents(form.currentBalance) ?? -1,
      balanceDate: form.balanceDate,
      annualRateBps: Number.isFinite(annualRate) ? Math.round(annualRate * 100) : -1,
      monthlyContribution: parseNonNegativeCurrencyToCents(form.monthlyContribution) ?? -1,
      contributionDay: Number(form.contributionDay),
      createPlannedExpense: form.createPlannedExpense,
    })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Revise os valores informados.')
      return
    }
    if (onSubmit(result.data)) {
      setForm({ ...emptyForm, balanceDate: today() })
      setError(null)
    }
  }

  return (
    <form id="investment-form" className={`workspace-card investment-form ${editingInvestment ? 'editing' : ''}`} onSubmit={submit} noValidate>
      <div className="card-heading">
        <div><span className="overline">{editingInvestment ? 'Editando aplicação' : 'Nova aplicação'}</span><h2>{editingInvestment?.name ?? 'Adicionar investimento'}</h2><p>{editingInvestment ? 'Atualize saldo, taxa ou aporte para recalcular toda a carteira.' : 'Registre reservas, caixinhas e aplicações de renda previsível.'}</p></div>
        {editingInvestment && <span className="editing-badge">Modo edição</span>}
      </div>
      <div className="investment-form-note"><span aria-hidden="true">i</span><p>O saldo pode começar em zero. A taxa anual e o aporte mensal serão usados apenas nas simulações.</p></div>
      <div className="form-grid">
        <label className="field wide"><span>Nome</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Reserva de emergência" /></label>
        <label className="field wide"><span>Instituição ou local</span><input value={form.institution} onChange={(event) => setForm({ ...form, institution: event.target.value })} placeholder="Ex.: Caixinha Nubank" /></label>
        <label className="field"><span>Saldo atual</span><div className="money-input"><span>R$</span><input inputMode="decimal" value={form.currentBalance} onChange={(event) => setForm({ ...form, currentBalance: event.target.value })} /></div></label>
        <label className="field"><span>Saldo referente a</span><input type="date" value={form.balanceDate} onChange={(event) => setForm({ ...form, balanceDate: event.target.value })} /></label>
        <label className="field"><span>Rentabilidade estimada</span><div className="suffix-input"><input inputMode="decimal" value={form.annualRate} onChange={(event) => setForm({ ...form, annualRate: event.target.value })} placeholder="Ex.: 10,5" /><span>% ao ano</span></div></label>
        <label className="field"><span>Aporte mensal</span><div className="money-input"><span>R$</span><input inputMode="decimal" value={form.monthlyContribution} onChange={(event) => setForm({ ...form, monthlyContribution: event.target.value })} /></div></label>
        <label className="field"><span>Dia do aporte</span><input type="number" min="1" max="31" value={form.contributionDay} onChange={(event) => setForm({ ...form, contributionDay: event.target.value })} /></label>
        <label className="check-field wide">
          <input type="checkbox" checked={form.createPlannedExpense} onChange={(event) => setForm({ ...form, createPlannedExpense: event.target.checked })} />
          <span><strong>Incluir aporte no Planejamento</strong><small>Cria ou mantém um gasto fixo mensal vinculado a esta aplicação.</small></span>
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        {editingInvestment && <button type="button" className="button-secondary" onClick={onCancel}>Cancelar</button>}
        <button type="submit" className="button-primary">{editingInvestment ? 'Salvar alterações' : 'Adicionar investimento'}</button>
      </div>
    </form>
  )
}

function formFromInvestment(investment: Investment): typeof emptyForm {
  return {
    name: investment.name,
    institution: investment.institution,
    currentBalance: (investment.currentBalance / 100).toFixed(2).replace('.', ','),
    balanceDate: investment.balanceDate,
    annualRate: (investment.annualRateBps / 100).toString().replace('.', ','),
    monthlyContribution: (investment.monthlyContribution / 100).toFixed(2).replace('.', ','),
    contributionDay: String(investment.contributionDay),
    createPlannedExpense: Boolean(investment.linkedFinancialItemId),
  }
}
