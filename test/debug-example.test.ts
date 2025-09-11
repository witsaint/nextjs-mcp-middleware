import { afterEach, beforeEach, describe, expect, it } from 'vitest'

/**
 * 这个测试文件演示如何在运行时使用环境变量来启用 debug 输出
 *
 * 使用方法：
 * 1. 设置环境变量：DEBUG=mcp:middleware
 * 2. 运行测试：DEBUG=mcp:middleware pnpm test test/debug-example.test.ts
 * 3. 或者运行应用：DEBUG=mcp:middleware pnpm dev
 */

describe('debug Environment Variable Usage', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should demonstrate how to enable debug logging', () => {
    // 方法1：在代码中设置环境变量
    process.env.DEBUG = 'mcp:middleware'

    // 验证环境变量已设置
    expect(process.env.DEBUG).toBe('mcp:middleware')

    // 在真实应用中，debug 库会检查这个环境变量
    // 如果匹配，就会输出 debug 信息到 console
  })

  it('should demonstrate different DEBUG patterns', () => {
    const patterns = [
      'mcp:middleware', // 精确匹配
      'mcp:*', // 匹配所有 mcp 相关的 debug
      '*:middleware', // 匹配所有 middleware 相关的 debug
      'mcp:*,other:*', // 匹配多个模式
    ]

    patterns.forEach((pattern) => {
      process.env.DEBUG = pattern
      expect(process.env.DEBUG).toBe(pattern)
    })
  })

  it('should show how to run with debug enabled', () => {
    // 这个测试演示了如何在命令行中启用 debug

    // 在终端中运行以下命令来启用 debug：
    // DEBUG=mcp:middleware pnpm test
    // DEBUG=mcp:middleware pnpm dev
    // DEBUG=mcp:* pnpm test

    process.env.DEBUG = 'mcp:middleware'

    // 验证环境变量设置正确
    expect(process.env.DEBUG).toBe('mcp:middleware')

    // 在真实应用中，这会启用 debug 输出
    // eslint-disable-next-line no-console
    console.log('Debug is enabled with pattern:', process.env.DEBUG)
  })

  it('should demonstrate debug output in different scenarios', () => {
    // 场景1：开发环境 - 启用所有 debug
    process.env.DEBUG = 'mcp:*'
    expect(process.env.DEBUG).toBe('mcp:*')

    // 场景2：生产环境 - 禁用 debug
    delete process.env.DEBUG
    expect(process.env.DEBUG).toBeUndefined()

    // 场景3：调试特定功能
    process.env.DEBUG = 'mcp:middleware'
    expect(process.env.DEBUG).toBe('mcp:middleware')
  })
})

/**
 * 使用说明：
 *
 * 1. 在开发时启用 debug：
 *    DEBUG=mcp:middleware pnpm dev
 *
 * 2. 在测试时启用 debug：
 *    DEBUG=mcp:middleware pnpm test
 *
 * 3. 在 CI/CD 中禁用 debug：
 *    unset DEBUG && pnpm build
 *
 * 4. 在 Docker 中设置环境变量：
 *    docker run -e DEBUG=mcp:middleware your-app
 *
 * 5. 在 package.json 脚本中：
 *    "debug": "DEBUG=mcp:middleware pnpm dev"
 *    "test:debug": "DEBUG=mcp:middleware pnpm test"
 */
