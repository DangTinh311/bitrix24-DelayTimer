# 🚀 Deployment Guide for Bitrix24 DelayTimer

This guide will help you deploy the Bitrix24 DelayTimer to Cloudflare Workers.

## Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install with `npm install -g wrangler`
3. **GitHub Account**: For repository hosting

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository:
   - Repository name: `bitrix24-DelayTimer`
   - Description: `🕰️ Serverless DelayTimer for Bitrix24 automation rules using Cloudflare Workers`
   - Public repository
   - Do not initialize with README (we already have one)

2. Copy the repository URL (e.g., `https://github.com/YOUR_USERNAME/bitrix24-DelayTimer.git`)

## Step 2: Push Code to GitHub

```bash
# Navigate to the project directory
cd cloudflare-workers/bitrix24-delayTimer

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote set-url origin https://github.com/YOUR_USERNAME/bitrix24-DelayTimer.git

# Push to GitHub
git push -u origin master
```

## Step 3: Setup Cloudflare Workers

### 3.1 Install and Login to Wrangler

```bash
# Install Wrangler CLI globally
npm install -g wrangler

# Login to Cloudflare
wrangler auth login
```

### 3.2 Create Required Cloudflare Resources

```bash
# Create KV namespaces
wrangler kv:namespace create DELAY_TIMER_KV
wrangler kv:namespace create DELAY_TIMER_KV --preview

# Create Queue
wrangler queues create delay-processing-queue
```

### 3.3 Update wrangler.toml

Copy the IDs from the previous commands and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "DELAY_TIMER_KV"
id = "YOUR_KV_NAMESPACE_ID"
preview_id = "YOUR_PREVIEW_KV_NAMESPACE_ID"
```

## Step 4: Deploy to Cloudflare Workers

### 4.1 Deploy to Development

```bash
wrangler deploy
```

### 4.2 Deploy to Production

```bash
wrangler deploy --env production
```

## Step 5: Configure GitHub Secrets (for CI/CD)

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. `CLOUDFLARE_API_TOKEN`: Create at [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. `CLOUDFLARE_ACCOUNT_ID`: Found in Cloudflare dashboard sidebar

### Required Permissions for API Token:
- **Account**: Cloudflare Workers:Edit
- **Zone**: Zone:Read
- **Account Resources**: Include All accounts

## Step 6: Test Deployment

### 6.1 Health Check

```bash
curl https://bitrix24-delay-timer.YOUR_SUBDOMAIN.workers.dev/
```

Expected response:
```json
{
  "status": "healthy",
  "service": "DelayTimer",
  "version": "1.0.0",
  "timestamp": "2025-01-XX..."
}
```

### 6.2 Test DelayTimer Endpoint

```bash
curl -X POST https://bitrix24-delay-timer.YOUR_SUBDOMAIN.workers.dev/api/activities/DelayTimer \
  -H "Content-Type: application/json" \
  -d '{
    "auth": {
      "member_id": "test123",
      "access_token": "test_token",
      "domain": "test.bitrix24.com",
      "user_id": 1
    },
    "properties": {
      "delaySeconds": 30,
      "delayMinutes": 1
    },
    "workflow_id": "test_workflow",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }'
```

## Step 7: Configure Custom Domain (Optional)

### 7.1 Add Custom Domain in Cloudflare Dashboard

1. Go to Workers & Pages → Overview
2. Click on your worker → Settings → Triggers
3. Add Custom Domain: `delay-timer.yourdomain.com`

### 7.2 Update Bitrix24 Configuration

Update the HANDLER URL in `frontend/app/activity.config.ts`:

```typescript
HANDLER: 'https://delay-timer.yourdomain.com/api/activities/DelayTimer'
```

## Step 8: Monitor and Maintain

### 8.1 View Logs

```bash
# Real-time logs
wrangler tail

# View deployments
wrangler deployments list
```

### 8.2 Monitor Analytics

```bash
# Workers analytics
wrangler analytics dashboard
```

### 8.3 Queue Monitoring

```bash
# Monitor queue
wrangler queues consumer list delay-processing-queue
```

## Troubleshooting

### Common Issues

1. **KV Namespace not found**
   - Run `wrangler kv:namespace list` to get correct IDs
   - Update `wrangler.toml` with the correct IDs

2. **Queue not processing**
   - Check `wrangler tail` for errors
   - Verify queue creation: `wrangler queues list`

3. **API Token permissions**
   - Ensure token has Workers:Edit and Zone:Read permissions
   - Check account ID matches your Cloudflare account

4. **CORS errors**
   - Verify the CORS middleware is properly configured
   - Check browser network tab for exact error

### Getting Help

- **Cloudflare Docs**: [developers.cloudflare.com/workers](https://developers.cloudflare.com/workers/)
- **Wrangler CLI**: `wrangler --help`
- **Community**: [Cloudflare Discord](https://discord.cloudflare.com)

## Success! 🎉

Your Bitrix24 DelayTimer is now deployed and ready to use in automation rules!

### Next Steps

1. **Add to Bitrix24**: Configure the automation rule in your Bitrix24 portal
2. **Test in Production**: Create a test workflow with delay functionality
3. **Monitor Usage**: Keep an eye on Cloudflare Workers analytics
4. **Scale**: The service auto-scales based on usage

---

**Generated with Claude Code** 🤖