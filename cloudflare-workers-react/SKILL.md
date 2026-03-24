---
name: cloudflare-workers-react
description: This skill should be used when creating new Cloudflare Workers projects, configuring Vite + Cloudflare integration, setting up wrangler.toml with Workers Assets, implementing API routes with streaming SSE, or deploying to Cloudflare Workers.
---

> **官方文档**: https://developers.cloudflare.com/workers/
> **SDK**: https://github.com/cloudflare/workers-sdk

# Cloudflare Workers + React 开发

## 项目初始化

### 1. 创建项目结构

```bash
mkdir my-project && cd my-project
npm init -y
```

### 2. 安装依赖

```bash
# Core dependencies
npm install react react-dom

# Dev dependencies
npm install -D wrangler vite @cloudflare/vite-plugin @vitejs/plugin-react typescript @types/react @types/react-dom
```

### 3. 配置文件

创建 `wrangler.toml`、`vite.config.ts`、`tsconfig.json`。参考 [references/config.md](references/config.md) 获取完整配置示例。

### 4. 入口文件

创建 `_worker.ts` 作为 Workers 入口，创建 `src/root.tsx` 作为 React 入口。参考 [references/entry-files.md](references/entry-files.md) 获取完整代码。

### 5. package.json scripts

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "build": "tsc && vite build",
    "deploy": "npm run build && wrangler deploy"
  }
}
```

## 常见 Gotchas

### 1. 流式响应 (SSE)

使用 ReadableStream 实现 SSE：

```ts
// ✅ 正确：使用 ReadableStream
const stream = new ReadableStream({
  start(controller) {
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode('data: hello\n\n'));
    controller.close();
  },
});
return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream' },
});
```

### 2. 静态文件路径

Vite 构建输出到 `dist/client/`，Workers Assets 从这里读取：

```toml
[assets]
directory = "./dist/client"
```

### 3. 环境变量

使用 Cloudflare Secrets 存储敏感密钥：

```bash
# 部署时
npx wrangler secret put SILICONFLOW_API_KEY

# 代码中
env.SILICONFLOW_API_KEY
```

### 4. CORS

实现安全的 CORS 处理：

```ts
// 生产环境：验证 Origin 后再返回
const origin = request.headers.get('Origin');
const allowedOrigins = ['https://your-domain.com', 'https://www.your-domain.com'];

if (request.method === 'OPTIONS') {
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // 开发环境允许所有源
  if (origin && allowedOrigins.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  } else if (!origin || origin === 'null') {
    // 简单场景可临时使用
    corsHeaders['Access-Control-Allow-Origin'] = '*';
  }

  return new Response(null, { headers: corsHeaders });
}
```

## 部署

```bash
npm run build
npx wrangler deploy
```

部署后获得 `.workers.dev` 域名。

## 项目结构参考

```
my-project/
├── _worker.ts        # Workers 入口
├── wrangler.toml    # Workers 配置
├── vite.config.ts    # Vite 配置
├── tsconfig.json
├── package.json
├── dist/client/      # Vite 构建输出
│   ├── index.html
│   └── assets/
└── src/
    ├── root.tsx
    ├── App.tsx
    └── components/
```

## Additional Resources

### Reference Files

- **[references/config.md](references/config.md)** - 完整配置文件示例
- **[references/entry-files.md](references/entry-files.md)** - 入口文件完整代码
