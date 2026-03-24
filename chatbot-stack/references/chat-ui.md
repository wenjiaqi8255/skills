# Chat UI Patterns

## useChat Hook

### Basic Setup

```typescript
// app/chat/ChatClient.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type Message } from 'ai';
import { MessageResponse } from '@/components/ai-elements/message';

export function ChatInterface({ userId }: { userId: string }) {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat' }),
    []
  );

  const { messages, status, sendMessage } = useChat({
    id: userId,
    transport,
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id} className={m.role}>
          {m.role === 'user' ? (
            m.content
          ) : (
            // Use AI Elements for proper markdown rendering
            <MessageResponse message={m} />
          )}
        </div>
      ))}
      <input
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem('input') as HTMLInputElement;
          sendMessage(input.value);
          input.value = '';
        }}
      />
    </div>
  );
}
```

### Custom Transport with Headers

```typescript
// lib/chat-transport.ts
import { DefaultChatTransport, type Message } from 'ai';

export class AuthenticatedChatTransport extends DefaultChatTransport {
  constructor(api: string, private getToken: () => Promise<string>) {
    super({ api });
  }

  async fetchMessages() {
    const token = await this.getToken();
    const response = await fetch(this.api, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  }
}
```

## Streaming Response (API)

### SSE Response Pattern

```typescript
// app/api/chat/route.ts
export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  const response = await aiProvider.chat(messages, { stream: true });

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.getReader();
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // Parse and forward SSE data
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'x-vercel-ai-ui-message-stream': 'v1'
    }
  });
}
```

## Message Handling

### Extract Text from UIMessage

```typescript
import { isTextUIMart, type UIMessage } from 'ai';

function getMessageText(message: UIMessage): string {
  if (typeof message.content === 'string') {
    return message.content;
  }

  if (message.parts?.length) {
    return message.parts
      .filter(isTextUIMart)
      .map(part => part.text)
      .join('');
  }

  return '';
}
```

### Calculate AI Contribution

```typescript
function calculateContribution(messages: Message[]) {
  const aiWords = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  const userWords = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;

  if (aiWords + userWords === 0) return 0;
  return Math.round((aiWords / (aiWords + userWords)) * 100);
}
```

## i18n Support

### Pass Locale to API

```typescript
// Client
const { locale } = useMessages();

await sendMessage({
  content: text,
  metadata: { locale }
});

// Server
const { locale = 'en' } = await request.json();
const languageInstruction = locale === 'zh'
  ? '\n\nCRITICAL: Respond in Chinese.'
  : '\n\nCRITICAL: Respond in English.';
```
