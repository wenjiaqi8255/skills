# Cloudflare Pages CI/CD Reference

## wrangler.toml Format

```toml
name = "project-name"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"

[[r2_buckets]]
binding = "BUCKET_NAME"
bucket_name = "bucket-name"
```

### Environment Variables

```toml
[env.production]
ENV_VARS = { env_vars = { VITE_USE_MOCK = "false" }, include = ["*"] }

[env.preview]
ENV_VARS = { env_vars = { VITE_USE_MOCK = "true" }, include = ["*"] }
```

**Note**: r2_buckets uses `[[...]]` syntax (array), NOT `[...]` (object).

## Deploy Commands

```bash
# Deploy to preview (default)
npx wrangler pages deploy dist --project-name=project-name

# Deploy to production
npx wrangler pages deploy dist --project-name=project-name --branch production

# List deployments
npx wrangler pages deployment list --project-name=project-name
```

## GitHub Actions Workflow

See `deploy.yml` template in parent directory for complete workflow.

## Secrets Required

Add to GitHub → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token |
| `CLOUDFLARE_ACCOUNT_ID` | Found in Cloudflare Dashboard URL |

## Permissions

```yaml
permissions:
  contents: read
  pull-requests: write
  deployments: write
```
