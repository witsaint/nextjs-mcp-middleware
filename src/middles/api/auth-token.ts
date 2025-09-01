import type { AuthConfig } from '../types'
import { type NextRequest, NextResponse } from 'next/server'
import { getCorsHeaders, jsonWithCors } from '../cors'

export async function authToken(request: NextRequest, authConfig: AuthConfig): Promise<NextResponse> {
  const { method } = request
  const { customToken } = authConfig
  if (method === 'OPTIONS') {
    const headers = getCorsHeaders(request)
    return new NextResponse(null, {
      status: 204,
      headers,
    })
  }
  if (method === 'POST') {
    try {
      // post 请求 nextjs 默认是 form-data 格式，需要手动转换为 json 格式
      const formData = await request.formData()
      const code = (formData.get('code') as string) || ''
      const grant_type = (formData.get('grant_type') as string) || ''
      const response = await customToken(
        { code, grantType: grant_type },
        request,
      )
      return jsonWithCors(request, response)
    }
    catch (error) {
      console.error(error)
      return NextResponse.json(
        {
          error: 'internal_server_error',
          error_description: 'Token exchange failed',
        },
        { status: 500 },
      )
    }
  }
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}
