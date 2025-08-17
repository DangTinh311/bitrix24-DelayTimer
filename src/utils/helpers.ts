/**
 * Utility functions for DelayTimer Workers
 */

import type { DelayTimerRequest } from '../types'

/**
 * Generate unique delay ID
 */
export function generateDelayId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2)
  return `delay_${timestamp}_${random}`
}

/**
 * Calculate total delay in seconds
 */
export function calculateTotalDelaySeconds(properties: DelayTimerRequest['properties']): number {
  const seconds = Number(properties.delaySeconds) || 0
  const minutes = Number(properties.delayMinutes) || 0
  const hours = Number(properties.delayHours) || 0
  
  return seconds + (minutes * 60) + (hours * 3600)
}

/**
 * Validate delay time constraints
 */
export function validateDelayTime(totalSeconds: number, maxSeconds: number): void {
  if (totalSeconds <= 0) {
    throw new Error('Delay time must be greater than 0 seconds')
  }
  
  if (totalSeconds > maxSeconds) {
    throw new Error(`Delay time cannot exceed ${maxSeconds} seconds (${Math.floor(maxSeconds / 3600)} hours)`)
  }
}

/**
 * Format delay duration for human reading
 */
export function formatDelayDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (seconds > 0) parts.push(`${seconds}s`)
  
  return parts.join(' ') || '0s'
}

/**
 * Validate Bitrix24 request structure
 */
export function validateBitrix24Request(request: any): request is DelayTimerRequest {
  if (!request) {
    throw new Error('Request body is required')
  }
  
  if (!request.auth || !request.auth.member_id) {
    throw new Error('Missing required auth.member_id')
  }
  
  if (!request.properties) {
    throw new Error('Missing required properties')
  }
  
  if (typeof request.properties.delaySeconds === 'undefined') {
    throw new Error('Missing required properties.delaySeconds')
  }
  
  return true
}

/**
 * Extract real IP from Cloudflare headers
 */
export function getRealIP(request: any): string {
  const headers = request.header ? request : request.headers
  return headers.get?.('CF-Connecting-IP') || 
         headers.get?.('X-Forwarded-For') || 
         request.header?.('CF-Connecting-IP') ||
         request.header?.('X-Forwarded-For') ||
         'unknown'
}

/**
 * Get client country from Cloudflare headers
 */
export function getClientCountry(request: any): string {
  const headers = request.header ? request : request.headers
  return headers.get?.('CF-IPCountry') ||
         request.header?.('CF-IPCountry') ||
         'unknown'
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  message: string, 
  status: number = 400, 
  details?: any
): Response {
  return new Response(JSON.stringify({
    status: 'error',
    message,
    details,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

/**
 * Log with structured format for Workers
 */
export function logStructured(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    data
  }
  
  console.log(JSON.stringify(logEntry))
}

/**
 * Sleep function using Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        break
      }
      
      const delayMs = baseDelayMs * Math.pow(2, attempt)
      await sleep(delayMs)
    }
  }
  
  throw lastError!
}