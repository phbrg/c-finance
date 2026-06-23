import type { TransactionType } from './common'

export type FinancialItemKind = 'recurring' | 'one-time'
export type OccurrenceStatus = 'planned' | 'completed' | 'skipped'

export interface RecurrenceRule {
  dayOfMonth: number
  startMonth: string
  endMonth?: string
  active: boolean
}

export interface FinancialItem {
  id: string
  title: string
  type: TransactionType
  kind: FinancialItemKind
  amount: number
  category: string
  notes?: string
  investmentId?: string
  recurrence?: RecurrenceRule
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface FinancialItemDraft {
  title: string
  type: TransactionType
  kind: FinancialItemKind
  amount: number
  category: string
  notes?: string
  investmentId?: string
  dayOfMonth?: number
  startMonth?: string
  endMonth?: string
  dueDate?: string
}

export interface OccurrenceRecord {
  key: string
  status: OccurrenceStatus
  confirmedAt?: string
}

export interface FinanceData {
  version: 3
  welcomeCompleted: boolean
  items: FinancialItem[]
  occurrenceRecords: OccurrenceRecord[]
  investments: Investment[]
}

export interface FinancialOccurrence {
  key: string
  itemId: string
  title: string
  type: TransactionType
  kind: FinancialItemKind
  amount: number
  category: string
  dueDate: string
  status: OccurrenceStatus
  confirmedAt?: string
  investmentId?: string
}

export interface Investment {
  id: string
  name: string
  institution: string
  currentBalance: number
  balanceDate: string
  annualRateBps: number
  monthlyContribution: number
  contributionDay: number
  linkedFinancialItemId?: string
  createdAt: string
  updatedAt: string
}

export interface InvestmentDraft {
  name: string
  institution: string
  currentBalance: number
  balanceDate: string
  annualRateBps: number
  monthlyContribution: number
  contributionDay: number
  createPlannedExpense: boolean
}

export interface InvestmentProjection {
  balance: number
  principal: number
  earnings: number
}

export interface DashboardSummary {
  expectedIncome: number
  expectedIncomeUntilCutoff: number
  receivedIncome: number
  expectedExpenses: number
  expectedExpensesUntilCutoff: number
  paidExpenses: number
  pendingIncome: number
  pendingExpenses: number
  realizedBalance: number
  projectedBalance: number
  fixedCommitmentPercentage: number | null
}

export type AppPage = 'dashboard' | 'planning' | 'transactions' | 'investments'
