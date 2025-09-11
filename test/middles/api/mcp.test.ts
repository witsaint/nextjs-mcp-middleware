import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest } from "../../utils/test-helpers"
import { mcpMiddleware } from '../../../src/middles/api/mcp'
import type { mcpHandlerParams } from '../../../src/middles/types'

// Mock mcp-handler
vi.mock('mcp-handler', () => ({
  createMcpHandler: vi.fn(() => vi.fn()),
  withMcpAuth: vi.fn(() => vi.fn()),
  protectedResourceHandler: vi.fn(() => vi.fn()),
}))

describe('mcpMiddleware', () => {
  const mockMcpHandlerParams: mcpHandlerParams = {
    mcpServer: vi.fn(),
    mcpHandlerOptions: { timeout: 5000 },
    mcpHandlerConfig: { basePath: '/api' },
    verifyToken: vi.fn(),
  }

  const protectedPath = '/.well-known/oauth-protected-resource'
  const scopesSupported = ['profile', 'email']

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET requests', () => {
    it('should handle GET requests with authentication', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/mcp', { method: 'GET' })

      const response = await mcpMiddleware(
        request,
        mockMcpHandlerParams,
        protectedPath,
        true,
        scopesSupported
      )

      expect(response).toBeDefined()
    })

    it('should handle GET requests without authentication', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/mcp', { method: 'GET' })

      const response = await mcpMiddleware(
        request,
        mockMcpHandlerParams,
        protectedPath,
        false,
        scopesSupported
      )

      expect(response).toBeDefined()
    })

    it('should handle empty scopesSupported array', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/mcp', { method: 'GET' })

      const response = await mcpMiddleware(
        request,
        mockMcpHandlerParams,
        protectedPath,
        true,
        []
      )

      expect(response).toBeDefined()
    })
  })

  describe('POST requests', () => {
    it('should handle POST requests with authentication', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/mcp', { method: 'POST' })

      const response = await mcpMiddleware(
        request,
        mockMcpHandlerParams,
        protectedPath,
        true,
        scopesSupported
      )

      expect(response).toBeDefined()
    })

    it('should handle POST requests without authentication', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/mcp', { method: 'POST' })

      const response = await mcpMiddleware(
        request,
        mockMcpHandlerParams,
        protectedPath,
        false,
        scopesSupported
      )

      expect(response).toBeDefined()
    })
  })

  describe('unsupported methods', () => {
    it('should return 405 for PUT requests', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/mcp', { method: 'PUT' })

      const response = await mcpMiddleware(
        request,
        mockMcpHandlerParams,
        protectedPath,
        true,
        scopesSupported
      )

      expect(response).toEqual({
        json: expect.any(Function),
        status: 405,
        headers: expect.any(Headers),
      })
    })

    it('should return 405 for DELETE requests', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/mcp', { method: 'DELETE' })

      const response = await mcpMiddleware(
        request,
        mockMcpHandlerParams,
        protectedPath,
        true,
        scopesSupported
      )

      expect(response).toEqual({
        json: expect.any(Function),
        status: 405,
        headers: expect.any(Headers),
      })
    })

    it('should return 405 for PATCH requests', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/mcp', { method: 'PATCH' })

      const response = await mcpMiddleware(
        request,
        mockMcpHandlerParams,
        protectedPath,
        true,
        scopesSupported
      )

      expect(response).toEqual({
        json: expect.any(Function),
        status: 405,
        headers: expect.any(Headers),
      })
    })
  })
})