import { DashboardHeader } from '../components/layout/DashboardHeader'
import type { FinanceData } from '../types/finance'

interface FaqPageProps {
  data: FinanceData
  onImport: (content: string) => boolean
}

interface FaqItem {
  question: string
  answer: string
}

interface FaqSection {
  title: string
  description: string
  items: FaqItem[]
}

const faqSections: FaqSection[] = [
  {
    title: 'Primeiros passos',
    description: 'O essencial para entender a proposta do c-finance e começar sem medo.',
    items: [
      {
        question: 'Como funciona o c-finance?',
        answer:
          'O c-finance é uma dashboard local para planejar ganhos, gastos fixos, gastos únicos, lançamentos mensais e investimentos. Você cadastra o que costuma entrar e sair, acompanha o mês, confirma o que já aconteceu e usa os gráficos para entender melhor seu fluxo de dinheiro.',
      },
      {
        question: 'Qual é a melhor forma de usar o app?',
        answer:
          'Comece cadastrando sua renda fixa e seus principais compromissos recorrentes, como aluguel, internet, mercado, academia e aportes. Depois registre gastos únicos quando eles aparecerem. Na aba Lançamentos, marque o que já foi pago ou recebido para a dashboard refletir sua situação real do mês.',
      },
      {
        question: 'Preciso criar conta ou fazer login?',
        answer:
          'Não. O app não tem login, backend, banco remoto ou autenticação. A ideia é ser simples e direto: abriu, usou, salvou no próprio navegador.',
      },
    ],
  },
  {
    title: 'Dados e segurança',
    description: 'O que acontece com suas informações e quais cuidados continuam importantes.',
    items: [
      {
        question: 'Como o app armazena meus dados?',
        answer:
          'Os dados ficam no LocalStorage do navegador. Isso significa que eles são salvos no próprio dispositivo e no próprio navegador que você está usando. O c-finance não envia seus dados financeiros para servidor.',
      },
      {
        question: 'Por que o app é seguro?',
        answer:
          'Do ponto de vista da internet, ele é seguro porque funciona client-side: não existe servidor recebendo seus ganhos, gastos ou investimentos. Também não há analytics, tracking ou chamadas externas para processar seus dados financeiros.',
      },
      {
        question: 'Existe algum risco?',
        answer:
          'Sim. Como os dados ficam no navegador, alguém com acesso ao seu dispositivo, perfil do navegador ou backup do sistema pode conseguir vê-los. Também é importante lembrar que limpar dados do navegador pode apagar as informações salvas.',
      },
      {
        question: 'Como faço backup dos meus dados?',
        answer:
          'Use a opção de exportar backup em JSON. Guarde esse arquivo em um lugar seguro, como uma pasta protegida ou serviço de nuvem de confiança. Para recuperar em outro navegador ou dispositivo, use a importação de backup.',
      },
    ],
  },
  {
    title: 'Funcionalidades',
    description: 'Como cada área do app ajuda no controle financeiro do dia a dia.',
    items: [
      {
        question: 'Qual a diferença entre Planejamento e Lançamentos?',
        answer:
          'Planejamento é onde você cria seus ganhos e gastos esperados, recorrentes ou únicos. Lançamentos é onde você acompanha as ocorrências do mês e marca se algo foi concluído, pulado ou continua pendente.',
      },
      {
        question: 'Para que serve a Dashboard?',
        answer:
          'A Dashboard mostra uma leitura mais rápida do mês: entradas previstas, saídas previstas, saldo projetado, valores já confirmados, categorias que mais pesam, comparação histórica e insights para ajudar na tomada de decisão.',
      },
      {
        question: 'Como funcionam os filtros de data?',
        answer:
          'O filtro mensal define o período principal da análise. A data de corte permite olhar o mês até um dia específico, útil para responder perguntas como “quanto eu já deveria ter recebido até hoje?” ou “quanto ainda falta pagar?”.',
      },
      {
        question: 'Como funciona a aba Investimentos?',
        answer:
          'Ela permite cadastrar reservas, caixinhas e aplicações simples, informando saldo atual, taxa anual estimada e aporte mensal. O app calcula projeções para dar uma noção de crescimento, mas não substitui uma análise financeira profissional.',
      },
      {
        question: 'Posso editar algo que cadastrei errado?',
        answer:
          'Pode. Ganhos, gastos e investimentos podem ser editados. Isso evita precisar apagar e recriar tudo quando muda um valor, uma data, uma categoria ou uma observação.',
      },
    ],
  },
  {
    title: 'Projeto aberto',
    description: 'Transparência sobre o código e evolução do produto.',
    items: [
      {
        question: 'O projeto é open source?',
        answer:
          'Sim. O código está aberto no GitHub em github.com/phbrg/c-finance. Isso permite estudar como o app funciona, sugerir melhorias, abrir issues ou adaptar a ideia para outros contextos.',
      },
      {
        question: 'Posso usar isso como meu controle financeiro principal?',
        answer:
          'Pode, desde que você mantenha backups. O app foi pensado para uso pessoal e local, então a responsabilidade de preservar o arquivo de backup e cuidar do dispositivo continua sendo importante.',
      },
    ],
  },
]

