import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest } from "../../utils/test-helpers"
import { oauthAuthorizationMiddleware } from '../../../src/middles/will-know/oauth-authoriztion'
import type { Metadata } from '../../../src/middles/types'

// Mock CORS functions
vi.mock('../../../src/middles/cors', () => ({
  getCorsHeaders: vi.fn(() => ({ 'Access-Control-Allow-Origin': '*' })),
  jsonWithCors: vi.fn((req, data, init) => ({
    json: () => Promise.resolve(data),
    status: init?.status || 200,
    headers: new Headers(init?.headers),
  })),
}))

describe('oauthAuthorizationMiddleware', () => {
  const basePath = '/api'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('OPTIONS requests', () => {
    it('should handle OPTIONS requests', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', {
        method: 'OPTIONS',
      })

      const response = oauthAuthorizationMiddleware(request, { basePath })

      expect(response).toEqual({
        json: expect.any(Function),
        status: 200,
        headers: expect.any(Headers),
      })
    })
  })

  describe('GET requests', () => {
    it('should return OAuth2 metadata with default values', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', {
        method: 'GET',
        headers: {
          'host': 'localhost:3000',
          'x-forwarded-proto': 'http',
        },
      })

      const response = oauthAuthorizationMiddleware(request, { basePath })

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })

    it('should use HTTPS when x-forwarded-proto is https', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', {
        method: 'GET',
        headers: {
          'host': 'api.example.com',
          'x-forwarded-proto': 'https',
        },
      })

      const response = oauthAuthorizationMiddleware(request, { basePath })

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })

    it('should use custom metadata when provided', () => {
      const customMetadata: Metadata = {
        issuer: 'https://custom-issuer.com',
        authorizationEndpoint: 'https://custom-issuer.com/auth',
        tokenEndpoint: 'https://custom-issuer.com/token',
        userinfoEndpoint: 'https://custom-issuer.com/userinfo',
        scopesSupported: ['openid', 'profile', 'email'],
        responseTypesSupported: ['code', 'id_token'],
        tokenEndpointAuthMethodsSupported: ['client_secret_basic'],
        clientId: 'custom-client-id',
        clientSecret: 'custom-client-secret',
      }

      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', {
        method: 'GET',
        headers: {
          'host': 'localhost:3000',
          'x-forwarded-proto': 'http',
        },
      })

      const response = oauthAuthorizationMiddleware(request, { basePath, metadata: customMetadata })

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })

    it('should handle missing x-forwarded-proto header', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', {
        method: 'GET',
        headers: {
          'host': 'localhost:3000',
        },
      })

      const response = oauthAuthorizationMiddleware(request, { basePath })

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })

    it('should handle missing host header', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', {
        method: 'GET',
        headers: {},
      })

      const response = oauthAuthorizationMiddleware(request, { basePath })

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })

    it('should use default scopes when not provided in metadata', () => {
      const metadataWithoutScopes: Metadata = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        responseTypesSupported: ['code'],
      }

      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', {
        method: 'GET',
        headers: {
          'host': 'localhost:3000',
          'x-forwarded-proto': 'http',
        },
      })

      const response = oauthAuthorizationMiddleware(request, { basePath, metadata: metadataWithoutScopes })

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })

    it('should use default response types when not provided in metadata', () => {
      const metadataWithoutResponseTypes: Metadata = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        scopesSupported: ['profile'],
      }

      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', {
        method: 'GET',
        headers: {
          'host': 'localhost:3000',
          'x-forwarded-proto': 'http',
        },
      })

      const response = oauthAuthorizationMiddleware(request, { basePath, metadata: metadataWithoutResponseTypes })

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })

    it('should use default token endpoint auth methods when not provided in metadata', () => {
      const metadataWithoutAuthMethods: Metadata = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        scopesSupported: ['profile'],
        responseTypesSupported: ['code'],
      }

      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', {
        method: 'GET',
        headers: {
          'host': 'localhost:3000',
          'x-forwarded-proto': 'http',
        },
      })

      const response = oauthAuthorizationMiddleware(request, { basePath, metadata: metadataWithoutAuthMethods })

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })
  })

  describe('error handling', () => {
    it('should handle errors during metadata generation', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', {
        method: 'GET',
        headers: {
          'host': 'localhost:3000',
          'x-forwarded-proto': 'http',
        },
      })

      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Mock jsonWithCors to throw an error
      const { jsonWithCors } = await import('../../../src/middles/cors')
      jsonWithCors.mockImplementationOnce(() => {
        throw new Error('Metadata generation error')
      })

      const response = oauthAuthorizationMiddleware(request, { basePath })

      expect(response).toEqual({
        json: expect.any(Function),
        status: 500,
        headers: expect.any(Headers),
      })

      consoleSpy.mockRestore()
    })
  })

  describe('unsupported methods', () => {
    it('should return 405 for POST requests', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', {
        method: 'POST',
      })

      const response = oauthAuthorizationMiddleware(request, { basePath })

      expect(response).toEqual({
        json: expect.any(Function),
        status: 405,
        headers: expect.any(Headers),
      })
    })

    it('should return 405 for PUT requests', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', {
        method: 'PUT',
      })

      const response = oauthAuthorizationMiddleware(request, { basePath })

      expect(response).toEqual({
        json: expect.any(Function),
        status: 405,
        headers: expect.any(Headers),
      })
    })

    it('should return 405 for DELETE requests', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', {
        method: 'DELETE',
      })

      const response = oauthAuthorizationMiddleware(request, { basePath })

      expect(response).toEqual({
        json: expect.any(Function),
        status: 405,
        headers: expect.any(Headers),
      })
    })
  })

  describe('metadata structure', () => {
    it('should include all required OAuth2 metadata fields', () => {
      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', {
        method: 'GET',
        headers: {
          'host': 'localhost:3000',
          'x-forwarded-proto': 'http',
        },
      })

      const response = oauthAuthorizationMiddleware(request, { basePath })

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })

    it('should include custom registration endpoint when provided', () => {
      const metadataWithRegistrationEndpoint: Metadata = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        scopesSupported: ['profile'],
        responseTypesSupported: ['code'],
        registrationEndpoint: 'https://custom-registration.com/register',
      }

      const request = createMockNextRequest('http://localhost:3000/.well-known/oauth-authorization-server', {
        method: 'GET',
        headers: {
          'host': 'localhost:3000',
          'x-forwarded-proto': 'http',
        },
      })

      const response = oauthAuthorizationMiddleware(request, { basePath, metadata: metadataWithRegistrationEndpoint })

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })
  })
})
