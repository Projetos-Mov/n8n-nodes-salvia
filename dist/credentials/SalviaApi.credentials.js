"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalviaApi = void 0;
/**
 * Credencial do Salvia CRM: chave da API (Ajustes → Central de Integrações →
 * Desenvolvedores) enviada como Bearer token. A Base URL permite apontar pro
 * ambiente de teste (preview) sem mexer nos fluxos.
 */
class SalviaApi {
    constructor() {
        this.name = "salviaApi";
        this.displayName = "Salvia API";
        this.documentationUrl = "https://salviacrm.com.br";
        this.properties = [
            {
                displayName: "Base URL",
                name: "baseUrl",
                type: "string",
                // COM www: o apex responde 308 pro www, e clients HTTP descartam o
                // header Authorization no redirect — a chave nunca chegava na API e o
                // teste de credencial falhava com "Couldn't connect".
                default: "https://www.salviacrm.com.br",
                description: "Endereço do Salvia. Pra testar, use a URL do ambiente de teste (preview).",
            },
            {
                displayName: "API Key",
                name: "apiKey",
                type: "string",
                typeOptions: { password: true },
                default: "",
                description: "Gerada no Salvia em Ajustes → Central de Integrações → Desenvolvedores.",
            },
        ];
        this.authenticate = {
            type: "generic",
            properties: {
                headers: {
                    Authorization: "=Bearer {{$credentials.apiKey}}",
                },
            },
        };
        this.test = {
            request: {
                baseURL: "={{$credentials.baseUrl}}",
                url: "/api/v1/me",
            },
        };
    }
}
exports.SalviaApi = SalviaApi;
