import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'
import { emptyFinanceData, FINANCE_STORAGE_KEY, saveFinanceData } from '../services/financeStorage'

describe('welcome experience', () => {
  it('shows the landing page on the first visit and persists the decision to start', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /Seu dinheiro faz mais sentido/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Começar meu planejamento/ }))

    expect(screen.getByRole('heading', { name: 'Planejamento' })).toBeInTheDocument()
    const saved = JSON.parse(window.localStorage.getItem(FINANCE_STORAGE_KEY) ?? '{}') as { welcomeCompleted?: boolean }
    expect(saved.welcomeCompleted).toBe(true)
  })

  it('does not show the landing page after the introduction was completed', () => {
    saveFinanceData({ ...emptyFinanceData(), welcomeCompleted: true })
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Planejamento' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Começar meu planejamento/ })).not.toBeInTheDocument()
  })
})
