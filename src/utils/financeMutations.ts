import type {
  FinanceData,
  FinancialItem,
  FinancialItemDraft,
  Investment,
  InvestmentDraft,
  OccurrenceStatus,
} from '../types/finance'

interface Identity {
  id: string
  timestamp: string
}

export interface MutationResult {
  data: FinanceData
  scheduleChanged?: boolean
}

export function addFinancialItem(data: FinanceData, draft: FinancialItemDraft, identity: Identity): FinanceData {
  const item = itemFromDraft(draft, identity.id, identity.timestamp, identity.timestamp)
  const items = data.items.map((existing) =>
    draft.investmentId && existing.investmentId === draft.investmentId
      ? { ...existing, investmentId: undefined }
      : existing,
  )
  const investments = data.investments.map((investment) =>
    investment.id === draft.investmentId
      ? { ...investment, linkedFinancialItemId: item.id, monthlyContribution: item.amount, updatedAt: identity.timestamp }
      : investment,
  )
  return { ...data, items: [...items, item], investments }
}

export function updateFinancialItem(
  data: FinanceData,
  id: string,
  draft: FinancialItemDraft,
  timestamp: string,
): MutationResult | null {
  const current = data.items.find((item) => item.id === id)
  if (!current) return null
  const updated = itemFromDraft(draft, current.id, current.createdAt, timestamp)
  const scheduleChanged = scheduleSignature(current) !== scheduleSignature(updated)
  const items = data.items
    .map((item) => item.id === id ? updated : item)
    .map((item) => draft.investmentId && item.id !== id && item.investmentId === draft.investmentId
      ? { ...item, investmentId: undefined }
      : item)
  const investments = data.investments.map((investment) => {
    if (investment.id === draft.investmentId) {
      return { ...investment, linkedFinancialItemId: id, monthlyContribution: draft.amount, updatedAt: timestamp }
    }
    if (investment.id === current.investmentId && current.investmentId !== draft.investmentId) {
      return { ...investment, linkedFinancialItemId: undefined, updatedAt: timestamp }
    }
    return investment
  })
  return {
    scheduleChanged,
    data: {
      ...data,
      items,
      investments,
      occurrenceRecords: scheduleChanged
        ? data.occurrenceRecords.filter((record) => !record.key.startsWith(`${id}:`))
        : data.occurrenceRecords,
    },
  }
}

export function deleteFinancialItem(data: FinanceData, id: string, timestamp: string): FinanceData {
  return {
    ...data,
    items: data.items.filter((item) => item.id !== id),
    investments: data.investments.map((investment) => investment.linkedFinancialItemId === id
      ? { ...investment, linkedFinancialItemId: undefined, updatedAt: timestamp }
      : investment),
    occurrenceRecords: data.occurrenceRecords.filter((record) => !record.key.startsWith(`${id}:`)),
  }
}

export function addPortfolioInvestment(
  data: FinanceData,
  draft: InvestmentDraft,
  investmentIdentity: Identity,
  linkedItemId: string,
): FinanceData {
  const linkedItem = draft.createPlannedExpense && draft.monthlyContribution > 0
    ? createInvestmentItem(draft, investmentIdentity.id, linkedItemId, investmentIdentity.timestamp)
    : null
  const investment = investmentFromDraft(
    draft,
    investmentIdentity.id,
    investmentIdentity.timestamp,
    investmentIdentity.timestamp,
    linkedItem?.id,
  )
  return {
    ...data,
    investments: [...data.investments, investment],
    items: linkedItem ? [...data.items, linkedItem] : data.items,
  }
}

export function updatePortfolioInvestment(
  data: FinanceData,
  id: string,
  draft: InvestmentDraft,
  linkedItemId: string,
  timestamp: string,
): FinanceData | null {
  const current = data.investments.find((investment) => investment.id === id)
  if (!current) return null
  const currentLinkedItem = data.items.find((item) => item.id === current.linkedFinancialItemId)
  const shouldLink = draft.createPlannedExpense && draft.monthlyContribution > 0
  const linkedItem = shouldLink
    ? currentLinkedItem
      ? updateInvestmentItem(currentLinkedItem, draft, id, timestamp)
      : createInvestmentItem(draft, id, linkedItemId, timestamp)
    : null
  const investment = investmentFromDraft(draft, current.id, current.createdAt, timestamp, linkedItem?.id)
  const itemsWithoutOldLink = data.items
    .filter((item) => item.id !== currentLinkedItem?.id)
    .map((item) => item.investmentId === id ? { ...item, investmentId: undefined } : item)
  const scheduleChanged = currentLinkedItem && (
    !linkedItem || scheduleSignature(currentLinkedItem) !== scheduleSignature(linkedItem)
  )
  return {
    ...data,
    investments: data.investments.map((item) => item.id === id ? investment : item),
    items: linkedItem ? [...itemsWithoutOldLink, linkedItem] : itemsWithoutOldLink,
    occurrenceRecords: scheduleChanged
      ? data.occurrenceRecords.filter((record) => !record.key.startsWith(`${currentLinkedItem.id}:`))
      : data.occurrenceRecords,
  }
}

