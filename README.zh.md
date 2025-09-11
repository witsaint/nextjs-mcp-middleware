# nextjs-mcp-middleware

一个用于处理 MCP（模型上下文协议）服务器 OAuth2 授权的 Next.js 中间件库。此包提供了帮助开发者将 MCP OAuth2 相关流程集成到 Next.js 应用程序的实用工具。

## 特性
- 🛡️ 支持 MCP OAuth2 授权流程
- ⚡️ 兼容 Next.js 15.5+ 中间件机制
- 🧩  可扩展的中间件架构，便于自定义
- 🪝 内置身份验证、注册和令牌验证中间件
- 🔧 灵活的令牌验证和自定义端点支持

## 系统要求
- **Next.js 15.5.2 或更高版本**（MCP 中间件兼容性所需）
- **Node.js 运行时**（中间件必须使用 `runtime: 'nodejs'` 配置）

## 安装

```bash
pnpm add nextjs-mcp-middleware
# 或者
npm install nextjs-mcp-middleware
# 或者
yarn add nextjs-mcp-middleware
```

> ⚠️ 建议使用 pnpm 以获得最佳依赖兼容性。

## 快速开始

### 1. 配置 MCP SDK
确保你的项目已正确安装和配置了 `@modelcontextprotocol/sdk`。

### 2. 设置中间件

```ts
// src/middleware.ts
import { nextMcpMiddleware } from 'nextjs-mcp-middleware'
import type { NextRequest } from 'next/server'

// 令牌验证函数
async function verifyToken(req: Request, bearerToken?: string): Promise<AuthInfo | undefined> {
  if (!bearerToken)
    return undefined

  // MCP 客户端验证逻辑
  return {
    token: bearerToken,
    scopes: ['profile'], // 添加相关作用域
    clientId: '', // 添加用户/客户端标识符
    extra: {
      // 可选的额外信息
      userId: '',
    },
  }
}

const { middlewareGenerator, matcher } = nextMcpMiddleware({
  mcpHandlerParams: {
    mcpServer: (server) => {
      useMcp(server)
      registerTools()
    },
    mcpHandlerOptions: {},
    mcpHandlerConfig: {
      basePath: '/api',
      maxDuration: 60,
      verboseLogs: true,
    },
    verifyToken,
  },
  metadata: {
    clientId: process.env.SSO_CLIENT_ID || '',
    clientSecret: process.env.SSO_CLIENT_SECRET || '',
    scopesSupported: ['profile'],
    responseTypesSupported: ['code', 'token'],
  },
  needAuth: true,
  authConfig: {
    async customAuthEndpoint(params: authCallParams, request: NextRequest) {
      const { responseType, clientId, redirectUri, scope, state } = params
      return `${process.env.SSO_HOST}/v1/oauth/authorize?response_type=${responseType}&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`
    },
    async customToken(params: tokenCallParams, _request) {
      const { code, grantType } = params
      const response = await ssoServer.post(
        `/v1/oauth/token?code=${code}&grant_type=${grantType}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      return await response.json()
    },
  },
})

export const middleware = middlewareGenerator

export const config = {
  runtime: 'nodejs', // 必需：必须使用 nodejs 运行时
  // matcher, // 可选：使用生成的匹配器或定义自己的
}
```

### 3. 环境变量

```env
SSO_CLIENT_ID=你的客户端ID
SSO_CLIENT_SECRET=你的客户端密钥
SSO_HOST=https://你的-sso-服务器.com
```

### 4. 在 Cursor/VSCode Copilot 中配置 MCP

要在 Cursor 或 VSCode Copilot 中使用你的 MCP 服务器，请在 MCP 设置中添加以下配置：

#### 对于 Cursor
添加到你的 Cursor MCP 设置中：

```json
{
  "mcp-remote": {
    "command": "npx",
    "args": [
      "-y",
      "mcp-remote",
      "https://your-next-server.com/api/mcp",
      "9696"
    ]
  }
}
```

#### 对于 VSCode Copilot
添加到你的 VSCode MCP 设置中：

```json
{
  "mcp-remote": {
    "command": "npx",
    "args": [
      "-y",
      "mcp-remote",
      "https://your-next-server.com/api/mcp",
      "9696"
    ]
  }
}
```

> **注意**：将 `https://your-next-server.com/api/mcp` 替换为你的实际 Next.js 服务器 URL 和 MCP 端点。端口 `9696` 是默认的 MCP 端口，可根据需要调整。此配置兼容 Cursor 和 VSCode Copilot。

