# 测试文档

这个目录包含了 `nextjs-mcp-middleware` 项目的所有单元测试。

## 测试结构

```
test/
├── setup.ts                    # 测试环境设置
├── index.test.ts              # 主入口测试
├── utils/
│   └── test-helpers.ts        # 测试工具函数
├── middles/
│   ├── index.test.ts          # 主中间件测试
│   ├── types.test.ts          # 类型定义测试
│   ├── cors.test.ts           # CORS 工具测试
│   ├── api/
│   │   ├── mcp.test.ts        # MCP 中间件测试
│   │   ├── auth-register.test.ts  # 认证注册测试
│   │   ├── auth-authorize.test.ts # 认证授权测试
│   │   └── auth-token.test.ts     # 认证令牌测试
│   └── will-know/
│       ├── oauth-authorization.test.ts  # OAuth 授权服务器测试
│       └── oauth-protected.test.ts      # OAuth 受保护资源测试
└── README.md                  # 本文档
```

## 运行测试

### 基本命令

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test-coverage

# 监视模式运行测试
pnpm test-unit-watch

# 运行所有测试（包括未匹配的）
pnpm test-all

# 启用 debug 模式运行测试
pnpm test-debug

# 启用 debug 模式的监视测试
pnpm test-debug-watch
```

### Debug 模式

项目支持通过环境变量启用 debug 日志输出：

```bash
# 启用所有 mcp 相关的 debug 输出
DEBUG=mcp:middleware pnpm test

# 启用所有 mcp 相关的 debug 输出
DEBUG=mcp:* pnpm test

# 启用多个 debug 模式
DEBUG=mcp:middleware,other:debug pnpm test

# 使用预定义的 debug 脚本
pnpm test-debug
```

### 环境变量说明

- `DEBUG=mcp:middleware` - 启用中间件的 debug 输出
- `DEBUG=mcp:*` - 启用所有 mcp 相关的 debug 输出
- `DEBUG=*:middleware` - 启用所有 middleware 相关的 debug 输出

### 运行特定测试文件
```bash
npx vitest run test/middles/cors.test.ts
```

## 测试覆盖率

项目配置了详细的测试覆盖率要求：

- **全局覆盖率**: 80% (分支、函数、行、语句)
- **关键文件覆盖率**: 85-90%

### 覆盖率报告

运行 `pnpm test-coverage` 后，覆盖率报告将生成在 `./coverage` 目录中：

- `coverage/index.html` - HTML 格式的详细报告
- `coverage/lcov.info` - LCOV 格式报告（用于 CI/CD）
- `coverage/coverage-final.json` - JSON 格式报告

## 测试工具

### 测试辅助函数

`test/utils/test-helpers.ts` 提供了以下辅助函数：

- `createMockNextRequest()` - 创建模拟的 NextRequest
- `createMockNextResponse()` - 创建模拟的 NextResponse
- `createMockFormData()` - 创建模拟的 FormData
- `createMockMetadata()` - 创建模拟的元数据对象
- `createMockAuthConfig()` - 创建模拟的认证配置
- `createMockMcpHandlerParams()` - 创建模拟的 MCP 处理器参数
- `createMockRegistrationData()` - 创建模拟的注册数据

### 使用示例

#### 基本用法
```typescript
import { createMockNextRequest, createMockMetadata } from './utils/test-helpers'
import type { MockNextRequest, MockNextResponse } from './setup'

describe('My Test', () => {
  it('should work', () => {
    const request = createMockNextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    const metadata = createMockMetadata({
      scopesSupported: ['profile', 'email']
    })

    // 测试逻辑...
  })
})
```

#### 类型化使用
```typescript
import { createMockNextRequest, createMockNextResponse } from './utils/test-helpers'
import type { MockNextRequest, MockNextResponse } from './setup'

describe('Typed Test', () => {
  it('should use typed mocks', () => {
    // 显式类型声明
    const request: MockNextRequest = createMockNextRequest('http://localhost:3000/api/test')
    const response: MockNextResponse = createMockNextResponse({ data: 'test' }, 200)

    // TypeScript 会提供完整的类型提示
    expect(request.url).toBe('http://localhost:3000/api/test')
    expect(response.status).toBe(200)
  })

  it('should work with async functions', async () => {
    const request = createMockNextRequest('http://localhost:3000/api/test')
    
    // 类型安全的异步调用
    const data = await request.json()
    const formData = await request.formData()
    
    expect(data).toEqual({})
    expect(formData).toBeInstanceOf(FormData)
  })
})
```

## 测试策略

### 1. 单元测试
- 每个函数和类都有对应的测试
- 测试覆盖正常流程和错误情况
- 使用模拟对象隔离依赖

### 2. 集成测试
- 测试中间件之间的交互
- 测试完整的请求/响应流程

### 3. 边界测试
- 测试空值、null、undefined 等边界情况
- 测试无效输入和错误处理

### 4. 类型测试
- 验证 TypeScript 类型定义的正确性
- 确保接口和类型约束有效

## 模拟 (Mocking)

项目使用 Vitest 的模拟功能来隔离依赖：

- **Next.js 模块**: 模拟 `next/server` 中的 NextRequest 和 NextResponse
- **MCP Handler**: 模拟 `mcp-handler` 中的函数
- **Debug**: 模拟 `debug` 模块

## 持续集成

测试配置支持 CI/CD 环境：

- 使用 `--coverage` 标志生成覆盖率报告
- 配置了覆盖率阈值，确保代码质量
- 支持并行测试执行

## 故障排除

### 常见问题

1. **模拟不工作**: 确保在 `beforeEach` 中调用 `vi.clearAllMocks()`
2. **类型错误**: 检查测试文件中的类型导入
3. **异步测试**: 确保使用 `await` 或返回 Promise

### 调试技巧

1. 使用 `console.log` 在测试中输出调试信息
2. 使用 `vi.debug()` 查看模拟调用
3. 使用 `--reporter=verbose` 获取详细输出

## 贡献指南

添加新测试时请遵循以下原则：

1. 测试文件命名: `*.test.ts`
2. 测试描述清晰明确
3. 每个测试只验证一个功能点
4. 使用适当的模拟和辅助函数
5. 确保测试覆盖率达标
