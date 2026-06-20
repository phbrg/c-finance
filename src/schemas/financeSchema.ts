import { z } from 'zod'

const datePattern = /^\d{4}-\d{2}-\d{2}$/
const monthPattern = /^\d{4}-\d{2}$/

const recurrenceSchema = z.object({
  dayOfMonth: z.number().int().min(1).max(31),
  startMonth: z.string().regex(monthPattern),
  endMonth: z.string().regex(monthPattern).optional(),
  active: z.boolean(),
})

export const financialItemSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().trim().min(1).max(100),
    type: z.enum(['income', 'expense']),
    kind: z.enum(['recurring', 'one-time']),
    amount: z.number().int().positive(),
    category: z.string().trim().min(1).max(60),
    notes: z.string().trim().max(500).optional(),
    investmentId: z.string().min(1).optional(),
    recurrence: recurrenceSchema.optional(),
    dueDate: z.string().regex(datePattern).optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .superRefine((item, context) => {
    if (item.kind === 'recurring' && !item.recurrence) {
      context.addIssue({ code: 'custom', path: ['recurrence'], message: 'Recurrence is required.' })
    }
    if (item.kind === 'one-time' && !item.dueDate) {
      context.addIssue({ code: 'custom', path: ['dueDate'], message: 'Due date is required.' })
    }
    if (item.recurrence?.endMonth && item.recurrence.endMonth < item.recurrence.startMonth) {
      context.addIssue({ code: 'custom', path: ['recurrence', 'endMonth'], message: 'Invalid recurrence range.' })
    }
  })

export const financeDataSchema = z.object({
  version: z.literal(2),
  welcomeCompleted: z.boolean().default(false),
  items: z.array(financialItemSchema).max(100_000),
  occurrenceRecords: z
    .array(
      z.object({
        key: z.string().min(1),
        status: z.enum(['planned', 'completed', 'skipped']),
        completedAt: z.string().datetime().optional(),
      }),
    )
    .max(500_000),
  investments: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().trim().min(1).max(100),
        institution: z.string().trim().min(1).max(100),
        currentBalance: z.number().int().nonnegative(),
        balanceDate: z.string().regex(datePattern),
        annualRateBps: z.number().int().min(0).max(1_000_000),
        monthlyContribution: z.number().int().nonnegative(),
        contributionDay: z.number().int().min(1).max(31),
        linkedFinancialItemId: z.string().min(1).optional(),
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime(),
      }),
    )
    .max(10_000)
    .default([]),
  openingBalance: z
    .object({ amount: z.number().int(), date: z.string().regex(datePattern) })
    .optional(),
})

export const financialItemDraftSchema = z
  .object({
    title: z.string().trim().min(1, 'Informe um título.').max(100),
    type: z.enum(['income', 'expense']),
    kind: z.enum(['recurring', 'one-time']),
    amount: z.number().int().positive('Informe um valor maior que zero.'),
    category: z.string().trim().min(1, 'Informe uma categoria.').max(60),
    notes: z.string().trim().max(500).optional(),
    investmentId: z.string().min(1).optional(),
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    startMonth: z.string().regex(monthPattern).optional(),
    endMonth: z.string().regex(monthPattern).optional(),
    dueDate: z.string().regex(datePattern).optional(),
  })
  .superRefine((draft, context) => {
    if (draft.kind === 'recurring' && (!draft.dayOfMonth || !draft.startMonth)) {
      context.addIssue({ code: 'custom', path: ['dayOfMonth'], message: 'Informe o dia e o mês inicial.' })
    }
    if (draft.kind === 'one-time' && !draft.dueDate) {
      context.addIssue({ code: 'custom', path: ['dueDate'], message: 'Informe a data prevista.' })
    }
    if (draft.startMonth && draft.endMonth && draft.endMonth < draft.startMonth) {
      context.addIssue({ code: 'custom', path: ['endMonth'], message: 'O mês final deve ser posterior ao inicial.' })
    }
  })

export const investmentDraftSchema = z.object({
  name: z.string().trim().min(1, 'Informe um nome.').max(100),
  institution: z.string().trim().min(1, 'Informe a instituição.').max(100),
  currentBalance: z.number().int().nonnegative(),
  balanceDate: z.string().regex(datePattern, 'Informe uma data válida.'),
  annualRateBps: z.number().int().min(0).max(1_000_000),
  monthlyContribution: z.number().int().nonnegative(),
  contributionDay: z.number().int().min(1).max(31),
  createPlannedExpense: z.boolean(),
})
