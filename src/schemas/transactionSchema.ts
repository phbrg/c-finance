import { z } from 'zod'

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(value: string): boolean {
  if (!isoDatePattern.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export const transactionSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(100),
  type: z.enum(['income', 'expense']),
  amount: z.number().int().positive(),
  paymentDate: z.string().refine(isValidDate),
  category: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(500).optional(),
  installment: z
    .object({
      seriesId: z.string().min(1),
      current: z.number().int().positive(),
      total: z.number().int().min(2).max(120),
    })
    .refine((value) => value.current <= value.total, 'Invalid installment position')
    .optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const transactionDraftSchema = z
  .object({
    title: z.string().trim().min(1, 'Informe um título.').max(100),
    type: z.enum(['income', 'expense']),
    amount: z.number().int().positive('Informe um valor maior que zero.'),
    paymentDate: z.string().refine(isValidDate, 'Informe uma data válida.'),
    category: z.string().trim().min(1, 'Informe uma categoria.').max(60),
    notes: z.string().trim().max(500, 'Use no máximo 500 caracteres.').optional(),
    installments: z.number().int().min(1).max(120).optional(),
  })
  .superRefine((value, context) => {
    if (value.type === 'income' && value.installments && value.installments > 1) {
      context.addIssue({
        code: 'custom',
        path: ['installments'],
        message: 'Parcelamento está disponível somente para gastos.',
      })
    }
    if (value.installments && value.installments > value.amount) {
      context.addIssue({
        code: 'custom',
        path: ['installments'],
        message: 'O valor deve permitir parcelas de pelo menos R$ 0,01.',
      })
    }
  })

export type TransactionDraftInput = z.infer<typeof transactionDraftSchema>
