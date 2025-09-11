import type {
  authCallParams,
  AuthConfig,
  mcpHandlerParams,
  Metadata,
  NextMcpMiddlewareOptions,
  RegistrationResponse,
  tokenCallParams,
} from '../../src/middles/types'
import { describe, expect, it, vi } from 'vitest'

describe('type definitions', () => {
  describe('metadata interface', () => {
    it('should accept all optional fields', () => {
      const metadata: Metadata = {
        issuer: 'https://example.com',
        authorizationEndpoint: 'https://example.com/auth',
        tokenEndpoint: 'https://example.com/token',
        registrationEndpoint: 'https://example.com/register',
        userinfoEndpoint: 'https://example.com/userinfo',
        tokenEndpointAuthMethodsSupported: ['client_secret_basic'],
        scopesSupported: ['profile', 'email'],
        responseTypesSupported: ['code'],
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      }

      expect(metadata.issuer).toBe('https://example.com')
      expect(metadata.scopesSupported).toEqual(['profile', 'email'])
      expect(metadata.clientId).toBe('test-client-id')
    })

    it('should accept function-based clientId and clientSecret', () => {
      const metadata: Metadata = {
        scopesSupported: ['profile'],
        responseTypesSupported: ['code'],
        clientId: () => 'dynamic-client-id',
        clientSecret: () => 'dynamic-client-secret',
      }

      expect(typeof metadata.clientId).toBe('function')
      expect(typeof metadata.clientSecret).toBe('function')
      expect(metadata.clientId()).toBe('dynamic-client-id')
      expect(metadata.clientSecret()).toBe('dynamic-client-secret')
    })

    it('should require scopesSupported and responseTypesSupported', () => {
      const metadata: Metadata = {
        scopesSupported: ['profile'],
        responseTypesSupported: ['code'],
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      }

      expect(metadata.scopesSupported).toBeDefined()
      expect(metadata.responseTypesSupported).toBeDefined()
    })
  })

  describe('mcpHandlerParams interface', () => {
    it('should accept all required fields', () => {
      const mcpServer = vi.fn()
      const verifyToken = vi.fn()

      const params: mcpHandlerParams = {
        mcpServer,
        mcpHandlerOptions: { timeout: 5000 },
        mcpHandlerConfig: { basePath: '/api' },
        verifyToken,
      }

      expect(params.mcpServer).toBe(mcpServer)
      expect(params.verifyToken).toBe(verifyToken)
      expect(params.mcpHandlerOptions).toEqual({ timeout: 5000 })
      expect(params.mcpHandlerConfig).toEqual({ basePath: '/api' })
    })

    it('should accept optional fields', () => {
      const mcpServer = vi.fn()
      const verifyToken = vi.fn()

      const params: mcpHandlerParams = {
        mcpServer,
        verifyToken,
      }

      expect(params.mcpServer).toBe(mcpServer)
      expect(params.verifyToken).toBe(verifyToken)
      expect(params.mcpHandlerOptions).toBeUndefined()
      expect(params.mcpHandlerConfig).toBeUndefined()
    })
  })

  describe('authCallParams interface', () => {
    it('should accept all required fields', () => {
      const params: authCallParams = {
        responseType: 'code',
        clientId: 'test-client-id',
        redirectUri: 'https://example.com/callback',
        scope: 'profile email',
        state: 'random-state-string',
      }

      expect(params.responseType).toBe('code')
      expect(params.clientId).toBe('test-client-id')
      expect(params.redirectUri).toBe('https://example.com/callback')
      expect(params.scope).toBe('profile email')
      expect(params.state).toBe('random-state-string')
    })
  })

  describe('tokenCallParams interface', () => {
    it('should accept all required fields', () => {
      const params: tokenCallParams = {
        code: 'authorization-code',
        grantType: 'authorization_code',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        codeVerifier: 'code-verifier',
      }

      expect(params.code).toBe('authorization-code')
      expect(params.grantType).toBe('authorization_code')
      expect(params.clientId).toBe('test-client-id')
      expect(params.clientSecret).toBe('test-client-secret')
      expect(params.codeVerifier).toBe('code-verifier')
    })

    it('should accept null values for optional fields', () => {
      const params: tokenCallParams = {
        code: 'authorization-code',
        grantType: 'authorization_code',
        clientId: 'test-client-id',
        clientSecret: null,
        codeVerifier: null,
      }

      expect(params.clientSecret).toBeNull()
      expect(params.codeVerifier).toBeNull()
    })
  })

  describe('authConfig interface', () => {
    it('should accept string customAuthEndpoint', () => {
      const config: AuthConfig = {
        customAuthEndpoint: 'https://auth.example.com/authorize',
        customToken: vi.fn(),
      }

      expect(config.customAuthEndpoint).toBe('https://auth.example.com/authorize')
      expect(typeof config.customToken).toBe('function')
    })

    it('should accept function customAuthEndpoint', () => {
      const customAuthEndpoint = vi.fn().mockResolvedValue('https://auth.example.com/authorize')
      const config: AuthConfig = {
        customAuthEndpoint,
        customToken: vi.fn(),
      }

      expect(typeof config.customAuthEndpoint).toBe('function')
      expect(typeof config.customToken).toBe('function')
    })

    it('should accept only customToken', () => {
      const config: AuthConfig = {
        customToken: vi.fn(),
      }

      expect(config.customAuthEndpoint).toBeUndefined()
      expect(typeof config.customToken).toBe('function')
    })
  })

  describe('nextMcpMiddlewareOptions interface', () => {
    it('should accept options with authentication', () => {
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: {
          mcpServer: vi.fn(),
          verifyToken: vi.fn(),
        },
        needAuth: true,
        metadata: {
          scopesSupported: ['profile'],
          responseTypesSupported: ['code'],
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
        },
        authConfig: {
          customToken: vi.fn(),
        },
      }

      expect(options.needAuth).toBe(true)
      expect(options.metadata).toBeDefined()
      expect(options.authConfig).toBeDefined()
    })

    it('should accept options without authentication', () => {
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: {
          mcpServer: vi.fn(),
          verifyToken: vi.fn(),
        },
        needAuth: false,
      }

      expect(options.needAuth).toBe(false)
      expect(options.metadata).toBeUndefined()
      expect(options.authConfig).toBeUndefined()
    })

    it('should accept optional next function', () => {
      const nextFn = vi.fn()
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: {
          mcpServer: vi.fn(),
          verifyToken: vi.fn(),
        },
        needAuth: false,
        next: nextFn,
      }

      expect(options.next).toBe(nextFn)
    })
  })

  describe('registrationResponse interface', () => {
    it('should accept all required fields', () => {
      const response: RegistrationResponse = {
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        client_id_issued_at: 1234567890,
        client_secret_expires_at: 0,
        registration_access_token: 'reg-token',
        registration_client_uri: 'https://example.com/register/test-client-id',
        token_endpoint_auth_method: 'client_secret_basic',
        grant_types: ['authorization_code'],
        response_types: ['code'],
        redirect_uris: ['https://example.com/callback'],
        scope: 'profile email',
        client_name: 'Test Client',
        client_uri: 'https://example.com',
        logo_uri: 'https://example.com/logo.png',
        contacts: ['admin@example.com'],
        policy_uri: 'https://example.com/policy',
        terms_of_service_uri: 'https://example.com/terms',
        jwks_uri: 'https://example.com/jwks.json',
        software_id: 'test-software',
        software_version: '1.0.0',
      }

      expect(response.client_id).toBe('test-client-id')
      expect(response.grant_types).toEqual(['authorization_code'])
      expect(response.redirect_uris).toEqual(['https://example.com/callback'])
    })

    it('should accept optional fields', () => {
      const response: RegistrationResponse = {
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        client_id_issued_at: 1234567890,
        client_secret_expires_at: 0,
        registration_access_token: 'reg-token',
        registration_client_uri: 'https://example.com/register/test-client-id',
        token_endpoint_auth_method: 'client_secret_basic',
        grant_types: ['authorization_code'],
        redirect_uris: ['https://example.com/callback'],
        scope: 'profile',
        client_name: 'Test Client',
      }

      expect(response.response_types).toBeUndefined()
      expect(response.client_uri).toBeUndefined()
      expect(response.logo_uri).toBeUndefined()
    })
  })
})
