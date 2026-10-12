# Contribuindo

## Preparação

1. Crie uma branch a partir de `main`.
2. Para a demo atual, execute `npm ci` e `npm run dev`. `.env.example` pertence ao Flask histórico.
3. Trabalhe somente com dados inteiramente fictícios na demonstração pública.
4. Mantenha alterações pequenas e fáceis de revisar.

## Padrão de branches

```text
feature/nome-da-funcionalidade
fix/descricao-do-problema
docs/assunto-da-documentacao
refactor/area-alterada
```

## Antes do commit

```bash
npm test
git diff --check
```

Execute também a aplicação localmente e valide as páginas afetadas.

## Commits

Prefira mensagens objetivas:

```text
feat: add technician productivity dashboard
fix: handle empty scheduling dates
docs: document data import flow
refactor: isolate spreadsheet normalization
```

## Pull request

O PR deve informar:

- problema resolvido;
- solução implementada;
- páginas ou endpoints afetados;
- como a alteração foi testada;
- riscos ou limitações conhecidas.

Nunca inclua capturas de tela com dados reais.
