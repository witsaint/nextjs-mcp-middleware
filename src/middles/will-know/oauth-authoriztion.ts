import type { Metadata } from '../types'
import { type NextRequest, NextResponse } from 'next/server'
import { getCorsHeaders, jsonWithCors } from '../cors'

export function oauthAuthorizationMiddleware(request: NextRequest, options: { basePath: string, metadata?: Metadata }): NextResponse {
  const { method } = request
  if (method === 'OPTIONS') {
    const headers = getCorsHeaders(request)
    return new NextResponse(null, {
      status: 200,
      headers,
    })
  }

  if (method === 'GET') {
    try {
      // Get the base URL from the request
      const protocol = request.headers.get('x-forwarded-proto') || 'http'
      const host = request.headers.get('host')
      const baseUrl = `${protocol}://${host}`
      const { basePath, metadata: metadataOptions } = options
      const {
        issuer,
        authorizationEndpoint,
        tokenEndpoint,
        userinfoEndpoint,
        scopesSupported,
        responseTypesSupported,
        registrationEndpoint,
      } = metadataOptions || {}

      // OAuth2 Authorization Server Metadata
      const metadata = {
        // Required fields according to RFC 8414
        issuer: issuer || baseUrl,
        authorization_endpoint:
          authorizationEndpoint || `${baseUrl}${basePath}/auth/authorize`,
        token_endpoint: tokenEndpoint || `${baseUrl}${basePath}/auth/token`,

        // Optional but commonly supported fields
        userinfo_endpoint:
          userinfoEndpoint || `${baseUrl}${basePath}/auth/userinfo`,
        jwks_uri: `${baseUrl}/.well-known/jwks.json`,

        // Supported grant types
        grant_types_supported: [
          'authorization_code',
          'client_credentials',
          'refresh_token',
        ],

        // Supported response types
        response_types_supported: responseTypesSupported || ['code'],

        // Supported scopes
        scopes_supported: scopesSupported || ['profile'],

        // Supported token authentication methods
        token_endpoint_auth_methods_supported: [
          'client_secret_basic',
          'client_secret_post',
          'client_secret_jwt',
          'private_key_jwt',
        ],

        // Supported subject types
        subject_types_supported: ['public'],

        // Supported ID token signing algorithms
        id_token_signing_alg_values_supported: ['RS256', 'ES256', 'HS256'],

        // Supported ID token encryption algorithms
        id_token_encryption_alg_values_supported: [
          'RSA1_5',
          'RSA-OAEP',
          'A128KW',
          'A256KW',
        ],

        // Supported ID token encryption encoding methods
        id_token_encryption_enc_values_supported: [
          'A128CBC-HS256',
          'A256CBC-HS512',
          'A128GCM',
          'A256GCM',
        ],

        // Supported user info signing algorithms
        userinfo_signing_alg_values_supported: [
          'RS256',
          'ES256',
          'HS256',
          'none',
        ],

        // Supported user info encryption algorithms
        userinfo_encryption_alg_values_supported: [
          'RSA1_5',
          'RSA-OAEP',
          'A128KW',
          'A256KW',
        ],

        // Supported user info encryption encoding methods
        userinfo_encryption_enc_values_supported: [
          'A128CBC-HS256',
          'A256CBC-HS512',
          'A128GCM',
          'A256GCM',
        ],

        // Supported request object signing algorithms
        request_object_signing_alg_values_supported: [
          'RS256',
          'ES256',
          'HS256',
          'none',
        ],

        // Supported request object encryption algorithms
        request_object_encryption_alg_values_supported: [
          'RSA1_5',
          'RSA-OAEP',
          'A128KW',
          'A256KW',
        ],

        // Supported request object encryption encoding methods
        request_object_encryption_enc_values_supported: [
          'A128CBC-HS256',
          'A256CBC-HS512',
          'A128GCM',
          'A256GCM',
        ],

        // Supported claim types
        claim_types_supported: ['normal', 'aggregated', 'distributed'],

        // Supported claims
        claims_supported: [
          'sub',
          'iss',
          'name',
          'given_name',
          'family_name',
          'email',
          'email_verified',
          'picture',
          'locale',
          'updated_at',
        ],

        // Service documentation
        service_documentation: `${baseUrl}/docs/oauth`,

        // Supported UI locales
        ui_locales_supported: ['en', 'zh-CN'],

        // Supported claim locales
        claims_locales_supported: ['en', 'zh-CN'],

        // Policy URI
        policy_uri: `${baseUrl}/docs/policy`,

        // Terms of service URI
        tos_uri: `${baseUrl}/docs/terms`,

        // Code challenge methods supported (PKCE)
        code_challenge_methods_supported: ['S256', 'plain'],

        // Introspection endpoint
        introspection_endpoint: `${baseUrl}${basePath}/auth/introspect`,

        // Revocation endpoint
        revocation_endpoint: `${baseUrl}${basePath}/auth/revoke`,

        // Device authorization endpoint
        device_authorization_endpoint: `${baseUrl}${basePath}/auth/device`,

        // Pushed authorization request endpoint
        pushed_authorization_request_endpoint: `${baseUrl}${basePath}/auth/par`,

        // End session endpoint
        end_session_endpoint: `${baseUrl}${basePath}/auth/logout`,

        // Backchannel logout endpoint
        backchannel_logout_endpoint: `${baseUrl}${basePath}/auth/backchannel-logout`,

        // Frontchannel logout endpoint
        frontchannel_logout_endpoint: `${baseUrl}${basePath}/auth/frontchannel-logout`,

        // Backchannel logout session required
        backchannel_logout_session_supported: true,

        // Frontchannel logout session required
        frontchannel_logout_session_supported: true,

        // Registration endpoint
        registration_endpoint:
          registrationEndpoint || `${baseUrl}${basePath}/auth/register`,

        // Token endpoint authentication methods
        token_endpoint_auth_signing_alg_values_supported: [
          'RS256',
          'ES256',
          'HS256',
        ],

        // Display values supported
        display_values_supported: ['page', 'popup', 'touch', 'wap'],

        // Claim parameter supported
        claims_parameter_supported: true,

        // Request parameter supported
        request_parameter_supported: true,

        // Request URI parameter supported
        request_uri_parameter_supported: true,

        // Require request URI registration
        require_request_uri_registration: false,

        // OP policy URI
        op_policy_uri: `${baseUrl}/docs/op-policy`,

        // OP terms of service URI
        op_tos_uri: `${baseUrl}/docs/op-terms`,
      }

      return jsonWithCors(request, metadata, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      })
    }
    catch (error) {
      console.error('Error generating OAuth2 metadata:', error)

      return NextResponse.json(
        {
          error: 'internal_server_error',
          error_description: 'Failed to generate OAuth2 metadata',
        },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
    }
  }
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 })
}
