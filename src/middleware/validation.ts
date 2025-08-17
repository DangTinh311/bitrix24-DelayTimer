/**
 * Validation middleware for Bitrix24 requests
 */

import type { Context, Next } from 'hono'
import type { Bindings } from '../types'
import { validateBitrix24Request, createErrorResponse, getRealIP, getClientCountry } from '../utils/helpers'

/**
 * Validate incoming Bitrix24 requests
 */
export async function validateBitrix24Request(
  c: Context<{ Bindings: Bindings }>, 
  next: Next
): Promise<Response | void> {
  try {
    // Log request details
    console.log(`DelayTimer request from ${c.req.method} ${c.req.url}`)
    
    // Check request method
    if (c.req.method !== 'POST') {
      return createErrorResponse('Only POST method is allowed', 405)
    }
    
    // Check content type
    const contentType = c.req.header('Content-Type')
    if (!contentType || !contentType.includes('application/json')) {
      return createErrorResponse('Content-Type must be application/json', 400)
    }
    
    // Parse and validate request body
    let requestBody: any
    try {
      requestBody = await c.req.json()
    } catch (error) {
      return createErrorResponse('Invalid JSON in request body', 400)
    }
    
    // Validate Bitrix24 request structure
    try {
      validateBitrix24Request(requestBody)
    } catch (error) {
      return createErrorResponse(
        error instanceof Error ? error.message : 'Invalid request structure',
        400
      )
    }
    
    // Additional security checks
    if (c.env.ENVIRONMENT === 'production') {
      // Add production-specific validation
      if (!requestBody.auth.access_token || requestBody.auth.access_token.length < 10) {
        return createErrorResponse('Invalid access token', 401)
      }
      
      // Check if domain is valid Bitrix24 domain
      if (!requestBody.auth.domain || !requestBody.auth.domain.includes('bitrix24')) {
        return createErrorResponse('Invalid Bitrix24 domain', 401)
      }
    }
    
    // Rate limiting (basic implementation)
    const rateLimitKey = `rate_limit:${clientIP}`
    const currentCount = await c.env.DELAY_TIMER_KV.get(rateLimitKey)
    const requestCount = currentCount ? parseInt(currentCount) : 0
    
    if (requestCount > 100) { // 100 requests per minute
      return createErrorResponse('Rate limit exceeded', 429)
    }
    
    // Update rate limit counter
    await c.env.DELAY_TIMER_KV.put(rateLimitKey, (requestCount + 1).toString(), {
      expirationTtl: 60 // 1 minute
    })
    
    // Continue to next middleware
    await next()
  } catch (error) {
    console.error('Validation middleware error:', error)
    return createErrorResponse('Internal validation error', 500)
  }
}

/**
 * Validate delay parameters specifically
 */
export function validateDelayParameters(properties: any): void {
  const { delaySeconds, delayMinutes, delayHours } = properties
  
  // Check required field
  if (typeof delaySeconds === 'undefined') {
    throw new Error('delaySeconds is required')
  }
  
  // Check numeric values
  if (typeof delaySeconds !== 'number' || delaySeconds < 0) {
    throw new Error('delaySeconds must be a positive number')
  }
  
  if (delayMinutes !== undefined && (typeof delayMinutes !== 'number' || delayMinutes < 0)) {
    throw new Error('delayMinutes must be a positive number')
  }
  
  if (delayHours !== undefined && (typeof delayHours !== 'number' || delayHours < 0)) {
    throw new Error('delayHours must be a positive number')
  }
  
  // Check reasonable limits
  if (delaySeconds > 3600) { // Max 1 hour in seconds field
    throw new Error('delaySeconds cannot exceed 3600 (1 hour)')
  }
  
  if (delayMinutes && delayMinutes > 1440) { // Max 24 hours in minutes field
    throw new Error('delayMinutes cannot exceed 1440 (24 hours)')
  }
  
  if (delayHours && delayHours > 24) { // Max 24 hours in hours field
    throw new Error('delayHours cannot exceed 24')
  }
}

/**
 * CORS preflight handler
 */
export async function handleCorsOptions(c: Context): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    }
  })
}