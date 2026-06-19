import type {
  FinancialSummaryData,
  Transaction,
  TransactionFilters,
} from '../types/transaction'

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters,
): Transaction[] {
  return transactions
    .filter((transaction) => {
      const matchesMonth = !filters.month || transaction.paymentDate.startsWith(filters.month)
      const matchesType = filters.type === 'all' || transaction.type === filters.type
      return matchesMonth && matchesType
    })
    .sort((first, second) => second.paymentDate.localeCompare(first.paymentDate))
}

export function calculateFinancialSummary(
  transactions: Transaction[],
): FinancialSummaryData {
  let totalIncome = 0
  let totalExpenses = 0
  let largestExpense: Transaction | null = null

  for (const transaction of transactions) {
    if (transaction.type === 'income') {
      totalIncome += transaction.amount
    } else {
      totalExpenses += transaction.amount
      if (!largestExpense || transaction.amount > largestExpense.amount) {
        largestExpense = transaction
      }
    }
  }

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    expensePercentage: totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : null,
    largestExpense,
  }
}
