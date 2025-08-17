# 🕰️ Bitrix24 DelayTimer - Cloudflare Workers

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR_USERNAME/bitrix24-DelayTimer)

Serverless implementation của DelayTimer cho Bitrix24 automation rules sử dụng Cloudflare Workers.

## 🚀 Live Demo

- **Production**: `https://bitrix24-delay-timer.your-subdomain.workers.dev`
- **API Endpoint**: `/api/activities/DelayTimer`
- **Health Check**: `/`

## ⭐ Features

- 🌍 **Global Edge Deployment** - 200+ locations worldwide
- ⚡ **Sub-5ms Cold Starts** - Lightning fast response
- 💰 **Cost Effective** - Pay only for usage ($0.50/M requests)
- 🛡️ **Built-in Security** - DDoS protection + rate limiting
- 📊 **Real-time Analytics** - Built-in monitoring
- 🔄 **Auto-scaling** - Infinite scale automatically

## 🌟 Tính Năng

- **Serverless Architecture**: Không cần quản lý server
- **Global CDN**: Deploy trên 200+ data centers của Cloudflare
- **Auto-scaling**: Tự động scale theo traffic
- **Cost Effective**: Chỉ trả tiền khi sử dụng
- **Edge Computing**: Xử lý gần user nhất
- **Built-in Security**: DDoS protection, rate limiting

## 🏗️ Architecture

```
Bitrix24 → Cloudflare Workers → Queue → Delayed Execution
                ↓
           KV Storage (State)
                ↓
        Durable Objects (Complex delays)
```

## 📦 Tech Stack

- **Runtime**: Cloudflare Workers (V8 engine)
- **Framework**: Hono (lightweight web framework)
- **Storage**: Cloudflare KV (key-value store)
- **Queue**: Cloudflare Queues (message queue)
- **Language**: TypeScript
- **Build Tool**: Wrangler CLI

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler auth login
```

### 2. Setup Project

```bash
# Install dependencies
cd cloudflare-workers/bitrix24-delayTimer
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Create Cloudflare Resources

```bash
# Create KV namespace
wrangler kv:namespace create DELAY_TIMER_KV
wrangler kv:namespace create DELAY_TIMER_KV --preview

# Create Queue
wrangler queues create delay-processing-queue

# Update wrangler.toml with the generated IDs
```

### 4. Deploy

```bash
# Deploy to development
wrangler deploy

# Deploy to production
wrangler deploy --env production
```

## ⚙️ Configuration

### wrangler.toml

```toml
name = "bitrix24-delay-timer"
main = "src/index.ts"
compatibility_date = "2024-11-27"
compatibility_flags = ["nodejs_compat"]

# KV Storage
[[kv_namespaces]]
binding = "DELAY_TIMER_KV"
id = "your_kv_namespace_id"

# Queue for delay processing
[[queues.producers]]
binding = "DELAY_QUEUE"
queue = "delay-processing-queue"

[[queues.consumers]]
queue = "delay-processing-queue"
max_batch_size = 10
max_batch_timeout = 30
```

### Environment Variables

```bash
# Cloudflare Account
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# Application Settings
MAX_DELAY_HOURS=24
DEFAULT_DELAY_SECONDS=30
ENVIRONMENT=production
```

## 🔧 Development

### Local Development

```bash
# Start development server
npm run dev

# Test endpoints
curl http://localhost:8787/

# Test DelayTimer endpoint
curl -X POST http://localhost:8787/api/activities/DelayTimer \\
  -H "Content-Type: application/json" \\
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

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run types
```

## 📊 Monitoring

### Wrangler Commands

```bash
# View logs in real-time
wrangler tail

# View deployment status
wrangler deployments list

# Monitor queue
wrangler queues consumer list delay-processing-queue
```

### Metrics

```bash
# View analytics
wrangler analytics dashboard

# Custom metrics in code
console.log(JSON.stringify({
  metric: 'delay_processed',
  value: totalDelaySeconds,
  timestamp: new Date().toISOString()
}))
```

