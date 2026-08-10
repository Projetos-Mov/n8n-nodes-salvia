# n8n-nodes-salvia

Nodes do **Salvia CRM** para o n8n: crie leads a partir de qualquer fluxo (formulário, planilha, anúncio, bot) com credencial própria e campos amigáveis.

## Instalação (n8n self-hosted)

No terminal do container do n8n:

```bash
mkdir -p ~/.n8n/nodes && cd ~/.n8n/nodes
npm install https://github.com/Projetos-Mov/n8n-nodes-salvia/archive/refs/heads/main.tar.gz
```

Depois **reinicie o n8n**. O node "Salvia" aparece na busca de nodes.

## Credencial

1. No Salvia: **Ajustes → Central de Integrações → Desenvolvedores → Nova chave** (planos Pro e Clínica).
2. No n8n: **Credentials → New → Salvia API**:
   - **Base URL**: `https://salviacrm.com.br` (ou a URL do ambiente de teste)
   - **API Key**: a chave gerada
3. O botão de teste chama `GET /api/v1/me` e confirma a conexão.

## Operações

### Lead → Criar

`POST /api/v1/leads` — campos: Nome (obrigatório), Telefone, Email, Origem e opcionais (funil, etapa, dono, campos personalizados, UTMs, telefone duplicado). O lead cai na etapa de entrada do funil padrão quando funil/etapa não são informados.

A saída do node é o lead criado (id, nome, etapa etc.) pronto pra usar nos próximos passos do fluxo.

## Desenvolvimento

```bash
npm install
npm run build   # tsc + cópia de ícones pro dist/
```

O `dist/` fica commitado pra permitir instalação direta pelo tarball do GitHub, sem build no servidor.
