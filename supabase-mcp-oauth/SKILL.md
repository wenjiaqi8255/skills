---
name: supabase-mcp-oauth
version: "1.2.0"
description: >
  This skill should be used when the user asks to "build MCP server on Supabase",
  "add MCP to my Supabase app", "MCP with OAuth", "Claude Desktop connect to Supabase",
  "MCP PKCE flow", "supabase mcp setup", "oauth for mcp tools", "user-scoped AI tools",
  "RLS for MCP", "Apple Sign In MCP", "MCP user identity mapping", or mentions building
  a remote MCP server with per-user authentication on Supabase Edge Functions.
---

# Supabase MCP Server with OAuth Authentication

Implement a fully authenticated MCP server on Supabase so AI agents access per-user data through OAuth 2.1 + PKCE.

## Architecture

```
MCP Client (Claude)  →  mcp-server  →  Service Layer (RLS)
         | 401
    OAuth Discovery Chain:
    oauth-protected-resource → oauth-discovery → oauth-registration
    oauth-authorize → Apple/Google Login → oauth-token
```

**Key insight**: The MCP SDK auto-discovers OAuth when the server returns `401 + WWW-Authenticate`. Configure no OAuth endpoints manually — the SDK handles discovery from the single header.

## Implementation Steps

### Step 1: Database Setup

See [references/db-schema.md](references/db-schema.md) for complete SQL.

Required tables:
- `oauth_registered_clients` — MCP client registrations (RFC 7591)
- `oauth_authorization_codes` — PKCE state + Supabase JWTs
- `user_id_aliases` — OAuth-to-app user identity mapping (see Pattern F below)
- Optional: `oauth_sessions`, `oauth_refresh_tokens`

Application tables must have RLS policies enforcing `auth.uid() = user_id`.

### Step 2: Create 6 Edge Functions

| # | Function | Purpose |
|---|----------|---------|
| 1 | `oauth-protected-resource` | RFC 9728 metadata — tells MCP clients where the auth server is |
| 2 | `oauth-discovery` | RFC 8414 AS metadata — lists endpoints |
| 3 | `oauth-registration` | RFC 7591 DCR — lets MCP clients self-register |
| 4 | `oauth-authorize` | Authorization endpoint — PKCE relay to Supabase Auth |
| 5 | `oauth-token` | Token exchange — validates PKCE, returns Supabase JWT |
| 6 | `mcp-server` | MCP JSON-RPC endpoint — the actual tools |

See [references/edge-functions.md](references/edge-functions.md) for each function's request/response format.

### Step 3: The MCP Server

Handles three JSON-RPC methods: `initialize`, `tools/list`, `tools/call`.

```
mcp-server/
  index.ts          # Entry point, 401 trigger, auth verification
  config.ts         # Environment variable accessors
  mcp/
    registry.ts     # Tool registration (name, schema, handler, scope)
    dispatcher.ts   # JSON-RPC routing
    errors.ts       # Error code helpers
  tools/
    listGoals.ts    # Individual tool implementations
  services/
    GoalService.ts  # Database queries (dual-mode: RLS or admin)
    UserIdentityService.ts  # OAuth-to-app user resolution
```

### Step 4: The Two-Phase PKCE Relay

See [references/oauth-flow.md](references/oauth-flow.md) for the full sequence diagram.

MCP SDK generates its own PKCE pair. Supabase Auth needs a SEPARATE PKCE pair. The server stores both in the DB and validates each at the right step.

### Step 5: Deploy and Test

```bash
npx supabase functions deploy oauth-protected-resource --project-ref <ref>
npx supabase functions deploy oauth-discovery --project-ref <ref>
npx supabase functions deploy oauth-registration --project-ref <ref>
npx supabase functions deploy oauth-authorize --project-ref <ref>
npx supabase functions deploy oauth-token --project-ref <ref>
npx supabase functions deploy mcp-server --project-ref <ref>
```

Connect via `.mcp.json`:
```json
{
  "mcpServers": {
    "your-app": {
      "type": "http",
      "url": "https://<project-ref>.supabase.co/functions/v1/mcp-server"
    }
  }
}
```

## Critical Implementation Patterns

All patterns include full code in [references/oauth-flow.md](references/oauth-flow.md). Below are summaries with the key insight for each.

### Pattern A: 401 Trigger with WWW-Authenticate

