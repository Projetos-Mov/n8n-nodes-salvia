"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Salvia = void 0;
/** Rótulo amigável do tipo da etapa no dropdown. */
const STAGE_TYPE_LABEL = {
    won: " (ganho)",
    lost: " (perda)",
};
async function fetchCatalog(ctx) {
    var _a, _b;
    const creds = (await ctx.getCredentials("salviaApi"));
    const res = (await ctx.helpers.httpRequestWithAuthentication.call(ctx, "salviaApi", {
        method: "GET",
        baseURL: String(creds.baseUrl).replace(/\/+$/, ""),
        url: "/api/v1/catalog",
        json: true,
    }));
    return (_b = (_a = res.data) === null || _a === void 0 ? void 0 : _a.pipelines) !== null && _b !== void 0 ? _b : [];
}
class Salvia {
    constructor() {
        this.methods = {
            loadOptions: {
                async getPipelines() {
                    const pipelines = await fetchCatalog(this);
                    return [
                        { name: "— Funil padrão do Salvia —", value: "" },
                        ...pipelines.map((p) => ({ name: p.name, value: p.id })),
                    ];
                },
                async getStages() {
                    const pipelines = await fetchCatalog(this);
                    const pipelineId = this.getCurrentNodeParameter("pipelineId") || "";
                    // Sem funil escolhido, lista as etapas de todos com o funil no rótulo —
                    // escolher a etapa já basta (a API deriva o funil dela).
                    const fonte = pipelineId ? pipelines.filter((p) => p.id === pipelineId) : pipelines;
                    const prefixo = (p) => pipelineId || pipelines.length === 1 ? "" : `${p.name} → `;
                    return [
                        { name: "— Etapa de entrada (padrão) —", value: "" },
                        ...fonte.flatMap((p) => p.stages.map((s) => {
                            var _a;
                            return ({
                                name: `${prefixo(p)}${s.name}${(_a = STAGE_TYPE_LABEL[s.type]) !== null && _a !== void 0 ? _a : ""}`,
                                value: s.id,
                            });
                        })),
                    ];
                },
            },
        };
        this.description = {
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
            inputs: ["main"],
            outputs: ["main"],
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
                            description: "Cria um lead no funil (etapa de entrada do funil padrão, salvo se você indicar outra)",
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
                    description: "Carregado da sua conta. Deixe no padrão pra usar o primeiro funil.",
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
                    description: "Etapas do funil escolhido (ou de todos, com o funil no nome). Escolher a etapa já define o funil.",
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
                            displayName: "Campos personalizados (JSON)",
                            name: "customFields",
                            type: "json",
                            default: "{}",
                            description: 'Ex.: {"convenio": "Unimed", "procedimento": "Botox"}',
                            routing: {
                                send: {
                                    type: "body",
                                    property: "customFields",
                                    value: "={{ typeof $value === 'string' ? JSON.parse($value || '{}') : $value }}",
                                },
                            },
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
                            description: "Se desligado (padrão), telefone já cadastrado devolve erro com o ID do lead existente",
                            routing: { send: { type: "body", property: "forceDuplicate" } },
                        },
                    ],
                },
            ],
        };
    }
}
exports.Salvia = Salvia;
