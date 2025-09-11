import createDebug from 'debug'

export const mcpIndexLogger = createDebug('mcp:index')
export const willKnowAuthorizationLogger = createDebug('mcp:will-know-authorization')
export const willKnowProtectedLogger = createDebug('mcp:will-know-protected')
export const apiAuthorizationLogger = createDebug('mcp:api-authorization')
export const apiTokenLogger = createDebug('mcp:api-token')
export const apiRegisterLogger = createDebug('mcp:api-register')
export const apiMcpLogger = createDebug('mcp:api-mcp')
