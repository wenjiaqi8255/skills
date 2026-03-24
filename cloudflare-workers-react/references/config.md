# 配置文件完整示例

## wrangler.toml

```toml
name = "my-project"
compatibility_date = "2024-01-01"  # 使用较稳定的日期
compatibility_flags = ["nodejs_compat"]

main = "_worker.ts"

[vars]
ENVIRONMENT = "production"

# Workers Assets - 静态文件托管
[assets]
directory = "./dist/client"
binding = "ASSETS"

[dev]
port = 8789
local_protocol = "http"

# 可选：KV 绑定
# [[kv_namespaces]]
# binding = "MY_KV"
# id = "your-kv-namespace-id"

# 可选：D1 数据库
# [[d1_databases]]
# binding = "MY_DB"
# database_name = "my-db"
# database_id = "your-d1-db-id"
```

## vite.config.ts

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig({
  plugins: [react(), cloudflare()],
  resolve: {
    alias: { '@': '/src' },
  },
  build: {
    // 确保输出到正确目录
    outDir: 'dist/client',
    rollupOptions: {
      input: 'index.html',
    },
  },
});
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"]
}
```

## 环境变量类型定义

在 `_worker.ts` 中定义完整的 Env 接口：

```ts
interface Env {
  // API 密钥
  SILICONFLOW_API_KEY: string;

  // 环境标识
  ENVIRONMENT: string;

  // Workers Assets
  ASSETS: { fetch: (req: Request) => Promise<Response> };

  // 可选：KV
  MY_KV: KVNamespace;

  // 可选：D1
  MY_DB: D1Database;
}
```
