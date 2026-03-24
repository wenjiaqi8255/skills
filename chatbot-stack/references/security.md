# Security Patterns

## CSRF Protection

### API Route Validation

```typescript
// lib/csrf.ts
import { cookies } from 'next/headers';

export function generateCSRFToken(): string {
  return crypto.randomUUID();
}

export async function validateCSRFToken(
  token: string
): Promise<boolean> {
  const cookieStore = await cookies();
  const storedToken = cookieStore.get('csrf_token')?.value;
  return token === storedToken;
}
```

### API Route Usage

```typescript
// app/api/chat/route.ts
export async function POST(request: NextRequest) {
  const csrfToken = request.headers.get('x-csrf-token');
  const isValid = await validateCSRFToken(csrfToken || '');

  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
      status: 403
    });
  }

  // Continue with handler...
}
```

### Client Transport with CSRF

```typescript
// lib/chat-transport.ts
class CSRFChatTransport implements ChatTransport {
  constructor(private apiEndpoint: string) {}

  async sendMessage(message: Message): Promise<void> {
    const csrfResponse = await fetch('/api/csrf-token');
    const { token } = await csrfResponse.json();

    await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': token
      },
      body: JSON.stringify(message)
    });
  }
}
```

## Auth Guard Pattern

```typescript
// lib/auth.ts
import { cookies } from 'next/headers';

export function requireAuth(handler: AuthHandler) {
  return async (request: NextRequest) => {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie?.value) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401
      });
    }

    const session = JSON.parse(sessionCookie.value);

    if (!session.userId || !session.condition) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401
      });
    }

    return handler(request, session.userId, session);
  };
}

type AuthHandler = (
  request: NextRequest,
  userId: string,
  session: Session
) => Promise<Response>;

// Usage
export const POST = requireAuth(async (request, userId, session) => {
  // Handler has validated userId and session
});
```

## Rate Limiting

```typescript
// lib/rate-limit.ts
export interface RateLimiter {
  check(key: string, limit: number, window: number): Promise<boolean>;
}

export class InMemoryRateLimiter implements RateLimiter {
  private cache = new Map<string, { count: number; resetAt: number }>();

  async check(key: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (!entry || now > entry.resetAt) {
      this.cache.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (entry.count >= limit) {
      return false;
    }

    entry.count++;
    return true;
  }
}
```
