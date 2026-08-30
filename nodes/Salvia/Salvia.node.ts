import type {
  ILoadOptionsFunctions,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

/**
 * Node declarativo do Salvia CRM. Sem método execute: o roteamento REST fica
 * todo na descrição — menos código, mesma robustez dos nodes oficiais.
 *
 * Operações:
 *   Lead → Criar  (POST /api/v1/leads)
 *
 * Funil e Etapa são DROPDOWNS carregados do GET /api/v1/catalog (estilo
 * Kommo): ninguém cola UUID. A resposta da API vem em { data: {...} } — o
 * postReceive desembrulha pro item de saída ser o lead direto.
 */

type CatalogPipeline = {
  id: string;
  name: string;
  stages: Array<{ id: string; name: string; type: string }>;
};

type CatalogCustomField = {
  key: string;
  label: string;
  type: string;
  options: string[];
};

type Catalog = {
  pipelines: CatalogPipeline[];
  customFields: CatalogCustomField[];
};

/** Rótulo amigável do tipo da etapa no dropdown. */
const STAGE_TYPE_LABEL: Record<string, string> = {
  won: " (ganho)",
  lost: " (perda)",
};

const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "texto",
  number: "número",
  date: "data",
  datetime: "data e hora",
  boolean: "sim/não",
  select: "seleção",
};

async function fetchCatalog(ctx: ILoadOptionsFunctions): Promise<Catalog> {
  const creds = (await ctx.getCredentials("salviaApi")) as { baseUrl: string };
  const res = (await ctx.helpers.httpRequestWithAuthentication.call(ctx, "salviaApi", {
    method: "GET",
    baseURL: String(creds.baseUrl).replace(/\/+$/, ""),
    url: "/api/v1/catalog",
    json: true,
  })) as { data?: { pipelines?: CatalogPipeline[]; customFields?: CatalogCustomField[] } };
  return {
    pipelines: res.data?.pipelines ?? [],
    customFields: res.data?.customFields ?? [],
  };
}

