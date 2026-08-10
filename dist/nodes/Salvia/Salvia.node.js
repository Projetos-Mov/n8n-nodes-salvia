"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Salvia = void 0;
/**
 * Node declarativo do Salvia CRM. Sem método execute: o roteamento REST fica
 * todo na descrição — menos código, mesma robustez dos nodes oficiais.
 *
 * Operações:
 *   Lead → Criar  (POST /api/v1/leads)
 *
 * A resposta da API vem em { data: {...} } — o postReceive desembrulha pro
 * item de saída ser o lead direto.
 */
class Salvia {
    constructor() {
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
                    displayName: "Opções adicionais",
                    name: "additionalFields",
                    type: "collection",
                    placeholder: "Adicionar campo",
                    default: {},
                    displayOptions: { show: { resource: ["lead"], operation: ["create"] } },
                    options: [
                        {
                            displayName: "Funil (pipelineId)",
                            name: "pipelineId",
                            type: "string",
                            default: "",
                            description: "UUID do funil de destino (opcional)",
                            routing: { send: { type: "body", property: "pipelineId" } },
                        },
                        {
                            displayName: "Etapa (stageId)",
                            name: "stageId",
                            type: "string",
                            default: "",
                            description: "UUID da etapa de destino (opcional)",
                            routing: { send: { type: "body", property: "stageId" } },
                        },
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
