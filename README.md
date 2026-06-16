# A365 Ops — Dashboard de Operações

Dashboard interno desenvolvido com Flask para gestão e visualização de ordens de serviço, controle de agendamentos e monitoramento de inadimplência da operação Alarme 365.

---

## Telas

| Rota | Descrição |
|------|-----------|
| `/` | Home — visão geral do sistema |
| `/login` | Autenticação de usuário |
| `/upload` | Upload de planilhas `.xlsx` por base |
| `/controle-os` | BI de Controle de OS (base: `bios.xlsx`) |
| `/agendadas` | BI de OS Agendadas (`agendadas.xlsx`) |
| `/nao-agendadas` | BI de OS Não Agendadas (`nao_agendadas.xlsx`) |
| `/recred` | Painel de Recredenciamento / Inadimplência |

---

## Stack

- **Backend**: Flask 3.0 + Waitress (servidor de produção)
- **Dados**: pandas + openpyxl para leitura de planilhas Excel
- **Frontend**: HTML5 + CSS3 + JavaScript puro (sem frameworks externos)
- **Gráficos**: Chart.js 4.x (bar, doughnut)
- **Autenticação**: Sessão Flask com variáveis de ambiente

---

## Funcionalidades por Dashboard

### Controle de OS (`/controle-os`)
- Cards de supervisor com OS, contas ativas e % OS/conta por regional
- KPIs: total de OS, contas ativas, % OS/conta, +14 dias, técnicos ativos
- Faixas de dias: 0-2 / 3-14 / +14 (click-to-filter no gráfico e nas pills)
- Gráfico de tipo de OS (doughnut) com legenda interativa
- Barras horizontais de OS por regional com % OS/conta
- Ranking de técnicos EPV com filtro por especialista
- Filtros: supervisor, região, cidade, motivo, tipo de OS
- Badge de atualização da base (atualizado hoje / X dias)
- Sidebar retrátil

### RECRED — Inadimplência (`/recred`)
- Cards de supervisor com OS, contas, % e exposição contratual
- KPIs: total, contas ativas, % OS/conta, +14 dias, pausadas, exposição, média dias suspenso
- Faixas de dias: 0-2 / 3-14 / +14 (click-to-filter)
- Gráfico de exposição por regional com click-to-filter
- Ranking de técnicos com exposição contratual
- Filtros: supervisor, regional, faixa de dias, status de pausa
- Exportação CSV filtrado

### Base Compartilhada (Contas x EPV)
- Upload único via `/upload` alimenta todos os dashboards simultaneamente
- Armazenada em `data/base.xlsx`, cache invalidado a cada upload
- Consumida via `/api/base` com dados de contas ativas por técnico/sigla

---

## Estrutura do Projeto

```
operational-dashboard-platform/
├── app.py                  # Aplicação principal Flask
├── requirements.txt        # Dependências Python
├── data/                   # Planilhas e metadados (não versionado)
│   └── .gitkeep
├── templates/              # Templates HTML (Jinja2)
│   ├── base.html
│   ├── home.html
│   ├── login.html
│   ├── upload.html
│   ├── controle_os.html
│   ├── agendadas.html
│   ├── nao_agendadas.html
│   └── recred.html
├── static/
│   ├── css/                # Estilos por página
│   └── js/                 # Scripts por página
└── .claude/                # Contexto e skills para Claude Code
    ├── CLAUDE.md
    └── skills/
        ├── add-dashboard.md
        └── inspect-js/
```

---

## Como Executar

### 1. Clone o repositório

```bash
git clone https://github.com/JvFaraco/operational-dashboard-platform.git
cd operational-dashboard-platform
```

### 2. Crie e ative o ambiente virtual

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate
```

### 3. Instale as dependências

```bash
pip install -r requirements.txt
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` ou exporte no terminal:

```bash
export A365_SECRET_KEY="sua_chave_secreta_aqui"
export A365_MASTER_PASS="sua_senha_aqui"
```

> Nunca suba os valores reais dessas variáveis para o repositório.

### 5. Adicione as planilhas de dados

Coloque os arquivos `.xlsx` na pasta `data/`:

```
data/
├── bios.xlsx           # Base de Controle de OS
├── agendadas.xlsx      # OS Agendadas
├── nao_agendadas.xlsx  # OS Não Agendadas
└── base.xlsx           # Contas x EPV (base compartilhada)
```

### 6. Inicie o servidor

```bash
python app.py
```

Disponível em:

```
Local:  http://localhost:5000
Rede:   http://<ip-da-maquina>:5000
```

---

## APIs Internas

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/controle-os` | GET | Dados da base `bios.xlsx` |
| `/api/agendadas` | GET | Dados da base `agendadas.xlsx` |
| `/api/nao-agendadas` | GET | Dados da base `nao_agendadas.xlsx` |
| `/api/recred` | GET | Registros de inadimplência |
| `/api/base` | GET | Contas x EPV (base compartilhada) |
| `/api/meta/<tipo>` | GET | Metadados e data de atualização de cada base |

---

## Autenticação

Acesso ao upload e funções protegidas exige login. A senha é única (master password) configurada via variável de ambiente `A365_MASTER_PASS`.

---

> Projeto desenvolvido para uso interno. Os dados operacionais não são versionados.