export class Salvia implements INodeType {
  methods = {
    loadOptions: {
      async getPipelines(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const { pipelines } = await fetchCatalog(this);
        return [
          { name: "— Funil padrão do Salvia —", value: "" },
          ...pipelines.map((p) => ({ name: p.name, value: p.id })),
        ];
      },

      async getStages(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const { pipelines } = await fetchCatalog(this);
        const pipelineId = (this.getCurrentNodeParameter("pipelineId") as string) || "";
        // Sem funil escolhido, lista as etapas de todos com o funil no rótulo —
        // escolher a etapa já basta (a API deriva o funil dela).
        const fonte = pipelineId ? pipelines.filter((p) => p.id === pipelineId) : pipelines;
        const prefixo = (p: CatalogPipeline) =>
          pipelineId || pipelines.length === 1 ? "" : `${p.name} → `;
        return [
          { name: "— Etapa de entrada (padrão) —", value: "" },
          ...fonte.flatMap((p) =>
            p.stages.map((s) => ({
              name: `${prefixo(p)}${s.name}${STAGE_TYPE_LABEL[s.type] ?? ""}`,
              value: s.id,
            })),
          ),
        ];
      },

      async getCustomFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
        const { customFields } = await fetchCatalog(this);
        return customFields.map((f) => {
          const opt: INodePropertyOptions = {
            name: `${f.label} (${FIELD_TYPE_LABEL[f.type] ?? f.type})`,
            value: f.key,
          };
          if (f.type === "select" && f.options.length) {
            opt.description = `Opções: ${f.options.join(", ")}`;
          }
          return opt;
        });
      },
    },
  };

  description: INodeTypeDescription = {
    displayName: "Salvia",
    name: "salvia",
    icon: "file:salvia.svg",
    group: ["transform"],
    version: 1,
    subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
    description: "Interage com o Salvia CRM (leads, funil, atendimento)",
    defaults: {
      name: "Salvia",
    },
    // Literal "main" compila em qualquer versão do n8n-workflow (o enum
    // NodeConnectionType virou type-only em versões recentes).
    inputs: ["main"] as unknown as INodeTypeDescription["inputs"],
    outputs: ["main"] as unknown as INodeTypeDescription["outputs"],
    usableAsTool: true,
    credentials: [
      {
        name: "salviaApi",
        required: true,
      },
    ],
    requestDefaults: {
      baseURL: "={{ $credentials.baseUrl }}",
      headers: {
        "Content-Type": "application/json",
      },
    },
    properties: [
      {
        displayName: "Recurso",
        name: "resource",
        type: "options",
        noDataExpression: true,
        options: [{ name: "Lead", value: "lead" }],
        default: "lead",
      },
      {
        displayName: "Operação",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: { show: { resource: ["lead"] } },
        options: [
          {
            name: "Criar",
            value: "create",
            action: "Criar um lead",
            description:
              "Cria um lead no funil (etapa de entrada do funil padrão, salvo se você indicar outra)",
            routing: {
              request: {
                method: "POST",
                url: "/api/v1/leads",
              },
              output: {
                postReceive: [
                  {
                    type: "rootProperty",
                    properties: { property: "data" },
                  },
                ],
              },
            },
          },
        ],
        default: "create",
      },

      // ── Campos do Criar Lead ──
      {
        displayName: "Nome",
        name: "name",
        type: "string",
        required: true,
        default: "",
        placeholder: "Maria Souza",
        displayOptions: { show: { resource: ["lead"], operation: ["create"] } },
        routing: { send: { type: "body", property: "name" } },
      },
      {
        displayName: "Telefone",
        name: "phone",
        type: "string",
        default: "",
        placeholder: "+55 71 99999-9999",
        description: "Com DDD. Aceita formato nacional ou internacional.",
        displayOptions: { show: { resource: ["lead"], operation: ["create"] } },
        routing: { send: { type: "body", property: "phone" } },
      },
      {
        displayName: "Email",
        name: "email",
        type: "string",
        default: "",
        placeholder: "maria@email.com",
        displayOptions: { show: { resource: ["lead"], operation: ["create"] } },
        routing: { send: { type: "body", property: "email" } },
      },
      {
        displayName: "Origem",
        name: "origin",
        type: "string",
        default: "",
        placeholder: "instagram-ads",
        description: "De onde o lead veio (aparece na ficha e nas métricas)",
        displayOptions: { show: { resource: ["lead"], operation: ["create"] } },
        routing: { send: { type: "body", property: "origin" } },
      },
      {
        displayName: "Funil",
        name: "pipelineId",
        type: "options",
        typeOptions: { loadOptionsMethod: "getPipelines" },
        default: "",
        description:
          "Carregado da sua conta. Deixe no padrão pra usar o primeiro funil.",
        displayOptions: { show: { resource: ["lead"], operation: ["create"] } },
        routing: {
          send: {
            type: "body",
            property: "pipelineId",
            // "" não pode ir pro corpo — a API valida UUID.
            value: "={{ $value === '' ? undefined : $value }}",
          },
        },
      },
      {
        displayName: "Etapa",
        name: "stageId",
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getStages",
          loadOptionsDependsOn: ["pipelineId"],
        },
        default: "",
        description:
          "Etapas do funil escolhido (ou de todos, com o funil no nome). Escolher a etapa já define o funil.",
        displayOptions: { show: { resource: ["lead"], operation: ["create"] } },
        routing: {
          send: {
            type: "body",
            property: "stageId",
            value: "={{ $value === '' ? undefined : $value }}",
          },
        },
      },
      {
        displayName: "Campos personalizados",
        name: "customFieldsUi",
        type: "fixedCollection",
        typeOptions: { multipleValues: true },
        placeholder: "Adicionar campo personalizado",
        default: {},
        description:
          "Campos criados na sua conta do Salvia. O dropdown carrega direto de lá — crie o campo no Salvia e ele aparece aqui.",
        displayOptions: { show: { resource: ["lead"], operation: ["create"] } },
        options: [
          {
            displayName: "Campo",
            name: "values",
            values: [
              {
                displayName: "Campo",
                name: "key",
                type: "options",
                typeOptions: { loadOptionsMethod: "getCustomFields" },
                default: "",
              },
              {
                displayName: "Valor",
                name: "value",
                type: "string",
                default: "",
              },
            ],
          },
        ],
        routing: {
          send: {
            type: "body",
            property: "customFields",
            // Vira {"chave": "valor"} no corpo; sem linhas preenchidas, nem vai.
            value:
              "={{ (($value && $value.values) || []).filter(v => v.key).length ? Object.fromEntries($value.values.filter(v => v.key).map(v => [v.key, v.value])) : undefined }}",
          },
        },
      },
      {
        displayName: "Opções adicionais",
        name: "additionalFields",
        type: "collection",
        placeholder: "Adicionar campo",
        default: {},
        displayOptions: { show: { resource: ["lead"], operation: ["create"] } },
        options: [
          {
            displayName: "Dono (email do atendente)",
            name: "ownerEmail",
            type: "string",
            default: "",
            description: "Email de um usuário do Salvia que vira dono do lead",
            routing: { send: { type: "body", property: "ownerEmail" } },
          },
          {
            displayName: "UTM Source",
            name: "utmSource",
            type: "string",
            default: "",
            routing: { send: { type: "body", property: "utmSource" } },
          },
          {
            displayName: "UTM Medium",
            name: "utmMedium",
            type: "string",
            default: "",
            routing: { send: { type: "body", property: "utmMedium" } },
          },
          {
            displayName: "UTM Campaign",
            name: "utmCampaign",
            type: "string",
            default: "",
            routing: { send: { type: "body", property: "utmCampaign" } },
          },
          {
            displayName: "Permitir telefone duplicado",
            name: "forceDuplicate",
            type: "boolean",
            default: false,
            description:
              "Se desligado (padrão), telefone já cadastrado devolve erro com o ID do lead existente",
            routing: { send: { type: "body", property: "forceDuplicate" } },
          },
        ],
      },
    ],
  };
}
