/**
 * TypeScript types for DelayTimer Workers
 */

export interface Bindings {
  // KV namespace for storing delay states
  DELAY_TIMER_KV: KVNamespace
  
  // Durable Object binding
  DELAY_TIMER_DURABLE: DurableObjectNamespace
  
  // Queue for delay processing
  DELAY_QUEUE: Queue<DelayTimerRequest>
  
  // Environment variables
  ENVIRONMENT: string
  MAX_DELAY_HOURS: string
  DEFAULT_DELAY_SECONDS: string
}

export interface DelayTimerRequest {
  // Bitrix24 authentication data
  auth: {
    access_token: string
    refresh_token: string
    expires_in: number
    member_id: string
    domain: string
    server_endpoint: string
    user_id: number
  }
  
  // Business process data
  workflow_id: string
  document_id: string[]
  document_type: string[]
  event_token: string
  
  // DelayTimer specific properties
  properties: {
    delaySeconds: number
    delayMinutes?: number
    delayHours?: number
  }
  
  // Additional metadata
  timestamp: string
  entityTypeId?: number
  entityId?: number
}

export interface DelayTimerResponse {
  delayStartTime: string
  delayEndTime: string
  totalDelaySeconds: number
  delayId: string
  status: 'scheduled' | 'processing' | 'completed' | 'failed'
}

export interface DelayState {
  id: string
  request: DelayTimerRequest
  scheduledTime: string
  executionTime: string
  status: 'pending' | 'completed' | 'failed'
  retryCount: number
  createdAt: string
  updatedAt: string
}

export interface ValidationError {
  field: string
  message: string
  value?: any
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error'
  data?: T
  message?: string
  errors?: ValidationError[]
  timestamp: string
}

// Cloudflare Workers specific types
export interface Env extends Bindings {}

export interface DelayTimerDurableObject {
  fetch(request: Request): Promise<Response>
  alarm(): Promise<void>
}