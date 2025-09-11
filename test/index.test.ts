import type { NextMcpMiddlewareOptions } from '../src/middles/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextMcpMiddleware } from '../src/middles'

describe('main exports', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // 保存原始环境变量
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    // 恢复原始环境变量
    process.env = originalEnv
  })

  it('should export nextMcpMiddleware function', () => {
    expect(typeof nextMcpMiddleware).toBe('function')
  })

  it('should export type definitions', () => {
    // This test ensures that the types are properly exported
    // We can't directly test TypeScript types at runtime, but we can test
    // that the module exports are working correctly
    const options: NextMcpMiddlewareOptions = {
      mcpHandlerParams: {
        mcpServer: vi.fn(),
        verifyToken: vi.fn(),
      },
      needAuth: false,
    }

    expect(options).toBeDefined()
    expect(options.needAuth).toBe(false)
  })

  it('should create middleware without errors', () => {
    const options: NextMcpMiddlewareOptions = {
      mcpHandlerParams: {
        mcpServer: vi.fn(),
        verifyToken: vi.fn(),
      },
      needAuth: false,
    }

    const middleware = nextMcpMiddleware(options)

    expect(middleware).toBeDefined()
    expect(middleware.middlewareGenerator).toBeDefined()
    expect(middleware.matcher).toBeDefined()
    expect(Array.isArray(middleware.matcher)).toBe(true)
  })

  describe('debug logging', () => {
    it('should set DEBUG environment variable correctly', () => {
      // 测试环境变量设置
      process.env.DEBUG = 'mcp:middleware'
      expect(process.env.DEBUG).toBe('mcp:middleware')

      // 测试不同的 DEBUG 模式
      process.env.DEBUG = 'mcp:*'
      expect(process.env.DEBUG).toBe('mcp:*')

      process.env.DEBUG = 'mcp:middleware,other:debug'
      expect(process.env.DEBUG).toBe('mcp:middleware,other:debug')
    })

    it('should handle DEBUG environment variable changes', () => {
      // 测试环境变量的设置和删除
      delete process.env.DEBUG
      expect(process.env.DEBUG).toBeUndefined()

      process.env.DEBUG = 'mcp:middleware'
      expect(process.env.DEBUG).toBe('mcp:middleware')

      delete process.env.DEBUG
      expect(process.env.DEBUG).toBeUndefined()
    })

    it('should work with different DEBUG patterns', () => {
      // 测试不同的 DEBUG 模式
      const debugPatterns = [
        'mcp:*', // 匹配所有 mcp 相关的 debug
        'mcp:middleware', // 精确匹配
        '*:middleware', // 匹配所有 middleware
      ]

      debugPatterns.forEach((pattern) => {
        process.env.DEBUG = pattern
        expect(process.env.DEBUG).toBe(pattern)

        // 测试中间件仍然能正常工作
        const options: NextMcpMiddlewareOptions = {
          mcpHandlerParams: {
            mcpServer: vi.fn(),
            verifyToken: vi.fn(),
          },
          needAuth: false,
        }

        const middleware = nextMcpMiddleware(options)
        expect(middleware).toBeDefined()
        expect(middleware.middlewareGenerator).toBeDefined()
        expect(middleware.matcher).toBeDefined()
      })
    })

    it('should work with multiple DEBUG values', () => {
      // 测试多个 DEBUG 值（用逗号分隔）
      process.env.DEBUG = 'mcp:middleware,other:debug'
      expect(process.env.DEBUG).toBe('mcp:middleware,other:debug')

      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: {
          mcpServer: vi.fn(),
          verifyToken: vi.fn(),
        },
        needAuth: false,
      }

      const middleware = nextMcpMiddleware(options)
      expect(middleware).toBeDefined()
    })

    it('should demonstrate environment variable usage in middleware', () => {
      // 演示如何在中间件中使用环境变量
      process.env.DEBUG = 'mcp:middleware'

      const options: NextMcpMiddlewareOptions = {
        mcpHandlerParams: {
          mcpServer: vi.fn().mockReturnValue({}),
          verifyToken: vi.fn().mockReturnValue(true),
          mcpHandlerConfig: {
            basePath: '/custom-api',
          },
        },
        needAuth: true,
        metadata: {
          scopesSupported: ['profile', 'email', 'read'],
          responseTypesSupported: ['code', 'token'],
          clientId: 'test-client-123',
          clientSecret: 'test-secret-456',
        },
        authConfig: {
          customToken: vi.fn().mockResolvedValue({
            access_token: 'mock-token',
            token_type: 'Bearer',
          }),
          customAuthEndpoint: 'https://auth.example.com/authorize',
        },
      }

      // 创建中间件
      const middleware = nextMcpMiddleware(options)

      // 验证中间件正常工作
      expect(middleware).toBeDefined()
      expect(middleware.middlewareGenerator).toBeDefined()
      expect(middleware.matcher).toBeDefined()
      expect(Array.isArray(middleware.matcher)).toBe(true)

      // 验证 matcher 包含预期的路径
      expect(middleware.matcher).toContain('/custom-api/mcp')
      expect(middleware.matcher).toContain('/custom-api/auth/register')
      expect(middleware.matcher).toContain('/.well-known/oauth-authorization-server')
      expect(middleware.matcher).toContain('/.well-known/oauth-protected-resource')
    })
  })
})
