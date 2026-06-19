import type { Transaction } from './transaction'

export interface FinanceBackup {
  version: 1
  exportedAt: string
  transactions: Transaction[]
}
