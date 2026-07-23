import type { FormEvent } from 'react'
import type { FinancialItemKind } from '../../types/finance'
import type { TransactionType } from '../../types/common'

export interface CalculatorFormState {
  title: string
  type: TransactionType
  kind: FinancialItemKind
  amount: string
  category: string
  dueDate: string
  dayOfMonth: string
  startMonth: string
  endMonth: string
  notes: string
}

interface SimulationFormProps {
  form: CalculatorFormState
  validationMessage: string | null
  isOfficialized: boolean
  onChange: (form: CalculatorFormState) => void
  onReset: () => void
  onOfficialize: () => void
}

export function SimulationForm({ form, validationMessage, isOfficialized, onChange, onReset, onOfficialize }: SimulationFormProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onOfficialize()
  }

  return (
    <form className="workspace-card calculator-form" onSubmit={submit} noValidate>
      <div className="card-heading calculator-form-heading">
        <div><span className="overline">Novo cenário</span><h2>O que você quer simular?</h2><p>Preencha o cenário e acompanhe o impacto instantaneamente. Nada será salvo agora.</p></div>
        <span className="calculator-private-badge"><i />Somente simulação</span>
      </div>

      <div className="calculator-form-section">
        <div className="calculator-section-heading"><span>01</span><div><strong>Defina o movimento</strong><small>Escolha o tipo e por quanto tempo ele acontece.</small></div></div>
        <div className="calculator-type-row">
          <div className="calculator-choice-group" role="group" aria-label="Tipo da simulação">
            <button type="button" className={`expense ${form.type === 'expense' ? 'active' : ''}`} aria-label="Gasto" aria-pressed={form.type === 'expense'} onClick={() => onChange({ ...form, type: 'expense' })}><span aria-hidden="true">−</span><div><strong>Gasto</strong><small>Compra ou nova despesa</small></div></button>
            <button type="button" className={`income ${form.type === 'income' ? 'active' : ''}`} aria-label="Ganho" aria-pressed={form.type === 'income'} onClick={() => onChange({ ...form, type: 'income' })}><span aria-hidden="true">＋</span><div><strong>Ganho</strong><small>Aumento, bônus ou renda</small></div></button>
          </div>
          <div className="calculator-frequency" role="group" aria-label="Frequência da simulação">
            <button type="button" className={form.kind === 'one-time' ? 'active' : ''} aria-label="Única" aria-pressed={form.kind === 'one-time'} onClick={() => onChange({ ...form, kind: 'one-time' })}><span aria-hidden="true">1×</span><div><strong>Única</strong><small>Acontece uma vez</small></div></button>
            <button type="button" className={form.kind === 'recurring' ? 'active' : ''} aria-label="Todo mês" aria-pressed={form.kind === 'recurring'} onClick={() => onChange({ ...form, kind: 'recurring' })}><span aria-hidden="true">↻</span><div><strong>Todo mês</strong><small>Repete mensalmente</small></div></button>
          </div>
        </div>
      </div>

      <div className="calculator-form-section">
        <div className="calculator-section-heading"><span>02</span><div><strong>Monte o cenário</strong><small>Informe os dados que serão usados nos cálculos.</small></div></div>
        <div className="calculator-main-fields">
          <label className="field calculator-title-field"><span>Descrição</span><input value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })} placeholder={form.type === 'expense' ? 'Ex.: Notebook novo' : 'Ex.: Aumento salarial'} /></label>
          <label className="field"><span>Valor</span><div className="money-input"><span>R$</span><input inputMode="decimal" value={form.amount} onChange={(event) => onChange({ ...form, amount: event.target.value })} placeholder="0,00" /></div></label>
          <label className="field"><span>Categoria</span><input value={form.category} onChange={(event) => onChange({ ...form, category: event.target.value })} placeholder="Ex.: Tecnologia" /></label>
        </div>
        <div className="calculator-schedule-panel">
          <div className="calculator-schedule-heading"><div><strong>Quando acontece</strong><small>{form.kind === 'recurring' ? 'Defina o início e, se houver, o encerramento.' : 'Escolha o dia em que o valor entra ou sai.'}</small></div><span>{form.kind === 'recurring' ? 'Fixo mensal' : 'Lançamento único'}</span></div>
          <div className={`calculator-schedule-fields ${form.kind}`}>
            {form.kind === 'one-time' ? (
              <label className="field"><span>Data prevista</span><input type="date" value={form.dueDate} onChange={(event) => onChange({ ...form, dueDate: event.target.value })} /></label>
            ) : (
              <>
                <label className="field"><span>Começa em</span><input type="month" value={form.startMonth} onChange={(event) => onChange({ ...form, startMonth: event.target.value })} /></label>
                <label className="field"><span>Dia do mês</span><input type="number" min="1" max="31" value={form.dayOfMonth} onChange={(event) => onChange({ ...form, dayOfMonth: event.target.value })} /></label>
                <label className="field"><span>Termina em <em>opcional</em></span><input type="month" value={form.endMonth} min={form.startMonth} onChange={(event) => onChange({ ...form, endMonth: event.target.value })} /><small className="calculator-field-help">Vazio significa sem data final.</small></label>
              </>
            )}
          </div>
        </div>
        <label className="field calculator-notes-field"><span>Observação <em>opcional</em></span><input value={form.notes} onChange={(event) => onChange({ ...form, notes: event.target.value })} placeholder="Algum detalhe para lembrar ao oficializar" /></label>
      </div>

      {validationMessage && <p className="form-error" role="alert">{validationMessage}</p>}
      <div className="calculator-form-footer">
        <p>A análise abaixo é atualizada enquanto você digita.</p>
        <div><button type="button" className="button-secondary" onClick={onReset}>Limpar</button><button type="submit" className="button-primary" disabled={isOfficialized}>{isOfficialized ? 'Adicionada ao planejamento' : 'Adicionar ao planejamento'}</button></div>
      </div>
    </form>
  )
}
