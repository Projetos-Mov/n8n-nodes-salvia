import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from "n8n-workflow";

/**
 * Credencial do Salvia CRM: chave da API (Ajustes → Central de Integrações →
 * Desenvolvedores) enviada como Bearer token. A Base URL permite apontar pro
 * ambiente de teste (preview) sem mexer nos fluxos.
 */
export class SalviaApi implements ICredentialType {
  name = "salviaApi";

  displayName = "Salvia API";

  documentationUrl = "https://salviacrm.com.br";

  properties: INodeProperties[] = [
    {
      displayName: "Base URL",
      name: "baseUrl",
      type: "string",
      default: "https://salviacrm.com.br",
      description:
        "Endereço do Salvia. Pra testar, use a URL do ambiente de teste (preview).",
    },
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      typeOptions: { password: true },
      default: "",
      description:
        "Gerada no Salvia em Ajustes → Central de Integrações → Desenvolvedores.",
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        Authorization: "=Bearer {{$credentials.apiKey}}",
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: "={{$credentials.baseUrl}}",
      url: "/api/v1/me",
    },
  };
}
