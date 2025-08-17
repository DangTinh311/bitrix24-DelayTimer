/**
 * Durable Object for managing complex delay states
 * Provides persistent storage and atomic operations
 */

import type { DelayTimerRequest, DelayState } from '../types'

export class DelayTimerDurable {
  private state: DurableObjectState
  private env: any

  constructor(state: DurableObjectState, env: any) {
    this.state = state
    this.env = env
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    try {
      switch (request.method) {
        case 'GET':
          if (path === '/status') {
            return this.getStatus()
          }
          break

        case 'POST':
          if (path === '/schedule') {
            return this.scheduleDelay(request)
          }
          break

        case 'DELETE':
          if (path === '/cancel') {
            return this.cancelDelay(request)
          }
          break

        default:
          return new Response('Method not allowed', { status: 405 })
      }

      return new Response('Not found', { status: 404 })
    } catch (error) {
      console.error('Durable Object error:', error)
      return new Response('Internal error', { status: 500 })
    }
  }

  /**
   * Get current delay status
   */
  private async getStatus(): Promise<Response> {
    const delays = await this.state.storage.list()
    const activeDelays = Array.from(delays.entries()).map(([key, value]) => ({
      id: key,
      ...value as DelayState
    }))

    return new Response(JSON.stringify({
      status: 'active',
      delayCount: activeDelays.length,
      delays: activeDelays
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Schedule a new delay
   */
  private async scheduleDelay(request: Request): Promise<Response> {
    const delayRequest: DelayTimerRequest = await request.json()
    const delayId = `delay_${Date.now()}_${Math.random().toString(36).substring(2)}`
    
    const totalDelaySeconds = this.calculateDelaySeconds(delayRequest.properties)
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + totalDelaySeconds * 1000)

    const delayState: DelayState = {
      id: delayId,
      request: delayRequest,
      scheduledTime: startTime.toISOString(),
      executionTime: endTime.toISOString(),
      status: 'pending',
      retryCount: 0,
      createdAt: startTime.toISOString(),
      updatedAt: startTime.toISOString()
    }

    // Store in Durable Object storage
    await this.state.storage.put(delayId, delayState)

    // Set alarm for execution
    const currentAlarm = await this.state.storage.getAlarm()
    if (!currentAlarm || endTime.getTime() < currentAlarm.getTime()) {
      await this.state.storage.setAlarm(endTime)
    }

    console.log(`DelayTimer scheduled in Durable Object: ${delayId}`)

    return new Response(JSON.stringify({
      delayId,
      delayStartTime: startTime.toISOString(),
      delayEndTime: endTime.toISOString(),
      totalDelaySeconds,
      status: 'scheduled'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Cancel a scheduled delay
   */
  private async cancelDelay(request: Request): Promise<Response> {
    const { delayId } = await request.json()
    
    const delayState = await this.state.storage.get(delayId) as DelayState
    if (!delayState) {
      return new Response(JSON.stringify({
        error: 'Delay not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (delayState.status !== 'pending') {
      return new Response(JSON.stringify({
        error: 'Delay cannot be cancelled (not pending)'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Update status to cancelled
    delayState.status = 'failed'
    delayState.updatedAt = new Date().toISOString()
    await this.state.storage.put(delayId, delayState)

    console.log(`DelayTimer cancelled: ${delayId}`)

    return new Response(JSON.stringify({
      delayId,
      status: 'cancelled'
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  /**
   * Alarm handler - called when scheduled delays should execute
   */
  async alarm(): Promise<void> {
    console.log('Durable Object alarm triggered')

    const now = new Date()
    const delays = await this.state.storage.list()
    
    for (const [delayId, delayState] of delays.entries()) {
      const state = delayState as DelayState
      
      if (state.status === 'pending' && new Date(state.executionTime) <= now) {
        try {
          await this.executeDelay(delayId, state)
        } catch (error) {
          console.error(`Failed to execute delay ${delayId}:`, error)
          
          // Update retry count
          state.retryCount = (state.retryCount || 0) + 1
          state.updatedAt = new Date().toISOString()
          
          if (state.retryCount >= 3) {
            state.status = 'failed'
          }
          
          await this.state.storage.put(delayId, state)
        }
      }
    }

    // Schedule next alarm if there are pending delays
    await this.scheduleNextAlarm()
  }

  /**
   * Execute a delay (callback to Bitrix24 or completion logic)
   */
  private async executeDelay(delayId: string, delayState: DelayState): Promise<void> {
    console.log(`Executing delay: ${delayId}`)

    // Mark as completed
    delayState.status = 'completed'
    delayState.updatedAt = new Date().toISOString()
    await this.state.storage.put(delayId, delayState)

    // Here you would typically:
    // 1. Call back to Bitrix24 to continue the business process
    // 2. Use the event_token to notify completion
    // 3. Send results back to the workflow

    console.log(`DelayTimer completed: ${delayId}`)
  }

  /**
   * Schedule the next alarm for pending delays
   */
  private async scheduleNextAlarm(): Promise<void> {
    const delays = await this.state.storage.list()
    let earliestTime: Date | null = null

    for (const [_, delayState] of delays.entries()) {
      const state = delayState as DelayState
      
      if (state.status === 'pending') {
        const executionTime = new Date(state.executionTime)
        if (!earliestTime || executionTime < earliestTime) {
          earliestTime = executionTime
        }
      }
    }

    if (earliestTime && earliestTime > new Date()) {
      await this.state.storage.setAlarm(earliestTime)
      console.log(`Next alarm scheduled for: ${earliestTime.toISOString()}`)
    }
  }

  /**
   * Calculate total delay seconds
   */
  private calculateDelaySeconds(properties: DelayTimerRequest['properties']): number {
    const seconds = Number(properties.delaySeconds) || 0
    const minutes = Number(properties.delayMinutes) || 0
    const hours = Number(properties.delayHours) || 0
    
    return seconds + (minutes * 60) + (hours * 3600)
  }
}