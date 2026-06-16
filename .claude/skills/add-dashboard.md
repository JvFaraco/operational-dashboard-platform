# Skill: add-dashboard

## Objetivo
Criar um novo dashboard completo no padrão A365 Ops, sem quebrar nada existente.

## Inputs obrigatórios
Se qualquer um destes faltar, **pergunte antes de gerar**:
- `nome` — chave snake_case (ex: `campo_servicos`) — usada nos nomes de arquivo e no dict TIPOS
- `rota` — URL slug (ex: `campo-servicos`) — usada na rota Flask e na URL
- `label` — texto legível (ex: `Campo & Serviços`) — título e menu
- `colunas Excel` — quais colunas o xlsx terá (especialmente datas)
- `KPIs` — quais indicadores mostrar nos cards do topo
- `filtros` — quais colunas terão filtro na sidebar
- `consome base compartilhada?` — se sim, incluir `/api/base` + fallback EMBED_CONTAS

## Passos
1. Confirmar todos os inputs acima
2. Modificar `app.py` (2 pontos)
3. Modificar `templates/upload.html` e `static/js/upload.js`
4. Criar `templates/<nome>.html`
5. Criar `static/css/<nome>.css` (copiar de `controle_os.css`, remover o que não usar)
6. Criar `static/js/<nome>.js`

## Arquivos a alterar

### `app.py`
- Inserir em `TIPOS`: `"<nome>": "<label>"`
- Adicionar rota de página: `@app.route("/<rota>")` → `render_template("<nome>.html")`
- Adicionar rota de API: `@app.route("/api/<rota>")` → `jsonify(load_xlsx("<nome>"))`
- Se houver colunas de data novas, adicionar ao bloco de normalização em `load_xlsx` (~linha 48)

### `templates/upload.html`
- Adicionar `<input type="radio" name="baseType" value="<nome>">` no grupo de radios

### `static/js/upload.js`
- Inserir `<nome>: '<label>'` no objeto `LABELS`
- Incluir `'<nome>'` no loop do `renderMeta()`

### `templates/<nome>.html`
Estrutura: `{% extends "base.html" %}` → header (sticky, `--blue`) → `.layout` (sidebar 248px + main) → `.krow` (KPI cards) → `.cgrid` (gráficos) → `.mgrid` (tabela) → `#toast`
Incluir Chart.js CDN no bloco `scripts`.

### `static/css/<nome>.css`
Copiar `controle_os.css` integralmente — ele é o design system completo.
Remover apenas blocos não usados (ex: `.supcard`, `.osg`, `.reglist` se o dashboard não tiver esses componentes).

### `static/js/<nome>.js`
Estrutura obrigatória:
```
variáveis de estado (rawData, filteredData, sel)
norm(r)             — mapeia colunas do Excel para campos internos
applyFilters()      — filtra rawData → filteredData → chama renderAll()
setupFilters()      — popula dropdowns com valores únicos de rawData
renderKPIs()        — animN() nos .kval
renderChart1/2()    — Chart.js; destruir instância antes de recriar
renderTable()       — tbody com slice(0, 500)
renderAll()         — safe(renderKPIs); safe(renderChart...); safe(renderTable)
fetch('/api/<rota>').then → rawData = data.map(norm); setupFilters(); applyFilters()
fetch('/api/meta/<nome>') — atualiza #metaInfo
sidebar toggle, theme toggle (localStorage), reset filtros, exportCSV
```
Se consumir base compartilhada: usar `Promise.all([fetch('/api/<rota>'), fetch('/api/base')])` e mapear `TecnicoResponsavel.split(' - ')[1]` → sigla.

## Regras de segurança
- Não remover nenhuma rota ou chave existente em `TIPOS`
- `old_string` no Edit deve ser único no arquivo — adicionar contexto se necessário
- Não ler `controle_os.js` inteiro — ver skill `inspect-js`
- CSS: sempre copiar de `controle_os.css`, nunca inventar tokens de design

## Tokens de design — referência rápida
```
--blue #005BAC  --yellow #F5B400  --green #2db86a  --red #e05050
--bg #0b0f14  --card #161d2a  --text #e8edf5  --muted #7a8aa0
--r 12px  --rsm 8px
```
Tema claro via `[data-theme="light"]`; salvo em `localStorage('theme')`.

## Saída esperada
Ao final: 3 arquivos criados (`html`, `css`, `js`) + 2 arquivos modificados (`app.py`, `upload.html`/`upload.js`). Dashboard acessível em `/<rota>` e base registrada na página de upload.
