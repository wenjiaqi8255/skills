# Database Schema for MCP OAuth

## Required Tables

### oauth_registered_clients

Stores dynamically registered MCP clients (RFC 7591).

```sql
CREATE TABLE IF NOT EXISTS public.oauth_registered_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT UNIQUE NOT NULL,
  client_secret TEXT,
  client_id_issued_at TIMESTAMPTZ DEFAULT now(),
  client_secret_expires_at TIMESTAMPTZ,
  client_name TEXT,
  client_uri TEXT,
  redirect_uris TEXT[] NOT NULL,
  scopes TEXT[] DEFAULT '{"read:goals","read:tasks"}',
  grant_types TEXT[] DEFAULT '{"authorization_code","refresh_token"}',
  response_types TEXT[] DEFAULT '{"code"}',
  token_endpoint_auth_method TEXT DEFAULT 'none',
  software_id TEXT,
  software_version TEXT,
  registration_access_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Allow anon to INSERT and SELECT (DCR requires unauthenticated registration)
ALTER TABLE public.oauth_registered_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon registration" ON public.oauth_registered_clients
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon select" ON public.oauth_registered_clients
  FOR SELECT TO anon USING (true);
```

### oauth_authorization_codes

Stores both the initial OAuth state (phase 1) and the final authorization code (phase 2).

```sql
CREATE TABLE IF NOT EXISTS public.oauth_authorization_codes (
  code TEXT PRIMARY KEY,
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000000',
  client_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  code_challenge TEXT,
  scopes TEXT DEFAULT '',
  mcp_state TEXT DEFAULT '',           -- MCP SDK's state param (CSRF)
  supabase_code_verifier TEXT DEFAULT '', -- Server's PKCE verifier for Supabase Auth
  session_access_token TEXT,            -- Supabase JWT (stored in phase 2)
  refresh_token TEXT,                   -- Supabase refresh token (stored in phase 2)
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.oauth_authorization_codes ENABLE ROW LEVEL SECURITY;
-- Only service_role accesses this table (Edge Functions use service role key)
CREATE POLICY "Service role full access" ON public.oauth_authorization_codes
  FOR ALL TO service_role USING (true) WITH CHECK (true);
```

### oauth_sessions (optional, for token tracking)

```sql
CREATE TABLE IF NOT EXISTS public.oauth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id TEXT NOT NULL,
  scopes TEXT DEFAULT '',
  issued_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT false
);
```

### oauth_refresh_tokens (optional, for refresh flow)

```sql
CREATE TABLE IF NOT EXISTS public.oauth_refresh_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id TEXT NOT NULL,
  scopes TEXT DEFAULT '',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Pre-seeding Claude Desktop Client

```sql
INSERT INTO public.oauth_registered_clients (
  client_id, client_name, redirect_uris, scopes,
  grant_types, response_types, token_endpoint_auth_method
) VALUES (
  'claude-desktop',
  'Claude Desktop',
  ARRAY['claude://mcp-callback', 'http://localhost:*', 'http://127.0.0.1:*'],
  ARRAY['read:goals','write:goals','read:tasks','write:tasks','read:progress','write:progress'],
  ARRAY['authorization_code','refresh_token'],
  ARRAY['code'],
  'none'
) ON CONFLICT (client_id) DO NOTHING;
```

### user_id_aliases (for OAuth-to-app user mapping)

Maps OAuth-authenticated users to their canonical (app) user identity.
Required when the same person has different auth.users records due to
provider-specific behavior (e.g., Apple Sign In generates different `sub`
values for iOS native app vs web Service ID).

```sql
CREATE TABLE IF NOT EXISTS public.user_id_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oauth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    canonical_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(oauth_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_id_aliases_oauth ON user_id_aliases(oauth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_id_aliases_canonical ON user_id_aliases(canonical_user_id);

ALTER TABLE user_id_aliases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role can manage user_id_aliases"
      ON user_id_aliases FOR ALL
      TO service_role
      USING (public.is_service_role());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

GRANT ALL ON user_id_aliases TO service_role;
```

## Application Tables (user's existing data)

The MCP tools query the user's application tables. These must have RLS policies enforcing `auth.uid() = user_id`:

```sql
-- Example RLS policy pattern (must exist on ALL application tables)
CREATE POLICY "Users see own data" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own data" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Repeat for tasks, progress_notes, etc.
```
