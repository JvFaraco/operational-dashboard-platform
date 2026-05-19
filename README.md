# A365 Ops — Dashboard de Operações

Dashboard interno desenvolvido com Flask para gestão e visualização de ordens de serviço, controle de agendamentos e monitoramento de inadimplência da operação Alarme 365.

---

## 🖥️ Telas

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

## ⚙️ Stack

- **Backend**: [Flask 3.0](https://flask.palletsprojects.com/) + [Waitress](https://docs.pylonsproject.org/projects/waitress/) (servidor de produção)
- **Dados**: [pandas](https://pandas.pydata.org/) + [openpyxl](https://openpyxl.readthedocs.io/) para leitura de planilhas Excel
- **Frontend**: HTML5 + CSS3 + JavaScript puro (sem frameworks externos)
- **Autenticação**: Sessão Flask com variáveis de ambiente

---

## 📁 Estrutura do Projeto

```
a365ops/
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
└── static/
    ├── css/                # Estilos por página
    └── js/                 # Scripts por página
```

---

## 🚀 Como Executar

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/a365ops.git
cd a365ops
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

Crie um arquivo `.env` ou exporte as variáveis no terminal:

```bash
# Chave secreta da sessão Flask
export A365_SECRET_KEY="sua_chave_secreta_aqui"

# Senha master de acesso ao sistema
export A365_MASTER_PASS="sua_senha_aqui"
```

> ⚠️ **Nunca** suba os valores reais dessas variáveis para o repositório.

### 5. Adicione as planilhas de dados

Coloque os arquivos `.xlsx` na pasta `data/`:

```
data/
├── bios.xlsx           # Base de Controle de OS
├── agendadas.xlsx      # OS Agendadas
└── nao_agendadas.xlsx  # OS Não Agendadas
```

### 6. Inicie o servidor

```bash
python app.py
```

O sistema estará disponível em:

```
Local:  http://localhost:5000
Rede:   http://<ip-da-maquina>:5000
DNS:    http://a365ops:5000
```

---

## 🔐 Autenticação

O acesso ao upload e às funções protegidas exige login. Os usuários autorizados são definidos diretamente no código (`USERS`). A senha é única (master password) e configurada via variável de ambiente `A365_MASTER_PASS`.

---

## 📊 APIs Internas

O sistema expõe endpoints JSON consumidos pelo frontend:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/controle-os` | GET | Dados da base `bios.xlsx` |
| `/api/agendadas` | GET | Dados da base `agendadas.xlsx` |
| `/api/nao-agendadas` | GET | Dados da base `nao_agendadas.xlsx` |
| `/api/meta` | GET | Metadados das 3 bases |
| `/api/recred` | GET | Registros de inadimplência com cálculo de multa e dias suspensos |

---

## 📋 Requisitos

```
flask==3.0.3
pandas==2.2.2
numpy==1.26.4
openpyxl==3.1.2
waitress==3.0.0
```

---

## .gitignore recomendado

```gitignore
# Dados sensíveis / operacionais
data/*.xlsx
data/*.json

# Manter a pasta data no repositório
!data/.gitkeep

# Cache Python
__pycache__/
*.pyc
*.pyo

# Ambiente virtual
venv/
.env

# Arquivos de sistema
.DS_Store
Thumbs.db
```

---

> Projeto desenvolvido para uso interno. Os dados operacionais não são versionados.
