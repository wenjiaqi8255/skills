---
name: cloudflare-workers-oauth
description: >-
  Google OAuth on Cloudflare Workers using Auth.js v5 + Drizzle ORM + D1 + Hono.
  This skill should be used when: adding Google OAuth to a Workers project; setting up Auth.js
  with D1/Drizzle; debugging OAuth issues (Configuration error, UntrustedHost, session null,
  cookies not set, PKCE verification failed); creating authenticated Hono middleware; implementing
  frontend sign-in/sign-out behind a Vite proxy. Triggers on: auth.js, drizzle-adapter, D1 auth
  tables, OAuth Workers, session cookie, requireAuth middleware.
---

# Cloudflare Workers OAuth (Auth.js + Drizzle + D1 + Hono)

## Architecture

```
Browser → Vite proxy (:3002 → :3001) → Cloudflare Worker (Hono)
  /api/auth/*      → Auth.js (OAuth flow, session, CSRF)
  /api/protected/* → requireAuth middleware → route handler
```

Auth.js uses JWT session strategy (encrypted cookie, not database sessions). The DrizzleAdapter stores `user` and `account` rows in D1 for identity lookup, but session state lives in the cookie.

## Implementation Checklist

Follow in order. Each step depends on the previous.

### 1. Install dependencies

```bash
npm install @auth/core @auth/drizzle-adapter drizzle-orm
```

### 2. Environment variables

Set via `wrangler secret put` (production) or `.dev.vars` (local):

```
AUTH_SECRET=<min-32-char-random-string>
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
ENVIRONMENT=development
```

Google Cloud Console: Create OAuth 2.0 Client ID, add redirect URI `http://localhost:3002/api/auth/callback/google` (dev), enable scopes `openid email profile`.

### 3. D1 schema (Drizzle)

Create exactly these 4 tables with **singular** names — DrizzleAdapter expects these defaults:

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp' }),
  image: text('image'),
});

export const accounts = sqliteTable('account', {
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

export const sessions = sqliteTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
});

export const verificationTokens = sqliteTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
});
```

Create tables in D1:
```bash
npx wrangler d1 execute <db-name> --local --command "<CREATE TABLE SQL>"
```

### 4. Auth config

```typescript
import { Auth } from '@auth/core';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Google from '@auth/core/providers/google';
import * as schema from './db/schema';

export function createAuthConfig(env: Env) {
  const db = createDb(env.DB);
  return {
    providers: [Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET })],
    adapter: DrizzleAdapter(db, {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    }),
    session: { strategy: 'jwt' as const, maxAge: 30 * 24 * 60 * 60 },
    callbacks: {
      async jwt({ token, user }: any) { if (user?.id) token.id = user.id; return token; },
      async session({ session, token }: any) { if (session.user && token.id) session.user.id = token.id; return session; },
    },
    secret: env.AUTH_SECRET,
    trustHost: true,
    basePath: '/api/auth',
  };
}

export async function handleAuth(request: Request, env: Env) {
  return Auth(request, createAuthConfig(env));
}
```

### 5. Auth route (Hono)

Delegate ALL `/api/auth/*` routes to Auth.js — no custom handlers:

```typescript
import { Hono } from 'hono';
import { handleAuth } from '../auth';

export const authRouter = new Hono<{ Bindings: Env }>();
authRouter.all('/*', async (c) => handleAuth(c.req.raw, c.env));
```

### 6. Auth middleware (Hono)

Build session request using `origin`, NOT the full request URL:

```typescript
export async function getAuthSession(request: Request, env: Env) {
  const url = new URL(request.url);
  const sessionReq = new Request(`${url.origin}/api/auth/session`, {
    headers: request.headers,
  });
  const res = await handleAuth(sessionReq, env);
  if (!res.ok) return null;
  const data = await res.json();
  return data?.user ?? null;
}

export async function requireAuth(c: Context, next: Next) {
  const user = await getAuthSession(c.req.raw, c.env);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  c.set('user', user);
  await next();
}
```

### 7. Frontend auth service

```typescript
export const authService = {
  async getSession() {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    return data?.user ?? null;
  },
  async signIn() {
    const { csrfToken } = await (await fetch('/api/auth/csrf')).json();
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/auth/signin/google';
    form.style.display = 'none';
    const csrf = Object.assign(document.createElement('input'), { type: 'hidden', name: 'csrfToken', value: csrfToken });
    const cb = Object.assign(document.createElement('input'), { type: 'hidden', name: 'callbackUrl', value: window.location.origin + '/' });
    form.append(csrf, cb);
    document.body.appendChild(form);
    form.submit();
  },
  async signOut() {
    const { csrfToken } = await (await fetch('/api/auth/csrf')).json();
    await fetch('/api/auth/signout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `csrfToken=${encodeURIComponent(csrfToken)}`,
    });
  },
};
```

### 8. Vite proxy config

Do NOT set `changeOrigin: true` — it rewrites the Host header and breaks Auth.js cookies:

```typescript
export default defineConfig({
  server: { proxy: { '/api': { target: 'http://localhost:3001' } } },
});
```

### 9. CORS config (Worker)

Must allow credentials for cookie-based sessions:

```typescript
app.use('*', cors({ origin: ['http://localhost:3002', 'https://<prod-domain>'], credentials: true }));
```

## Pitfalls

5 real production bugs from this stack, each with root cause analysis and fix. Read [references/pitfalls.md](references/pitfalls.md) before implementing — these are non-obvious interaction bugs between Auth.js, D1, Workers, and Vite proxy.

## Testing

Read [references/testing-checklist.md](references/testing-checklist.md) for curl commands and browser test steps to verify each layer independently.

## Prerequisites

The code above assumes:

- `Env` type with `DB: D1Database`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ENVIRONMENT` bindings (from `wrangler.toml`)
- `createDb(d1)` factory returning `drizzle(d1, { schema })` from `drizzle-orm/d1`
- Hono app with CORS middleware (`credentials: true` required for cookie-based auth)
- Vite dev server proxying `/api` to the Worker
