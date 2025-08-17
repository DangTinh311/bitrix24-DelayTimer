/**
 * Error handling middleware for DelayTimer Workers
 */

import type { ErrorHandler } from 'hono'
import type { Bindings } from '../types'

/**
 * Global error handler for the application
 */
export const errorHandler: ErrorHandler<{ Bindings: Bindings }> = (err, c) => {
  console.error('Unhandled error:', err)
  
  // Determine error status and message
  let status = 500
  let message = 'Internal Server Error'
  let details: any = undefined
  
  if (err instanceof Error) {
    message = err.message
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      status = 400
    } else if (err.name === 'AuthenticationError') {
      status = 401
    } else if (err.name === 'AuthorizationError') {
      status = 403
    } else if (err.name === 'NotFoundError') {
      status = 404
    } else if (err.name === 'RateLimitError') {
      status = 429
    }
    
    // Include stack trace in development
    if (c.env.ENVIRONMENT === 'development') {
      details = {
        name: err.name,
        stack: err.stack,
        cause: err.cause
      }
    }
  }
  
  // Log error with context
  const errorContext = {
    timestamp: new Date().toISOString(),
    method: c.req.method,
    url: c.req.url,
    userAgent: c.req.header('User-Agent'),
    cfRay: c.req.header('CF-Ray'),
    cfConnectingIP: c.req.header('CF-Connecting-IP'),
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  }
  
  console.error('Error context:', JSON.stringify(errorContext))
  
  // Return error response
  return c.json({
    status: 'error',
    message,
    details,
    timestamp: new Date().toISOString(),
    requestId: c.req.header('CF-Ray') || 'unknown'
  }, status)
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded') {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class DelayTimerError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'DelayTimerError'
  }
}

/**
 * Async error wrapper for handlers
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R> => {
    return fn(...args).catch((error) => {
      console.error('Async handler error:', error)
      throw error
    })
  }
}

/**
 * Error reporter for external monitoring
 */
export async function reportError(
  error: Error,
  context: Record<string, any>,
  env: Bindings
): Promise<void> {
  try {
    // In production, you might want to send errors to external monitoring
    // like Sentry, DataDog, or Cloudflare Analytics
    
    const errorReport = {
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context
    }
    
    // Store error in KV for later analysis
    const errorKey = `error:${Date.now()}:${Math.random().toString(36).substring(2)}`
    await env.DELAY_TIMER_KV.put(errorKey, JSON.stringify(errorReport), {
      expirationTtl: 86400 * 7 // Keep for 7 days
    })
    
    console.log('Error reported:', errorKey)
  } catch (reportingError) {
    console.error('Failed to report error:', reportingError)
  }
}