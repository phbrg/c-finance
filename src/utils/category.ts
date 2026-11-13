import { normalizeSearchText } from './text'

/** Capitalizes the first letter and collapses spaces: "  mercado  " -> "Mercado". */
export function tidyCategory(value: string): string {
  const clean = value.trim().replace(/\s+/g, ' ')
  return clean.charAt(0).toLocaleUpperCase('pt-BR') + clean.slice(1)
}

/** Reuses the spelling of an existing category when it only differs by case or accents. */
export function canonicalCategory(value: string, existing: Iterable<string>): string {
  const tidy = tidyCategory(value)
  const key = normalizeSearchText(tidy)
  for (const category of existing) {
    if (normalizeSearchText(category) === key) return category
  }
  return tidy
}

/** Categories in use, most frequent first, for suggestions. */
export function categorySuggestions(categories: string[]): string[] {
  const counts = new Map<string, number>()
  for (const category of categories) counts.set(category, (counts.get(category) ?? 0) + 1)
  return [...counts.entries()]
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0], 'pt-BR'))
    .map(([category]) => category)
}