const toSectionId = (title: string) => title.toLowerCase().replaceAll(' ', '-')

export function FaqPage({ data, onImport }: FaqPageProps) {
  const questionCount = faqSections.reduce((total, section) => total + section.items.length, 0)

  return (
    <div className="faq-page">
      <DashboardHeader
        title="FAQ"
        description="Respostas rápidas sobre uso, privacidade, dados locais e funcionalidades do c-finance."
        data={data}
        onImport={onImport}
      />

      <section className="faq-hero workspace-card">
        <div>
          <span className="overline">Central de ajuda</span>
          <h2>Entenda o c-finance antes de confiar seus números a ele.</h2>
          <p>
            Um guia direto para quem quer saber como o app funciona, onde os dados ficam salvos,
            quais cuidados tomar e como aproveitar melhor cada módulo.
          </p>
          <a href="https://github.com/phbrg/c-finance" target="_blank" rel="noreferrer">
            Ver projeto no GitHub
            <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="faq-hero-card" aria-label="Resumo da FAQ">
          <strong>{questionCount}</strong>
          <span>perguntas respondidas</span>
          <small>Privacidade, backup, dashboard, planejamento, lançamentos e investimentos.</small>
        </div>
      </section>

      <section className="faq-quick-grid" aria-label="Pontos importantes">
        <article>
          <span>01</span>
          <strong>Local por padrão</strong>
          <p>Seus dados ficam no navegador. Sem backend, sem login e sem envio para servidor.</p>
        </article>
        <article>
          <span>02</span>
          <strong>Backup é essencial</strong>
          <p>Exportar JSON com frequência é o melhor hábito para não perder seu histórico.</p>
        </article>
        <article>
          <span>03</span>
          <strong>Código aberto</strong>
          <p>O repositório é público para consulta, aprendizado e evolução transparente.</p>
        </article>
      </section>

      <div className="faq-layout">
        <aside className="faq-index workspace-card" aria-label="Categorias da FAQ">
          <span className="overline">Categorias</span>
          {faqSections.map((section) => (
            <a key={section.title} href={`#${toSectionId(section.title)}`}>
              {section.title}
            </a>
          ))}
        </aside>

        <div className="faq-sections">
          {faqSections.map((section) => (
            <section key={section.title} id={toSectionId(section.title)} className="workspace-card faq-section">
              <div className="card-heading">
                <div>
                  <span className="overline">{section.title}</span>
                  <h2>{section.description}</h2>
                </div>
                <span className="count-badge">{section.items.length}</span>
              </div>

              <div className="faq-list">
                {section.items.map((item, index) => (
                  <details key={item.question} className="faq-item" open={index === 0}>
                    <summary>
                      <span>{item.question}</span>
                      <i aria-hidden="true" />
                    </summary>
                    <p>{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
