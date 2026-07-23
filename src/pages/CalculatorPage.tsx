import { useMemo, useState } from 'react'
import { SimulationCashFlowChart } from '../components/calculator/SimulationCashFlowChart'
import { SimulationForm, type CalculatorFormState } from '../components/calculator/SimulationForm'
import { SimulationHorizonChart } from '../components/calculator/SimulationHorizonChart'
import { SimulationInsights } from '../components/calculator/SimulationInsights'
import { SimulationOverview } from '../components/calculator/SimulationOverview'
import { DashboardHeader } from '../components/layout/DashboardHeader'
import { financialItemDraftSchema } from '../schemas/financeSchema'
import type { FinanceData, FinancialItemDraft, FinancialOccurrence } from '../types/finance'
import { parseCurrencyToCents } from '../utils/currency'
import { currentMonth, today } from '../utils/date'
import { addMonth } from '../utils/recurrence'
import { simulateTransaction, simulateTransactionHorizon } from '../utils/transactionSimulation'

interface CalculatorPageProps {
  data: FinanceData
  occurrencesForMonth: (month: string) => FinancialOccurrence[]
  onAdd: (draft: FinancialItemDraft) => boolean
  onImport: (content: string) => boolean
}

const initialForm = (): CalculatorFormState => ({
  title: 'Nova simulação',
  type: 'expense',
  kind: 'one-time',
  amount: '',
  category: 'Outros',
  dueDate: today(),
  dayOfMonth: String(new Date().getDate()),
  startMonth: currentMonth(),
  endMonth: '',
  notes: '',
})

export function CalculatorPage({ data, occurrencesForMonth, onAdd, onImport }: CalculatorPageProps) {
  const [form, setForm] = useState(initialForm)
  const [showValidation, setShowValidation] = useState(false)
  const [officializedSignature, setOfficializedSignature] = useState<string | null>(null)
  const parsedDraft = useMemo(() => parseDraft(form), [form])
  const draft = parsedDraft.success ? parsedDraft.data : null
  const analysisMonth = form.kind === 'one-time' ? form.dueDate.slice(0, 7) : form.startMonth
  const simulation = useMemo(
    () => draft && analysisMonth ? simulateTransaction(occurrencesForMonth(analysisMonth), draft, analysisMonth) : null,
    [analysisMonth, draft, occurrencesForMonth],
  )
  const horizon = useMemo(
    () => draft && analysisMonth
      ? simulateTransactionHorizon(Array.from({ length: 6 }, (_, index) => {
          const month = addMonth(analysisMonth, index)
          return { month, occurrences: occurrencesForMonth(month) }
        }), draft)
      : [],
    [analysisMonth, draft, occurrencesForMonth],
  )
  const signature = draft ? JSON.stringify(draft) : null
  const isOfficialized = Boolean(signature && signature === officializedSignature)

  const changeForm = (nextForm: CalculatorFormState) => {
    setForm(nextForm)
    setShowValidation(false)
  }

  const officialize = () => {
    setShowValidation(true)
    if (!draft || !signature) return
    if (onAdd(draft)) setOfficializedSignature(signature)
  }

  const reset = () => {
    setForm(initialForm())
    setShowValidation(false)
    setOfficializedSignature(null)
  }

  return (
    <div className="calculator-page">
      <DashboardHeader title="Calculadora" description="Teste decisões financeiras antes de colocá-las no seu planejamento." data={data} onImport={onImport} />
      <section className="calculator-intro"><div><span className="overline">Ambiente de simulação</span><h2>Veja o efeito antes de decidir.</h2><p>Simule uma compra, um novo gasto fixo, uma bonificação ou um aumento de renda usando os números que você já cadastrou.</p></div><div className="calculator-intro-note"><i aria-hidden="true" /><span><strong>Seus dados reais não mudam</strong>A simulação existe somente nesta tela até você decidir oficializá-la.</span></div></section>
      <SimulationForm form={form} validationMessage={showValidation && !parsedDraft.success ? parsedDraft.error.issues[0]?.message ?? 'Revise os dados informados.' : null} isOfficialized={isOfficialized} onChange={changeForm} onReset={reset} onOfficialize={officialize} />

      {simulation && draft ? (
        <div className="calculator-results">
          <div className="calculator-period"><span>Cenário analisado</span><strong>{formatMonthLabel(analysisMonth)}</strong><p>{recurrenceDescription(draft)}</p></div>
          <SimulationOverview simulation={simulation} draft={draft} />
          <div className="calculator-analysis-grid"><SimulationCashFlowChart simulation={simulation} /><SimulationInsights simulation={simulation} draft={draft} /></div>
          <SimulationHorizonChart points={horizon} />
        </div>
      ) : (
        <section className="workspace-card calculator-empty"><span aria-hidden="true">±</span><h2>Informe um valor para começar</h2><p>Os comparativos, gráficos e insights aparecerão aqui enquanto você monta o cenário.</p></section>
      )}
    </div>
  )
}

function parseDraft(form: CalculatorFormState) {
  return financialItemDraftSchema.safeParse({
    title: form.title,
    type: form.type,
    kind: form.kind,
    amount: parseCurrencyToCents(form.amount) ?? 0,
    category: form.category,
    notes: form.notes || undefined,
    ...(form.kind === 'one-time'
      ? { dueDate: form.dueDate }
      : {
          dayOfMonth: Number(form.dayOfMonth),
          startMonth: form.startMonth,
          endMonth: form.endMonth || undefined,
        }),
  })
}

function recurrenceDescription(draft: FinancialItemDraft): string {
  if (draft.kind === 'one-time') return 'A transação acontece uma única vez neste período.'
  if (draft.endMonth) return `Repete mensalmente de ${formatMonthLabel(draft.startMonth ?? '')} até ${formatMonthLabel(draft.endMonth)}.`
  return 'A transação se repete mensalmente a partir deste período, sem data final.'
}

function formatMonthLabel(month: string): string {
  return new Date(`${month}-02T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
