# 🚀 Quick Deploy Guide

## Prerequisites

1. **Cloudflare Account**: Sign up at [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Wrangler CLI**: Already installed ✅

## Step 1: Authentication

```bash
# If you don't have API token, login via browser
wrangler login

# OR set API token if you have one
export CLOUDFLARE_API_TOKEN=your_api_token_here
```

## Step 2: Create Required Resources

```bash
# Create KV namespace
wrangler kv:namespace create DELAY_TIMER_KV
# Example output: { binding = "DELAY_TIMER_KV", id = "abc123...", preview_id = "def456..." }

# Create preview KV namespace
wrangler kv:namespace create DELAY_TIMER_KV --preview

# Create Queue
wrangler queues create delay-processing-queue
```

## Step 3: Update wrangler.toml

Replace the placeholder IDs in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "DELAY_TIMER_KV"
id = "your_actual_kv_id_here"           # From step 2
preview_id = "your_actual_preview_id_here"  # From step 2
```

## Step 4: Deploy

```bash
# Deploy to development
wrangler deploy

# Deploy to production
wrangler deploy --env production
```

## Step 5: Test

```bash
# Get your worker URL from deploy output, then test:
curl https://bitrix24-delay-timer-prod.your-subdomain.workers.dev/

# Test install endpoint
curl https://bitrix24-delay-timer-prod.your-subdomain.workers.dev/install
```

## 🎯 Current Bitrix24 Application Settings

- **Client ID**: `local.68a194d2b8d3c5.76602508`
- **Client Secret**: `X5272Aj5C9NrKfWoz4kZ6s61YWiCrdz2Dd1KCCDVjuXOiHTl3B`
- **Handler Path**: `/api/activities/DelayTimer`
- **Install Path**: `/install`

## 📋 After Deployment

Update your Bitrix24 Local Application with the actual URLs:

- **Handler Path**: `https://your-worker.workers.dev/api/activities/DelayTimer`
- **Initial Installation Path**: `https://your-worker.workers.dev/install`

## 🐛 Troubleshooting

- **Authentication Error**: Run `wrangler login` or set valid `CLOUDFLARE_API_TOKEN`
- **KV Namespace Error**: Make sure to create KV namespaces and update IDs in wrangler.toml
- **Queue Error**: Run `wrangler queues create delay-processing-queue`

---

**Ready to deploy!** 🚀