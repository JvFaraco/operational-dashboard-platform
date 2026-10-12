# Arquitetura da demonstração

Esta é uma demonstração pública de uma solução desenvolvida para a Orsegups. O produto interno e a demonstração não compartilham credenciais, bases ou serviços de execução.

## Origem das telas

Referência: código local do Portal A365 em 12/10/2026. Menu, design compartilhado e administração vêm de `server/templates/`; Controle de O.S. e Produtividade de `dashboard/`; mapa de `routes/mapa_cobertura_rotas.html`.

O CSS dos dashboards e do mapa é copiado integralmente. `source-manifest.json` registra os hashes extraídos do fonte, conferidos por teste. As funções de cálculo, gráficos, filtros, exportação e interações permanecem originais; não foi construída uma nova implementação desses algoritmos.

## Adaptações da fronteira pública

- `SIGLA_CIDADE`, supervisores, nomes de exemplos especiais e todas as bases embutidas recebem valores genéricos. Comentários com exemplos internos são removidos, preservando avisos de licença das bibliotecas.
- Elementos previamente preenchidos no HTML interno são limpos antes da exportação; os dashboards os preenchem com a base fictícia.
- As fontes atuais dos dashboards são quatro arquivos JSON locais, com os mesmos contratos esperados pelo frontend. Datas de conclusão usam timestamps ISO com offset para alimentar o parser original.
- Um aviso permanente identifica Orsegups, demonstração e dados fictícios. Links de navegação apontam a páginas estáticas; não existe sessão corporativa.
- `public-boundary.js` permite `fetch` apenas para os quatro datasets locais. O parâmetro que permitia substituir a fonte do coletor foi removido. O mapa pode carregar imagens públicas de basemap; elas não são uma fonte de dados corporativos.
- A administração mantém o template e suas animações. Formulários não enviam dados, arquivos estão desabilitados e ativação/inativação altera apenas a linha fictícia até recarregar.

## Geração e manutenção

`tools/import_portal_presentation.py` copia somente menu/CSS compartilhado, sem dashboards. `tools/copy_portal_demo.cjs` copia as demais telas, analisa os scripts com Acorn e substitui constantes de dados e nomes. Se não conseguir analisar um script, a exportação para, em vez de publicar o código sem tratamento.

As ferramentas exigem explicitamente o caminho da fonte privada. A regeneração deve ser seguida de verificação de privacidade, comparação do CSS, testes e inspeção visual. O caminho privado e os dados originais não são incluídos no repositório.

## Hospedagem e limites

O workflow existente publica `docs/` no GitHub Pages. Uma CI separada executa Playwright. Leaflet é mantido localmente com sua licença; os dashboards preservam as bibliotecas já embutidas no fonte.

O Flask histórico é preservado em `app.py`, `templates/` e `static/`, mas não participa da demo nem equivale ao backend interno atual. A demo não implementa autenticação, coleta, persistência ou importação corporativa. Não foram certificados leitor de tela, Safari/Firefox ou conformidade WCAG completa; a identidade visual original foi preservada.
