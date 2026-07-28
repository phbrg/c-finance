import { WelcomeImport } from '../components/welcome/WelcomeImport'

interface WelcomePageProps {
  error: string | null
  onStart: () => void
  onImport: (content: string) => boolean
  onImported: () => void
  onClearError: () => void
}

const steps = [
  {
    number: '01',
    title: 'Conte o que entra e o que sai',
    description: 'Cadastre salário, contas fixas, compras únicas e qualquer valor que faça parte do seu mês.',
  },
  {
    number: '02',
    title: 'Acompanhe sem fazer contas',
    description: 'Veja o que já aconteceu, o que ainda falta pagar e quanto deve sobrar no fim do período.',
  },
  {
    number: '03',
    title: 'Teste antes de decidir',
    description: 'Simule uma compra ou uma mudança de renda e entenda o impacto sem alterar seu planejamento.',
  },
]

const features: Array<{
  icon: WelcomeFeatureIconName
  title: string
  description: string
  detail: string
}> = [
  {
    icon: 'planning',
    title: 'Planejamento mensal',
    description: 'Organize ganhos e gastos fixos ou únicos, com começo, vencimento e encerramento.',
    detail: 'Saiba o que vem pela frente',
  },
  {
    icon: 'dashboard',
    title: 'Dashboard que explica',
    description: 'Compare previsto e confirmado, acompanhe o saldo e identifique onde o dinheiro está indo.',
    detail: 'Números com contexto',
  },
  {
    icon: 'calculator',
    title: 'Simulações rápidas',
    description: 'Veja como uma compra, bonificação ou novo compromisso mudaria os próximos meses.',
    detail: 'Decida antes de registrar',
  },
  {
    icon: 'investments',
    title: 'Reservas e investimentos',
    description: 'Acompanhe aportes, rendimentos e projeções de objetivos como reserva de emergência.',
    detail: 'Patrimônio no mesmo lugar',
  },
]

