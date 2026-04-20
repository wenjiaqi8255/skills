---
name: supabase-mcp-oauth
description: >
  This skill implements an MCP (Model Context Protocol) server with OAuth 2.1 user
  authentication on Supabase Edge Functions, enabling AI agents (Claude Desktop,
  Claude Code) to access per-user data via PKCE-based OAuth through Apple/Google
  Sign In. Covers the two-phase PKCE relay pattern, six Edge Functions, DCR
  registration, and RLS-enforced service layer. This skill should be used when
  the user asks to "add MCP server to my Supabase app", "MCP server with OAuth",
  "Claude Desktop connect to Supabase", "MCP PKCE flow", "supabase mcp setup",
  "oauth for mcp tools", "how to add MCP to my app", or mentions MCP server setup,
  OAuth PKCE, Supabase Auth integration with MCP, user-scoped AI tool access,
  Row Level Security for MCP tools, or troubleshooting MCP + OAuth issues.
---

# Supabase MCP Server with OAuth Authentication

Implement a fully authenticated MCP server on Supabase so AI agents access per-user data through OAuth 2.1 + PKCE.

## Architecture

The application needs **6 Supabase Edge Functions** and **2-3 database tables**:

```
MCP Client (Claude)  ->  mcp-server  ->  Service Layer (RLS)
         | 401
    OAuth Discovery Chain:
    oauth-protected-resource -> oauth-discovery -> oauth-registration
    oauth-authorize -> Apple/Google Login -> oauth-token
```

**Key insight**: The MCP SDK auto-discovers OAuth when the server returns `401 + WWW-Authenticate`. No manual configuration on the client side.

## Implementation Steps

### Step 1: Database Setup

Run migrations to create OAuth tables. See [references/db-schema.md](references/db-schema.md) for complete SQL.

Required tables:
- `oauth_registered_clients` — stores MCP client registrations (RFC 7591)
- `oauth_authorization_codes` — stores PKCE state + Supabase JWTs
- Optional: `oauth_sessions`, `oauth_refresh_tokens`

Application tables (`goals`, `tasks`, etc.) must have RLS policies enforcing `auth.uid() = user_id`.

### Step 2: Create 6 Edge Functions

Each function is a Deno TypeScript file deployed to `supabase/functions/<name>/index.ts`.

See [references/edge-functions.md](references/edge-functions.md) for each function's request/response format.

**Function overview**:

| # | Function | Purpose |
|---|----------|---------|
| 1 | `oauth-protected-resource` | RFC 9728 metadata — tells MCP clients where the auth server is |
| 2 | `oauth-discovery` | RFC 8414 AS metadata — lists endpoints |
| 3 | `oauth-registration` | RFC 7591 DCR — lets MCP clients self-register |
| 4 | `oauth-authorize` | Authorization endpoint — PKCE relay to Supabase Auth |
| 5 | `oauth-token` | Token exchange — validates PKCE, returns Supabase JWT |
| 6 | `mcp-server` | MCP JSON-RPC endpoint — the actual tools |

### Step 3: The MCP Server

The MCP server handles three JSON-RPC methods:
- `initialize` — returns server capabilities
- `tools/list` — returns available tools
- `tools/call` — executes a tool after auth + scope check

Structure:
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
    GoalService.ts  # Database queries with user JWT
```

For a complete working tool example, see [examples/tool-implementation.ts](examples/tool-implementation.ts).

### Step 4: The Two-Phase PKCE Relay

This is the trickiest part. See [references/oauth-flow.md](references/oauth-flow.md) for the full sequence diagram.

**Why two PKCE layers?**
- MCP SDK generates its own PKCE pair (client_verifier -> client_challenge)
- Supabase Auth needs a SEPARATE PKCE pair (server_verifier -> server_challenge)
- The server stores both in the DB and validates each at the right step

**Phase 1** (authorize): Client sends `code_challenge` -> server generates own PKCE -> stores both -> redirects to Supabase Auth with server's challenge.

**Phase 2** (callback): Supabase returns auth code -> server exchanges with server's verifier -> gets JWT -> generates final MCP auth code -> redirects to client with code + original `state`.

**Phase 3** (token exchange): Client sends `code_verifier` -> server validates SHA-256(verifier) matches stored `code_challenge` -> returns Supabase JWT.

### Step 5: Service Layer with RLS

CRITICAL: All service files must create Supabase clients correctly for RLS to work. See Pattern C in [references/oauth-flow.md](references/oauth-flow.md) for the correct `createUserClient` implementation.

**Common bug**: `createClient(url, userToken)` passes the JWT as the `apikey` parameter (2nd arg). This silently breaks RLS. The JWT must go in the `Authorization` header, not as the apikey.

### Step 6: Deploy and Test

```bash
# Deploy all functions
npx supabase functions deploy oauth-protected-resource --project-ref <ref>
npx supabase functions deploy oauth-discovery --project-ref <ref>
npx supabase functions deploy oauth-registration --project-ref <ref>
npx supabase functions deploy oauth-authorize --project-ref <ref>
npx supabase functions deploy oauth-token --project-ref <ref>
npx supabase functions deploy mcp-server --project-ref <ref>
```

Test with `.mcp.json` in the project root:
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

Claude Code auto-triggers OAuth on first connection.

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "CSRF attack" | MCP `state` not stored/returned | Store `mcp_state` in DB, return in redirect |
| "refresh_token expected string, received null" | Token not stored in auth code row | Store `refresh_token` in `completeAuthorization` |
| "server still requires authentication" | `createClient(url, jwt)` bug | Use `createClient(url, anonKey)` + `getUser(token)` |
| "Insufficient scope" | Empty `app_metadata.scopes` | Default to all scopes when empty |
| Zod validation on tool response | Service uses `createClient(url, jwt)` | Fix service-layer to use `createUserClient` |
| 401 loop after deploy | MCP client cached stale auth | Clear MCP auth or retry connection |

## Resources

- [references/oauth-flow.md](references/oauth-flow.md) — Complete OAuth flow sequence diagram + key patterns (including `createUserClient`)
- [references/db-schema.md](references/db-schema.md) — SQL for all required tables + RLS policies
- [references/edge-functions.md](references/edge-functions.md) — Request/response format for each Edge Function
- [examples/tool-implementation.ts](examples/tool-implementation.ts) — Working MCP tool + service example
