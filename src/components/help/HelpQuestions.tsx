const sections = [
  {
    title: 'Começando',
    questions: [
      {
        q: 'Como o app funciona?',
        a: 'Você cadastra em Planejamento o que entra e o que sai. O Dashboard mostra isso dia a dia, e você confirma cada item quando ele acontece de fato. O saldo do mês junta o que já foi confirmado com o que ainda falta.',
      },
      {
        q: 'Qual a diferença entre Planejamento e Dashboard?',
        a: 'Planejamento é a lista do que se repete ou está previsto: salário, aluguel, assinaturas. Dashboard é o que acontece em cada mês a partir dessa lista. A regra você muda no Planejamento; no Dashboard você confirma ou ajusta os valores.',
      },
    ],
  },
  {
    title: 'Dinheiro',
    questions: [
      {
        q: 'Como funcionam as parcelas?',
        a: 'Num gasto de uma vez, preencha Parcelas e informe o valor total da compra. O app divide o total e põe uma parcela por mês, no mesmo dia, a partir do mês da data. No cartão, cada parcela entra na fatura do mês em que cai. Se a divisão não fecha, as primeiras parcelas levam os centavos que sobram.',
      },
      {
        q: 'Como mudo um valor sem alterar o passado?',
        a: 'Ao editar um item que se repete, escolha o mês a partir do qual o novo valor vale. Os meses anteriores continuam com o valor antigo.',
      },
    ],
  },
  {
    title: 'Cartão',
    questions: [
      {
        q: 'Como acompanho a fatura do cartão?',
        a: 'Cadastre o cartão em Dados com o dia em que você paga a fatura e, se quiser, o limite. Ao lançar um gasto, escolha o cartão em Pago com. No Dashboard, a fatura aparece como uma linha no dia do pagamento, com o total das compras daquele mês, e é nesse dia que o saldo cai. Clique na fatura para ver as compras.',
      },
    ],
  },
  {
    title: 'Seus dados',
    questions: [
      {
        q: 'Onde ficam meus dados?',
        a: 'No armazenamento deste navegador, neste computador. Não existe conta nem servidor. Limpar os dados do navegador apaga tudo, então baixe um backup de vez em quando.',
      },
      {
        q: 'Como faço backup?',
        a: 'Em Dados, clique em Exportar backup e guarde o arquivo. Para voltar a um backup, use Importar backup. Ele substitui tudo o que está salvo agora.',
      },
    ],
  },
]

export function HelpQuestions() {
  return (
    <div className="panel help-faq">
      {sections.map(({ title, questions }, s) => (
        <section key={title} className="help-section" aria-labelledby={`help-s${s}`}>
          <h2 id={`help-s${s}`}>{title}</h2>
          {questions.map(({ q, a }, i) => (
            <details key={q} open={s === 0 && i === 0}>
              <summary>
                <span>{q}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </section>
      ))}
    </div>
  )
}
