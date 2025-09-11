import type { NextRequest } from 'next/server'
import type { MockNextRequest, MockNextResponse } from '../setup'
import type { AuthConfig, mcpHandlerParams, Metadata, RegistrationResponse } from '@/middles/types'
import { vi } from 'vitest'

/**
 * Create a mock NextRequest for testing
 */
export function createMockNextRequest(url: string, options: RequestInit = {}): NextRequest {
  const mockRequest: MockNextRequest = {
    url,
    method: options.method || 'GET',
    headers: new Headers(options.headers),
    nextUrl: new URL(url),
    json: vi.fn().mockResolvedValue({}),
    formData: vi.fn().mockResolvedValue(new FormData()),
  }

  return mockRequest as NextRequest
}

/**
 * Create a mock NextResponse for testing
 */
export function createMockNextResponse(data: any, status = 200, headers?: HeadersInit): MockNextResponse {
  return {
    json: () => Promise.resolve(data),
    status,
    headers: new Headers(headers),
  }
}

/**
 * Create mock form data for testing
 */
export function createMockFormData(data: Record<string, string>): FormData {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value)
  })
  return formData
}

/**
 * Create a mock metadata object for testing
 */
export function createMockMetadata(overrides: Partial<any> = {}): Metadata {
  return {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    scopesSupported: ['profile', 'email'],
    responseTypesSupported: ['code'],
    ...overrides,
  }
}

/**
 * Create a mock auth config for testing
 */
export function createMockAuthConfig(overrides: Partial<any> = {}): AuthConfig {
  return {
    customToken: vi.fn().mockResolvedValue({
      access_token: 'test-access-token',
      token_type: 'Bearer',
    }),
    ...overrides,
  }
}

/**
 * Create a mock MCP handler params for testing
 */
export function createMockMcpHandlerParams(overrides: Partial<any> = {}): mcpHandlerParams {
  return {
    mcpServer: vi.fn(),
    mcpHandlerOptions: {},
    mcpHandlerConfig: { basePath: '/api' },
    verifyToken: vi.fn(),
    ...overrides,
  }
}

/**
 * Create a mock registration data for testing
 */
export function createMockRegistrationData(overrides: Partial<any> = {}): RegistrationResponse {
  return {
    client_name: 'Test Client',
    grant_types: ['authorization_code'],
    redirect_uris: ['https://example.com/callback'],
    ...overrides,
    client_id: '',
    client_secret: '',
    client_id_issued_at: 0,
    client_secret_expires_at: 0,
    registration_access_token: '',
    registration_client_uri: '',
    token_endpoint_auth_method: '',
    scope: '',
  }
}

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Create a mock error for testing
 */
export function createMockError(message: string, name = 'Error'): Error {
  const error = new Error(message)
  error.name = name
  return error
}

/**
 * Mock console methods to avoid noise in test output
 */
export function mockConsole(): { setup: () => void, restore: () => void } {
  const originalConsole = { ...console }

  return {
    setup: () => {
      vi.spyOn(console, 'log').mockImplementation(() => {})
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.spyOn(console, 'error').mockImplementation(() => {})
    },
    restore: () => {
      vi.restoreAllMocks()
      Object.assign(console, originalConsole)
    },
  }
}
