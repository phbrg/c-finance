import type { AppPage } from '../../types/finance'

interface SidebarProps {
  currentPage: AppPage
  onNavigate: (page: AppPage) => void
}

const items: Array<{ page: AppPage; label: string; icon: string }> = [
  { page: 'dashboard', label: 'Dashboard', icon: '◫' },
  { page: 'planning', label: 'Planejamento', icon: '◎' },
  { page: 'transactions', label: 'Lançamentos', icon: '⇄' },
  { page: 'investments', label: 'Investimentos', icon: '↗' },
]

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span>c-finance</span>
        <small>Controle local</small>
      </div>
      <nav aria-label="Navegação principal">
        {items.map((item) => (
          <button
            key={item.page}
            type="button"
            className={currentPage === item.page ? 'active' : ''}
            onClick={() => onNavigate(item.page)}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <p className="sidebar-privacy">Seus dados permanecem neste dispositivo.</p>
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
          <span aria-hidden="true">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )
}
