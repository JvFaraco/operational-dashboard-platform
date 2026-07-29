# Política de Segurança

## Dados proibidos no repositório

Não envie para este projeto:

- planilhas operacionais reais;
- dados de clientes ou colaboradores;
- endereços, telefones, documentos ou coordenadas reais;
- senhas, tokens, cookies, chaves ou certificados;
- URLs internas e exports de sistemas corporativos;
- arquivos `.env` ou bancos de dados locais.

Use somente dados fictícios ou anonimizados nas demonstrações.

## Configuração

As credenciais locais devem ser definidas por variáveis de ambiente. Use `.env.example` como referência e mantenha o arquivo `.env` fora do Git.

Antes de publicar uma alteração, verifique:

```bash
git diff --cached
git status
```

Também pesquise por padrões comuns de segredo:

```bash
git grep -n -E "password|secret|token|authorization|bearer|api[_-]?key"
```

## Relato de vulnerabilidades

Não abra uma issue pública com credenciais, dados pessoais ou detalhes exploráveis. Entre em contato com o mantenedor de forma privada e informe:

- arquivo ou endpoint afetado;
- impacto observado;
- passos mínimos para reprodução;
- sugestão de correção, quando houver.

## Recomendações de implantação

- use HTTPS;
- configure uma chave de sessão longa e exclusiva;
- não use o servidor de desenvolvimento do Flask em produção;
- limite tamanho e extensão dos uploads;
- mantenha dependências atualizadas;
- restrinja o acesso à área de administração;
- registre uploads e alterações relevantes;
- não exponha mensagens de exceção ao usuário final.
