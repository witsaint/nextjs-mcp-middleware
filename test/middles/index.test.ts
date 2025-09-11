import type { NextResponse } from 'next/server'
import type { AuthConfig, mcpHandlerParams, Metadata, NextMcpMiddlewareOptions } from '../../src/middles/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextMcpMiddleware } from '../../src/middles'
import { createMockNextRequest } from '../utils/test-helpers'

// Mock the middleware functions
vi.mock('../../src/middles/api/mcp', () => ({
  mcpMiddleware: vi.fn(() => Promise.resolve({ status: 200 })),
}))

vi.mock('../../src/middles/api/auth-register', () => ({
  authRegister: vi.fn(() => Promise.resolve({ status: 200 })),
}))

vi.mock('../../src/middles/api/auth-authorize', () => ({
  authAuthorize: vi.fn(() => Promise.resolve({ status: 302 })),
}))

vi.mock('../../src/middles/api/auth-token', () => ({
  authToken: vi.fn(() => Promise.resolve({ status: 200 })),
}))

vi.mock('../../src/middles/will-know/oauth-authoriztion', () => ({
  oauthAuthorizationMiddleware: vi.fn(() => ({ status: 200 })),
}))

vi.mock('../../src/middles/will-know/oauth-protected', () => ({
  protectedResourceMiddleware: vi.fn(() => ({ status: 200 })),
}))

vi.mock('../../src/middles/debug', () => ({
  debugLogger: vi.fn(),
}))

describe('nextMcpMiddleware', () => {
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

  describe('without authentication', () => {
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

    it('should handle MCP requests when needAuth is false', async () => {
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: mockMcpHandlerParams,
        needAuth: false,
      }

      const { middlewareGenerator } = nextMcpMiddleware(options)
      const request = createMockNextRequest('http://localhost:3000/api/mcp', { method: 'GET' })

      const response = await middlewareGenerator(request)

      expect(response).toBeDefined()
    })

    it('should call next middleware for non-MCP paths when needAuth is false', async () => {
      const nextFn = vi.fn(() => ({ status: 200 }) as NextResponse)
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: mockMcpHandlerParams,
        needAuth: false,
        next: nextFn,
      }

      const { middlewareGenerator } = nextMcpMiddleware(options)
      const request = createMockNextRequest('http://localhost:3000/other-path', { method: 'GET' })

      await middlewareGenerator(request)

      expect(nextFn).toHaveBeenCalledWith(request)
    })

    it('should return NextResponse.next() when no next function provided', async () => {
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: mockMcpHandlerParams,
        needAuth: false,
      }

      const { middlewareGenerator } = nextMcpMiddleware(options)
      const request = createMockNextRequest('http://localhost:3000/other-path', { method: 'GET' })

      const response = await middlewareGenerator(request)

      expect(response).toBeDefined()
    })
  })

  describe('with authentication', () => {
    it('should create middleware with correct matcher paths when needAuth is true', () => {
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

    it('should handle OAuth authorization server requests', async () => {
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: mockMcpHandlerParams,
        needAuth: true,
        metadata: mockMetadata,
        authConfig: mockAuthConfig,
      }

      const { middlewareGenerator } = nextMcpMiddleware(options)
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', { method: 'GET' })

      const response = await middlewareGenerator(request)

      expect(response).toBeDefined()
    })

    it('should handle OAuth protected resource requests', async () => {
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: mockMcpHandlerParams,
        needAuth: true,
        metadata: mockMetadata,
        authConfig: mockAuthConfig,
      }

      const { middlewareGenerator } = nextMcpMiddleware(options)
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-protected-resource', { method: 'GET' })

      const response = await middlewareGenerator(request)

      expect(response).toBeDefined()
    })

    it('should handle auth register requests', async () => {
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: mockMcpHandlerParams,
        needAuth: true,
        metadata: mockMetadata,
        authConfig: mockAuthConfig,
      }

      const { middlewareGenerator } = nextMcpMiddleware(options)
      const request = createMockNextRequest('http://localhost:3000/api/auth/register', { method: 'POST' })

      const response = await middlewareGenerator(request)

      expect(response).toBeDefined()
    })

    it('should handle auth authorize requests', async () => {
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: mockMcpHandlerParams,
        needAuth: true,
        metadata: mockMetadata,
        authConfig: mockAuthConfig,
      }

      const { middlewareGenerator } = nextMcpMiddleware(options)
      const request = createMockNextRequest('http://localhost:3000/api/auth/authorize', { method: 'GET' })

      const response = await middlewareGenerator(request)

      expect(response).toBeDefined()
    })

    it('should handle auth token requests', async () => {
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: mockMcpHandlerParams,
        needAuth: true,
        metadata: mockMetadata,
        authConfig: mockAuthConfig,
      }

      const { middlewareGenerator } = nextMcpMiddleware(options)
      const request = createMockNextRequest('http://localhost:3000/api/auth/token', { method: 'POST' })

      const response = await middlewareGenerator(request)

      expect(response).toBeDefined()
    })
  })

  describe('custom basePath', () => {
    it('should use custom basePath from mcpHandlerConfig', () => {
      const customMcpHandlerParams: mcpHandlerParams = {
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

      expect(result.matcher).toEqual([
        '/api/mcp',
        '/.well-known/oauth-authorization-server',
        '/.well-known/oauth-protected-resource',
        '/api/auth/register',
      ])
    })
  })

  describe('scopesSupported handling', () => {
    it('should pass scopesSupported to MCP middleware', async () => {
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: mockMcpHandlerParams,
        needAuth: true,
        metadata: mockMetadata,
        authConfig: mockAuthConfig,
      }

      const { middlewareGenerator } = nextMcpMiddleware(options)
      const request = createMockNextRequest('http://localhost:3000/api/mcp', { method: 'GET' })

      await middlewareGenerator(request)

      // The mcpMiddleware should be called with the scopesSupported
      const { mcpMiddleware } = await import('../../src/middles/api/mcp')
      expect(mcpMiddleware).toHaveBeenCalledWith(
        request,
        mockMcpHandlerParams,
        '/.well-known/oauth-protected-resource',
        true,
        ['profile', 'email'],
      )
    })

    it('should use empty array when scopesSupported is not provided', async () => {
      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: mockMcpHandlerParams,
        needAuth: true,
        metadata: { ...mockMetadata, scopesSupported: undefined as any },
        authConfig: mockAuthConfig,
      }

      const { middlewareGenerator } = nextMcpMiddleware(options)
      const request = createMockNextRequest('http://localhost:3000/api/mcp', { method: 'GET' })

      await middlewareGenerator(request)

      const { mcpMiddleware } = await import('../../src/middles/api/mcp')
      expect(mcpMiddleware).toHaveBeenCalledWith(
        request,
        mockMcpHandlerParams,
        '/.well-known/oauth-protected-resource',
        true,
        [],
      )
    })
  })
})
