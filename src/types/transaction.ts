export type TransactionType = 'income' | 'expense'

export interface InstallmentDetails {
  seriesId: string
  current: number
  total: number
}

export interface Transaction {
  id: string
  title: string
  type: TransactionType
  amount: number
  paymentDate: string
  category: string
  notes?: string
  installment?: InstallmentDetails
  createdAt: string
  updatedAt: string
}

export interface TransactionDraft {
  title: string
  type: TransactionType
  amount: number
  paymentDate: string
  category: string
  notes?: string
  installments?: number
}

export interface TransactionFilters {
  month: string
  type: TransactionType | 'all'
}

export interface FinancialSummaryData {
  totalIncome: number
  totalExpenses: number
  balance: number
  expensePercentage: number | null
  largestExpense: Transaction | null
}
