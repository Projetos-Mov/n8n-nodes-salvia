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

`POST /api/v1/leads` — campos: Nome (obrigatório), Telefone, Email, Origem e opcionais (funil, etapa, dono, campos personalizados, telefone duplicado) mais o rastreio completo da origem: **UTM Source, Medium, Campaign, Content e Term** e os IDs de clique **FBCLID** e **GCLID**. O lead cai na etapa de entrada do funil padrão quando funil/etapa não são informados.

Campo de rastreio deixado em branco não é enviado — o Salvia grava nulo em vez de string vazia, e o relatório por origem não enche de valores falsos. FBCLID e GCLID têm teto de 500 caracteres na API (UTMs, 200): acima disso a requisição é recusada inteira e o lead não é criado.

A saída do node é o lead criado (id, nome, etapa etc.) pronto pra usar nos próximos passos do fluxo.

## Desenvolvimento

```bash
npm install
npm run build   # tsc + cópia de ícones pro dist/
```

O `dist/` fica commitado pra permitir instalação direta pelo tarball do GitHub, sem build no servidor.
