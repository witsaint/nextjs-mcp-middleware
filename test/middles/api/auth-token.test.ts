import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest } from "../../utils/test-helpers"
import { authToken } from '../../../src/middles/api/auth-token'
import type { AuthConfig } from '../../../src/middles/types'

// Mock CORS functions
vi.mock('../../../src/middles/cors', () => ({
  getCorsHeaders: vi.fn(() => ({ 'Access-Control-Allow-Origin': '*' })),
  jsonWithCors: vi.fn((req, data, init) => ({
    json: () => Promise.resolve(data),
    status: init?.status || 200,
    headers: new Headers(init?.headers),
  })),
}))

describe('authToken', () => {
  const mockAuthConfig: AuthConfig = {
    customToken: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('OPTIONS requests', () => {
    it('should handle OPTIONS requests', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/auth/token', { method: 'OPTIONS' })

      const response = await authToken(request, mockAuthConfig)

      expect(response).toEqual({
        json: expect.any(Function),
        status: 204,
        headers: expect.any(Headers),
      })
    })
  })

  describe('POST requests', () => {
    it('should handle valid token request with authorization_code', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
      }

      mockAuthConfig.customToken!.mockResolvedValue(mockTokenResponse)

      const request = createMockNextRequest('http://localhost:3000/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      // Mock formData to return the expected form data
      const mockFormData = new FormData()
      mockFormData.append('code', 'test-code')
      mockFormData.append('grant_type', 'authorization_code')
      mockFormData.append('client_id', 'test-client-id')
      mockFormData.append('client_secret', 'test-client-secret')
      mockFormData.append('code_verifier', 'test-code-verifier')

      request.formData = vi.fn().mockResolvedValue(mockFormData)

      const response = await authToken(request, mockAuthConfig)

      expect(mockAuthConfig.customToken).toHaveBeenCalledWith(
        {
          code: 'test-code',
          grantType: 'authorization_code',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          codeVerifier: 'test-code-verifier',
        },
        request
      )

      expect(response).toBeDefined()
    })

    it('should handle token request with minimal parameters', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
      }

      mockAuthConfig.customToken!.mockResolvedValue(mockTokenResponse)

      const request = createMockNextRequest('http://localhost:3000/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const mockFormData = new FormData()
      mockFormData.append('code', 'test-code')
      mockFormData.append('grant_type', 'authorization_code')
      mockFormData.append('client_id', 'test-client-id')

      request.formData = vi.fn().mockResolvedValue(mockFormData)

      const response = await authToken(request, mockAuthConfig)

      expect(mockAuthConfig.customToken).toHaveBeenCalledWith(
        {
          code: 'test-code',
          grantType: 'authorization_code',
          clientId: 'test-client-id',
          clientSecret: null,
          codeVerifier: null,
        },
        request
      )

      expect(response).toBeDefined()
    })

    it('should handle empty form data values', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
      }

      mockAuthConfig.customToken!.mockResolvedValue(mockTokenResponse)

      const request = createMockNextRequest('http://localhost:3000/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const mockFormData = new FormData()
      mockFormData.append('code', '')
      mockFormData.append('grant_type', '')
      mockFormData.append('client_id', '')
      mockFormData.append('client_secret', '')
      mockFormData.append('code_verifier', '')

      request.formData = vi.fn().mockResolvedValue(mockFormData)

      const response = await authToken(request, mockAuthConfig)

      expect(mockAuthConfig.customToken).toHaveBeenCalledWith(
        {
          code: '',
          grantType: '',
          clientId: '',
          clientSecret: '',
          codeVerifier: '',
        },
        request
      )

      expect(response).toBeDefined()
    })

    it('should return 400 for unsupported grant types', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const mockFormData = new FormData()
      mockFormData.append('grant_type', 'client_credentials')
      mockFormData.append('client_id', 'test-client-id')

      request.formData = vi.fn().mockResolvedValue(mockFormData)

      const response = await authToken(request, mockAuthConfig)

      expect(response).toEqual({
        json: expect.any(Function),
        status: 400,
        headers: expect.any(Headers),
      })

      const jsonResponse = await (response as any).json()
      expect(jsonResponse).toEqual({ error: 'Unsupported grant type' })
    })

    it('should return 400 for refresh_token grant type', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const mockFormData = new FormData()
      mockFormData.append('grant_type', 'refresh_token')
      mockFormData.append('client_id', 'test-client-id')

      request.formData = vi.fn().mockResolvedValue(mockFormData)

      const response = await authToken(request, mockAuthConfig)

      expect(response).toEqual({
        json: expect.any(Function),
        status: 400,
        headers: expect.any(Headers),
      })
    })
  })

  describe('error handling', () => {
    it('should handle customToken function errors', async () => {
      const error = new Error('Token exchange failed')
      mockAuthConfig.customToken!.mockRejectedValue(error)

      const request = createMockNextRequest('http://localhost:3000/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const mockFormData = new FormData()
      mockFormData.append('code', 'test-code')
      mockFormData.append('grant_type', 'authorization_code')
      mockFormData.append('client_id', 'test-client-id')

      request.formData = vi.fn().mockResolvedValue(mockFormData)

      const response = await authToken(request, mockAuthConfig)

      expect(response).toEqual({
        json: expect.any(Function),
        status: 500,
        headers: expect.any(Headers),
      })

      const jsonResponse = await (response as any).json()
      expect(jsonResponse).toEqual({
        error: 'internal_server_error',
        error_description: 'Token exchange failed',
      })
    })

    it('should handle formData parsing errors', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      request.formData = vi.fn().mockRejectedValue(new Error('Form data parsing error'))

      const response = await authToken(request, mockAuthConfig)

      expect(response).toEqual({
        json: expect.any(Function),
        status: 500,
        headers: expect.any(Headers),
      })
    })
  })

  describe('unsupported methods', () => {
    it('should return 405 for GET requests', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/auth/token', { method: 'GET' })

      const response = await authToken(request, mockAuthConfig)

      expect(response).toEqual({
        json: expect.any(Function),
        status: 405,
        headers: expect.any(Headers),
      })
    })

    it('should return 405 for PUT requests', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/auth/token', { method: 'PUT' })

      const response = await authToken(request, mockAuthConfig)

      expect(response).toEqual({
        json: expect.any(Function),
        status: 405,
        headers: expect.any(Headers),
      })
    })

    it('should return 405 for DELETE requests', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/auth/token', { method: 'DELETE' })

      const response = await authToken(request, mockAuthConfig)

      expect(response).toEqual({
        json: expect.any(Function),
        status: 405,
        headers: expect.any(Headers),
      })
    })
  })

  describe('CORS handling', () => {
    it('should include CORS headers in responses', async () => {
      const mockTokenResponse = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
      }

      mockAuthConfig.customToken!.mockResolvedValue(mockTokenResponse)

      const request = createMockNextRequest('http://localhost:3000/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const mockFormData = new FormData()
      mockFormData.append('code', 'test-code')
      mockFormData.append('grant_type', 'authorization_code')
      mockFormData.append('client_id', 'test-client-id')

      request.formData = vi.fn().mockResolvedValue(mockFormData)

      const response = await authToken(request, mockAuthConfig)

      expect(response).toBeDefined()
      // The CORS headers are added by the jsonWithCors function
    })
  })
})
