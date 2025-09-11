# nextjs-mcp-middleware

A Next.js middleware library for handling MCP (Model Context Protocol) server with OAuth2 authorization. This package provides utilities to help developers integrate MCP OAuth2-related processes into their Next.js applications.

## Features
- 🛡️ MCP OAuth2 authorization flow support
- ⚡️ Compatible with Next.js 15.5+ middleware mechanism
- 🧩 Extensible middleware architecture for customization
- 🪝 Built-in authentication, registration, and token validation middleware
- 🔧 Flexible token verification with custom endpoints

## Requirements
- **Next.js 15.5.2 or higher** (required for MCP middleware compatibility)
- **Node.js runtime** (middleware must use `runtime: 'nodejs'` configuration)

## Installation

```bash
pnpm add nextjs-mcp-middleware
# or
npm install nextjs-mcp-middleware
# or
yarn add nextjs-mcp-middleware
```

> ⚠️ We recommend using pnpm for the best dependency compatibility.

## Quick Start

### 1. Configure MCP SDK
Ensure your project has `@modelcontextprotocol/sdk` properly installed and configured.

### 2. Setup Middleware

```ts
// src/middleware.ts
import { nextMcpMiddleware } from 'nextjs-mcp-middleware'
import type { NextRequest } from 'next/server'

// Token verification function
async function verifyToken(req: Request, bearerToken?: string): Promise<AuthInfo | undefined> {
  if (!bearerToken)
    return undefined

  // MCP client verification logic
  return {
    token: bearerToken,
    scopes: ['profile'], // Add relevant scopes
    clientId: '', // Add user/client identifier
    extra: {
      // Optional extra information
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
  runtime: 'nodejs', // Required: Must use nodejs runtime
  // matcher, // Optional: Use generated matcher or define your own
}
```

### 3. Environment Variables

```env
SSO_CLIENT_ID=your_client_id
SSO_CLIENT_SECRET=your_client_secret
SSO_HOST=https://your-sso-server.com
```

### 4. Configure MCP in Cursor/VSCode Copilot

To use your MCP server with Cursor or VSCode Copilot, add the following configuration to your MCP settings:

#### For Cursor
Add to your Cursor MCP settings:

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

#### For VSCode Copilot
Add to your VSCode MCP settings:

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

> **Note**: Replace `https://your-next-server.com/api/mcp` with your actual Next.js server URL and MCP endpoint. The port `9696` is the default MCP port, adjust as needed. This configuration is compatible with both Cursor and VSCode Copilot.

## API Reference

### `nextMcpMiddleware(options)`

Main function to create MCP middleware with OAuth2 support.

#### Options

- `mcpHandlerParams`: MCP server configuration
- `needAuth`: Enable/disable authentication requirement
- `metadata`: OAuth2 client metadata，be required with `needAuth: true`
  - `clientId`: OAuth2 client_id value, or a function returning it
  - `clientSecret`: OAuth2 client_secret value, or a function returning it
  - `issuer?`: Authorization server issuer URL (optional)
  - `authorizationEndpoint?`: OAuth2 authorization endpoint URL (optional)
  - `tokenEndpoint?`: OAuth2 token endpoint URL (optional)
  - `registrationEndpoint?`: Dynamic client registration endpoint URL (optional)
  - `userinfoEndpoint?`: UserInfo endpoint URL (optional)
  - `tokenEndpointAuthMethodsSupported?`: Supported token endpoint auth methods, e.g. `['client_secret_basic','client_secret_post']` (optional)
  - `scopesSupported`: Supported OAuth2 scopes, e.g. `['profile']`
  - `responseTypesSupported`: Supported OAuth2 response types, e.g. `['code','token']`
- `authConfig`: Custom authentication endpoints configuration be required with `needAuth: true`
  - `customAuthEndpoint`: Custom authorization endpoint. Supports two forms:
    - String: a fixed URL or an intermediate relay URL. You can point this to a relay URL which then performs a second redirect to your final `redirectUri` (e.g. `/api/relay-auth?redirect_uri=...`).
    - Function: `(params: authCallParams, request: NextRequest) => Promise<string> | string` for fully dynamic URL construction based on `responseType`, `clientId`, `redirectUri`, `scope`, `state`, and the current `request`.
  - `customToken`: Custom token endpoint

### Types

- `AuthInfo`: Token verification result interface
- `authCallParams`: Authorization endpoint parameters
- `tokenCallParams`: Token endpoint parameters

## Configuration

### Runtime Requirement

**Important**: Your middleware configuration must specify `runtime: 'nodejs'`:

```ts
export const config = {
  runtime: 'nodejs', // Required for MCP middleware
}
```

### Next.js Version

This package requires **Next.js 15.5.2 or higher** for proper MCP middleware support.

### Debug Logging

You can enable verbose middleware logs using the `debug` package namespace `mcp:middleware`.

Run with environment variable:

```bash
# Enable only middleware logs
DEBUG=mcp:middleware pnpm dev

# Enable all mcp-related logs
DEBUG=mcp:* pnpm dev

# Multiple patterns
DEBUG=mcp:middleware,other:debug pnpm dev
```

During tests (Vitest):

```bash
DEBUG=mcp:middleware pnpm test
```

In the example app (workspace):

```bash
pnpm -F example dev:debug
pnpm -F example dev:debug:all
```

## Dependencies

- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [zod](https://www.npmjs.com/package/zod)
- [mcp-handler](https://www.npmjs.com/package/mcp-handler)

## FAQ

- **Fatal error: Error: client_secret_basic authentication requires a client_secret**
  - This usually means your OAuth client is configured to use `client_secret_basic` but the `client_secret` is missing or not being sent.
  - Quick fixes:
    - Ensure `SSO_CLIENT_SECRET` is set in your environment and correctly loaded by your Next.js app.
    - If you recently changed credentials or scopes in local development, clear the local MCP auth cache:
      ```bash
      rm -rf ~/.mcp-auth
      ```
    - Restart your MCP client (Cursor/VSCode Copilot) and your Next.js server, then retry.

> For Chinese documentation, see `docs/README.zh-CN.md`.