Return `401` with `WWW-Authenticate: Bearer resource_metadata="<prm-url>"`. The MCP SDK auto-discovers the entire OAuth flow from this header. See [references/oauth-flow.md](references/oauth-flow.md#pattern-a).

### Pattern B: Supabase Auth Code Exchange

Exchange Supabase auth code via PKCE at `/auth/v1/token?grant_type=pkce`. Server stores its own PKCE pair for the Supabase leg, separate from the client's PKCE. See [references/oauth-flow.md](references/oauth-flow.md#pattern-b).

### Pattern C: Service-Layer RLS via User JWT (MOST COMMON BUG)

Pass the user JWT in the `Authorization` header with the anon key. **Never** pass the JWT as the second argument to `createClient()` — that sets it as `apikey`, which silently breaks RLS. See [references/oauth-flow.md](references/oauth-flow.md#pattern-c).

### Pattern D: Token Verification

Create Supabase client with ANON KEY (not user JWT), then call `supabase.auth.getUser(token)`. Default to all scopes when `app_metadata.scopes` is empty. See [references/oauth-flow.md](references/oauth-flow.md#pattern-d).

### Pattern E: MCP tools/call Response Format

MCP spec requires tool results wrapped in `{ content: [{ type: "text", text: "..." }] }`. The **dispatcher** (not tool handlers) does this wrapping. Tool handlers return `{ success, data }` or `{ success, error }`. Doing it in both places causes double-wrapping. See [references/oauth-flow.md](references/oauth-flow.md#pattern-e).

### Pattern F: User Identity Mapping (Apple Sign In)

Apple "Sign in with Apple" generates a unique `sub` per app registration. iOS native app (bundle ID) and browser OAuth (Service ID) create two different `auth.users` for the same person. Use a `user_id_aliases` table to map OAuth users to canonical app users. See [references/oauth-flow.md](references/oauth-flow.md#pattern-f) and [references/db-schema.md](references/db-schema.md) for SQL.

### Pattern G: Dual-Mode DB Access

Service functions support two modes: **RLS mode** (default, token user == data owner) and **admin mode** (with `canonicalUserId`, token user != data owner). Admin mode uses service role key with explicit `user_id` filter to replace RLS. See [references/oauth-flow.md](references/oauth-flow.md#pattern-g) and [examples/tool-implementation.ts](examples/tool-implementation.ts).

### Pattern H: JWT Auto-Refresh in verifyUser

When a JWT expires between sessions, the MCP server can transparently refresh it using the stored refresh token. This prevents 401 errors that force re-authentication.

```typescript
// mcp-server/index.ts — verifyUser with auto-refresh fallback
async function verifyUser(token: string) {
  const supabase = createClient(SUPABASE_URL, ANON_KEY)
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (!error && user) {
    return { userId: user.id, scopes: /* ... */, resolvedToken: token }
  }
  // JWT expired — attempt auto-refresh
  return await refreshExpiredToken(token)
}

async function refreshExpiredToken(expiredToken: string) {
  // 1. Extract user_id from expired JWT payload (no signature validation needed)
  const payload = JSON.parse(atob(expiredToken.split('.')[1]))
  if (payload.exp * 1000 > Date.now()) return null  // Not actually expired
  const userId = payload.sub

  // 2. Look up stored refresh token for this user
  const supabase = createAdminClient()
  const { data } = await supabase.from('oauth_refresh_tokens')
    .select('token, scopes, client_id')
    .eq('user_id', userId).gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false }).limit(1).single()

  // 3. Refresh session via Supabase Auth (MUST use anon-key client)
  const anonClient = createClient(SUPABASE_URL, ANON_KEY)
  const { data: refreshData } = await anonClient.auth.refreshSession({
    refreshToken: data.token,
  })

  // 4. Rotate stored refresh token
  await supabase.from('oauth_refresh_tokens').delete().eq('token', data.token)
  await supabase.from('oauth_refresh_tokens').insert({
    token: refreshData.session.refresh_token,
    user_id: userId, client_id: data.client_id, scopes: data.scopes,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })

  return { userId, scopes: /* ... */, resolvedToken: refreshData.session.access_token }
}
```

**Why this matters**: MCP clients (Claude Code, Claude Desktop) cache tokens. When a JWT expires after 1 hour, the next tool call fails with 401. Auto-refresh makes this transparent — no re-authentication needed.

### Pattern I: Supabase GoTrue Single-Use Refresh Token Trap

Supabase GoTrue refresh tokens are **single-use**. After PKCE exchange in `oauth-authorize`, the refresh token from that exchange is already consumed. Calling `refreshSession` with it in `oauth-token` will **always fail**.

```
oauth-authorize:
  PKCE exchange → { access_token, refresh_token }  ← token is CONSUMED here
  Store both in DB

oauth-token (authorization_code grant):
  ❌ WRONG: refreshSession(stored_refresh_token)  ← always fails, token already consumed
  ✅ CORRECT: Return stored access_token directly  ← it's FRESH (seconds old)
```

**Rule**: In `oauth-token`'s `authorization_code` handler, return `codeData.session_access_token` directly. The token was obtained seconds ago in `oauth-authorize` — it is NOT stale. Only `oauth-token`'s `refresh_token` grant handler should call `refreshSession`.

### Pattern J: Client-Scoped Refresh Token Rotation

When rotating refresh tokens, delete by **both** `user_id` AND `client_id` — never by `user_id` alone. Deleting by `user_id` alone kills refresh tokens for ALL MCP clients connected to that user.

```typescript
// ❌ WRONG — kills tokens for ALL clients
await supabase.from('oauth_refresh_tokens').delete().eq('user_id', userId)

// ✅ CORRECT — scoped to specific client
await supabase.from('oauth_refresh_tokens').delete()
  .eq('user_id', userId).eq('client_id', clientId)
```

Also add cross-client validation in `refresh_token` grant:
```typescript
const { data: tokenData } = await supabase.from('oauth_refresh_tokens')
  .select('client_id, scopes').eq('token', body.refresh_token).single()

if (tokenData?.client_id && tokenData.client_id !== body.client_id) {
  return { error: { error: 'invalid_client', error_description: 'Token belongs to different client' } }
}
```

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "Error occurred during tool execution" | Tool result not in MCP content format | Ensure dispatcher wraps result in `{ content: [{ type: "text", text: ... }] }` |
| Tool returns empty data | User identity mismatch (OAuth user != app user) | Implement Pattern F + G (user_id_aliases + dual-mode) |
| "CSRF attack" | MCP `state` not stored/returned | Store `mcp_state` in DB, return in redirect |
| "refresh_token expected string, received null" | Token not stored in auth code row | Store `refresh_token` in `completeAuthorization` |
| "server still requires authentication" | `createClient(url, jwt)` bug | Use Pattern C: `createClient(url, anonKey)` + Authorization header |
| "Insufficient scope" | Empty `app_metadata.scopes` | Default to all scopes when empty |
| Zod validation on tool response | Service uses `createClient(url, jwt)` | Fix to Pattern C |
| 401 loop after deploy | MCP client cached stale auth | Clear MCP auth or retry connection |
| Double content wrapping | Both handler and dispatcher wrap content | Only wrap in dispatcher (Pattern E) |
| Admin queries return all users' data | Missing explicit `user_id` filter | Always add `.eq('user_id', canonicalUserId!)` in admin mode |
| 401 "token expired" on fresh auth | `refreshSession` consumed single-use token in oauth-token | Pattern I: Return stored JWT directly, don't call refreshSession |
| 401 after JWT expires (>1hr) | No auto-refresh mechanism | Pattern H: Add verifyUser auto-refresh fallback |
| Other MCP clients lose access after re-auth | Refresh token deleted by user_id, not client_id | Pattern J: Scope deletion to user_id + client_id |
| `oauth_authorization_codes` table empty | Rows are one-time-use, deleted after exchange | Use `oauth_refresh_tokens` / `oauth_sessions` for diagnosis |

## Resources

### Reference Files

- **[references/oauth-flow.md](references/oauth-flow.md)** — Full OAuth flow sequence diagram + all 7 implementation patterns with complete code
- **[references/db-schema.md](references/db-schema.md)** — SQL for all required tables (OAuth + user_id_aliases) + RLS policies
- **[references/edge-functions.md](references/edge-functions.md)** — Request/response format for each Edge Function

### Examples

- **[examples/tool-implementation.ts](examples/tool-implementation.ts)** — Complete MCP tool handler with dual-mode service layer (RLS + admin mode)
