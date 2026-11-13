import type { ReactNode } from 'react'
import type { AppPage } from '../../types/finance'
import { pageHashes } from './pageHashes'


const icons: Record<AppPage, ReactNode> = {
  month: <><rect x="4" y="5" width="16" height="16" rx="2.5" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
  planning: <><path d="M5 6h14M5 12h14M5 18h9" /></>,
  data: <><path d="M12 4v10M8 10l4 4 4-4M5 19h14" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.4v.6M12 17h.01" /></>,
}

const items: Array<{ page: AppPage; label: string }> = [
  { page: 'month', label: 'Dashboard' },
  { page: 'planning', label: 'Planejamento' },
  { page: 'data', label: 'Dados' },
  { page: 'help', label: 'Ajuda' },
]

// One nav: side column on desktop, bottom bar on mobile (see shell.css).
export function Sidebar({ currentPage }: { currentPage: AppPage }) {
  return (
    <nav className="app-nav" aria-label="Navegação principal">
      <span className="app-brand">c-finance</span>
      {items.map(({ page, label }) => (
        <a key={page} href={pageHashes[page]} aria-current={currentPage === page ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{icons[page]}</svg>
          <span>{label}</span>
        </a>
      ))}
    </nav>
  )
}
