# inspect-js — Reference

## Mapa de linhas: controle_os.js

| Linha | Conteúdo |
|---|---|
| 1 | xlsx.js bundlado (não tocar) |
| 29 | `// ===== DADOS EMBUTIDOS =====` — início do código da app |
| 31 | `EMBED_CONTAS` — entre `/*__EMBED_CONTAS_START__*/` e `/*__EMBED_CONTAS_END__*/` |
| 51–52 | `let CONTAS_POR_SIGLA`, `CONTAS_TOTAL` |
| 53–59 | `function recomputeContas()` |
| 61–97 | `Promise.all([fetch('/api/controle-os'), fetch('/api/base')])` |
| 98–139 | `function checkFreshness(meta)` |
| 140–151 | variáveis de estado: `rawData`, `filteredData`, `sel`, `activeBucket`… |
| ~153 | `function init()` |
| ~169 | `function norm(r)` |
| ~384 | `function renderKPIs()` |
| ~553 | `function renderAll()` |

> Linhas com `~` podem variar ±10 após edições. Sempre confirmar com grep.

---

## Padrões de grep frequentes

```bash
# qualquer função ou variável
grep -n "function <nome>\|let <nome>\|const <nome>" static/js/controle_os.js | grep -v "^1:"

# todos os fetch
grep -n "fetch(" static/js/controle_os.js | grep -v "^1:"

# uso de um ID do HTML
grep -n "<id>" static/js/controle_os.js | grep -v "^1:"

# todos os getElementById
grep -n "getElementById\|querySelector" static/js/controle_os.js | grep -v "^1:"

# todas as funções definidas
grep -n "^function \|^const .* = (" static/js/controle_os.js | grep -v "^1:"

# elementos de KPI e meta
grep -n "kpiContas\|kpiTotal\|kpiPct\|headerCount\|metaInfo" static/js/controle_os.js | grep -v "^1:"
```

---

## Receitas de edição

### Adicionar KPI
1. Grep: `renderKPIs\|animN`
2. Ler bloco de `renderKPIs`
3. Inserir `animN(document.getElementById('kpiNovo'), valor)` dentro da função
4. Adicionar `<div class="kpi">` no HTML (`controle_os.html`)

### Adicionar filtro
1. Grep: `setupFilters\|applyFilters\|sel\.`
2. Inserir `sel.novo = new Set()` nas variáveis de estado (~linha 144)
3. Popular dropdown em `setupFilters`
4. Adicionar checagem em `applyFilters`: `if (sel.novo.size && !sel.novo.has(r.campo)) return false`
5. Adicionar `ms-wrap` no HTML

### Adicionar fetch paralelo
1. Grep: `Promise.all`
2. Ler o bloco completo
3. Inserir nova entrada no array: `fetch('/api/novo').then(r=>r.json()).catch(()=>[])`
4. Desestruturar: `.then(([data, baseData, novoData]) => ...)`

### Atualizar EMBED_CONTAS (bloco hard-coded)
1. Grep: `EMBED_CONTAS_START\|EMBED_CONTAS_END`
2. Substituir o conteúdo entre os marcadores com o novo array
3. `old_string` = linha 31 inteira (marcador + array + marcador)
