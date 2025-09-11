import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest } from "../../utils/test-helpers"
import { authRegister } from '../../../src/middles/api/auth-register'
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

describe('authRegister', () => {
  const mockMetadata: Metadata = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    scopesSupported: ['profile', 'email'],
    responseTypesSupported: ['code'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('OPTIONS requests', () => {
    it('should handle OPTIONS requests', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/auth/register', { method: 'OPTIONS' })

      const response = await authRegister(request, mockMetadata)

      expect(response).toEqual({
        json: expect.any(Function),
        status: 204,
        headers: expect.any(Headers),
      })
    })
  })

  describe('POST requests', () => {
    it('should handle valid registration request', async () => {
      const validRegistrationData = {
        client_name: 'Test Client',
        client_uri: 'https://example.com',
        logo_uri: 'https://example.com/logo.png',
        scope: 'profile email',
        grant_types: ['authorization_code', 'client_credentials'],
        response_types: ['code'],
        token_endpoint_auth_method: 'client_secret_basic',
        redirect_uris: ['https://example.com/callback'],
        contacts: ['admin@example.com'],
        policy_uri: 'https://example.com/policy',
        terms_of_service_uri: 'https://example.com/terms',
        jwks_uri: 'https://example.com/jwks.json',
        software_id: 'test-software',
        software_version: '1.0.0',
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validRegistrationData),
      })

      // Mock the json method to return the registration data
      request.json = vi.fn().mockResolvedValue(validRegistrationData)

      const response = await authRegister(request, mockMetadata)

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })

    it('should handle registration request with minimal required fields', async () => {
      const minimalRegistrationData = {
        client_name: 'Minimal Client',
        grant_types: ['authorization_code'],
        redirect_uris: ['https://example.com/callback'],
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(minimalRegistrationData),
      })

      request.json = vi.fn().mockResolvedValue(minimalRegistrationData)

      const response = await authRegister(request, mockMetadata)

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })

    it('should use default scope when not provided', async () => {
      const registrationData = {
        client_name: 'Test Client',
        grant_types: ['authorization_code'],
        redirect_uris: ['https://example.com/callback'],
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      })

      request.json = vi.fn().mockResolvedValue(registrationData)

      const response = await authRegister(request, mockMetadata)

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })

    it('should handle function-based clientId and clientSecret', async () => {
      const functionMetadata: Metadata = {
        ...mockMetadata,
        clientId: () => 'dynamic-client-id',
        clientSecret: () => 'dynamic-client-secret',
      }

      const registrationData = {
        client_name: 'Test Client',
        grant_types: ['authorization_code'],
        redirect_uris: ['https://example.com/callback'],
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      })

      request.json = vi.fn().mockResolvedValue(registrationData)

      const response = await authRegister(request, functionMetadata)

      expect(response).toBeDefined()
      expect(response.status).toBe(200)
    })
  })

  describe('validation errors', () => {
    it('should return 400 for missing client_name', async () => {
      const invalidData = {
        grant_types: ['authorization_code'],
        redirect_uris: ['https://example.com/callback'],
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      })

      request.json = vi.fn().mockResolvedValue(invalidData)

      const response = await authRegister(request, mockMetadata)

      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid client_uri', async () => {
      const invalidData = {
        client_name: 'Test Client',
        client_uri: 'invalid-uri',
        grant_types: ['authorization_code'],
        redirect_uris: ['https://example.com/callback'],
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      })

      request.json = vi.fn().mockResolvedValue(invalidData)

      const response = await authRegister(request, mockMetadata)

      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid redirect_uri', async () => {
      const invalidData = {
        client_name: 'Test Client',
        grant_types: ['authorization_code'],
        redirect_uris: ['invalid-uri'],
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      })

      request.json = vi.fn().mockResolvedValue(invalidData)

      const response = await authRegister(request, mockMetadata)

      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid email in contacts', async () => {
      const invalidData = {
        client_name: 'Test Client',
        grant_types: ['authorization_code'],
        redirect_uris: ['https://example.com/callback'],
        contacts: ['invalid-email'],
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      })

      request.json = vi.fn().mockResolvedValue(invalidData)

      const response = await authRegister(request, mockMetadata)

      expect(response.status).toBe(400)
    })

    it('should return 400 for empty grant_types', async () => {
      const invalidData = {
        client_name: 'Test Client',
        grant_types: [],
        redirect_uris: ['https://example.com/callback'],
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      })

      request.json = vi.fn().mockResolvedValue(invalidData)

      const response = await authRegister(request, mockMetadata)

      expect(response.status).toBe(400)
    })

    it('should return 400 for empty redirect_uris', async () => {
      const invalidData = {
        client_name: 'Test Client',
        grant_types: ['authorization_code'],
        redirect_uris: [],
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      })

      request.json = vi.fn().mockResolvedValue(invalidData)

      const response = await authRegister(request, mockMetadata)

      expect(response.status).toBe(400)
    })
  })

  describe('error handling', () => {
    it('should handle JSON parsing errors', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      request.json = vi.fn().mockRejectedValue(new Error('Invalid JSON'))

      const response = await authRegister(request, mockMetadata)

      expect(response.status).toBe(500)
    })

    it('should handle unexpected errors', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      request.json = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const response = await authRegister(request, mockMetadata)

      expect(response.status).toBe(500)
    })
  })

  describe('unsupported methods', () => {
    it('should return 405 for GET requests', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/auth/register', { method: 'GET' })

      const response = await authRegister(request, mockMetadata)

      expect(response.status).toBe(405)
    })

    it('should return 405 for PUT requests', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/auth/register', { method: 'PUT' })

      const response = await authRegister(request, mockMetadata)

      expect(response.status).toBe(405)
    })

    it('should return 405 for DELETE requests', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/auth/register', { method: 'DELETE' })

      const response = await authRegister(request, mockMetadata)

      expect(response.status).toBe(405)
    })
  })
})
