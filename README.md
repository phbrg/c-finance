# c-finance
> Feito com AI
Aplicação client-side para organizar finanças pessoais. Os dados são validados e armazenados exclusivamente no `localStorage` do navegador; não há backend, login, analytics ou chamadas HTTP.

## Executar

```bash
npm install
npm run dev
```

## Verificar

```bash
npm test
npm run lint
npm run build
```

## Backup

O botão **Exportar JSON** cria um arquivo versionado com todas as transações. A importação valida integralmente o arquivo antes de substituir os dados locais e exige confirmação explícita.

> O `localStorage` não é criptografado. Evite usar a aplicação em dispositivos compartilhados e mantenha backups em local seguro.
