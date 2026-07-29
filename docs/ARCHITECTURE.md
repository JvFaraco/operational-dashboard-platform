# Arquitetura

## Contexto

A aplicação consolida arquivos operacionais em dashboards web. Ela foi desenhada para um cenário em que as fontes originais ainda são planilhas Excel, mas a visualização precisa ser centralizada e acessível por navegador.

## Fluxo de dados

1. Um usuário autenticado envia uma planilha pela área de upload.
2. O backend valida o tipo de base e armazena o arquivo localmente.
3. O pandas lê e normaliza datas, valores vazios e tipos incompatíveis com JSON.
4. O resultado processado é mantido em cache enquanto o arquivo não é alterado.
5. Endpoints internos disponibilizam os registros em JSON.
6. O frontend aplica filtros, agrega indicadores e renderiza gráficos e rankings.

## Componentes

### Backend Flask

Responsável por rotas, autenticação de sessão, upload, leitura das bases e APIs internas.

### Camada de dados

A versão atual usa arquivos `.xlsx` e pequenos metadados JSON. A pasta `data/` não é versionada para impedir exposição de informações operacionais.

### Cache

Cada base possui a data de modificação verificada antes da leitura. Quando o arquivo muda, o cache correspondente é invalidado e reconstruído.

### Frontend

Os templates Jinja2 entregam a estrutura das páginas. CSS e JavaScript são separados por dashboard. Chart.js atende gráficos e Leaflet atende visualizações geográficas.

## Fronteiras de segurança

- O upload deve aceitar apenas formatos esperados.
- Credenciais ficam em variáveis de ambiente.
- Bases reais não podem ser commitadas.
- Mensagens de erro não devem revelar dados internos em produção.
- A aplicação deve ser publicada atrás de HTTPS e de um proxy confiável.

## Evolução proposta

```text
Excel/API externa
       │
       ▼
Camada de importação
       │
       ▼
Serviço de normalização
       │
       ▼
SQLite/PostgreSQL
       │
       ├── API de indicadores
       ├── auditoria de uploads
       └── gestão de usuários
               │
               ▼
Dashboards web
```

A migração para banco de dados permitirá histórico, concorrência, controle de acesso por perfil e análises temporais sem depender do arquivo mais recente.
