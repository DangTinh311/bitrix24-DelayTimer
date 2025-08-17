/**
 * DelayTimer Handler for Cloudflare Workers
 * Manages delay processing using Workers features
 */

import type { Bindings, DelayTimerRequest, DelayTimerResponse, DelayState } from '../types'
import { generateDelayId, calculateTotalDelaySeconds, validateDelayTime } from '../utils/helpers'

export class DelayTimerHandler {
  constructor(private env: Bindings) {}

  /**
   * Process incoming delay request from Bitrix24
   */
  async processDelayRequest(request: DelayTimerRequest): Promise<DelayTimerResponse> {
    // Validate delay time
    const totalDelaySeconds = calculateTotalDelaySeconds(request.properties)
    validateDelayTime(totalDelaySeconds, parseInt(this.env.MAX_DELAY_HOURS) * 3600)

    const delayId = generateDelayId()
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + totalDelaySeconds * 1000)

    // Create delay state
    const delayState: DelayState = {
      id: delayId,
      request,
      scheduledTime: startTime.toISOString(),
      executionTime: endTime.toISOString(),
      status: 'pending',
      retryCount: 0,
      createdAt: startTime.toISOString(),
      updatedAt: startTime.toISOString()
    }

    // Store delay state in KV
    await this.env.DELAY_TIMER_KV.put(
      `delay:${delayId}`,
      JSON.stringify(delayState),
      { expirationTtl: totalDelaySeconds + 3600 } // Extra hour for cleanup
    )

    // Schedule execution using Queue with delay
    await this.env.DELAY_QUEUE.send(request, {
      delaySeconds: totalDelaySeconds
    })

    console.log(`DelayTimer scheduled: ${delayId}, delay: ${totalDelaySeconds}s`)

    return {
      delayStartTime: startTime.toISOString(),
      delayEndTime: endTime.toISOString(),
      totalDelaySeconds,
      delayId,
      status: 'scheduled'
    }
  }

  /**
   * Execute delayed action after delay period
   */
  async executeDelayedAction(request: DelayTimerRequest): Promise<void> {
    console.log(`Executing delayed action for member: ${request.auth.member_id}`)

    try {
      // In a real implementation, you would:
      // 1. Call back to Bitrix24 to continue the business process
      // 2. Use the event_token to notify completion
      // 3. Update any relevant data
      
      // For now, we'll just log the completion
      const result = {
        delayStartTime: request.timestamp,
        delayEndTime: new Date().toISOString(),
        totalDelaySeconds: calculateTotalDelaySeconds(request.properties),
        status: 'completed'
      }

      // If this was a real Bitrix24 integration, you'd call:
      // await this.notifyBitrix24Completion(request, result)

      console.log(`DelayTimer completed successfully:`, result)
    } catch (error) {
      console.error(`DelayTimer execution failed:`, error)
      throw error
    }
  }

  /**
   * Cleanup expired delay states
   */
  async cleanupExpiredDelays(): Promise<void> {
    console.log('Running cleanup for expired delays...')
    
    // In a real implementation, you would:
    // 1. List all keys with prefix 'delay:'
    // 2. Check expiration times
    // 3. Remove expired entries
    // 4. Handle any failed delays
    
    // This is a simplified cleanup
    const now = Date.now()
    console.log(`Cleanup completed at: ${new Date(now).toISOString()}`)
  }

  /**
   * Get delay status by ID
   */
  async getDelayStatus(delayId: string): Promise<DelayState | null> {
    const stateJson = await this.env.DELAY_TIMER_KV.get(`delay:${delayId}`)
    if (!stateJson) {
      return null
    }
    
    return JSON.parse(stateJson) as DelayState
  }

  /**
   * Cancel a scheduled delay
   */
  async cancelDelay(delayId: string): Promise<boolean> {
    const state = await this.getDelayStatus(delayId)
    if (!state || state.status !== 'pending') {
      return false
    }

    // Update state to cancelled
    state.status = 'failed'
    state.updatedAt = new Date().toISOString()
    
    await this.env.DELAY_TIMER_KV.put(
      `delay:${delayId}`,
      JSON.stringify(state),
      { expirationTtl: 3600 } // Keep for 1 hour for audit
    )

    console.log(`DelayTimer cancelled: ${delayId}`)
    return true
  }

  /**
   * Private method to notify Bitrix24 of completion
   * (This would be implemented for real Bitrix24 integration)
   */
  private async notifyBitrix24Completion(
    request: DelayTimerRequest, 
    result: DelayTimerResponse
  ): Promise<void> {
    // Implementation would use Bitrix24 API to continue business process
    // Using the event_token and workflow_id to notify completion
    console.log('Would notify Bitrix24 completion here')
  }
}