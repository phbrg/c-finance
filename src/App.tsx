import { useEffect, useState } from 'react'
import { pageHashes } from './components/layout/pageHashes'
import { Sidebar } from './components/layout/Sidebar'
import { useFinance } from './hooks/useFinance'
import { DataPage } from './pages/DataPage'
import { HelpPage } from './pages/HelpPage'
import { MonthPage } from './pages/MonthPage'
import { PlanningPage } from './pages/PlanningPage'
import { WelcomePage } from './pages/WelcomePage'
import type { AppPage } from './types/finance'
import { currentMonth } from './utils/date'

function pageFromHash(): AppPage {
  const found = (Object.keys(pageHashes) as AppPage[]).find((page) => pageHashes[page] === window.location.hash)
  return found ?? 'month'
}

function App() {
  const finance = useFinance()
  const { data } = finance
  const todayMonth = currentMonth()
  const [month, setMonth] = useState(todayMonth)
  const [page, setPage] = useState(pageFromHash)

  useEffect(() => {
    const onHash = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!finance.message) return
    const timer = window.setTimeout(finance.clearFeedback, 3500)
    return () => window.clearTimeout(timer)
  }, [finance.message, finance.clearFeedback])

  const goTo = (target: AppPage) => { window.location.hash = pageHashes[target] }

  const hasExistingData = data.items.length > 0 || data.occurrenceRecords.length > 0
  if (!data.welcomeCompleted && !hasExistingData) {
    return (
      <WelcomePage
        error={finance.error}
        onStart={() => { if (finance.completeWelcome()) goTo('planning') }}
        onImport={finance.importBackup}
        onImported={() => goTo('month')}
        onClearError={finance.clearFeedback}
      />
    )
  }

  const content = {
    month: (
      <MonthPage
        data={data}
        month={month}
        onMonthChange={setMonth}
        onStatusChange={finance.setOccurrenceStatus}
        onAddItem={finance.addItem}
        onGoToData={() => goTo('data')}
      />
    ),
    planning: <PlanningPage data={data} month={todayMonth} onAdd={finance.addItem} onUpdate={finance.updateItem} onDelete={finance.deleteItem} />,
    data: <DataPage data={data} onImport={finance.importBackup} onSetOpeningBalance={finance.setOpeningBalance} onAddCard={finance.addCard} onUpdateCard={finance.updateCard} onDeleteCard={finance.deleteCard} />,
    help: <HelpPage />,
  }[page]

  return (
    <div className="app-layout">
      <Sidebar currentPage={page} />
      <div className="app-workspace">
        {(finance.error || finance.message) && (
          <div className={`toast ${finance.error ? 'error' : 'success'}`} role={finance.error ? 'alert' : 'status'}>
            <span>{finance.error ?? finance.message}</span>
            <button type="button" onClick={finance.clearFeedback} aria-label="Fechar mensagem">×</button>
          </div>
        )}
        <main>{content}</main>
      </div>
    </div>
  )
}

export default App
