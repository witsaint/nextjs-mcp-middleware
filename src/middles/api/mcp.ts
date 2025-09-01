import type { mcpHandlerParams, Metadata } from '../types'
import { createMcpHandler, withMcpAuth } from 'mcp-handler'
import { type NextRequest, NextResponse } from 'next/server'

export async function mcpMiddleware(request: NextRequest, mcpHandlerParams: mcpHandlerParams, metadata: Metadata, protectedPath: string, needAuth: boolean): Promise<NextResponse | Response> {
  const { method } = request
  const { mcpServer, mcpHandlerOptions, mcpHandlerConfig, verifyToken }
    = mcpHandlerParams
  const { scopesSupported } = metadata
  if (method === 'GET' || method === 'POST') {
    // Make authorization required
    const handler = createMcpHandler(
      mcpServer,
      mcpHandlerOptions,
      mcpHandlerConfig,
    )
    const authHandler = withMcpAuth(handler, verifyToken, {
      required: needAuth, // Make auth required for all requests
      requiredScopes: scopesSupported, // Optional: Require specific scopes
      resourceMetadataPath: protectedPath, // Optional: Custom metadata path
    })
    return authHandler(request)
  }
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}
