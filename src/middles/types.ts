import type { createMcpHandler, withMcpAuth } from 'mcp-handler'
import type { NextRequest, NextResponse } from 'next/server'

export interface Metadata {
  issuer?: string
  authorizationEndpoint?: string
  tokenEndpoint?: string
  registrationEndpoint?: string
  userinfoEndpoint?: string
  scopesSupported: string[]
  responseTypesSupported: string[]
  clientId: string | (() => string)
  clientSecret: string | (() => string)
}

export interface mcpHandlerParams {
  mcpServer: Parameters<typeof createMcpHandler>[0]
  mcpHandlerOptions?: Parameters<typeof createMcpHandler>[1]
  mcpHandlerConfig?: Omit<
    NonNullable<Parameters<typeof createMcpHandler>[2]>,
    'sseEndpoint' | 'sseMessageEndpoint'
  >
  verifyToken: Parameters<typeof withMcpAuth>[1]
}

export interface authCallParams {
  responseType: string
  clientId: string
  redirectUri: string
  scope: string
  state: string
}

export interface tokenCallParams {
  code: string
  grantType: string
  clientId: string
  clientSecret?: string | null
  codeVerifier?: string | null
}

export interface AuthConfig {
  customAuthEndpoint:
    | string
    | ((authCallParams: authCallParams) => Promise<string>)
  customToken: (
    tokenCallParams: tokenCallParams,
    request: NextRequest
  ) => Promise<Record<string, string>>
}

export type NextMcpMiddlewareOptions = {
  mcpHandlerParams: mcpHandlerParams
  next?: (request: NextRequest) => NextResponse
} & (
  | {
    needAuth: true
    metadata: Metadata
    authConfig: AuthConfig
  }
  | {
    needAuth: false
    metadata?: Metadata
    authConfig?: AuthConfig
  }
)

// OAuth2 Registration Response Schema
export interface RegistrationResponse {
  client_id: string
  client_secret: string
  client_id_issued_at: number
  client_secret_expires_at: number
  registration_access_token: string
  registration_client_uri: string
  token_endpoint_auth_method: string
  grant_types: string[]
  response_types?: string[]
  redirect_uris: string[]
  scope: string
  client_name: string
  client_uri?: string
  logo_uri?: string
  contacts?: string[]
  policy_uri?: string
  terms_of_service_uri?: string
  jwks_uri?: string
  software_id?: string
  software_version?: string
}
