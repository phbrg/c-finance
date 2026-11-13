import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HelpPage } from '../pages/HelpPage'

describe('HelpPage', () => {
  it('groups the seven questions by subject', () => {
    render(<HelpPage />)
    const groups = { Começando: 2, Dinheiro: 2, Cartão: 1, 'Seus dados': 2 }
    for (const [title, count] of Object.entries(groups)) {
      const section = screen.getByRole('region', { name: title })
      expect(section.querySelectorAll('details')).toHaveLength(count)
    }
    expect(screen.getAllByText(/\?$/)).toHaveLength(7)
    expect(screen.getByText('Como faço backup?')).toBeInTheDocument()
    expect(screen.getByText('Como acompanho a fatura do cartão?')).toBeInTheDocument()
  })

  it('opens only the first question', () => {
    const { container } = render(<HelpPage />)
    const open = container.querySelectorAll('details[open]')
    expect(open).toHaveLength(1)
    expect(open[0]).toHaveTextContent('Como o app funciona?')
  })

  it('links the first steps to their pages', () => {
    render(<HelpPage />)
    const steps = within(screen.getByRole('region', { name: 'Comece por aqui' })).getAllByRole('link')
    expect(steps.map((link) => link.getAttribute('href'))).toEqual(['#/planejamento', '#/mes', '#/dados'])
  })

  it('links to the project on GitHub in a new tab', () => {
    render(<HelpPage />)
    const link = screen.getByRole('link', { name: /Ver no GitHub/ })
    expect(link).toHaveAttribute('href', 'https://github.com/phbrg/c-finance')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })
})