export function deletePortfolioInvestment(data: FinanceData, id: string): FinanceData {
  return {
    ...data,
    investments: data.investments.filter((investment) => investment.id !== id),
    items: data.items.map((item) => item.investmentId === id ? { ...item, investmentId: undefined } : item),
  }
}

export function changeOccurrenceStatus(
  data: FinanceData,
  key: string,
  status: OccurrenceStatus,
  confirmedAt: string,
): FinanceData {
  const record = { key, status, ...(status === 'completed' ? { confirmedAt } : {}) }
  return { ...data, occurrenceRecords: [...data.occurrenceRecords.filter((item) => item.key !== key), record] }
}

function itemFromDraft(
  draft: FinancialItemDraft,
  id: string,
  createdAt: string,
  updatedAt: string,
): FinancialItem {
  return {
    id,
    createdAt,
    updatedAt,
    title: draft.title.trim(),
    type: draft.type,
    kind: draft.kind,
    amount: draft.amount,
    category: draft.category.trim(),
    ...(draft.notes?.trim() ? { notes: draft.notes.trim() } : {}),
    ...(draft.investmentId ? { investmentId: draft.investmentId } : {}),
    ...(draft.kind === 'recurring'
      ? { recurrence: {
          dayOfMonth: draft.dayOfMonth ?? 1,
          startMonth: draft.startMonth ?? updatedAt.slice(0, 7),
          ...(draft.endMonth ? { endMonth: draft.endMonth } : {}),
          active: true,
        } }
      : { dueDate: draft.dueDate }),
  }
}

function investmentFromDraft(
  draft: InvestmentDraft,
  id: string,
  createdAt: string,
  updatedAt: string,
  linkedFinancialItemId?: string,
): Investment {
  return {
    id,
    createdAt,
    updatedAt,
    name: draft.name.trim(),
    institution: draft.institution.trim(),
    currentBalance: draft.currentBalance,
    balanceDate: draft.balanceDate,
    annualRateBps: draft.annualRateBps,
    monthlyContribution: draft.monthlyContribution,
    contributionDay: draft.contributionDay,
    ...(linkedFinancialItemId ? { linkedFinancialItemId } : {}),
  }
}

function createInvestmentItem(
  draft: InvestmentDraft,
  investmentId: string,
  id: string,
  timestamp: string,
): FinancialItem {
  return {
    id,
    title: `Aporte · ${draft.name.trim()}`,
    type: 'expense',
    kind: 'recurring',
    amount: draft.monthlyContribution,
    category: 'Investimentos',
    investmentId,
    recurrence: { dayOfMonth: draft.contributionDay, startMonth: draft.balanceDate.slice(0, 7), active: true },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function updateInvestmentItem(
  item: FinancialItem,
  draft: InvestmentDraft,
  investmentId: string,
  timestamp: string,
): FinancialItem {
  return {
    ...item,
    title: `Aporte · ${draft.name.trim()}`,
    amount: draft.monthlyContribution,
    category: 'Investimentos',
    investmentId,
    recurrence: {
      dayOfMonth: draft.contributionDay,
      startMonth: item.recurrence?.startMonth ?? draft.balanceDate.slice(0, 7),
      active: true,
    },
    dueDate: undefined,
    type: 'expense',
    kind: 'recurring',
    updatedAt: timestamp,
  }
}

function scheduleSignature(item: FinancialItem): string {
  return JSON.stringify({
    kind: item.kind,
    dueDate: item.dueDate,
    recurrence: item.recurrence && {
      dayOfMonth: item.recurrence.dayOfMonth,
      startMonth: item.recurrence.startMonth,
      endMonth: item.recurrence.endMonth,
    },
  })
}
