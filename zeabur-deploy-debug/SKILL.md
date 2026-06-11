---
name: zeabur-deploy-debug
description: "This skill should be used when the user asks to 'debug Zeabur deployment', 'check Zeabur logs', 'fix deployment failed', 'create Dockerfile for Zeabur', or mentions error messages like 'MODULE_NOT_FOUND', 'npm update failed', 'Cannot find module promise-retry', 'process did not complete successfully'. Provides systematic debugging workflows, CLI commands, and Dockerfile templates for Node.js/Next.js projects."
---

# Zeabur Deploy Debug

Systematic approach to diagnose and fix Zeabur deployment failures.

## Debug Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  User reports "deployment failed"                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. List projects → Identify target project                 │
│     npx zeabur@latest project list -i=false --json          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. List services → Find the failing service                │
│     npx zeabur@latest service list --project-id <id> --json │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Get build logs → Find the specific error                │
│     npx zeabur@latest deployment log --service-id <id>      │
│       -t build -i=false 2>&1 | tail -100                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Match error pattern → Apply fix (see Common Errors)     │
└─────────────────────────────────────────────────────────────┘
```

## CLI Reference

> **Always use `npx zeabur@latest`** - never `zeabur` directly.

### Essential Commands

```bash
# List all projects
npx zeabur@latest project list -i=false --json

# List services in a project
npx zeabur@latest service list --project-id <project-id> --json

# Get build logs (most useful for debugging)
npx zeabur@latest deployment log --service-id <service-id> -t build -i=false 2>&1 | tail -100

# Get runtime logs (if build succeeded but app crashes)
npx zeabur@latest deployment log --service-id <service-id> -t runtime -i=false 2>&1 | tail -50

# Watch logs live
npx zeabur@latest deployment log --service-id <service-id> -w -i=false
```

## Common Errors & Fixes

### 1. npm update Failure (Node.js 22)

**Error:**
```
npm error Cannot find module 'promise-retry'
npm error code MODULE_NOT_FOUND
#7 ERROR: process "/bin/sh -c npm update -g npm" did not complete successfully
```

**Cause:** Zeabur's auto-generated Dockerfile runs `npm update -g npm` which fails on Node.js 22 images.

**Fix:** Create a custom `Dockerfile` in your project root:

```dockerfile
FROM node:22-alpine AS base

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (skip npm update!)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Expose port
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start
CMD ["npm", "start"]
```

### 2. Module Not Found (Runtime)

**Error:**
```
Error: Cannot find module 'xxx'
```

**Fix:** Add the missing dependency to `package.json`:
```bash
npm install <module-name>
```

### 3. Build Command Not Found

**Error:**
```
npm ERR! missing script: build
```

**Fix:** Ensure `package.json` has a build script:
```json
{
  "scripts": {
    "build": "next build"
  }
}
```

### 4. Port Mismatch

**Error:** App starts but is inaccessible

**Fix:** Ensure app listens on `PORT` environment variable:
```javascript
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0');
```

### 5. Environment Variables Missing

**Error:** App crashes with undefined config

**Fix:** Set environment variables in Zeabur:
1. Go to service → Variables tab
2. Add required variables
3. Redeploy

### 6. Memory Limit Exceeded

**Error:**
```
JavaScript heap out of memory
```

**Fix:** Increase Node.js memory:
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=4096"
```

## Next.js Specific Fixes

### For Next.js 16+ with Turbopack

Custom Dockerfile (simpler approach, no standalone):

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
```

### For Subdirectory Projects (e.g., `web/`)

If Next.js app is in a subdirectory:

1. Set `RootDirectory` to `/web` in Zeabur service settings, OR
2. Create Dockerfile in the subdirectory

## Debug Checklist

When deployment fails, check in order:

- [ ] **Build logs** - Find the exact error message
- [ ] **Dockerfile** - Is there a custom one? Does it avoid `npm update`?
- [ ] **package.json** - Are all scripts defined? All dependencies listed?
- [ ] **Node.js version** - Is it compatible with your dependencies?
- [ ] **Environment variables** - Are required vars set in Zeabur?
- [ ] **Port configuration** - Does app use `PORT` env var?
- [ ] **Root directory** - Is Zeabur looking at the correct folder?

## Quick Fixes by Framework

| Framework | Common Fix |
|-----------|-----------|
| Next.js | Custom Dockerfile, remove standalone output |
| React (Vite) | `npm run build` → serve with `preview` or nginx |
| Node.js Express | Ensure `0.0.0.0` binding, not `localhost` |
| Python | Check requirements.txt, proper CMD |
| Static sites | Check output directory setting |

## Resources

### references/
- `dockerfile-templates.md` - Ready-to-use Dockerfile templates for common frameworks

### scripts/
- `diagnose.py` - Automated diagnosis script (future)
