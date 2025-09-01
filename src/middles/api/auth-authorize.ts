import type { AuthConfig } from '../types'
import { type NextRequest, NextResponse } from 'next/server'

function generateState(): string {
  return `state_${Math.random().toString(36).substring(2, 9)}`
}

export async function authAuthorize(request: NextRequest, authConfig: AuthConfig): Promise<NextResponse> {
  const { customAuthEndpoint } = authConfig
  const { searchParams } = new URL(request.url)
  const response_type = searchParams.get('response_type')
  const client_id = searchParams.get('client_id')
  const redirect_uri = searchParams.get('redirect_uri')
  const scope = searchParams.get('scope') || 'profile'
  const state = searchParams.get('state')

  let url = ''
  if (customAuthEndpoint) {
    if (typeof customAuthEndpoint === 'function') {
      url = await customAuthEndpoint({
        responseType: response_type || '',
        clientId: client_id || '',
        redirectUri: redirect_uri || '',
        scope: scope || '',
        state: state || generateState(),
      })
    }
    else {
      url = customAuthEndpoint
    }
  }

  return NextResponse.redirect(url)
}
