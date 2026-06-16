# Skill: inspect-js

## Quando usar
Sempre que precisar ler, localizar, depurar ou editar qualquer arquivo JS do projeto.

## Quando não usar
Para arquivos JS pequenos (< 50 KB) que não sejam `controle_os.js` — esses podem ser lidos diretamente com `Read`.

## Regra absoluta — controle_os.js
**NUNCA usar `Read` nem `cat` em `static/js/controle_os.js`.**
O arquivo tem ~1.1 MB: a linha 1 é o xlsx.js bundlado. O código da app começa na linha ~29.
Verificar tamanho antes de ler qualquer JS:
```powershell
(Get-Item static/js/<arquivo>.js).Length
# > 200000 bytes → usar grep; caso contrário → Read direto
```

## Fluxo padrão

### 1. Localizar
```bash
grep -n "<padrão>" static/js/controle_os.js | grep -v "^1:"
```

### 2. Ler trecho
```bash
# Bash:
sed -n '<inicio>,<fim>p' static/js/controle_os.js
# PowerShell:
Get-Content static/js/controle_os.js | Select-Object -Skip <inicio-1> -First <qtd>
```

### 3. Editar
Usar `Edit` com `old_string` copiado exatamente do trecho lido.
Se `old_string` não for único → incluir mais linhas de contexto.

## Resultado esperado
Localizar qualquer símbolo sem ler o arquivo inteiro. Consulte `REFERENCE.md` para mapa de linhas, padrões de grep e receitas de edição frequentes.
