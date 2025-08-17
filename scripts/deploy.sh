#!/bin/bash

# Deployment script for Bitrix24 DelayTimer Workers
# Supports multiple environments

set -e

# Default environment
ENVIRONMENT=${1:-development}

echo "🚀 Deploying Bitrix24 DelayTimer to $ENVIRONMENT..."

# Validate environment
case $ENVIRONMENT in
    development|staging|production)
        echo "✅ Valid environment: $ENVIRONMENT"
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Valid options: development, staging, production"
        exit 1
        ;;
esac

# Check if wrangler is installed and user is logged in
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Install with: npm install -g wrangler"
    exit 1
fi

if ! wrangler whoami &> /dev/null; then
    echo "❌ Please login first: wrangler auth login"
    exit 1
fi

# Run tests before deployment
echo "🧪 Running tests..."
if npm test; then
    echo "✅ Tests passed"
else
    echo "❌ Tests failed. Deployment aborted."
    exit 1
fi

# Type checking
echo "🔍 Running type check..."
if npm run types; then
    echo "✅ Type check passed"
else
    echo "❌ Type check failed. Deployment aborted."
    exit 1
fi

# Build and deploy based on environment
case $ENVIRONMENT in
    development)
        echo "🔧 Deploying to development..."
        wrangler deploy
        ;;
    staging)
        echo "🎭 Deploying to staging..."
        wrangler deploy --env staging
        ;;
    production)
        echo "🏭 Deploying to production..."
        
        # Additional checks for production
        echo "⚠️  Deploying to PRODUCTION. This will affect live traffic."
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ Production deployment cancelled"
            exit 1
        fi
        
        wrangler deploy --env production
        ;;
esac

# Get deployment URL
WORKER_URL=$(wrangler show bitrix24-delay-timer$([ "$ENVIRONMENT" != "development" ] && echo "-$ENVIRONMENT") | grep -o 'https://[^[:space:]]*' | head -1)

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Deployment info:"
echo "Environment: $ENVIRONMENT"
echo "Worker URL: $WORKER_URL"
echo "Deployment time: $(date)"
echo ""
echo "🔗 Quick test:"
echo "curl $WORKER_URL"
echo ""
echo "📚 Useful commands:"
echo "- wrangler tail                    # View real-time logs"
echo "- wrangler analytics dashboard     # View analytics"
echo "- wrangler deployments list        # View deployment history"
echo ""

# Health check
echo "🏥 Running health check..."
if curl -s -f "$WORKER_URL" > /dev/null; then
    echo "✅ Health check passed"
else
    echo "⚠️  Health check failed - please verify deployment"
fi

# Environment-specific post-deployment actions
case $ENVIRONMENT in
    production)
        echo "📊 Production deployment notes:"
        echo "- Monitor logs: wrangler tail --env production"
        echo "- Check analytics in Cloudflare dashboard"
        echo "- Verify custom domain if configured"
        ;;
    staging)
        echo "🎭 Staging deployment notes:"
        echo "- Test thoroughly before promoting to production"
        echo "- Share staging URL with team for testing"
        ;;
esac

echo ""
echo "🚀 DelayTimer Workers deployment complete!"