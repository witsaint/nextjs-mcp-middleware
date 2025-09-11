import type { NextMcpMiddlewareOptions } from './types'
import { type NextRequest, NextResponse } from 'next/server'
import { authAuthorize } from './api/auth-authorize'
import { authRegister } from './api/auth-register'
import { authToken } from './api/auth-token'
import { mcpMiddleware } from './api/mcp'
import { mcpIndexLogger } from './debug'
import { oauthAuthorizationMiddleware } from './will-know/oauth-authoriztion'
import { protectedResourceMiddleware } from './will-know/oauth-protected'

export function nextMcpMiddleware(options: NextMcpMiddlewareOptions): {
  middlewareGenerator: (request: NextRequest) => Promise<NextResponse | Response | (() => Response)>
  matcher: string[]
} {
  const { mcpHandlerParams, metadata, next, authConfig, needAuth } = options
  const { mcpHandlerConfig } = mcpHandlerParams
  const { scopesSupported } = metadata || {}

  mcpIndexLogger(`[nextMcpMiddleware] options %O`, options)

  const { basePath = '/api' } = mcpHandlerConfig || {}
  const mcpPath = `${basePath}/mcp`
  const oauthPath = '/.well-known/oauth-authorization-server'
  const protectedPath = `/.well-known/oauth-protected-resource`

  const authRegisterPath = `${basePath}/auth/register`
  const authAuthorizePath = `${basePath}/auth/authorize`
  const authTokenPath = `${basePath}/auth/token`
  const matcher = [
    mcpPath,
    oauthPath,
    protectedPath,
    authRegisterPath,
  ]

  const handle = async function (request: NextRequest): Promise<NextResponse | Response | (() => Response)> {
    const { pathname } = request.nextUrl

    if (pathname === mcpPath) {
      mcpIndexLogger(`[nextMcpMiddleware] mcpPath ${mcpPath}`)
      return mcpMiddleware(
        request,
        mcpHandlerParams,
        protectedPath,
        needAuth,
        scopesSupported || [],
      )
    }

    if (needAuth) {
      if (pathname === oauthPath) {
        mcpIndexLogger(`[nextMcpMiddleware] oauthPath ${oauthPath} %O`, metadata)
        return oauthAuthorizationMiddleware(request, {
          basePath,
          metadata,
        })
      }

      if (pathname === protectedPath) {
        mcpIndexLogger(`[nextMcpMiddleware] protectedPath ${protectedPath} ${oauthPath}`)
        return protectedResourceMiddleware(request, {
          oauthPath,
        })
      }

      if (pathname === authRegisterPath) {
        mcpIndexLogger(`[nextMcpMiddleware] authRegisterPath ${authRegisterPath} %O`, metadata)
        return authRegister(request, metadata)
      }

      if (pathname === authAuthorizePath) {
        mcpIndexLogger(`[nextMcpMiddleware] authAuthorizePath ${authAuthorizePath} %O`, authConfig)
        return authAuthorize(request, authConfig)
      }

      if (pathname === authTokenPath) {
        mcpIndexLogger(`[nextMcpMiddleware] authTokenPath ${authTokenPath} %O`, authConfig)
        return authToken(request, authConfig)
      }
    }

    return next ? next(request) : NextResponse.next()
  }
  return {
    middlewareGenerator: handle,
    matcher,
  }
}
