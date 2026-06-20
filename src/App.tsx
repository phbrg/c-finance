import { useEffect, useMemo, useState } from 'react'
import { MobileNavigation, Sidebar } from './components/layout/Sidebar'
import { useFinance } from './hooks/useFinance'
import { DashboardPage } from './pages/DashboardPage'
import { PlanningPage } from './pages/PlanningPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { InvestmentsPage } from './pages/InvestmentsPage'
import { WelcomePage } from './pages/WelcomePage'
import type { AppPage } from './types/finance'
import { currentMonth, today } from './utils/date'
import { daysInMonth } from './utils/recurrence'

function cutoffForMonth(month: string): string {
  if (month === currentMonth()) return today()
  return `${month}-${String(daysInMonth(month)).padStart(2, '0')}`
}

function App() {
  const finance = useFinance()
  const [page, setPage] = useState<AppPage>(() =>
    finance.items.length > 0 || finance.investments.length > 0 ? 'dashboard' : 'planning',
  )
  const [month, setMonth] = useState(currentMonth())
  const [cutoffDate, setCutoffDate] = useState(today())
  const occurrences = useMemo(() => finance.occurrencesForMonth(month), [finance, month])

  useEffect(() => {
    if (!finance.message) return
    const timer = window.setTimeout(finance.clearFeedback, 3500)
    return () => window.clearTimeout(timer)
  }, [finance.message, finance.clearFeedback])

  const changeMonth = (nextMonth: string) => {
    setMonth(nextMonth)
    setCutoffDate(cutoffForMonth(nextMonth))
  }

  const hasExistingData =
    finance.items.length > 0 ||
    finance.investments.length > 0 ||
    finance.data.occurrenceRecords.length > 0
  const showWelcome = !finance.data.welcomeCompleted && !hasExistingData

  if (showWelcome) {
    return (
      <WelcomePage
        error={finance.error}
        onStart={() => {
          if (finance.completeWelcome()) setPage('planning')
        }}
        onImport={finance.importBackup}
        onImported={() => setPage('dashboard')}
        onClearError={finance.clearFeedback}
      />
    )
  }

  const pageContent = {
    dashboard: (
      <DashboardPage
        data={finance.data}
        month={month}
        cutoffDate={cutoffDate}
        occurrences={occurrences}
        occurrencesForMonth={finance.occurrencesForMonth}
        onMonthChange={changeMonth}
        onCutoffChange={setCutoffDate}
        onImport={finance.importBackup}
        onGoToPlanning={() => setPage('planning')}
      />
    ),
    planning: (
      <PlanningPage
        data={finance.data}
        onAdd={finance.addItem}
        onUpdate={finance.updateItem}
        onDelete={finance.deleteItem}
        onImport={finance.importBackup}
      />
    ),
    transactions: (
      <TransactionsPage
        data={finance.data}
        month={month}
        occurrences={occurrences}
        onMonthChange={changeMonth}
        onStatusChange={finance.setOccurrenceStatus}
        onImport={finance.importBackup}
      />
    ),
    investments: (
      <InvestmentsPage
        data={finance.data}
        onAdd={finance.addInvestment}
        onUpdate={finance.updateInvestment}
        onDelete={finance.deleteInvestment}
        onImport={finance.importBackup}
      />
    ),
  }[page]

  return (
    <div className="app-layout">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <div className="app-workspace">
        <MobileNavigation currentPage={page} onNavigate={setPage} />
        {(finance.error || finance.message) && (
          <div className={`feedback global-feedback ${finance.error ? 'error' : 'success'}`} role={finance.error ? 'alert' : 'status'}>
            <span>{finance.error ?? finance.message}</span>
            <button type="button" onClick={finance.clearFeedback} aria-label="Fechar mensagem">×</button>
          </div>
        )}
        <main>{pageContent}</main>
      </div>
    </div>
  )
}

export default App
