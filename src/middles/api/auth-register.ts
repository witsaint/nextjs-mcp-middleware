import type { Metadata, RegistrationResponse } from '../types'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getCorsHeaders, jsonWithCors } from '../cors'
import { apiRegisterLogger } from '../debug'

// OAuth2 Registration Request Schema
const RegistrationSchema = z.object({
  client_name: z.string().min(1, 'Client name is required'),
  client_uri: z.string().url('Valid client URI is required').optional(),
  logo_uri: z.string().url('Valid logo URI is required').optional(),
  scope: z.string().min(1, 'Scope is required').optional(),
  grant_types: z
    .array(
      z.enum(['authorization_code', 'client_credentials', 'refresh_token']),
    )
    .min(1, 'At least one grant type is required'),
  response_types: z.array(z.enum(['code', 'token'])).optional(),
  token_endpoint_auth_method: z
    .enum(['client_secret_basic', 'client_secret_post', 'none'])
    .default('client_secret_basic'),
  redirect_uris: z
    .array(z.string().url('Valid redirect URI is required'))
    .min(1, 'At least one redirect URI is required'),
  contacts: z.array(z.string().email('Valid email is required')).optional(),
  policy_uri: z.string().url('Valid policy URI is required').optional(),
  terms_of_service_uri: z
    .string()
    .url('Valid terms of service URI is required')
    .optional(),
  jwks_uri: z.string().url('Valid JWKS URI is required').optional(),
  software_id: z.string().optional(),
  software_version: z.string().optional(),
})

// In-memory storage for demo purposes (replace with database in production)

function generateRegistrationAccessToken(): string {
  return `reg_token_${Math.random().toString(36).substring(2, 20)}`
}

function funcStr(func: string | (() => string)): string {
  if (typeof func === 'function') {
    return func()
  }
  return func
}

export async function authRegister(request: NextRequest, metadata: Metadata): Promise<NextResponse> {
  const { method } = request
  const { clientId, clientSecret, scopesSupported } = metadata
  if (method === 'OPTIONS') {
    const headers = getCorsHeaders(request)
    return new NextResponse(null, {
      status: 204,
      headers,
    })
  }

  if (method === 'POST') {
    try {
      // Parse and validate the request body
      const body = await request.json()
      apiRegisterLogger(`[authRegister] body %O`, body)
      const validatedData = RegistrationSchema.parse(body)

      // Generate OAuth2 client credentials
      const _clientId = funcStr(clientId)
      const _clientSecret = funcStr(clientSecret)
      const registrationAccessToken = generateRegistrationAccessToken()
      const now = Math.floor(Date.now() / 1000)

      // Create registration response
      const registrationResponse: RegistrationResponse = {
        client_id: _clientId,
        client_secret: _clientSecret,
        client_id_issued_at: now,
        client_secret_expires_at: 0, // 0 means no expiration
        registration_access_token: registrationAccessToken,
        registration_client_uri: `${request.nextUrl.origin}/api/auth/register/${_clientId}`,
        token_endpoint_auth_method: validatedData.token_endpoint_auth_method,
        grant_types: validatedData.grant_types,
        response_types: validatedData.response_types,
        redirect_uris: validatedData.redirect_uris,
        scope: validatedData.scope || scopesSupported.join(','),
        client_name: validatedData.client_name,
        client_uri: validatedData.client_uri,
        logo_uri: validatedData.logo_uri,
        contacts: validatedData.contacts,
        policy_uri: validatedData.policy_uri,
        terms_of_service_uri: validatedData.terms_of_service_uri,
        jwks_uri: validatedData.jwks_uri,
        software_id: validatedData.software_id,
        software_version: validatedData.software_version,
      }

      // Store the registration (replace with database in production)
      // clientRegistrations?.set(clientId, registrationResponse);

      apiRegisterLogger(`[authRegister] registrationResponse %O`, {
        registrationResponse,
        validatedData,
      })
      // Return the registration response
      return jsonWithCors(request, registrationResponse, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      })
    }
    catch (error) {
      if (error instanceof z.ZodError) {
        // Validation error
        return jsonWithCors(
          request,
          {
            error: 'invalid_request',
            error_description: 'Invalid registration request',
            error_uri: 'https://tools.ietf.org/html/rfc7591#section-3.2.2',
            details: error.message,
          },
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Cache-Control': 'no-store',
            },
          },
        )
      }

      // Internal server error
      console.error('Registration error:', error)
      return jsonWithCors(
        request,
        {
          error: 'server_error',
          error_description: 'Internal server error during registration',
        },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        },
      )
    }
  }
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}
