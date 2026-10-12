# Demonstração do Portal A365 — Implementation Plan

**Goal:** atualizar a demo pública para a estrutura atual da solução desenvolvida para a Orsegups, mantendo dados e ações inteiramente fictícios.

**Architecture:** site estático em `docs/`, publicado pelo workflow Pages existente. Copiar os templates e frontends originais; manter CSS, animações e lógica de cálculo/filtros. Substituir bases/cadastros por dados fictícios e ações de administração por simulação. Backend Flask anterior é histórico e não executa a demo.

**Tech Stack:** HTML/CSS/ESM, Leaflet 1.9.4 local; Playwright/axe para verificação.

**Source:** templates de menu/theme/admin, dashboards e mapa do A365 Portal local em 12/10/2026. Fonte contém dados reais embutidos: substituí-los antes de gerar o HTML público. Requisito explícito do autor: mesmo CSS, animações, cores e lógica; apenas dados genéricos.

- [x] Criar testes de navegação, igualdade do CSS, filtros/CSV, período e dias da semana, mapa, administração, fallback sem JS, mobile e rede sem APIs externas. Reproduzir falha contra demo antiga e regressões encontradas.
- [x] Copiar frontends, substituir todas as bases/cadastros e adaptar a fronteira pública.
- [x] Verificar agregações, filtros, downloads e mobile; inspecionar capturas. Cores originais mantidas; sem certificação WCAG.
- [x] Atualizar README/arquitetura e workflow de validação/deploy; registrar fontes e limites.
- [x] Revisão independente confirmou CSS e estrutura das funções; encontrou fallback de forms sem JS e parser fail-open. Ambos corrigidos; regressão sem JS adicionada.
- [ ] Publicar após CI e confirmar demo no endereço público.
