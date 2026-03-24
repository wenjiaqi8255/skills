---
name: chatbot-stack
description: |
  This skill should be used when the user asks to "build a chatbot", "create a chat API",
  "implement streaming AI responses", "add session management", "set up event logging",
  "configure database abstraction", or similar conversational AI architecture tasks.
  Provides decoupled patterns for AI providers, databases, sessions, and events.
---

# Chatbot Architecture - Quick Reference

## Core Concept: Scope Separation

Separate decoupled interfaces from coupled implementations:

| Category | Decoupled (Reusable) | Coupled (Swappable) |
|----------|---------------------|---------------------|
| AI Layer | Interface + Streaming pattern | Vercel AI Gateway, OpenAI, Anthropic |
| Database | Repository Interface | Supabase, Neon, Postgres |
| Session | Storage Interface | Cookies, LocalStorage, Redis |
| Events | Logger Interface | Supabase, Firebase, In-memory |

## Decoupled Patterns

### 1. Session Storage Interface

Define interface in `lib/session.ts`:

```typescript
export interface Session {
  userId: string;
  condition: string;
  [key: string]: unknown;
}

export interface SessionStorage {
  get(sessionId: string): Promise<Session | null>;
  set(sessionId: string, session: Session): Promise<void>;
  delete(sessionId: string): Promise<void>;
}
```

### 2. Event Logger Interface

Define interface in `lib/event-logger.ts`:

```typescript
export interface ChatEvent {
  userId: string;
  eventType: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface EventLogger {
  log(event: ChatEvent): Promise<void>;
  logBatch(events: ChatEvent[]): Promise<void>;
}
```

### 3. Database Repository Interface

Define interface in `lib/database.ts`:

```typescript
export interface DatabaseClient {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<ExecutionResult>;
}

export interface UserRepository {
  findById(userId: string): Promise<User | null>;
  create(user: CreateUserDTO): Promise<User>;
}
```

## Quick Decision Guide

| Need | Where to Modify |
|------|------------------|
| Switch AI provider | `implementations/ai/` (swap factory) |
| Switch database | `implementations/db/` (swap client) |
| Change session storage | `implementations/session/` |
| Add new event type | Extend interface in `lib/event-logger.ts` |

## Common Issues

1. **CSRF 403 in production**: Use transport with CSRF header
2. **Race condition on redirect**: Always await async before router.push()
3. **Locale not propagating**: Pass locale explicitly in request body
4. **Streaming breaks**: Ensure `x-vercel-ai-ui-message-stream: v1` header
5. **Session lost**: Check cookie attributes (httpOnly, secure, sameSite)

## Environment Setup

Use Vercel AI Gateway (recommended):

```env
# Run: vercel env pull to get VERCEL_OIDC_TOKEN
# No API keys needed - uses OIDC auth
```

## Additional Resources

### Reference Files

For detailed implementation patterns, consult:
- **`references/implementations.md`** - Supabase, Neon, AI Gateway implementations
- **`references/security.md`** - CSRF protection, auth patterns
- **`references/chat-ui.md`** - useChat hook, transport patterns

### Architecture Decision Tree

```
Need to build chatbot?
├── Use AI SDK (@ai-sdk/react)?
│   ├── Yes → See references/chat-ui.md
│   └── No → Use custom transport
├── Need streaming?
│   ├── Yes → Return ReadableStream with SSE headers
│   └── No → Return JSON response
├── Need session?
│   ├── Yes → Implement SessionStorage interface
│   └── No → Skip session layer
└── Need events?
    ├── Yes → Implement EventLogger interface
    └── No → Skip event logging
```
