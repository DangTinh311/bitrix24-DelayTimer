#!/bin/bash

# Setup script for Bitrix24 DelayTimer Workers
# This script creates necessary Cloudflare resources

set -e

echo "🚀 Setting up Bitrix24 DelayTimer Workers..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI is not installed. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "❌ Please login to Cloudflare first:"
    echo "wrangler auth login"
    exit 1
fi

echo "✅ Wrangler CLI is ready"

# Create KV namespace for production
echo "📦 Creating KV namespace for production..."
KV_ID=$(wrangler kv:namespace create DELAY_TIMER_KV --json | jq -r '.id')
echo "KV Namespace ID: $KV_ID"

# Create KV namespace for preview
echo "📦 Creating KV namespace for preview..."
KV_PREVIEW_ID=$(wrangler kv:namespace create DELAY_TIMER_KV --preview --json | jq -r '.id')
echo "KV Preview Namespace ID: $KV_PREVIEW_ID"

# Create Queue
echo "📦 Creating Queue for delay processing..."
wrangler queues create delay-processing-queue

# Update wrangler.toml with generated IDs
echo "📝 Updating wrangler.toml..."
sed -i.bak "s/your_kv_namespace_id/$KV_ID/" wrangler.toml
sed -i.bak "s/your_preview_kv_namespace_id/$KV_PREVIEW_ID/" wrangler.toml

echo "✅ Wrangler.toml updated with resource IDs"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your specific values"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy to development
echo "🚀 Deploying to development..."
wrangler deploy

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your specific values"
echo "2. Update wrangler.toml if needed"
echo "3. Test your deployment:"
echo "   curl https://bitrix24-delay-timer.your-subdomain.workers.dev/"
echo ""
echo "📚 Useful commands:"
echo "- npm run dev          # Start development server"
echo "- wrangler deploy      # Deploy to production"
echo "- wrangler tail        # View logs"
echo "- npm test             # Run tests"
echo ""
echo "🔗 Your Worker URL:"
wrangler show bitrix24-delay-timer | grep "https://"