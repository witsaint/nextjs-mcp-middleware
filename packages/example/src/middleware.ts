import type { authCallParams, tokenCallParams } from 'nextjs-mcp-middleware';
import { nextMcpMiddleware } from 'nextjs-mcp-middleware';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

// Token verification function
const verifyToken = async (
  req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined;

  try {
    const tokenData = JSON.parse(bearerToken);
    const { access_token, expires_at } = tokenData || {};
    if (!access_token || expires_at < Date.now()) {
      return undefined;
    }

    return {
      token: access_token,
      scopes: ['profile'], // Add relevant scopes
      clientId: process.env.SSO_CLIENT_ID || '', // Add user/client identifier
      extra: {
        // Optional extra information
      },
    };
  } catch (error) {
    return undefined;
  }
};

const { middlewareGenerator, matcher } = nextMcpMiddleware({
  mcpHandlerParams: {
    mcpServer: (server) => {},
    mcpHandlerOptions: {},
    mcpHandlerConfig: {
      basePath: '/api',
      maxDuration: 60,
      verboseLogs: true,
    },
    verifyToken,
  },
  metadata: {
    clientId: process.env.SSO_CLIENT_ID || '',
    clientSecret: process.env.SSO_CLIENT_SECRET || '',
    scopesSupported: ['read'],
    responseTypesSupported: ['code'],
  },
  needAuth: true,
  authConfig: {
    async customAuthEndpoint(params: authCallParams) {
      const { responseType, clientId, redirectUri, scope, state } = params;
      const urlParams = new URLSearchParams();
      const tianyuanDirectUrl =
        'https://authzsso.tcshuke.com/oa/authorizationCallback';
      urlParams.set('client_id', 'JF_AUTHZ_CLIENT');
      urlParams.set('response_type', responseType);
      urlParams.set('scope', scope);
      urlParams.set('redirect_uri', decodeURI(tianyuanDirectUrl));
      urlParams.set('return_uri', decodeURI(redirectUri));
      urlParams.set('state', state);
      const ssoUrl = `http://tccommon.17usoft.com/oauth/authorize`;
      return `${ssoUrl}?${urlParams.toString()}`;
    },
    async customToken(params: tokenCallParams, _request) {
      const { code, grantType } = params;
      return {};
    },
  },
});

export const middleware = middlewareGenerator;

export const config = {
  runtime: 'nodejs',
  // matcher,
};
