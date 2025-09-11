import { describe, it, expect } from 'vitest'
import { nextMcpMiddleware } from '../src/middles'
import type { NextMcpMiddlewareOptions } from '../src/middles/types'

// Mock all the middleware functions
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

vi.mock('../src/middles/debug', () => ({
  debugLogger: vi.fn(),
}))

describe('nextMcpMiddleware - Basic Tests', () => {
  const mockMcpHandlerParams = {
    mcpServer: vi.fn(),
    mcpHandlerOptions: {},
    mcpHandlerConfig: { basePath: '/api' },
    verifyToken: vi.fn(),
  }

  const mockMetadata = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    scopesSupported: ['profile', 'email'],
    responseTypesSupported: ['code'],
  }

  const mockAuthConfig = {
    customToken: vi.fn(),
  }

  it('should create middleware with correct matcher paths', () => {
    const options: NextMcpMiddlewareOptions = {
      mcpHandlerParams: mockMcpHandlerParams,
      needAuth: false,
    }

    const result = nextMcpMiddleware(options)

    expect(result.matcher).toEqual([
      '/api/mcp',
      '/.well-known/oauth-authorization-server',
      '/.well-known/oauth-protected-resource',
      '/api/auth/register',
    ])
  })

  it('should create middleware with authentication enabled', () => {
    const options: NextMcpMiddlewareOptions = {
      mcpHandlerParams: mockMcpHandlerParams,
      needAuth: true,
      metadata: mockMetadata,
      authConfig: mockAuthConfig,
    }

    const result = nextMcpMiddleware(options)

    expect(result.matcher).toEqual([
      '/api/mcp',
      '/.well-known/oauth-authorization-server',
      '/.well-known/oauth-protected-resource',
      '/api/auth/register',
    ])
  })

  it('should use custom basePath from mcpHandlerConfig', () => {
    const customMcpHandlerParams = {
      ...mockMcpHandlerParams,
      mcpHandlerConfig: { basePath: '/custom-api' },
    }

    const options: NextMcpMiddlewareOptions = {
      mcpHandlerParams: customMcpHandlerParams,
      needAuth: false,
    }

    const result = nextMcpMiddleware(options)

    expect(result.matcher).toEqual([
      '/custom-api/mcp',
      '/.well-known/oauth-authorization-server',
      '/.well-known/oauth-protected-resource',
      '/custom-api/auth/register',
    ])
  })

  it('should have middlewareGenerator function', () => {
    const options: NextMcpMiddlewareOptions = {
      mcpHandlerParams: mockMcpHandlerParams,
      needAuth: false,
    }

    const result = nextMcpMiddleware(options)

    expect(typeof result.middlewareGenerator).toBe('function')
  })
})
