# Auth.js + Cloudflare Workers Pitfalls

Real bugs encountered in production with Auth.js v5 + Drizzle + D1 + Hono on Cloudflare Workers, with Vite dev proxy.

## Quick Reference

| # | Pitfall | Symptom | Fix |
|---|---------|---------|-----|
| A | D1 table naming | Configuration error on callback | Singular names: `user`, `account`, `session`, `verificationToken` |
| B | Middleware URL construction | 401 on all protected routes | Use `new URL(request.url).origin` not string concat |
| C | Vite proxy changeOrigin | Cookies not set correctly | Remove `changeOrigin: true` |
| D | UntrustedHost error | Auth.js rejects localhost | Set `trustHost: true` |
| E | Redundant route handlers | Session/signout endpoints fail | Single catch-all `authRouter.all('/*')` |

## A. D1 Table Naming — Plural vs Singular

**Symptom**: `Configuration` error or `PKCE` error on OAuth callback. Auth.js fails silently when trying to read/write auth tables.

**Root cause**: DrizzleAdapter defaults to singular table names (`user`, `account`, `session`, `verificationToken`). If your Drizzle schema uses plural names (`users`, `accounts`), the adapter generates queries against wrong table names. D1 returns "no such table" which Auth.js wraps as a generic Configuration error.

**Fix**: Use singular table names in `sqliteTable()` first argument:

```typescript
// WRONG
export const users = sqliteTable('users', { ... });

// CORRECT
export const users = sqliteTable('user', { ... });
```

Also pass tables explicitly to the adapter:
```typescript
DrizzleAdapter(db, {
  usersTable: schema.users,
  accountsTable: schema.accounts,
  sessionsTable: schema.sessions,
  verificationTokensTable: schema.verificationTokens,
})
```

**Verification**: After creating schema, check D1:
```bash
npx wrangler d1 execute <db> --local --command "SELECT name FROM sqlite_master WHERE type='table'"
```

## B. Middleware URL Construction

**Symptom**: All protected API routes return 401 even when user is logged in. Session works at `/api/auth/session` but `requireAuth` middleware always returns null.

**Root cause**: The `getAuthSession()` function constructed the session check URL by appending `/api/auth/session` to `request.url`. For a request to `/api/favorites`, this produced:

```
http://localhost:3001/api/favorites/api/auth/session  ← WRONG
```

Auth.js uses the URL path for routing. It received an unknown path, returned an empty/error response, and the middleware returned null → 401.

**Additionally**: An earlier version first called `handleAuth(request, env)` with the original request (`/api/favorites`), which Auth.js rejected immediately. The function returned null before ever reaching the session check.

**Fix**: Construct the session URL from the origin only:

```typescript
// WRONG
const sessionReq = new Request(request.url + '/api/auth/session', { headers: request.headers });

// Also wrong (two calls, first one fails)
const response = await handleAuth(request, env);  // fails for non-auth paths
// ...
const sessionReq = new Request(request.url + '/api/auth/session', ...);

// CORRECT
const url = new URL(request.url);
const sessionReq = new Request(`${url.origin}/api/auth/session`, {
  method: 'GET',
  headers: request.headers,
});
const sessionResponse = await handleAuth(sessionReq, env);
```

## C. Vite Proxy changeOrigin

**Symptom**: OAuth callback succeeds, user/account rows created in D1, but session cookie not set or set with wrong domain. Frontend `getSession()` returns null.

**Root cause**: Setting `changeOrigin: true` in Vite proxy config rewrites the `Host` header from `localhost:3002` to `localhost:3001`. Auth.js uses the Host header to:
1. Validate the request origin
2. Set cookie domain
3. Construct callback URLs

The rewritten host causes Auth.js to set cookies for `localhost:3001` (the Worker) instead of `localhost:3002` (where the browser is). The browser ignores these cookies.

**Fix**: Remove `changeOrigin`:

```typescript
// WRONG
proxy: {
  '/api': { target: 'http://localhost:3001', changeOrigin: true },
}

// CORRECT
proxy: {
  '/api': { target: 'http://localhost:3001' },
}
```

## D. UntrustedHost Error

**Symptom**: `Error: UntrustedHost` in Worker logs. Auth.js rejects requests from localhost behind the Vite proxy.

**Root cause**: Auth.js validates the request origin against a trusted hosts list. By default, it does not trust proxy-forwarded requests. On Cloudflare Workers, the Host header comes from the proxy, not the browser directly.

**Fix**: Set `trustHost: true` in auth config:

```typescript
export function createAuthConfig(env: Env) {
  return {
    // ...
    trustHost: true,
  };
}
```

## E. Redundant Route Handlers

**Symptom**: Custom `/api/auth/session` and `/api/auth/signout` handlers return unexpected responses or 404.

**Root cause**: Auth.js internally handles all routes under the basePath. Adding custom Hono routes for these paths creates a conflict — Hono matches the custom route first and never reaches the Auth.js catch-all.

**Fix**: Use a single catch-all route that delegates everything to Auth.js:

```typescript
// WRONG
authRouter.get('/session', async (c) => { /* custom logic */ });
authRouter.post('/signout', async (c) => { /* custom logic */ });
authRouter.all('/*', async (c) => handleAuth(c.req.raw, c.env));

// CORRECT
authRouter.all('/*', async (c) => handleAuth(c.req.raw, c.env));
```
