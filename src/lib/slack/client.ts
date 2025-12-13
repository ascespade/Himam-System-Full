/**
 * Slack API Client
 * Enhanced Slack client with authentication and message sending
 */

import { getSettings } from '../config'

export interface SlackMessage {
  text: string
  channel?: string
  blocks?: unknown[]
  attachments?: unknown[]
}

export class SlackClient {
  private token: string | null = null
  private defaultChannel: string | null = null

  /**
   * Initialize Slack client
   */
  async initialize(): Promise<void> {
    try {
      const settings = await getSettings()
      this.token = settings.SLACK_BOT_TOKEN || process.env.SLACK_BOT_TOKEN || null
      this.defaultChannel = settings.SLACK_DEFAULT_CHANNEL || process.env.SLACK_DEFAULT_CHANNEL || null
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error initializing Slack client', error)
    }
  }

  /**
   * Send message to Slack
   */
  async sendMessage(message: SlackMessage): Promise<boolean> {
    if (!this.token) {
      await this.initialize()
    }

    if (!this.token) {
      const { logWarn } = await import('@/shared/utils/logger')
      logWarn('Slack token not configured')
      return false
    }

    try {
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: message.channel || this.defaultChannel || '#general',
          text: message.text,
          blocks: message.blocks,
          attachments: message.attachments
        })
      })

      const data = await response.json()

      if (!data.ok) {
        const { logError } = await import('@/shared/utils/logger')
        logError('Slack API error', { error: data.error })
        return false
      }

      return true
    } catch (error) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Error sending Slack message', error)
      return false
    }
  }

  /**
   * Send formatted patient status message
   */
  async sendPatientStatus(patientId: string, status: string): Promise<boolean> {
    const message: SlackMessage = {
      text: `Patient Status Update`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Patient Status Update'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Patient ID:*\n${patientId}`
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\n${status}`
            }
          ]
        }
      ]
    }

    return this.sendMessage(message)
  }

  /**
   * Send system health message
   */
  async sendSystemHealth(health: {
    status: string
    database: string
    api: string
    details?: Record<string, unknown>
  }): Promise<boolean> {
    const emoji = health.status === 'healthy' ? '✅' : health.status === 'degraded' ? '⚠️' : '❌'

    const message: SlackMessage = {
      text: `${emoji} System Health: ${health.status}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} System Health Report`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Status:*\n${health.status}`
            },
            {
              type: 'mrkdwn',
              text: `*Database:*\n${health.database}`
            },
            {
              type: 'mrkdwn',
              text: `*API:*\n${health.api}`
            }
          ]
        }
      ]
    }

    return this.sendMessage(message)
  }
}

export const slackClient = new SlackClient()
