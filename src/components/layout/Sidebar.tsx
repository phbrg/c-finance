import type { ReactNode } from 'react'
import type { AppPage } from '../../types/finance'

interface SidebarProps {
  currentPage: AppPage
  onNavigate: (page: AppPage) => void
}

type NavigationIcon = 'dashboard' | 'planning' | 'transactions' | 'investments' | 'faq'

const items: Array<{ page: AppPage; label: string; icon: NavigationIcon }> = [
  { page: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { page: 'planning', label: 'Planejamento', icon: 'planning' },
  { page: 'transactions', label: 'Lançamentos', icon: 'transactions' },
  { page: 'investments', label: 'Investimentos', icon: 'investments' },
  { page: 'faq', label: 'Ajuda', icon: 'faq' },
]

function NavigationIcon({ name }: { name: NavigationIcon }) {
  const paths: Record<NavigationIcon, ReactNode> = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="4" rx="1.5" /><rect x="14" y="11" width="7" height="10" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    planning: <><path d="M7 3v3M17 3v3M4 9h16" /><rect x="4" y="5" width="16" height="16" rx="2.5" /><path d="M8 13h3M8 17h6" /></>,
    transactions: <><path d="M5 7h14M15 3l4 4-4 4M19 17H5M9 13l-4 4 4 4" /></>,
    investments: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /><path d="m4 10 6-5 6 7 5-6" /></>,
    faq: <><circle cx="12" cy="12" r="9" /><path d="M9.8 9a2.35 2.35 0 0 1 4.55.8c0 1.8-2.35 2-2.35 3.7M12 17h.01" /></>,
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span>c-finance</span>
        <small>finanças pessoais</small>
      </div>
      <p className="sidebar-section-label">Seu espaço</p>
      <nav aria-label="Navegação principal">
        {items.map((item) => (
          <button
            key={item.page}
            type="button"
            className={currentPage === item.page ? 'active' : ''}
            onClick={() => onNavigate(item.page)}
          >
            <span><NavigationIcon name={item.icon} /></span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-privacy">
        <i aria-hidden="true" />
        <span><strong>Dados privados</strong>Salvos somente neste navegador.</span>
      </div>
    </aside>
  )
}

export function MobileNavigation({ currentPage, onNavigate }: SidebarProps) {
  return (
    <nav className="mobile-navigation" aria-label="Navegação principal">
      {items.map((item) => (
        <button
          key={item.page}
          type="button"
          className={currentPage === item.page ? 'active' : ''}
          onClick={() => onNavigate(item.page)}
        >
          <span><NavigationIcon name={item.icon} /></span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
