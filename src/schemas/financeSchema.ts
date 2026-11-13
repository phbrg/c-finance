import { z } from 'zod'
import type { FinanceData } from '../types/finance'
import { canonicalCategory } from '../utils/category'
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
  amountChanges: z.array(z.object({ from: isoMonthSchema, amount: moneySchema.positive() })).max(600).optional(),
  category: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(500).optional(),
  cardId: z.string().min(1).optional(),
  installments: z.number().int().min(2).max(60).optional(),
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
  if (item.cardId && item.type !== 'expense') {
    context.addIssue({ code: 'custom', path: ['cardId'], message: 'Only expenses can use a card.' })
  }
  if (item.recurrence?.endMonth && item.recurrence.endMonth < item.recurrence.startMonth) {
    context.addIssue({ code: 'custom', path: ['recurrence', 'endMonth'], message: 'Invalid recurrence range.' })
  }
})

const recordSchema = z.object({
  key: z.string().min(1),
  status: z.enum(['planned', 'completed', 'skipped']),
  confirmedAt: z.string().datetime().optional(),
  amount: moneySchema.nonnegative().optional(),
  paidDate: isoDateSchema.optional(),
})

export const cardSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  // Old cards still carry it; invoices no longer use it.
  closingDay: z.number().int().min(1).max(31).optional(),
  dueDay: z.number().int().min(1).max(31),
  limit: moneySchema.positive().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const financeDataSchema = z.object({
  version: z.literal(5),
  welcomeCompleted: z.boolean().default(false),
  items: z.array(financialItemSchema).max(100_000),
  openingBalance: z.object({ amount: moneySchema, month: isoMonthSchema }).optional(),
  occurrenceRecords: z.array(recordSchema).max(500_000),
  cards: z.array(cardSchema).max(100).default([]),
}).superRefine(validateRelations)

/**
 * v2-v4 data. Old cards and investments are not carried over: they are dropped, together with
 * the items tied to them. v2/v3 record keys end in a full date and the opening balance has a date.
 */
const legacyFinanceDataSchema = z.object({
  version: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  welcomeCompleted: z.boolean().default(false),
  items: z.array(z.record(z.string(), z.unknown())).max(100_000),
  occurrenceRecords: z.array(recordSchema).max(500_000),
  openingBalance: z.object({
    amount: moneySchema,
    month: isoMonthSchema.optional(),
    date: isoDateSchema.optional(),
  }).optional(),
})

const DATE_SUFFIX = /^(.*):(\d{4}-\d{2})-\d{2}$/

/** Record keys become month based, so editing a day never orphans a confirmation. */
export function monthKey(key: string): string {
  return key.replace(DATE_SUFFIX, '$1:$2')
}

export function parseFinanceData(value: unknown): FinanceData {
  const current = financeDataSchema.safeParse(value)
  if (current.success) return tidyCategories(current.data)

  const legacy = legacyFinanceDataSchema.safeParse(value)
  if (!legacy.success) throw current.error

  const dropped = new Set<unknown>()
  const items = legacy.data.items.flatMap(({ investmentId, cardId, ...item }) => {
    if (!investmentId && !cardId) return [item.installments === 1 ? { ...item, installments: undefined } : item]
    dropped.add(item.id)
    return []
  })
  const records = new Map(legacy.data.occurrenceRecords
    .filter((record) => !dropped.has(record.key.split(':')[0]) && !record.key.startsWith('card:'))
    .map((record) => [monthKey(record.key), { ...record, key: monthKey(record.key) }]))
  const opening = legacy.data.openingBalance
  const openingMonth = opening?.month ?? opening?.date?.slice(0, 7)
  return tidyCategories(financeDataSchema.parse({
    version: 5,
    welcomeCompleted: legacy.data.welcomeCompleted,
    items,
    occurrenceRecords: [...records.values()],
    ...(opening && openingMonth ? { openingBalance: { amount: opening.amount, month: openingMonth } } : {}),
  }))
}

/** "mercado" and "Mercado" become one category. */
function tidyCategories(data: FinanceData): FinanceData {
  const seen: string[] = []
  return {
    ...data,
    items: data.items.map((item) => {
      const category = canonicalCategory(item.category, seen)
      if (!seen.includes(category)) seen.push(category)
      return category === item.category ? item : { ...item, category }
    }),
  }
}

function validateRelations(data: z.infer<typeof financeDataSchema>, context: z.RefinementCtx): void {
  const itemIds = new Set<string>()
  const occurrenceKeys = new Set<string>()
  const cardIds = new Set(data.cards.map((card) => card.id))

  data.items.forEach((item, index) => {
    if (itemIds.has(item.id)) context.addIssue({ code: 'custom', path: ['items', index, 'id'], message: 'Duplicate item id.' })
    itemIds.add(item.id)
    if (item.cardId && !cardIds.has(item.cardId)) {
      context.addIssue({ code: 'custom', path: ['items', index, 'cardId'], message: 'Unknown card.' })
    }
  })
  data.occurrenceRecords.forEach((record, index) => {
    if (occurrenceKeys.has(record.key)) {
      context.addIssue({ code: 'custom', path: ['occurrenceRecords', index, 'key'], message: 'Duplicate occurrence key.' })
    }
    occurrenceKeys.add(record.key)
  })
}

export const financialItemDraftSchema = z.object({
  title: z.string().trim().min(1, 'Informe um título.').max(100),
  type: z.enum(['income', 'expense']),
  kind: z.enum(['recurring', 'one-time']),
  amount: moneySchema.positive('Informe um valor maior que zero.'),
  category: z.string().trim().min(1, 'Informe uma categoria.').max(60),
  notes: z.string().trim().max(500).optional(),
  cardId: z.string().min(1).optional(),
  // 1 means no installments.
  installments: z.number().int().min(1).max(60).optional().transform((value) => value && value > 1 ? value : undefined),
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

export const creditCardDraftSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do cartão.').max(60),
  dueDay: z.number().int().min(1).max(31),
  limit: moneySchema.positive().optional(),
})
