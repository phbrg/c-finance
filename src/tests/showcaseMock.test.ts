import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseFinanceBackup } from '../services/financeBackupService'

describe('showcase backup mock', () => {
  it('is a valid importable backup with useful sample data', () => {
    const content = readFileSync(resolve(process.cwd(), '..', 'mocks', 'showcase.json'), 'utf-8')
    const data = parseFinanceBackup(content)

    expect(data.items.length).toBeGreaterThan(20)
    expect(data.occurrenceRecords.length).toBeGreaterThan(30)
    expect(data.investments.length).toBeGreaterThan(3)
  })
})
