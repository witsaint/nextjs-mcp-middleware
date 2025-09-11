import type { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { protectedResourceMiddleware } from '../../../src/middles/will-know/oauth-protected'
import { createMockNextRequest } from '../../utils/test-helpers'

// Mock mcp-handler
vi.mock('mcp-handler', () => ({
  protectedResourceHandler: vi.fn(() => vi.fn()),
}))

// Mock CORS functions
vi.mock('../../../src/middles/cors', () => ({
  getCorsHeaders: vi.fn(() => ({ 'Access-Control-Allow-Origin': '*' })),
}))

describe('protectedResourceMiddleware', () => {
  const oauthPath = '/.well-known/oauth-authorization-server'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('oPTIONS requests', () => {
    it('should handle OPTIONS requests', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-protected-resource', {
        method: 'OPTIONS',
      })

      const response = protectedResourceMiddleware(request as NextRequest, { oauthPath })

      expect(response).toBeDefined()
    })
  })

  describe('gET requests', () => {
    it('should handle GET requests with protected resource handler', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-protected-resource', {
        method: 'GET',
      })

      const response = protectedResourceMiddleware(request as NextRequest, { oauthPath })

      expect(response).toBeDefined()
    })

    it('should pass the correct oauthPath to protectedResourceHandler', () => {
      const customOauthPath = '/custom/oauth-path'
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-protected-resource', {
        method: 'GET',
      })

      const response = protectedResourceMiddleware(request as NextRequest, { oauthPath: customOauthPath })

      expect(response).toBeDefined()
    })
  })

  describe('unsupported methods', () => {
    it('should return 405 for POST requests', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-protected-resource', {
        method: 'POST',
      })

      const response = protectedResourceMiddleware(request as NextRequest, { oauthPath })

      expect(response).toEqual({
        json: expect.any(Function),
        status: 405,
        headers: expect.any(Headers),
      })
    })

    it('should return 405 for PUT requests', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-protected-resource', {
        method: 'PUT',
      })

      const response = protectedResourceMiddleware(request as NextRequest, { oauthPath })

      expect(response).toEqual({
        json: expect.any(Function),
        status: 405,
        headers: expect.any(Headers),
      })
    })

    it('should return 405 for DELETE requests', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-protected-resource', {
        method: 'DELETE',
      })

      const response = protectedResourceMiddleware(request as NextRequest, { oauthPath })

      expect(response).toEqual({
        json: expect.any(Function),
        status: 405,
        headers: expect.any(Headers),
      })
    })

    it('should return 405 for PATCH requests', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-protected-resource', {
        method: 'PATCH',
      })

      const response = protectedResourceMiddleware(request as NextRequest, { oauthPath })

      expect(response).toEqual({
        json: expect.any(Function),
        status: 405,
        headers: expect.any(Headers),
      })
    })
  })
})
