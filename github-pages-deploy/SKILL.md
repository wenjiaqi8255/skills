---
name: github-pages-deploy
description: This skill should be used when the user asks to "deploy to GitHub Pages", "setup GitHub Pages CI/CD", "fix 404 on GitHub Pages", "deploy React app to GitHub Pages", or "convert legacy HTML to React app deployed on GitHub Pages". Provides Vite config, GitHub Actions workflow template, and common issue fixes for React/Vite/静态网站 deployments.
---

# GitHub Pages Deployment Guide

## Quick Start

### 1. Vite Config
```ts
// vite.config.ts
export default defineConfig({
  base: '/your-repo-name/',
  // ...
})
```

### 2. GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

### 3. Push and Enable Pages
Push to remote. In repository Settings > Pages:
- Source: Select "GitHub Actions"

## Common Issues

### 404 on Production
**Cause**: Legacy build type serving stale index.html

**Fix**:
```bash
# 1. Check current build type
gh api repos/{owner}/{repo}/pages --jq '.build_type'

# 2. Switch to workflow build
gh api -X PUT repos/{owner}/{repo}/pages -f build_type="workflow"

# 3. Trigger new deployment
gh workflow run deploy.yml --repo {owner}/{repo}
```

### Asset Paths Wrong
- Check `vite.config.ts` base path matches repo name
- Ensure index.html uses correct asset references after build

### CDN Caching
- GitHub Pages CDN has ~10 min TTL
- After fixes, wait or trigger new deployment
- Check with: `curl -sI https://owner.github.io/repo/`

## React Router on GitHub Pages

Use HashRouter for SPA routing:
```tsx
import { HashRouter } from 'react-router-dom'

<HashRouter>
  <App />
</HashRouter>
```

## Verification
```bash
# Check deployment status
gh run list --repo {owner}/{repo} --workflow "deploy.yml" --limit 3

# Check production index.html
curl -s https://{owner}.github.io/{repo}/ | grep "script.*src"
```