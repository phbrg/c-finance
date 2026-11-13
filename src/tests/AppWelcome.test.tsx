import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { emptyFinanceData, FINANCE_STORAGE_KEY, saveFinanceData } from '../services/financeStorage'

beforeEach(() => { window.location.hash = '' })

const backupFile = (content: string) => new File([content], 'backup.json', { type: 'application/json' })
const validBackup = JSON.stringify({ exportedAt: '2026-11-01T12:00:00.000Z', data: { ...emptyFinanceData(), welcomeCompleted: true } })

describe('welcome', () => {
  it('shows the landing on first use and saves the decision to start', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: /para onde seu dinheiro vai/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Importar backup' })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Começar' })[0])

    expect(screen.queryByRole('button', { name: 'Começar' })).not.toBeInTheDocument()
    expect(window.location.hash).toBe('#/planejamento')
    const saved = JSON.parse(window.localStorage.getItem(FINANCE_STORAGE_KEY) ?? '{}') as { welcomeCompleted?: boolean }
    expect(saved.welcomeCompleted).toBe(true)
  })

  it('every "Começar" button starts the app', () => {
    render(<App />)
    const buttons = screen.getAllByRole('button', { name: 'Começar' })
    expect(buttons).toHaveLength(3)

    fireEvent.click(buttons[2])
    expect(window.location.hash).toBe('#/planejamento')
  })

  it('has section anchors, the backup shortcut and a safe GitHub link', () => {
    render(<App />)

    for (const [name, id] of [['Como funciona', 'como-funciona'], ['Recursos', 'recursos'], ['Privacidade', 'privacidade']]) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', `#${id}`)
      expect(document.getElementById(id)).not.toBeNull()
    }
    expect(screen.getByRole('link', { name: 'Já tenho um backup' })).toHaveAttribute('href', '#restaurar')
    expect(document.getElementById('restaurar')).toContainElement(screen.getByRole('button', { name: 'Importar backup' }))

    const github = screen.getByRole('link', { name: /GitHub/ })
    expect(github).toHaveAttribute('href', 'https://github.com/phbrg/c-finance')
    expect(github).toHaveAttribute('target', '_blank')
    expect(github).toHaveAttribute('rel', 'noreferrer')
  })

  it('imports a valid backup and opens the dashboard', async () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Arquivo de backup'), { target: { files: [backupFile(validBackup)] } })

    expect(await screen.findByText('Backup importado.')).toBeInTheDocument()
    expect(window.location.hash).toBe('#/mes')
    expect(screen.queryByRole('button', { name: 'Importar backup' })).not.toBeInTheDocument()
  })

  it('shows an error for an invalid backup and lets the user close it', async () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Arquivo de backup'), { target: { files: [backupFile('isto não é json')] } })

    expect(await screen.findByRole('alert')).toHaveTextContent('O arquivo não contém JSON válido.')
    expect(screen.getAllByRole('button', { name: 'Começar' })).toHaveLength(3)

    fireEvent.click(screen.getByRole('button', { name: 'Fechar mensagem' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('skips the welcome once it was completed', () => {
    saveFinanceData({ ...emptyFinanceData(), welcomeCompleted: true })
    render(<App />)

    expect(screen.queryByRole('button', { name: 'Começar' })).not.toBeInTheDocument()
  })
})
