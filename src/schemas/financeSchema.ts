import { z } from 'zod'
import type { FinanceData } from '../types/finance'
import { isoDateSchema, isoMonthSchema, moneySchema } from './primitives'

const recurrenceSchema = z.object({
  dayOfMonth: z.number().int().min(1).max(31),
  startMonth: isoMonthSchema,
  endMonth: isoMonthSchema.optional(),
  active: z.boolean(),
})

export const financialItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(100),
  type: z.enum(['income', 'expense']),
  kind: z.enum(['recurring', 'one-time']),
  amount: moneySchema.positive(),
  category: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(500).optional(),
  investmentId: z.string().min(1).optional(),
  recurrence: recurrenceSchema.optional(),
  dueDate: isoDateSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).superRefine((item, context) => {
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

const investmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(100),
  institution: z.string().trim().min(1).max(100),
  currentBalance: moneySchema.nonnegative(),
  balanceDate: isoDateSchema,
  annualRateBps: z.number().int().safe().min(0).max(1_000_000),
  monthlyContribution: moneySchema.nonnegative(),
  contributionDay: z.number().int().min(1).max(31),
  linkedFinancialItemId: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

const dataFields = {
  welcomeCompleted: z.boolean().default(false),
  items: z.array(financialItemSchema).max(100_000),
  investments: z.array(investmentSchema).max(10_000).default([]),
}

export const financeDataSchema = z.object({
  version: z.literal(3),
  ...dataFields,
  occurrenceRecords: z.array(z.object({
    key: z.string().min(1),
    status: z.enum(['planned', 'completed', 'skipped']),
    confirmedAt: z.string().datetime().optional(),
  })).max(500_000),
}).superRefine(validateRelations)

const legacyFinanceDataSchema = z.object({
  version: z.literal(2),
  ...dataFields,
  occurrenceRecords: z.array(z.object({
    key: z.string().min(1),
    status: z.enum(['planned', 'completed', 'skipped']),
    completedAt: z.string().datetime().optional(),
  })).max(500_000),
  openingBalance: z.object({ amount: moneySchema, date: isoDateSchema }).optional(),
})

export function parseFinanceData(value: unknown): FinanceData {
  const current = financeDataSchema.safeParse(value)
  if (current.success) return current.data

  const legacy = legacyFinanceDataSchema.safeParse(value)
  if (!legacy.success) throw current.error

  return financeDataSchema.parse({
    version: 3,
    welcomeCompleted: legacy.data.welcomeCompleted,
    items: legacy.data.items,
    investments: legacy.data.investments,
    occurrenceRecords: legacy.data.occurrenceRecords.map(({ key, status }) => ({ key, status })),
  })
}

function validateRelations(data: z.infer<typeof financeDataSchema>, context: z.RefinementCtx): void {
  const itemIds = new Set<string>()
  const investmentIds = new Set<string>()
  const occurrenceKeys = new Set<string>()

  data.items.forEach((item, index) => {
    if (itemIds.has(item.id)) context.addIssue({ code: 'custom', path: ['items', index, 'id'], message: 'Duplicate item id.' })
    itemIds.add(item.id)
  })
  data.investments.forEach((investment, index) => {
    if (investmentIds.has(investment.id)) context.addIssue({ code: 'custom', path: ['investments', index, 'id'], message: 'Duplicate investment id.' })
    investmentIds.add(investment.id)
  })
  data.occurrenceRecords.forEach((record, index) => {
    if (occurrenceKeys.has(record.key)) {
      context.addIssue({ code: 'custom', path: ['occurrenceRecords', index, 'key'], message: 'Duplicate occurrence key.' })
    }
    occurrenceKeys.add(record.key)
  })
  data.items.forEach((item, index) => {
    if (item.investmentId && !investmentIds.has(item.investmentId)) {
      context.addIssue({ code: 'custom', path: ['items', index, 'investmentId'], message: 'Unknown investment.' })
    }
  })
  data.investments.forEach((investment, index) => {
    if (investment.linkedFinancialItemId && !itemIds.has(investment.linkedFinancialItemId)) {
      context.addIssue({ code: 'custom', path: ['investments', index, 'linkedFinancialItemId'], message: 'Unknown financial item.' })
    }
  })
}

export const financialItemDraftSchema = z.object({
  title: z.string().trim().min(1, 'Informe um título.').max(100),
  type: z.enum(['income', 'expense']),
  kind: z.enum(['recurring', 'one-time']),
  amount: moneySchema.positive('Informe um valor maior que zero.'),
  category: z.string().trim().min(1, 'Informe uma categoria.').max(60),
  notes: z.string().trim().max(500).optional(),
  investmentId: z.string().min(1).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  startMonth: isoMonthSchema.optional(),
  endMonth: isoMonthSchema.optional(),
  dueDate: isoDateSchema.optional(),
}).superRefine((draft, context) => {
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
  currentBalance: moneySchema.nonnegative(),
  balanceDate: isoDateSchema,
  annualRateBps: z.number().int().safe().min(0).max(1_000_000),
  monthlyContribution: moneySchema.nonnegative(),
  contributionDay: z.number().int().min(1).max(31),
  createPlannedExpense: z.boolean(),
})
