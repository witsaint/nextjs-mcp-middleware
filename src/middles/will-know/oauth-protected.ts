import {
  protectedResourceHandler,
} from 'mcp-handler'
import { type NextRequest, NextResponse } from 'next/server'
import { getCorsHeaders } from '../cors'

export function protectedResourceMiddleware(request: NextRequest, options: {
  oauthPath: string
}): NextResponse | Response | (() => Response) {
  const { method } = request
  if (method === 'OPTIONS') {
    const headers = getCorsHeaders(request)
    return new NextResponse(null, {
      status: 200,
      headers,
    })
  }

  const { oauthPath } = options

  const handler = protectedResourceHandler({
    // Specify the Issuer URL of the associated Authorization Server
    // 授权服务器元数据请求”RFC8414 RFC8414
    authServerUrls: [oauthPath],
  })
  if (method === 'GET') {
    return handler(request)
  }
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}
