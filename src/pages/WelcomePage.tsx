import type { ReactNode } from 'react'
import { DashboardMock } from '../components/welcome/DashboardMock'
import { WelcomeImport } from '../components/welcome/WelcomeImport'

interface WelcomePageProps {
  error: string | null
  onStart: () => void
  onImport: (content: string) => boolean
  onImported: () => void
  onClearError: () => void
}

const benefits = [
  { title: 'O mês inteiro numa tela', text: 'Entradas, saídas, o que falta pagar e com quanto você chega ao último dia.' },
  { title: 'Some o extrato com cliques', text: 'Marque os itens da lista e a soma aparece na hora.' },
  { title: 'Cartão no lugar certo', text: 'A compra entra na fatura, e a fatura entra no dia em que você paga.' },
]

const steps = [
  { title: 'Cadastre o que entra e o que sai', text: 'No Planejamento: salário, aluguel, assinaturas, compras parceladas. O que é fixo se repete todo mês.' },
  { title: 'Acompanhe pelo Dashboard', text: 'Confirme cada item quando ele acontecer. Se o valor ou a data forem outros, anote os reais.' },
  { title: 'Simule antes de comprar', text: 'Em "Posso gastar?" você informa valor, parcelas e cartão e vê o saldo dos próximos meses.' },
]

const icon = (paths: ReactNode) => <svg viewBox="0 0 24 24" aria-hidden="true">{paths}</svg>

const features = [
  { title: 'Soma por seleção', text: 'Marque vários itens e veja entradas, saídas e o total líquido. Dá para filtrar por busca, tipo, categoria e cartão.', icon: icon(<><rect x="4" y="4" width="16" height="16" rx="3" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>) },
  { title: 'Dia a dia', text: 'Gráfico do saldo e do que entrou e saiu em cada dia, mais um resumo de para onde foi o dinheiro.', icon: icon(<><path d="M4 20V4M4 20h16" /><path d="m7 15 4-4 3 3 5-6" /></>) },
  { title: 'Fixos e parcelas', text: 'Contas fixas se repetem sozinhas. Mudou o valor? Ajuste a partir de um mês sem mexer no passado.', icon: icon(<><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>) },
  { title: 'Cartão e fatura', text: 'Cadastre o cartão com dia de pagamento e limite. A fatura aparece no dia certo e abre para mostrar as compras.', icon: icon(<><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18M7 15h4" /></>) },
  { title: 'Posso gastar?', text: 'Teste uma compra com valor, parcelas, data e cartão e veja o efeito no saldo antes de registrar.', icon: icon(<><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4M12 16.8h.01" /></>) },
  { title: 'Backup em arquivo', text: 'Baixe tudo num arquivo JSON e importe em outro navegador ou computador quando precisar.', icon: icon(<><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" /><path d="M5 19.5h14" /></>) },
]

const check = <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.3 2.8 2.7 6.2-6.3" /></svg>

export function WelcomePage({ error, onStart, onImport, onImported, onClearError }: WelcomePageProps) {
  return (
    <div className="welcome-page">
      <header className="welcome-header">
        <div className="welcome-shell">
          <span className="welcome-brand">c-finance</span>
          <nav className="welcome-nav" aria-label="Seções da página">
            <a href="#como-funciona">Como funciona</a>
            <a href="#recursos">Recursos</a>
            <a href="#privacidade">Privacidade</a>
          </nav>
          <button type="button" className="btn primary small" onClick={onStart}>Começar</button>
        </div>
      </header>

      {error && (
        <div className="toast error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={onClearError} aria-label="Fechar mensagem">×</button>
        </div>
      )}

      <main>
        <section className="welcome-hero welcome-shell" aria-labelledby="welcome-title">
          <div className="welcome-copy">
            <p className="welcome-eyebrow">Controle financeiro pessoal, direto no navegador</p>
            <h1 id="welcome-title">Veja para onde seu dinheiro vai antes que o mês acabe.</h1>
            <p className="welcome-lead">Anote o que entra e o que sai. O c-finance mostra o saldo dia a dia, quanto ainda falta pagar e com quanto você fecha o mês.</p>
            <div className="welcome-actions">
              <button type="button" className="btn primary large" onClick={onStart}>Começar</button>
              <a className="btn large" href="#restaurar">Já tenho um backup</a>
            </div>
            <ul className="welcome-trust" aria-label="Como funciona o acesso">
              <li>{check}Grátis</li>
              <li>{check}Sem cadastro</li>
              <li>{check}Dados ficam no navegador</li>
            </ul>
          </div>
          <DashboardMock />
        </section>

        <section className="welcome-benefits" aria-label="Destaques">
          <div className="welcome-shell">
            {benefits.map((item) => (
              <div key={item.title}><h2>{item.title}</h2><p>{item.text}</p></div>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="welcome-section welcome-shell" aria-labelledby="como-funciona-title">
          <div className="welcome-intro">
            <p className="welcome-label">Como funciona</p>
            <h2 id="como-funciona-title">Três passos, e o mês fica claro.</h2>
          </div>
          <ol className="welcome-steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span aria-hidden="true">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="recursos" className="welcome-section welcome-shell" aria-labelledby="recursos-title">
          <div className="welcome-intro">
            <p className="welcome-label">Recursos</p>
            <h2 id="recursos-title">O que dá para fazer no app</h2>
            <p>Você cadastra os valores uma vez. As contas do mês ficam com o c-finance.</p>
          </div>
          <div className="welcome-features">
            {features.map((feature) => (
              <article key={feature.title}>
                <span className="welcome-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="privacidade" className="welcome-section welcome-shell welcome-privacy" aria-labelledby="privacidade-title">
          <div>
            <p className="welcome-label">Privacidade</p>
            <h2 id="privacidade-title">Seus dados ficam neste navegador.</h2>
            <p>O c-finance não tem conta, login nem servidor. O que você cadastra é salvo no armazenamento local do navegador, e o app não envia esses dados para lugar nenhum.</p>
            <p>Por isso ninguém guarda uma cópia para você. Se limpar os dados do navegador ou trocar de computador, é o backup que traz tudo de volta.</p>
          </div>
          <ul className="welcome-privacy-list">
            <li>{check}<span><b>Sem cadastro</b>Abra e comece a usar.</span></li>
            <li>{check}<span><b>Salvo no navegador</b>Cada navegador tem os seus próprios dados.</span></li>
            <li>{check}<span><b>Backup em JSON</b>Baixe na aba Dados e guarde onde preferir.</span></li>
          </ul>
        </section>

        <section className="welcome-section welcome-shell welcome-final" aria-label="Começar">
          <div className="welcome-final-card is-primary">
            <h2>Comece pelo Planejamento</h2>
            <p>Cadastre o salário e as contas fixas. Em poucos minutos o Dashboard já mostra o seu mês.</p>
            <div className="welcome-actions"><button type="button" className="btn primary large" onClick={onStart}>Começar</button></div>
          </div>
          <div id="restaurar" className="welcome-final-card">
            <h2>Já usa o c-finance?</h2>
            <p>Escolha o arquivo .json que você baixou na aba Dados. Ele vira os dados deste navegador.</p>
            <div className="welcome-actions"><WelcomeImport onImport={onImport} onImported={onImported} /></div>
          </div>
        </section>
      </main>

      <footer className="welcome-footer">
        <div className="welcome-shell">
          <span>c-finance · controle financeiro pessoal e local</span>
          <a href="https://github.com/phbrg/c-finance" target="_blank" rel="noreferrer">Código no GitHub <span aria-hidden="true">↗</span></a>
        </div>
      </footer>
    </div>
  )
}
