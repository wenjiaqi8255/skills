# Edge Function Reference

Complete reference for all Supabase Edge Functions in the MCP + OAuth stack.

## Function List

| Function | Purpose | RFC |
|----------|---------|-----|
| `mcp-server` | MCP JSON-RPC endpoint | MCP spec |
| `oauth-protected-resource` | Protected Resource Metadata | RFC 9728 |
| `oauth-discovery` | Authorization Server Metadata | RFC 8414 |
| `oauth-registration` | Dynamic Client Registration | RFC 7591 |
| `oauth-authorize` | Authorization endpoint (PKCE relay) | RFC 6749 |
| `oauth-token` | Token exchange + refresh | RFC 6749 |

## mcp-server

**Route**: `POST /functions/v1/mcp-server`

**Responsibilities**:
1. Return 401 + WWW-Authenticate for unauthenticated requests (triggers OAuth)
2. Serve `/.well-known/oauth-protected-resource` on GET
3. Validate Bearer token via `supabase.auth.getUser(token)`
4. Dispatch JSON-RPC methods: `initialize`, `tools/list`, `tools/call`
5. Rate limiting before tool execution

**Environment variables needed**:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MCP_DEV_TOKEN` (optional, for dev mode)
- `MCP_DEV_USER_ID` (optional, for dev mode)

**Critical pattern — verifyUser**:
```typescript
async function verifyUser(token: string) {
  const supabase = createClient(SUPABASE_URL, ANON_KEY)  // NOT user JWT
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return { userId: user.id, scopes: /* default to all */, resolvedToken: token }
}
```

## oauth-protected-resource

**Route**: `GET /functions/v1/oauth-protected-resource`

**Response**:
```json
{
  "resource": "https://<project>.supabase.co/functions/v1/mcp-server",
  "authorization_servers": ["https://<project>.supabase.co/functions/v1/oauth-discovery"],
  "scopes_supported": ["read:goals", "write:goals", ...],
  "bearer_methods_supported": ["header"]
}
```

This is the first endpoint the MCP SDK calls after receiving a 401. It tells the client where to find the authorization server.

## oauth-discovery

**Route**: `GET /functions/v1/oauth-discovery`

**Response** (RFC 8414 Authorization Server Metadata):
```json
{
  "issuer": "https://<project>.supabase.co/functions/v1/oauth-discovery",
  "authorization_endpoint": "https://<project>.supabase.co/functions/v1/oauth-authorize",
  "token_endpoint": "https://<project>.supabase.co/functions/v1/oauth-token",
  "registration_endpoint": "https://<project>.supabase.co/functions/v1/oauth-registration",
  "response_types_supported": ["code"],
  "code_challenge_methods_supported": ["S256"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "token_endpoint_auth_methods_supported": ["none"]
}
```

## oauth-registration

**Route**: `POST /functions/v1/oauth-registration`

**Request** (RFC 7591):
```json
{
  "client_name": "Claude Desktop",
  "redirect_uris": ["claude://mcp-callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
```

**Response** (201):
```json
{
  "client_id": "mcp_a1b2c3d4",
  "client_id_issued_at": 1234567890,
  "registration_access_token": "rat_..."
}
```

Validates redirect URIs: HTTPS required unless localhost/127.0.0.1 or custom scheme (e.g., `claude://`).

## oauth-authorize

**Route**: `GET /functions/v1/oauth-authorize`

**Two-phase handler**:

### Phase 1: Initial authorize request
- Validates `client_id` and `redirect_uri` against DB
- Generates server's own PKCE pair for Supabase Auth
- Stores: client's `code_challenge`, server's `code_verifier`, `mcp_state`
- Redirects to Supabase Auth with Apple provider + server's PKCE

### Phase 2: Supabase Auth callback (when `?callback=true`)
- Restores OAuth state from DB using `state_id`
- Exchanges Supabase auth code using server's `code_verifier`
- Gets Supabase JWT + refresh token
- Generates final MCP auth code, stores JWT + refresh token
- Redirects to MCP SDK's `redirect_uri` with final code + original `state`

## oauth-token

**Route**: `POST /functions/v1/oauth-token`

**Supports two grant types**:

### authorization_code
- Validates `client_id` against DB
- Looks up authorization code in DB
- Verifies PKCE: SHA-256(`code_verifier`) must match stored `code_challenge`
- Verifies `redirect_uri` matches
- Returns stored Supabase JWT as `access_token`

### refresh_token
- Looks up stored refresh token
- Calls Supabase Auth to refresh the session
- Returns new tokens

**Response**:
```json
{
  "access_token": "<supabase-jwt>",
  "refresh_token": "<refresh-token>",
  "token_type": "Bearer",
  "expires_in": 3600
}
```