## 🔌 API Endpoints

### Health Check
```
GET /
Response: { "status": "healthy", "version": "1.0.0" }
```

### DelayTimer Processing
```
POST /api/activities/DelayTimer
Content-Type: application/json

{
  "auth": {
    "member_id": "string",
    "access_token": "string",
    "domain": "string",
    "user_id": number
  },
  "properties": {
    "delaySeconds": number,
    "delayMinutes": number?,
    "delayHours": number?
  },
  "workflow_id": "string",
  "timestamp": "string"
}
```

## 🚀 Deployment

### Staging Deployment

```bash
# Deploy to staging
wrangler deploy --env staging

# Test staging endpoint
curl https://bitrix24-delay-timer-staging.your-subdomain.workers.dev/
```

### Production Deployment

```bash
# Deploy to production
wrangler deploy --env production

# Verify production
curl https://bitrix24-delay-timer-prod.your-subdomain.workers.dev/
```

### Custom Domain

```bash
# Add custom domain
wrangler route create "delay-timer.yourdomain.com/*" bitrix24-delay-timer-prod

# Or configure in Cloudflare dashboard:
# DNS: delay-timer.yourdomain.com → bitrix24-delay-timer-prod.workers.dev
```

## 🔒 Security

### Rate Limiting

```typescript
// Built-in rate limiting per IP
const rateLimitKey = `rate_limit:${clientIP}`
const currentCount = await env.DELAY_TIMER_KV.get(rateLimitKey)
if (currentCount && parseInt(currentCount) > 100) {
  return new Response('Rate limit exceeded', { status: 429 })
}
```

### Authentication

```typescript
// Validate Bitrix24 tokens
if (!request.auth.access_token || request.auth.access_token.length < 10) {
  throw new AuthenticationError('Invalid access token')
}
```

## 📈 Performance

### Cold Starts
- **~1-5ms**: Typical cold start time
- **0ms**: Warm requests (kept warm automatically)

### Limits
- **CPU Time**: 50-100ms per request (Free), 15min (Paid)
- **Memory**: 128MB (Free), 512MB (Paid)  
- **Request Size**: 100MB
- **KV Storage**: 1GB (Free), unlimited (Paid)

### Optimization

```typescript
// Use KV for caching
const cached = await env.DELAY_TIMER_KV.get(`cache:${key}`)
if (cached) return JSON.parse(cached)

// Batch KV operations
await env.DELAY_TIMER_KV.put(key, value, { expirationTtl: 3600 })
```

## 🐛 Troubleshooting

### Common Issues

1. **KV Namespace not found**
   ```bash
   wrangler kv:namespace list
   # Update IDs in wrangler.toml
   ```

2. **Queue not processing**
   ```bash
   wrangler queues consumer list delay-processing-queue
   wrangler tail --format=pretty
   ```

3. **CORS Issues**
   ```typescript
   // Add CORS headers
   app.use('*', cors({ origin: '*' }))
   ```

### Debug Mode

```bash
# Enable debug logging
wrangler dev --local --debug

# Check logs
wrangler tail --format=pretty
```

## 💰 Cost Estimation

### Free Tier (100k requests/day)
- **Requests**: Free up to 100k/day
- **KV Storage**: 1GB free
- **Queues**: 1M operations/month free

### Paid Tier
- **Requests**: $0.50 per million requests
- **CPU Time**: $12.50 per million GB-s
- **KV Storage**: $0.50 per GB/month
- **Queues**: $0.40 per million operations

## 🤝 Contributing

```bash
# Fork repository
# Create feature branch
git checkout -b feature/new-feature

# Make changes and test
npm test
npm run dev

# Commit and push
git commit -m "Add new feature"
git push origin feature/new-feature

# Create pull request
```

## 📞 Support

- **Documentation**: [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- **Community**: [Cloudflare Discord](https://discord.cloudflare.com)
- **Issues**: Create issue in this repository

---

**DelayTimer Workers** - Serverless delay functionality cho Bitrix24! 🚀