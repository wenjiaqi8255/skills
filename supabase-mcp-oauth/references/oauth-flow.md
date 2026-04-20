# OAuth 2.1 + PKCE Flow for MCP on Supabase

## Overview

MCP clients (Claude Desktop, Claude Code) discover OAuth via RFC 9728 Protected Resource Metadata. The server relays authentication to Supabase Auth via a **two-phase PKCE relay** pattern.

## Flow Sequence

```
MCP Client                      Your OAuth Edge Functions                Supabase Auth (GoTrue)
    |                                          |                                        |
    | 1. POST /mcp-server (no token)           |                                        |
    | <--- 401 + WWW-Authenticate              |                                        |
    |                                          |                                        |
    | 2. GET /.well-known/oauth-protected-resource                                     |
    | <--- { resource, authorization_servers } |                                        |
    |                                          |                                        |
    | 3. GET /oauth-discovery                  |                                        |
    | <--- AS metadata (RFC 8414)              |                                        |
    |                                          |                                        |
    | 4. POST /oauth-registration              |                                        |
    | <--- 201 { client_id }                   |                                        |
    |                                          |                                        |
    | 5. GET /oauth-authorize                  |                                        |
    |    ?client_id&redirect_uri               |                                        |
    |    &code_challenge (client's PKCE)       |                                        |
    |                                          |                                        |
    |                     validate client + redirect_uri                                |
    |                     generate server PKCE pair                                     |
    |                     store both PKCE sets in DB                                    |
    |                                          |                                        |
    |                     302 redirect --------|----> /auth/v1/authorize?provider=apple  |
    |                                          |        &code_challenge (server's PKCE)  |
    |                                          |        &redirect_to=callback_url        |
    |                                          |                                        |
    |                                          |    User logs in with Apple             |
    |                                          |                                        |
    |                                          | <--- 302 callback ?code=supabase_code  |
    |                                          |                                        |
    |                     exchange Supabase code with server's verifier                 |
    |                                          | ----> POST /auth/v1/token               |
    |                                          | <--- { access_token, refresh_token }    |
    |                                          |                                        |
    |                     generate final MCP auth code                                  |
    |                     store Supabase JWT + refresh token                            |
    |                                          |                                        |
    | <--- 302 redirect_uri ?code=mcp_code&state=original                              |
    |                                          |                                        |
    | 6. POST /oauth-token                     |                                        |
    |    grant_type=authorization_code         |                                        |
    |    code_verifier (client's PKCE)         |                                        |
    |                                          |                                        |
    |                     validate client PKCE against stored challenge                 |
    |                     return stored Supabase JWT as access_token                     |
    |                                          |                                        |
    | <--- 200 { access_token (Supabase JWT), refresh_token }                           |
    |                                          |                                        |
    | 7. POST /mcp-server (with Bearer token)  |                                        |
    | <--- 200 { tools/call result }           |                                        |
```

## Why Two-Phase PKCE?

The MCP SDK generates its own PKCE pair (verifier + challenge). But Supabase Auth is a separate OAuth provider that needs ITS OWN PKCE pair. The server cannot pass the client's verifier to Supabase Auth because:

1. The client's verifier is never exposed until the token exchange step
2. Supabase Auth needs a code_challenge at the `/auth/v1/authorize` step
3. The server must verify the client's PKCE during its own token exchange

Solution: The server generates a SECOND PKCE pair for the Supabase Auth leg, stores both sets in the DB, and validates each at the appropriate step.

## Key Implementation Patterns

### Pattern A: 401 Trigger with WWW-Authenticate

```typescript
// mcp-server/index.ts — This is what triggers the entire OAuth flow
function unauthorizedResponse(): Response {
  const resourceMetadataUrl = `${getSupabaseUrl()}/functions/v1/oauth-protected-resource`
  return new Response(
    JSON.stringify({ error: 'unauthorized' }),
    {
      status: 401,
      headers: {
        'WWW-Authenticate': `Bearer realm="your-app", resource_metadata="${resourceMetadataUrl}"`,
        'Content-Type': 'application/json',
      },
    }
  )
}
```

The MCP SDK sees 401 + `WWW-Authenticate` → fetches PRM → fetches AS metadata → registers client → authorizes → exchanges token → retries original request.

### Pattern B: Supabase Auth Code Exchange

```typescript
// oauth-authorize/index.ts — Exchange Supabase auth code via PKCE
async function exchangeSupabaseAuthCode(authCode: string, codeVerifier: string) {
  const tokenUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=pkce`
  const resp = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
    body: JSON.stringify({ auth_code: authCode, code_verifier: codeVerifier }),
  })
  return resp.json() // { access_token, refresh_token, user }
}
```

### Pattern C: Service-Layer RLS via User JWT

```typescript
// services/*.ts — CRITICAL: Correct Supabase client pattern for RLS
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

function createUserClient(userToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  })
}

// WRONG — passes JWT as apikey parameter (RLS fails silently):
// createClient(supabaseUrl, userToken)

// CORRECT — passes JWT as Authorization header with anon key:
// createUserClient(userToken)
```

### Pattern D: Token Verification in MCP Server

```typescript
// mcp-server/index.ts — verifyUser()
async function verifyUser(token: string) {
  // Create client with ANON KEY, not user JWT
  const supabase = createClient(SUPABASE_URL, ANON_KEY)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  // Default to all scopes if not in app_metadata
  const allScopes = ['read:goals', 'write:goals', 'read:tasks', 'write:tasks']
  const scopes = user.app_metadata?.scopes || allScopes

  return { userId: user.id, scopes, resolvedToken: token }
}
```

## Common Pitfalls

1. **createClient(url, jwt)** — The 2nd arg is `apikey`, NOT the user JWT. JWT goes in `Authorization` header.
2. **Missing `state` passthrough** — MCP SDK's `state` param must round-trip through Apple login back to the redirect URI.
3. **Missing `refresh_token`** — Must store Supabase refresh_token in auth code row for the token endpoint to return it.
4. **Missing PKCE validation** — The token endpoint MUST verify `code_verifier` against stored `code_challenge` using SHA-256.
5. **Stale cached auth** — After deploying fixes, MCP clients may cache old tokens. Retry or clear MCP auth.