export function WelcomePage({ error, onStart, onImport, onImported, onClearError }: WelcomePageProps) {
  return (
    <div className="welcome-page">
      <header className="welcome-header">
        <div className="welcome-shell">
          <a className="welcome-brand" href="#inicio" aria-label="c-finance, início">
            c-finance
            <small>finanças pessoais</small>
          </a>
          <nav className="welcome-nav" aria-label="Navegação da apresentação">
            <a href="#como-funciona">Como funciona</a>
            <a href="#recursos">Recursos</a>
            <a href="#privacidade">Privacidade</a>
          </nav>
          <button type="button" className="welcome-header-cta" onClick={onStart}>Começar agora</button>
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
            <span className="welcome-eyebrow"><i /> Simples, privado e feito para o dia a dia</span>
            <h1>Entenda seu dinheiro antes que o mês termine.</h1>
            <p>O c-finance mostra o que entra, o que sai e o que ainda vem pela frente. Você planeja, acompanha e testa decisões sem planilhas complicadas e sem criar uma conta.</p>
            <div className="welcome-cta-row">
              <button type="button" className="welcome-primary-cta" onClick={onStart}>Organizar minhas finanças <span aria-hidden="true">→</span></button>
              <a href="#restaurar">Já tenho um backup</a>
            </div>
            <div className="welcome-trust-row" aria-label="Características principais">
              <span>Grátis para usar</span>
              <span>Sem cadastro</span>
              <span>Dados no navegador</span>
            </div>
          </div>

          <DashboardPreview />
        </section>

        <section className="welcome-proof">
          <div className="welcome-shell welcome-proof-grid">
            <div><strong>Uma visão do mês inteiro</strong><span>Ganhos, gastos, saldo e próximos compromissos juntos.</span></div>
            <div><strong>Menos registro, mais análise</strong><span>Itens fixos se repetem automaticamente no planejamento.</span></div>
            <div><strong>Você continua no controle</strong><span>Exporte seu backup quando quiser e guarde onde preferir.</span></div>
          </div>
        </section>

        <section id="como-funciona" className="welcome-how welcome-shell">
          <div className="welcome-section-intro">
            <span className="welcome-section-label">Como funciona</span>
            <h2>Você não precisa entender de finanças para começar.</h2>
            <p>Cadastre o básico e deixe o c-finance transformar os dados em uma visão clara do seu mês.</p>
          </div>
          <div className="welcome-step-grid">
            {steps.map((step) => (
              <article key={step.number}>
                <span>{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.description}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section id="recursos" className="welcome-features">
          <div className="welcome-shell">
            <div className="welcome-section-intro welcome-features-heading">
              <span className="welcome-section-label">Tudo em um só lugar</span>
              <h2>Ferramentas para planejar hoje e enxergar mais longe.</h2>
              <p>Da conta que vence esta semana até a reserva que você está construindo para o futuro.</p>
            </div>
            <div className="welcome-feature-grid">
              {features.map((feature) => (
                <article key={feature.title}>
                  <div className="welcome-feature-icon"><WelcomeFeatureIcon name={feature.icon} /></div>
                  <span>{feature.detail}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="privacidade" className="welcome-privacy-section">
          <div className="welcome-shell welcome-privacy-content">
            <div className="welcome-privacy-copy">
              <span className="welcome-section-label">Privacidade sem mistério</span>
              <h2>Seus dados financeiros ficam com você.</h2>
              <p>O c-finance funciona direto no navegador. Não há login, banco de dados remoto ou envio das suas informações financeiras para um servidor do projeto.</p>
              <p className="welcome-privacy-note"><strong>Importante:</strong> quem tiver acesso ao seu navegador também pode acessar esses dados. Proteja seu dispositivo e mantenha um backup atualizado.</p>
            </div>
            <div className="welcome-data-card" aria-label="Como os dados circulam no c-finance">
              <div><span>01</span><strong>Você registra</strong><small>Ganhos, gastos e investimentos</small></div>
              <i aria-hidden="true">→</i>
              <div className="active"><span>02</span><strong>O navegador guarda</strong><small>Armazenamento deste dispositivo</small></div>
              <i aria-hidden="true">→</i>
              <div><span>03</span><strong>Você faz o backup</strong><small>Um arquivo que você pode guardar</small></div>
            </div>
          </div>
        </section>

        <section className="welcome-final-cta welcome-shell">
          <div>
            <span className="welcome-section-label">Seu próximo mês começa aqui</span>
            <h2>Troque a incerteza por uma visão clara.</h2>
            <p>Leva poucos minutos para cadastrar o essencial e começar a entender seu planejamento.</p>
          </div>
          <button type="button" className="welcome-primary-cta" onClick={onStart}>Criar meu planejamento <span aria-hidden="true">→</span></button>
        </section>

        <section id="restaurar" className="welcome-restore welcome-shell">
          <WelcomeImport onImport={onImport} onImported={onImported} />
        </section>
      </main>

      <footer className="welcome-footer">
        <div className="welcome-shell">
          <span>c-finance</span>
          <p>Controle financeiro pessoal, privado e local.</p>
          <a href="https://github.com/phbrg/c-finance" target="_blank" rel="noreferrer">Projeto open source <span aria-hidden="true">↗</span></a>
        </div>
      </footer>
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="welcome-preview" aria-label="Prévia da dashboard do c-finance">
      <div className="preview-window-bar"><span><i /><i /><i /></span><small>Visão de julho</small><em>Dados locais</em></div>
      <div className="preview-content">
        <div className="preview-balance">
          <div><small>Previsão de fechamento</small><span>Saldo positivo</span></div>
          <strong><small>R$</small> 3.280,00</strong>
          <p>R$ 5.200 em ganhos − R$ 1.920 em gastos</p>
        </div>
        <div className="preview-metrics">
          <div><small>Saldo confirmado</small><strong>R$ 2.140</strong><span>até o dia 18</span></div>
          <div><small>Ainda a pagar</small><strong>R$ 760</strong><span>3 compromissos</span></div>
        </div>
        <div className="preview-chart">
          <div className="preview-chart-heading"><span>Caminho do saldo</span><small>Julho</small></div>
          <svg viewBox="0 0 360 110" role="img" aria-label="Exemplo de evolução do saldo durante o mês" preserveAspectRatio="none">
            <path className="preview-grid-line" d="M0 20H360M0 58H360M0 96H360" />
            <path className="preview-chart-line" d="M0 88 H38 V74 H82 V49 H128 V60 H175 V30 H218 V38 H265 V23 H310 V35 H360 V18" />
            <circle cx="360" cy="18" r="4" />
          </svg>
          <div><span>1</span><span>8</span><span>15</span><span>22</span><span>31</span></div>
        </div>
        <div className="preview-next">
          <div><span>22</span><small>Próximo pagamento</small><strong>Aluguel · R$ 1.200,00</strong></div>
          <em>Em 4 dias</em>
        </div>
      </div>
    </div>
  )
}

type WelcomeFeatureIconName = 'planning' | 'dashboard' | 'calculator' | 'investments'

function WelcomeFeatureIcon({ name }: { name: WelcomeFeatureIconName }) {
  const paths = {
    planning: <><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M7 3v4M17 3v4M3 10h18M7 14h3M7 17h7" /></>,
    dashboard: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="10" width="8" height="11" rx="2" /></>,
    calculator: <><rect x="4" y="2.5" width="16" height="19" rx="2.5" /><path d="M7.5 6.5h9M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18.5h.01M12 18.5h4" /></>,
    investments: <><path d="M3 20h18M5 17V9M10 17V5M15 17v-4M20 17V8" /><path d="m4 10 6-5 5 7 5-5" /></>,
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}
