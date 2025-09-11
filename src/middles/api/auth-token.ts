import type { AuthConfig } from '../types'
import { type NextRequest, NextResponse } from 'next/server'
import { getCorsHeaders, jsonWithCors } from '../cors'
import { apiTokenLogger } from '../debug'

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
      const client_id = formData.get('client_id') as string
      const client_secret = formData.get('client_secret') as string | null
      const code_verifier = formData.get('code_verifier') as string | undefined

      if (grant_type !== 'authorization_code') {
        console.warn('Unsupported grant type:', grant_type)
        return NextResponse.json({ error: 'Unsupported grant type' }, {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        })
      }
      const response = await customToken(
        { code, grantType: grant_type, clientId: client_id, clientSecret: client_secret, codeVerifier: code_verifier },
        request,
      )
      apiTokenLogger(`[authToken] result %O`, {
        code,
        grant_type,
        client_id,
        client_secret,
        code_verifier,
      })
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
