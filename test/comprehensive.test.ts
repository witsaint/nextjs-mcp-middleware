import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextMcpMiddleware } from '../src/middles'
import type { NextMcpMiddlewareOptions, Metadata, AuthConfig, mcpHandlerParams } from '../src/middles/types'

// Mock all dependencies
vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string
    method: string
    headers: Headers
    nextUrl: URL

    constructor(url: string, init?: RequestInit) {
      this.url = url
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers)
      this.nextUrl = new URL(url)
    }

    async json() {
      return {}
    }

    async formData() {
      return new FormData()
    }
  },
  NextResponse: {
    json: (data: any, init?: ResponseInit) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
      headers: new Headers(init?.headers),
    }),
    next: () => ({
      status: 200,
      headers: new Headers(),
    }),
    redirect: (url: string) => ({
      status: 302,
      headers: new Headers({ Location: url }),
    }),
  },
}))

vi.mock('mcp-handler', () => ({
  createMcpHandler: vi.fn(() => vi.fn()),
  withMcpAuth: vi.fn(() => vi.fn()),
  protectedResourceHandler: vi.fn(() => vi.fn()),
}))

vi.mock('../src/middles/api/mcp', () => ({
  mcpMiddleware: vi.fn(() => Promise.resolve({ status: 200 })),
}))

vi.mock('../src/middles/api/auth-register', () => ({
  authRegister: vi.fn(() => Promise.resolve({ status: 200 })),
}))

vi.mock('../src/middles/api/auth-authorize', () => ({
  authAuthorize: vi.fn(() => Promise.resolve({ status: 302 })),
}))

vi.mock('../src/middles/api/auth-token', () => ({
  authToken: vi.fn(() => Promise.resolve({ status: 200 })),
}))

vi.mock('../src/middles/will-know/oauth-authoriztion', () => ({
  oauthAuthorizationMiddleware: vi.fn(() => ({ status: 200 })),
}))

vi.mock('../src/middles/will-know/oauth-protected', () => ({
  protectedResourceMiddleware: vi.fn(() => ({ status: 200 })),
}))

vi.mock('../src/middles/cors', () => ({
  getCorsHeaders: vi.fn(() => ({ 'Access-Control-Allow-Origin': '*' })),
  jsonWithCors: vi.fn((req, data, init) => ({
    json: () => Promise.resolve(data),
    status: init?.status || 200,
    headers: new Headers(init?.headers),
  })),
}))

vi.mock('../src/middles/debug', () => ({
  debugLogger: vi.fn(),
}))

