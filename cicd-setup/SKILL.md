---
name: cicd-setup
description: "Set up GitHub Actions CI/CD pipelines and Cloudflare Pages deployment for new projects. Triggers: set up CI/CD, configure GitHub Actions, add deployment pipeline, or initialize a project requiring automated deployment."
---

# CI/CD Setup

## Overview

Set up production-ready CI/CD for web projects using GitHub Actions and Cloudflare Pages. Covers workflow creation, wrangler.toml configuration, environment variables, secrets management, and lockfile handling.

## Quick Start

1. Check project type and deployment target
2. Create GitHub Actions workflow in `.github/workflows/`
3. Configure wrangler.toml if using Cloudflare Pages
4. Add required GitHub Secrets
5. Verify branch names match (main vs master)

## Cloudflare Pages

See [cloudflare-pages.md](references/cloudflare-pages.md) for wrangler.toml format, deploy commands, secrets, and permissions.

### Standard Workflow Template

Copy from `assets/deploy.yml` — includes:
- Checkout + Node 20 setup with npm cache
- Dependency install (handles macOS lockfile incompatibility)
- Build with VITE_USE_MOCK per branch
- Deploy via cloudflare/pages-action@v1
- PR preview comment

### Common Issues

| Problem | Fix |
|---------|-----|
| npm ci fails on Linux | `rm -rf node_modules package-lock.json && npm install` |
| "Resource not accessible" | Add `permissions: deployments: write` to workflow |
| r2_buckets format error | Use `[[r2_buckets]]` array syntax, not `{...}` object |
| Wrong branch deployed | Ensure `on.push.branches` matches local branch name |
| Env vars not set | Use wrangler.toml `[env.production]` section |

### Environment Strategy

```yaml
# PRs → preview (VITE_USE_MOCK=true)
# main pushes → production (VITE_USE_MOCK=false)
VITE_USE_MOCK: ${{ github.event_name == 'pull_request' && 'true' || 'false' }}
```

## GitHub Secrets

Add in GitHub → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Found in Cloudflare Dashboard URL |

## Branch Naming

Always use `main` as the production branch. If local repo uses `master`:
```bash
git branch -m master main
```
