import { describe, expect, it } from 'vitest'
import { canonicalCategory, categorySuggestions, tidyCategory } from '../utils/category'

describe('category', () => {
  it('tidies spaces and capitalizes', () => {
    expect(tidyCategory('  mercado   livre ')).toBe('Mercado livre')
  })

  it('reuses an existing spelling that differs by case or accents', () => {
    expect(canonicalCategory('mercado', ['Mercado'])).toBe('Mercado')
    expect(canonicalCategory('CAFE', ['Café'])).toBe('Café')
    expect(canonicalCategory('lazer', ['Mercado'])).toBe('Lazer')
  })

  it('suggests the most used first', () => {
    expect(categorySuggestions(['B', 'A', 'B', 'C', 'A', 'B'])).toEqual(['B', 'A', 'C'])
  })
})