describe('nextjs-mcp-middleware', () => {
  const mockMcpHandlerParams: mcpHandlerParams = {
    mcpServer: vi.fn(),
    mcpHandlerOptions: {},
    mcpHandlerConfig: { basePath: '/api' },
    verifyToken: vi.fn(),
  }

  const mockMetadata: Metadata = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    scopesSupported: ['profile', 'email'],
    responseTypesSupported: ['code'],
  }

  const mockAuthConfig: AuthConfig = {
    customToken: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('nextMcpMiddleware', () => {
    it('should create middleware without authentication', () => {
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: mockMcpHandlerParams,
        needAuth: false,
      }

      const result = nextMcpMiddleware(options)

      expect(result).toHaveProperty('middlewareGenerator')
      expect(result).toHaveProperty('matcher')
      expect(Array.isArray(result.matcher)).toBe(true)
      expect(typeof result.middlewareGenerator).toBe('function')
    })

    it('should create middleware with authentication', () => {
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: mockMcpHandlerParams,
        needAuth: true,
        metadata: mockMetadata,
        authConfig: mockAuthConfig,
      }

      const result = nextMcpMiddleware(options)

      expect(result).toHaveProperty('middlewareGenerator')
      expect(result).toHaveProperty('matcher')
      expect(Array.isArray(result.matcher)).toBe(true)
      expect(typeof result.middlewareGenerator).toBe('function')
    })

    it('should include correct paths in matcher', () => {
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: mockMcpHandlerParams,
        needAuth: false,
      }

      const result = nextMcpMiddleware(options)

      expect(result.matcher).toContain('/api/mcp')
      expect(result.matcher).toContain('/.well-known/oauth-authorization-server')
      expect(result.matcher).toContain('/.well-known/oauth-protected-resource')
      expect(result.matcher).toContain('/api/auth/register')
    })

    it('should use custom basePath', () => {
      const customMcpHandlerParams: mcpHandlerParams = {
        ...mockMcpHandlerParams,
        mcpHandlerConfig: { basePath: '/custom-api' },
      }

      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: customMcpHandlerParams,
        needAuth: false,
      }

      const result = nextMcpMiddleware(options)

      expect(result.matcher).toContain('/custom-api/mcp')
      expect(result.matcher).toContain('/custom-api/auth/register')
    })

    it('should default to /api when basePath is not provided', () => {
      const customMcpHandlerParams: mcpHandlerParams = {
        ...mockMcpHandlerParams,
        mcpHandlerConfig: {},
      }

      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: customMcpHandlerParams,
        needAuth: false,
      }

      const result = nextMcpMiddleware(options)

      expect(result.matcher).toContain('/api/mcp')
      expect(result.matcher).toContain('/api/auth/register')
    })
  })

  describe('Type definitions', () => {
    it('should accept valid Metadata interface', () => {
      const metadata: Metadata = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        scopesSupported: ['profile', 'email'],
        responseTypesSupported: ['code'],
      }

      expect(metadata.clientId).toBe('test-client-id')
      expect(metadata.scopesSupported).toEqual(['profile', 'email'])
    })

    it('should accept function-based clientId and clientSecret', () => {
      const metadata: Metadata = {
        clientId: () => 'dynamic-client-id',
        clientSecret: () => 'dynamic-client-secret',
        scopesSupported: ['profile'],
        responseTypesSupported: ['code'],
      }

      expect(typeof metadata.clientId).toBe('function')
      expect(typeof metadata.clientSecret).toBe('function')
    })

    it('should accept valid AuthConfig interface', () => {
      const authConfig: AuthConfig = {
        customToken: vi.fn(),
      }

      expect(typeof authConfig.customToken).toBe('function')
    })

    it('should accept string customAuthEndpoint', () => {
      const authConfig: AuthConfig = {
        customAuthEndpoint: 'https://auth.example.com/authorize',
        customToken: vi.fn(),
      }

      expect(authConfig.customAuthEndpoint).toBe('https://auth.example.com/authorize')
    })

    it('should accept function customAuthEndpoint', () => {
      const customAuthEndpoint = vi.fn()
      const authConfig: AuthConfig = {
        customAuthEndpoint,
        customToken: vi.fn(),
      }

      expect(typeof authConfig.customAuthEndpoint).toBe('function')
    })
  })

  describe('CORS utilities', () => {
    it('should have getCorsHeaders function', async () => {
      const { getCorsHeaders } = await import('../src/middles/cors')
      expect(typeof getCorsHeaders).toBe('function')
    })

    it('should have jsonWithCors function', async () => {
      const { jsonWithCors } = await import('../src/middles/cors')
      expect(typeof jsonWithCors).toBe('function')
    })
  })

  describe('API middleware functions', () => {
    it('should have mcpMiddleware function', async () => {
      const { mcpMiddleware } = await import('../src/middles/api/mcp')
      expect(typeof mcpMiddleware).toBe('function')
    })

    it('should have authRegister function', async () => {
      const { authRegister } = await import('../src/middles/api/auth-register')
      expect(typeof authRegister).toBe('function')
    })

    it('should have authAuthorize function', async () => {
      const { authAuthorize } = await import('../src/middles/api/auth-authorize')
      expect(typeof authAuthorize).toBe('function')
    })

    it('should have authToken function', async () => {
      const { authToken } = await import('../src/middles/api/auth-token')
      expect(typeof authToken).toBe('function')
    })
  })

  describe('OAuth middleware functions', () => {
    it('should have oauthAuthorizationMiddleware function', async () => {
      const { oauthAuthorizationMiddleware } = await import('../src/middles/will-know/oauth-authoriztion')
      expect(typeof oauthAuthorizationMiddleware).toBe('function')
    })

    it('should have protectedResourceMiddleware function', async () => {
      const { protectedResourceMiddleware } = await import('../src/middles/will-know/oauth-protected')
      expect(typeof protectedResourceMiddleware).toBe('function')
    })
  })
})
