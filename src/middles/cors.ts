import { type NextRequest, NextResponse } from 'next/server'

export function getCorsHeaders(req: NextRequest): Record<string, string> {
  const originHeader = req.headers.get('origin')
  // Fallback to the request URL origin to avoid using '*', which breaks credentials
  const origin = originHeader || new URL(req.url).origin
  const requestMethod = req.headers.get('access-control-request-method')
  const requestHeaders = req.headers.get('access-control-request-headers')
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods':
      requestMethod || 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      requestHeaders || 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
  }
}

export function jsonWithCors(
  req: NextRequest,
  data: unknown,
  init?: ResponseInit,
): NextResponse {
  const res = NextResponse.json(data as any, init)
  const cors = getCorsHeaders(req)
  for (const [k, v] of Object.entries(cors)) res.headers.set(k, v)
  return res
}
