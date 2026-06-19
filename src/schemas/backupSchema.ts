import { z } from 'zod'
import { transactionSchema } from './transactionSchema'

export const backupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  transactions: z.array(transactionSchema).max(100_000),
})
