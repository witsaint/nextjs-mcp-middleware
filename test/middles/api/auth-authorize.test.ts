import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockNextRequest } from "../../utils/test-helpers"
import { authAuthorize } from '../../../src/middles/api/auth-authorize'
import type { AuthConfig } from '../../../src/middles/types'

describe('authAuthorize', () => {
  const mockAuthConfig: AuthConfig = {
    customToken: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('with customAuthEndpoint as string', () => {
    it('should redirect to custom auth endpoint', async () => {
      const authConfig: AuthConfig = {
        ...mockAuthConfig,
        customAuthEndpoint: 'https://auth.example.com/authorize',
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/authorize?response_type=code&client_id=test&redirect_uri=https://example.com/callback&scope=profile&state=test-state')

      const response = await authAuthorize(request, authConfig)

      expect(response).toEqual({
        status: 302,
        headers: expect.any(Headers),
      })
    })

    it('should redirect to custom auth endpoint without query parameters', async () => {
      const authConfig: AuthConfig = {
        ...mockAuthConfig,
        customAuthEndpoint: 'https://auth.example.com/authorize',
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/authorize')

      const response = await authAuthorize(request, authConfig)

      expect(response).toEqual({
        status: 302,
        headers: expect.any(Headers),
      })
    })
  })

  describe('with customAuthEndpoint as function', () => {
    it('should call custom auth endpoint function with parameters', async () => {
      const customAuthEndpoint = vi.fn().mockResolvedValue('https://auth.example.com/authorize?custom=param')
      const authConfig: AuthConfig = {
        ...mockAuthConfig,
        customAuthEndpoint,
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/authorize?response_type=code&client_id=test-client&redirect_uri=https://example.com/callback&scope=profile&state=test-state')

      const response = await authAuthorize(request, authConfig)

      expect(customAuthEndpoint).toHaveBeenCalledWith({
        responseType: 'code',
        clientId: 'test-client',
        redirectUri: 'https://example.com/callback',
        scope: 'profile',
        state: 'test-state',
      })

      expect(response).toEqual({
        status: 302,
        headers: expect.any(Headers),
      })
    })

    it('should handle missing query parameters with defaults', async () => {
      const customAuthEndpoint = vi.fn().mockResolvedValue('https://auth.example.com/authorize')
      const authConfig: AuthConfig = {
        ...mockAuthConfig,
        customAuthEndpoint,
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/authorize')

      const response = await authAuthorize(request, authConfig)

      expect(customAuthEndpoint).toHaveBeenCalledWith({
        responseType: '',
        clientId: '',
        redirectUri: '',
        scope: 'profile',
        state: expect.stringMatching(/^state_[a-z0-9]{7}$/),
      })

      expect(response).toEqual({
        status: 302,
        headers: expect.any(Headers),
      })
    })

    it('should use default scope when not provided', async () => {
      const customAuthEndpoint = vi.fn().mockResolvedValue('https://auth.example.com/authorize')
      const authConfig: AuthConfig = {
        ...mockAuthConfig,
        customAuthEndpoint,
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/authorize?response_type=code&client_id=test&redirect_uri=https://example.com/callback')

      const response = await authAuthorize(request, authConfig)

      expect(customAuthEndpoint).toHaveBeenCalledWith({
        responseType: 'code',
        clientId: 'test',
        redirectUri: 'https://example.com/callback',
        scope: 'profile',
        state: expect.stringMatching(/^state_[a-z0-9]{7}$/),
      })

      expect(response).toEqual({
        status: 302,
        headers: expect.any(Headers),
      })
    })

    it('should handle function errors', async () => {
      const customAuthEndpoint = vi.fn().mockRejectedValue(new Error('Auth endpoint error'))
      const authConfig: AuthConfig = {
        ...mockAuthConfig,
        customAuthEndpoint,
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/authorize?response_type=code&client_id=test')

      await expect(authAuthorize(request, authConfig)).rejects.toThrow('Auth endpoint error')
    })
  })

  describe('without customAuthEndpoint', () => {
    it('should redirect to empty URL when no customAuthEndpoint', async () => {
      const request = createMockNextRequest('http://localhost:3000/api/auth/authorize?response_type=code&client_id=test&redirect_uri=https://example.com/callback&scope=profile&state=test-state')

      const response = await authAuthorize(request, mockAuthConfig)

      expect(response).toEqual({
        status: 302,
        headers: expect.any(Headers),
      })
    })
  })

  describe('query parameter handling', () => {
    it('should extract all query parameters correctly', async () => {
      const customAuthEndpoint = vi.fn().mockResolvedValue('https://auth.example.com/authorize')
      const authConfig: AuthConfig = {
        ...mockAuthConfig,
        customAuthEndpoint,
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/authorize?response_type=code&client_id=test-client&redirect_uri=https://example.com/callback&scope=email&state=custom-state')

      await authAuthorize(request, authConfig)

      expect(customAuthEndpoint).toHaveBeenCalledWith({
        responseType: 'code',
        clientId: 'test-client',
        redirectUri: 'https://example.com/callback',
        scope: 'email',
        state: 'custom-state',
      })
    })

    it('should handle empty query parameters', async () => {
      const customAuthEndpoint = vi.fn().mockResolvedValue('https://auth.example.com/authorize')
      const authConfig: AuthConfig = {
        ...mockAuthConfig,
        customAuthEndpoint,
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/authorize?response_type=&client_id=&redirect_uri=&scope=&state=')

      await authAuthorize(request, authConfig)

      expect(customAuthEndpoint).toHaveBeenCalledWith({
        responseType: '',
        clientId: '',
        redirectUri: '',
        scope: 'profile',
        state: expect.stringMatching(/^state_[a-z0-9]{7}$/),
      })
    })

    it('should handle missing query parameters', async () => {
      const customAuthEndpoint = vi.fn().mockResolvedValue('https://auth.example.com/authorize')
      const authConfig: AuthConfig = {
        ...mockAuthConfig,
        customAuthEndpoint,
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/authorize')

      await authAuthorize(request, authConfig)

      expect(customAuthEndpoint).toHaveBeenCalledWith({
        responseType: '',
        clientId: '',
        redirectUri: '',
        scope: 'profile',
        state: expect.stringMatching(/^state_[a-z0-9]{7}$/),
      })
    })
  })

  describe('state generation', () => {
    it('should generate unique state values', async () => {
      const customAuthEndpoint = vi.fn().mockResolvedValue('https://auth.example.com/authorize')
      const authConfig: AuthConfig = {
        ...mockAuthConfig,
        customAuthEndpoint,
      }

      const request = createMockNextRequest('http://localhost:3000/api/auth/authorize')

      // Call multiple times to test state generation
      await authAuthorize(request, authConfig)
      await authAuthorize(request, authConfig)

      const calls = customAuthEndpoint.mock.calls
      expect(calls).toHaveLength(2)
      
      const state1 = calls[0][0].state
      const state2 = calls[1][0].state
      
      expect(state1).toMatch(/^state_[a-z0-9]{7}$/)
      expect(state2).toMatch(/^state_[a-z0-9]{7}$/)
      expect(state1).not.toBe(state2)
    })
  })
})
