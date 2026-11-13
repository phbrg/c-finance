# c-finance

O **[c-finance](https://zen-type-tau.vercel.app/)** nasceu de uma necessidade bem prática: substituir a planilha que eu usava para organizar ganhos e gastos por uma ferramenta mais clara, visual e agradável de usar no dia a dia.

Em vez de funcionar apenas como um registro de transações, o projeto foi pensado como uma dashboard de planejamento financeiro. A ideia é ajudar a entender quanto da renda já está comprometida, o que ainda precisa ser pago, como o mês tende a terminar e o que cada compra no cartão muda no saldo dos próximos meses.

Tudo funciona localmente no navegador. Não há conta, backend, analytics ou envio de informações financeiras para serviços externos.

## O que já é possível fazer

- Planejar ganhos e gastos fixos ou pontuais, com datas de início e término
- Parcelar compras (cada parcela cai no seu mês) e mudar o valor de um item a partir de um mês sem alterar o passado
- Confirmar lançamentos com o valor e a data reais, ignorar ou voltar para pendente
- Marcar vários lançamentos e ver a soma, como quando se soma um extrato
- Filtrar por busca, tipo, categoria, situação e cartão
- Ver o mês dia a dia, o gasto por categoria e a evolução dos meses seguintes
- Cadastrar cartões (dia do pagamento e limite), vincular gastos a eles e abrir a fatura do mês
- Simular uma compra ("Posso gastar?") e ver o efeito no saldo dos próximos meses antes de registrar
- Partir de um saldo inicial que acumula de mês em mês
- Exportar e importar um backup completo em JSON

## Privacidade como decisão de arquitetura

Os dados são validados e armazenados exclusivamente no `localStorage`. Essa escolha mantém o projeto simples e, principalmente, evita que informações financeiras pessoais saiam do dispositivo.

Por isso, o c-finance não possui:

- autenticação;
- banco de dados remoto;
- cookies de rastreamento;
- analytics;
- chamadas HTTP para processar dados financeiros.

> O `localStorage` não é criptografado. Evite utilizar a aplicação em dispositivos compartilhados e mantenha seus backups em um local seguro.

## Decisões técnicas

Alguns cuidados que guiaram o desenvolvimento:

- valores monetários são armazenados em centavos para evitar erros de ponto flutuante;
- datas financeiras usam formatos previsíveis, sem conversões acidentais de fuso horário;
- entradas do usuário e backups são validados com Zod;
- cálculos financeiros e projeções foram isolados em funções puras e testáveis;
- alterações destrutivas exigem confirmação;
- dados de versões anteriores são migrados, e o texto original fica guardado no navegador antes de ser convertido;
- interface, regras de negócio, persistência e tipos ficam em camadas separadas.

## Tecnologias

- React
- TypeScript
- Vite
- CSS puro
- Zod
- Vitest
- Testing Library

## Executando localmente

```bash
git clone https://github.com/phbrg/c-finance.git
cd c-finance
npm install
npm run dev
```

## Qualidade do projeto

```bash
npm test
npm run lint
npm run build
```

Os testes cobrem cálculos financeiros, recorrências, parcelas, faturas de cartão, simulação de compras, persistência, migração de dados, backups e as telas principais.

## Estrutura

```text
src/
  components/   # Componentes de interface organizados por domínio
  hooks/        # Estado e coordenação das regras da aplicação
  pages/        # Dashboard, planejamento, dados, ajuda e boas-vindas
  schemas/      # Validação dos dados com Zod
  services/     # Persistência, migração e backups
  tests/        # Testes unitários e de componentes
  types/        # Modelos e contratos TypeScript
  utils/        # Cálculos e funções puras
```

## Desenvolvimento com apoio de IA

O projeto foi desenvolvido com o apoio de um agente de IA durante etapas de implementação, revisão e testes. A direção do produto, as regras financeiras, a arquitetura local-first, as decisões de privacidade e os critérios técnicos foram definidos e conduzidos por mim.

Usei a IA como ferramenta de desenvolvimento, mantendo o foco em entender as decisões, revisar o código gerado, testar os comportamentos importantes e evoluir o produto a partir do uso real, inclusive encontrando problemas de UX que só aparecem quando a aplicação deixa de ser uma ideia e começa a fazer parte da rotina.

## Próximos passos

O projeto continua evoluindo. Algumas ideias para as próximas versões são metas financeiras, orçamentos por categoria, recorrências mais flexíveis e análises históricas mais profundas.
