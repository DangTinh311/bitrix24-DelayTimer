/**
 * Bitrix24 DelayTimer - Cloudflare Workers Implementation
 * Serverless delay functionality for business process automation
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { DelayTimerHandler } from './handlers/DelayTimerHandler'
import { validateBitrix24Request } from './middleware/validation'
import { errorHandler } from './middleware/errorHandler'
import { DelayTimerDurable } from './durable-objects/DelayTimerDurable'
import type { Bindings, DelayTimerRequest } from './types'

// Export Durable Object class
export { DelayTimerDurable }

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Bitrix24 DelayTimer Workers',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development'
  })
})

// Bitrix24 activity handler endpoint
app.post('/api/activities/DelayTimer', validateBitrix24Request, async (c) => {
  try {
    const request = await c.req.json<DelayTimerRequest>()
    const handler = new DelayTimerHandler(c.env)
    
    const result = await handler.processDelayRequest(request)
    
    return c.json({
      status: 'success',
      data: result,
      processedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('DelayTimer processing error:', error)
    return c.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// Queue consumer for delayed execution
export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, env, ctx)
  },

  // Queue consumer handler
  async queue(batch: MessageBatch<DelayTimerRequest>, env: Bindings, ctx: ExecutionContext): Promise<void> {
    const handler = new DelayTimerHandler(env)
    
    for (const message of batch.messages) {
      try {
        await handler.executeDelayedAction(message.body)
        message.ack()
      } catch (error) {
        console.error('Queue processing error:', error)
        message.retry({ delaySeconds: 60 }) // Retry after 1 minute
      }
    }
  },

  // Scheduled handler for cleanup tasks
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext): Promise<void> {
    const handler = new DelayTimerHandler(env)
    await handler.cleanupExpiredDelays()
  }
}

// Error handling
app.onError(errorHandler)