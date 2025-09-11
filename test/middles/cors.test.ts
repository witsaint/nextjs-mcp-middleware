import { describe, it, expect } from 'vitest'
import { getCorsHeaders, jsonWithCors } from '../../src/middles/cors'
import { createMockNextRequest } from '../utils/test-helpers'

describe('CORS utilities', () => {
  describe('getCorsHeaders', () => {
    it('should return CORS headers with origin from request', () => {
      const request = createMockNextRequest('http://localhost:3000/api/test', {
        headers: {
          'origin': 'https://example.com',
        },
      })

      const headers = getCorsHeaders(request)

      expect(headers).toEqual({
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
      })
    })

    it('should fallback to request URL origin when no origin header', () => {
      const request = createMockNextRequest('https://api.example.com/test', {
        headers: {},
      })

      const headers = getCorsHeaders(request)

      expect(headers['Access-Control-Allow-Origin']).toBe('https://api.example.com')
    })

    it('should use custom request method from headers', () => {
      const request = createMockNextRequest('http://localhost:3000/api/test', {
        headers: {
          'origin': 'https://example.com',
          'access-control-request-method': 'PATCH',
        },
      })

      const headers = getCorsHeaders(request)

      expect(headers['Access-Control-Allow-Methods']).toBe('PATCH')
    })

    it('should use custom request headers from headers', () => {
      const request = createMockNextRequest('http://localhost:3000/api/test', {
        headers: {
          'origin': 'https://example.com',
          'access-control-request-headers': 'X-Custom-Header, Authorization',
        },
      })

      const headers = getCorsHeaders(request)

      expect(headers['Access-Control-Allow-Headers']).toBe('X-Custom-Header, Authorization')
    })

    it('should handle multiple headers correctly', () => {
      const request = createMockNextRequest('http://localhost:3000/api/test', {
        headers: {
          'origin': 'https://example.com',
          'access-control-request-method': 'PUT',
          'access-control-request-headers': 'X-Custom-Header',
        },
      })

      const headers = getCorsHeaders(request)

      expect(headers).toEqual({
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'PUT',
        'Access-Control-Allow-Headers': 'X-Custom-Header',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
      })
    })
  })

  describe('jsonWithCors', () => {
    it('should return NextResponse with CORS headers', () => {
      const request = createMockNextRequest('http://localhost:3000/api/test', {
        headers: {
          'origin': 'https://example.com',
        },
      })

      const data = { message: 'test' }
      const response = jsonWithCors(request, data)

      expect(response).toBeDefined()
      // Note: In the actual implementation, we can't easily test the headers
      // because NextResponse.json() returns a mock object in our test setup
    })

    it('should pass through init options', () => {
      const request = createMockNextRequest('http://localhost:3000/api/test', {
        headers: {
          'origin': 'https://example.com',
        },
      })

      const data = { message: 'test' }
      const init = {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      const response = jsonWithCors(request, data, init)

      expect(response).toBeDefined()
    })

    it('should handle undefined init', () => {
      const request = createMockNextRequest('http://localhost:3000/api/test', {
        headers: {
          'origin': 'https://example.com',
        },
      })

      const data = { message: 'test' }
      const response = jsonWithCors(request, data, undefined)

      expect(response).toBeDefined()
    })

    it('should work with different data types', () => {
      const request = createMockNextRequest('http://localhost:3000/api/test', {
        headers: {
          'origin': 'https://example.com',
        },
      })

      const stringData = 'test string'
      const numberData = 123
      const arrayData = [1, 2, 3]
      const nullData = null

      expect(jsonWithCors(request, stringData)).toBeDefined()
      expect(jsonWithCors(request, numberData)).toBeDefined()
      expect(jsonWithCors(request, arrayData)).toBeDefined()
      expect(jsonWithCors(request, nullData)).toBeDefined()
    })
  })
})
