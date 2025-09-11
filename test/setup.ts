import { vi } from 'vitest'

// 导出模拟类型
export interface MockNextRequest {
  url: string
  method: string
  headers: Headers
  nextUrl: URL
  json: () => Promise<any>
  formData: () => Promise<FormData>
}

export interface MockNextResponse {
  status: number
  headers: Headers
  json: () => Promise<any>
}

export interface MockNextResponseConstructor {
  new (body: any, init?: ResponseInit): MockNextResponse
  json: (data: any, init?: ResponseInit) => MockNextResponse
  next: () => MockNextResponse
  redirect: (url: string) => MockNextResponse
}

export interface MockNextRequestConstructor {
  new (url: string, init?: RequestInit): MockNextRequest
}

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string
    method: string
    headers: Headers
    nextUrl: URL

    constructor(url: string, init?: RequestInit) {
      this.url = url
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers)
      this.nextUrl = new URL(url)
    }

    async json(): Promise<any> {
      return {}
    }

    async formData(): Promise<FormData> {
      return new FormData()
    }
  },
  NextResponse: class MockNextResponse {
    status: number
    headers: Headers

    constructor(body: any, init?: ResponseInit) {
      this.status = init?.status || 200
      this.headers = new Headers(init?.headers)
    }

    static json(data: any, init?: ResponseInit): MockNextResponse {
      return new MockNextResponse(data, init)
    }

    static next(): MockNextResponse {
      return new MockNextResponse(null, { status: 200 })
    }

    static redirect(url: string): MockNextResponse {
      return new MockNextResponse(null, {
        status: 302,
        headers: { Location: url },
      })
    }
  },
}))

// Mock mcp-handler
vi.mock('mcp-handler', () => ({
  createMcpHandler: vi.fn(() => vi.fn()),
  withMcpAuth: vi.fn(() => vi.fn()),
  protectedResourceHandler: vi.fn(() => vi.fn()),
}))

// Test utilities are available in test/utils/test-helpers.ts