## API 参考

### `nextMcpMiddleware(options)`

创建支持 OAuth2 的 MCP 中间件的主函数。

#### 选项

- `mcpHandlerParams`: MCP 服务器配置
- `needAuth`: 启用/禁用身份验证要求
- `metadata`: OAuth2 客户端元数据， `needAuth: true` 时必须提供
  - `clientId`: OAuth2 的 client_id，或返回该值的函数
  - `clientSecret`: OAuth2 的 client_secret，或返回该值的函数
  - `issuer?`: 授权服务器 Issuer 地址（可选）
  - `authorizationEndpoint?`: OAuth2 授权端点地址（可选）
  - `tokenEndpoint?`: OAuth2 令牌端点地址（可选）
  - `registrationEndpoint?`: 动态客户端注册端点地址（可选）
  - `userinfoEndpoint?`: 用户信息端点地址（可选）
  - `tokenEndpointAuthMethodsSupported?`: 令牌端点支持的认证方式，如 `['client_secret_basic','client_secret_post']`（可选）
  - `scopesSupported`: 支持的 OAuth2 作用域列表，如 `['profile']`
  - `responseTypesSupported`: 支持的 OAuth2 响应类型列表，如 `['code','token']`
- `authConfig`: 自定义身份验证端点配置， `needAuth: true` 时必须提供
  - `customAuthEndpoint`: 自定义授权端点，支持两种形式：
    - 字符串：固定 URL 或“中转”URL，可先跳转到中转 URL，再由中转端二次跳转到最终的 `redirectUri`（例如：`/api/relay-auth?redirect_uri=...`）。
    - 函数：`(params: authCallParams, request: NextRequest) => Promise<string> | string`，可基于 `responseType`、`clientId`、`redirectUri`、`scope`、`state` 与当前 `request` 动态生成授权地址。
  - `customToken`: 自定义令牌端点

### 类型

- `AuthInfo`: 令牌验证结果接口
- `authCallParams`: 授权端点参数
- `tokenCallParams`: 令牌端点参数

## 配置

### 运行时要求

**重要**：你的中间件配置必须指定 `runtime: 'nodejs'`：

```ts
export const config = {
  runtime: 'nodejs', // MCP 中间件必需
}
```

### Next.js 版本

此包需要 **Next.js 15.5.2 或更高版本** 以获得适当的 MCP 中间件支持。

### Debug 日志

可以通过 `DEBUG` 环境变量启用中间件的调试日志（使用 `debug` 库命名空间 `mcp:middleware`）。

运行时启用：

```bash
# 仅启用 middleware 日志
DEBUG=mcp:middleware pnpm dev

# 启用所有 mcp 相关日志
DEBUG=mcp:* pnpm dev

# 同时启用多个模式
DEBUG=mcp:middleware,other:debug pnpm dev
```

在测试（Vitest）中：

```bash
DEBUG=mcp:middleware pnpm test
```

在示例应用（workspace）中：

```bash
pnpm -F example dev:debug
pnpm -F example dev:debug:all
```

## 依赖

- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [zod](https://www.npmjs.com/package/zod)
- [mcp-handler](https://www.npmjs.com/package/mcp-handler)

## 常见问题（FAQ）

- 致命错误：`Error: client_secret_basic authentication requires a client_secret`
  - 通常表示 OAuth 客户端配置为 `client_secret_basic`，但没有传递 `client_secret`。
  - 处理方法：
    - 确认环境变量已设置：`SSO_CLIENT_SECRET`。
    - 本地调试若刚修改过凭据或授权范围，可清理本地 MCP 授权缓存后重试：
      ```bash
      rm -rf ~/.mcp-auth
      ```
    - 重启 MCP 客户端（如 Cursor/VSCode Copilot）与 Next.js 服务后再次尝试。

> 更多内容请参考根目录英文 `README.md` 示例与 API 说明。
