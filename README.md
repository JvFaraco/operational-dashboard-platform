# 📊 A365 Ops — Dashboard Operacional Alarme 365

Dashboard operacional para gestão de Ordens de Serviço em operações de segurança eletrônica. Desenvolvido com Flask + Pandas no backend e HTML, CSS e JavaScript puro no frontend.

---

## 🚀 Funcionalidades

- **Login com controle de sessão** — acesso restrito por usuário
- **Upload de bases** — importação de arquivos `.xlsx` com histórico de atualizações
- **Controle de Agenda** — visão das O.S do controle de agenda com filtros
- **Agendadas** — acompanhamento das ordens agendadas
- **Não Agendadas** — visão das ordens sem agendamento
- **RECRED** — painel de contratos inadimplentes com cálculo de multa e dias suspensos
- **Cache em memória** — dados recarregados do disco apenas quando o arquivo muda
- **API REST interna** — endpoints JSON consumidos pelo frontend

---

## 🛠️ Stack

**Backend**

![Python](https://img.shields.io/badge/Python-%233776AB.svg?&style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-%23000.svg?&style=for-the-badge&logo=flask&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-%23150458.svg?&style=for-the-badge&logo=pandas&logoColor=white)

**Frontend**

![HTML5](https://img.shields.io/badge/HTML5-%23E34F26.svg?&style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-%231572B6.svg?&style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-%23F7DF1E.svg?&style=for-the-badge&logo=javascript&logoColor=black)

---

## 📁 Estrutura

```
operational-dashboard-platform/
├── app.py                  # Aplicação Flask — rotas e lógica de dados
├── requirements.txt        # Dependências Python
├── data/                   # Bases de dados (não versionadas)
│   └── .gitkeep
├── static/
│   ├── css/                # Estilos por módulo
│   └── js/                 # Scripts por módulo
└── templates/              # Templates HTML (Jinja2)
    ├── base.html
    ├── login.html
    ├── upload.html
    ├── home.html
    ├── agendadas.html
    ├── nao_agendadas.html
    ├── controle_os.html
    └── recred.html
```

---

## ⚙️ Como rodar localmente

**1. Clone o repositório**
```bash
git clone https://github.com/JvFaraco/operational-dashboard-platform.git
cd operational-dashboard-platform
```

**2. Instale as dependências**
```bash
pip install -r requirements.txt
```

**3. Configure as variáveis de ambiente (opcional)**
```bash
# Chave secreta da sessão
A365_SECRET_KEY=sua_chave_secreta

# Senha master de acesso
A365_MASTER_PASS=sua_senha
```

**4. Rode a aplicação**
```bash
python app.py
```

**5. Acesse no navegador**
```
http://localhost:5000
```

> A pasta `data/` precisa existir (já está no repo via `.gitkeep`). Faça o upload das bases pela interface após o login.

---

## 🔒 Segurança

- A pasta `data/` está no `.gitignore` — nenhum dado real é versionado
- Credenciais são gerenciadas via variáveis de ambiente
- Sessões controladas pelo Flask com `secret_key`

---

## 📫 Contato

[![LinkedIn](https://img.shields.io/badge/LinkedIn-%230077B5.svg?&style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/joão-victor-faraco-01066423a)
[![GitHub](https://img.shields.io/badge/GitHub-%23181717.svg?&style=for-the-badge&logo=github&logoColor=white)](https://github.com/JvFaraco)

---

<p align="center">Desenvolvido por <a href="https://github.com/JvFaraco">João Victor Faraco</a> · © 2025</p>
