import { z } from 'zod'
import { isoDateSchema, moneySchema } from './primitives'

export const legacyTransactionSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(100),
  type: z.enum(['income', 'expense']),
  amount: moneySchema.positive(),
  paymentDate: isoDateSchema,
  category: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(500).optional(),
  installment: z.object({
    seriesId: z.string().min(1),
    current: z.number().int().positive(),
    total: z.number().int().min(2).max(120),
  }).refine((value) => value.current <= value.total, 'Invalid installment position').optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const legacyTransactionListSchema = z.array(legacyTransactionSchema).max(100_000)

export const legacyBackupSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  transactions: legacyTransactionListSchema,
})

export type LegacyTransaction = z.infer<typeof legacyTransactionSchema>
