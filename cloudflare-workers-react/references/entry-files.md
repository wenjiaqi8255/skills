# 入口文件完整示例

## _worker.ts (Workers 入口)

```ts
interface Env {
  // API 密钥
  SILICONFLOW_API_KEY: string;
  // 环境标识
  ENVIRONMENT: string;
  // Workers Assets
  ASSETS: { fetch: (req: Request) => Promise<Response> };
  // 可选：KV
  // MY_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // API 路由：/api/hello
    if (url.pathname === '/api/hello' && request.method === 'POST') {
      // 处理 API 请求
      return new Response(JSON.stringify({ message: 'Hello!' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // API 路由：/api/generate (流式响应)
    if (url.pathname === '/api/generate' && request.method === 'POST') {
      const { topic } = await request.json();

      const stream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();

          // 流式发送数据
          controller.enqueue(encoder.encode('data: {"chunk": "第一部分"}\n\n'));
          controller.enqueue(encoder.encode('data: {"chunk": "第二部分"}\n\n'));

          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // 返回静态文件
    return env.ASSETS.fetch(request);
  },
};
```

## src/root.tsx (React 入口)

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
```

## src/index.html (HTML 入口)

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/root.tsx"></script>
  </body>
</html>
```

## src/App.tsx (主组件示例)

```tsx
import { useState } from 'react';

export default function App() {
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    const response = await fetch('/api/hello', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    setMessage(data.message);
  };

  return (
    <div>
      <h1>My Cloudflare Workers App</h1>
      <button onClick={handleSubmit}>Click me</button>
      {message && <p>{message}</p>}
    </div>
  );
}
```
