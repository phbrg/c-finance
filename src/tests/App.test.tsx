import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { emptyFinanceData, saveFinanceData } from '../services/financeStorage'

// Pages are tested on their own; here they are stubs so only routing is exercised.
vi.mock('../pages/MonthPage', () => ({ MonthPage: () => <h1>Página mês</h1> }))
vi.mock('../pages/PlanningPage', () => ({ PlanningPage: () => <h1>Página planejamento</h1> }))
vi.mock('../pages/DataPage', () => ({ DataPage: () => <h1>Página dados</h1> }))
vi.mock('../pages/HelpPage', () => ({ HelpPage: () => <h1>Página ajuda</h1> }))

const goTo = (hash: string) => act(() => {
  window.location.hash = hash
  window.dispatchEvent(new HashChangeEvent('hashchange'))
})

beforeEach(() => {
  window.location.hash = ''
  saveFinanceData({ ...emptyFinanceData(), welcomeCompleted: true })
})

describe('navigation', () => {
  it('opens the month by default', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Página mês' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
  })

  it('opens the page named in the hash on load', () => {
    window.location.hash = '#/dados'
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Página dados' })).toBeInTheDocument()
  })

  it('changes page when the hash changes and goes back', () => {
    render(<App />)
    goTo('#/planejamento')
    expect(screen.getByRole('heading', { name: 'Página planejamento' })).toBeInTheDocument()
    goTo('#/dados')
    expect(screen.getByRole('heading', { name: 'Página dados' })).toBeInTheDocument()
    goTo('#/planejamento')
    expect(screen.getByRole('heading', { name: 'Página planejamento' })).toBeInTheDocument()
    goTo('#/ajuda')
    expect(screen.getByRole('heading', { name: 'Página ajuda' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ajuda' })).toHaveAttribute('aria-current', 'page')
  })

  it('opens the help page from the hash on load', () => {
    window.location.hash = '#/ajuda'
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Página ajuda' })).toBeInTheDocument()
  })

  it('falls back to the month on an unknown hash', () => {
    window.location.hash = '#/nada'
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Página mês' })).toBeInTheDocument()
  })

  it.each(['#/cartoes', '#/investimentos'])('sends the removed page %s to the month', (hash) => {
    window.location.hash = hash
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Página mês' })).toBeInTheDocument()
  })

  it('has the four items in the navigation, help last', () => {
    render(<App />)
    const links = screen.getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['Dashboard', 'Planejamento', 'Dados', 'Ajuda'])
    expect(screen.getByRole('link', { name: 'Ajuda' })).toHaveAttribute('href', '#/ajuda')
  })
})
