import { WelcomeImport } from '../components/welcome/WelcomeImport'

interface WelcomePageProps {
  error: string | null
  onStart: () => void
  onImport: (content: string) => boolean
  onImported: () => void
  onClearError: () => void
}

const benefits = [
  {
    number: '01',
    title: 'Planeje o mês antes que ele aconteça',
    description: 'Organize ganhos, contas fixas e gastos únicos para enxergar o que ainda está por vir.',
  },
  {
    number: '02',
    title: 'Entenda os números sem planilhas',
    description: 'Acompanhe previsto, realizado, categorias e projeções em uma dashboard direta ao ponto.',
  },
  {
    number: '03',
    title: 'Cuide também do que você está construindo',
    description: 'Registre reservas e investimentos, simule aportes e conecte tudo ao planejamento.',
  },
]

export function WelcomePage({ error, onStart, onImport, onImported, onClearError }: WelcomePageProps) {
  return (
    <div className="welcome-page">
      <header className="welcome-header">
        <div className="welcome-shell">
          <a className="welcome-brand" href="#inicio" aria-label="c-finance, início">c-finance</a>
          <span className="welcome-local-badge"><i /> Seus dados ficam no navegador</span>
        </div>
      </header>

      {error && (
        <div className="welcome-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onClearError} aria-label="Fechar mensagem">×</button>
        </div>
      )}

      <main id="inicio">
        <section className="welcome-hero welcome-shell">
          <div className="welcome-copy">
            <span className="welcome-eyebrow">Controle financeiro local-first</span>
            <h1>Seu dinheiro faz mais sentido quando você consegue enxergar o caminho.</h1>
            <p>O c-finance reúne planejamento, acompanhamento e projeções em um só lugar — sem conta, sem anúncios e sem enviar sua vida financeira para um servidor.</p>
            <div className="welcome-cta-row">
              <button type="button" className="welcome-primary-cta" onClick={onStart}>Começar meu planejamento <span aria-hidden="true">→</span></button>
              <a href="#restaurar">Já tenho um backup</a>
            </div>
            <div className="welcome-trust-row">
              <span>Sem login</span><span>Sem backend</span><span>Backup sob seu controle</span>
            </div>
          </div>

          <div className="welcome-preview" aria-label="Prévia da dashboard do c-finance">
            <div className="preview-top"><span>Visão de junho</span><i>•••</i></div>
            <div className="preview-balance"><small>Saldo projetado</small><strong>R$ 3.280,00</strong><span>+12,4% em relação ao mês anterior</span></div>
            <div className="preview-metrics"><div><small>Ganhos</small><strong>R$ 5.200</strong></div><div><small>Gastos</small><strong>R$ 1.920</strong></div></div>
            <div className="preview-chart">
              <div className="preview-bars"><i style={{ height: '30%' }} /><i style={{ height: '42%' }} /><i style={{ height: '38%' }} /><i style={{ height: '61%' }} /><i style={{ height: '55%' }} /><i style={{ height: '78%' }} /><i style={{ height: '88%' }} /></div>
              <span>Projeção do mês</span>
            </div>
            <div className="preview-insight"><i>↗</i><span><small>Leitura rápida</small><strong>Seus gastos fixos usam 36% da renda.</strong></span></div>
          </div>
        </section>

        <section className="welcome-benefits welcome-shell">
          <div className="welcome-section-heading"><span>Feito para a vida real</span><h2>Menos tempo registrando.<br />Mais clareza para decidir.</h2></div>
          <div className="welcome-benefit-grid">
            {benefits.map((benefit) => <article key={benefit.number}><span>{benefit.number}</span><h3>{benefit.title}</h3><p>{benefit.description}</p></article>)}
          </div>
        </section>

        <section className="welcome-privacy-section">
          <div className="welcome-shell welcome-privacy-content">
            <div><span className="welcome-section-number">Privacidade por arquitetura</span><h2>Local de verdade.</h2></div>
            <p>O c-finance salva seus dados neste navegador. Não existe banco remoto, rastreamento ou conta para invadir. Você decide quando exportar, onde guardar e em qual dispositivo restaurar.</p>
          </div>
        </section>

        <section id="restaurar" className="welcome-restore welcome-shell">
          <WelcomeImport onImport={onImport} onImported={onImported} />
        </section>
      </main>

      <footer className="welcome-footer"><div className="welcome-shell"><span>c-finance</span><p>Planejamento financeiro privado, simples e local.</p></div></footer>
    </div>
  )
}
