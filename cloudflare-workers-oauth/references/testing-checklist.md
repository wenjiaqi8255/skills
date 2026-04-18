# OAuth Testing Checklist

Layer-by-layer verification for Auth.js + D1 + Hono on Cloudflare Workers.

## Layer 1: D1 Database

```bash
# Verify tables exist with correct names (must be singular)
npx wrangler d1 execute <db-name> --local --command \
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"

# Expected: user, account, session, verificationToken (singular names)
```

```bash
# After OAuth login, verify user was created
npx wrangler d1 execute <db-name> --local --command \
  "SELECT id, email, name FROM user"

# After OAuth login, verify account was linked
npx wrangler d1 execute <db-name> --local --command \
  "SELECT provider, providerAccountId, userId FROM account"
```

## Layer 2: Auth.js Endpoints

```bash
# CSRF token (should return { csrfToken: "..." })
curl http://localhost:3001/api/auth/csrf

# Session without cookies (should return null)
curl http://localhost:3001/api/auth/session

# Providers list
curl http://localhost:3001/api/auth/providers
```

## Layer 3: Protected Routes

```bash
# Without auth (should return 401)
curl http://localhost:3001/api/favorites

# Check response is proper JSON error
curl -s http://localhost:3001/api/favorites | python3 -m json.tool
```

## Layer 4: Frontend Auth Service

Test in browser console:

```javascript
// Check session (returns user object or null)
const res = await fetch('/api/auth/session');
const data = await res.json();
console.log('Session:', data);

// CSRF token works
const csrf = await fetch('/api/auth/csrf').then(r => r.json());
console.log('CSRF:', csrf.csrfToken?.length > 0);
```

## Layer 5: Full OAuth Flow

1. Open `http://localhost:3002` (frontend via Vite proxy)
2. Trigger sign-in (button or modal)
3. Browser redirects to Google OAuth consent screen
4. After consent, redirects back to `/api/auth/callback/google`
5. Then redirects to `/` (frontend)

**Verify after redirect:**
- Browser has `authjs.session-token` cookie (check DevTools → Application → Cookies)
- Frontend session check returns user data
- Protected API calls succeed (not 401)

## Layer 6: Session Persistence

1. Add data via a protected endpoint (e.g., POST /api/favorites/toggle)
2. Check D1: data row exists with correct userId
3. Sign out (clears cookie)
4. Sign in again
5. Load data via GET endpoint — should return the data added in step 1

```bash
# Verify user-owned data persisted after sign-out/sign-in cycle
# Replace <table> with your protected resource table
npx wrangler d1 execute <db-name> --local --command \
  "SELECT * FROM <table> WHERE userId = '<user-id-from-session>'"

# Verify user and account rows exist
npx wrangler d1 execute <db-name> --local --command \
  "SELECT u.id, u.email, a.provider FROM user u JOIN account a ON u.id = a.userId"
```

## Common Error Responses

| Response | Meaning |
|----------|---------|
| `null` from `/api/auth/session` | No session cookie or cookie expired |
| `{ error: "Configuration" }` at callback | D1 table missing or wrong names |
| `PKCE verification failed` | Often same root cause as Configuration (adapter fails) |
| `{ error: "Unauthorized" }` on protected route | Middleware can't read session (URL construction bug) |
| `Route GET / not found` after OAuth | Callback redirecting to Worker port instead of frontend |
| `Error: UntrustedHost` in Worker logs | Missing `trustHost: true` in auth config |
