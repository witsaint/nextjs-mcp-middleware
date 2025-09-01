import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandler,
} from 'mcp-handler'
import { type NextRequest, NextResponse } from 'next/server'

export function protectedResourceMiddleware(request: NextRequest, options: {
  oauthPath: string
}): NextResponse | Response | (() => Response) {
  const { method } = request
  if (method === 'OPTIONS') {
    return metadataCorsOptionsRequestHandler()
  }

  const { oauthPath } = options

  const handler = protectedResourceHandler({
    // Specify the Issuer URL of the associated Authorization Server
    // 没有实现 猎户座没有实现auth2 的 授权服务器元数据请求”RFC8414 RFC8414
    authServerUrls: [oauthPath],
    // resUrl: 'https://localhost:3443',
  })
  if (method === 'GET') {
    return handler(request)
  }
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}
