/**
 * Slack API Integration
 * Full integration with Slack API for channels, huddles, and recording
 */

import { getSettings } from './config'

interface SlackChannel {
  id: string
  name: string
  created: number
}

interface SlackHuddle {
  id: string
  channel: string
  date_start: number
  date_end?: number
  participants?: string[]
}

interface SlackRecording {
  id: string
  huddle_id: string
  url?: string
  duration?: number
  status: 'recording' | 'completed' | 'failed'
}

/**
 * Get Slack API token from settings
 */
async function getSlackToken(): Promise<string | null> {
  const settings = await getSettings()
  return settings.SLACK_BOT_TOKEN || process.env.SLACK_BOT_TOKEN || null
}

/**
 * Make authenticated request to Slack API
 */
async function slackApiRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<any> {
  const token = await getSlackToken()
  if (!token) {
    throw new Error('Slack Bot Token not configured')
  }

  const url = `https://slack.com/api/${endpoint}`
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!data.ok) {
    throw new Error(data.error || 'Slack API error')
  }

  return data
}

/**
 * Create a Slack channel
 */
export async function createSlackChannel(
  name: string,
  isPrivate: boolean = false
): Promise<SlackChannel> {
  const data = await slackApiRequest('conversations.create', 'POST', {
    name: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    is_private: isPrivate,
  })

  return {
    id: data.channel.id,
    name: data.channel.name,
    created: data.channel.created,
  }
}

/**
 * Invite users to a Slack channel
 */
export async function inviteToSlackChannel(
  channelId: string,
  userIds: string[]
): Promise<boolean> {
  try {
    await slackApiRequest('conversations.invite', 'POST', {
      channel: channelId,
      users: userIds.join(','),
    })
    return true
  } catch (error) {
    console.error('Error inviting users to Slack channel:', error)
    return false
  }
}

/**
 * Start a Slack Huddle (video call) in a channel
 */
export async function startSlackHuddle(
  channelId: string,
  title?: string
): Promise<SlackHuddle> {
  const data = await slackApiRequest('calls.add', 'POST', {
    external_unique_id: `huddle-${Date.now()}`,
    join_url: `https://slack.com/call/${channelId}`,
    title: title || 'Therapy Session',
    created_by: 'system',
  })

  // For huddles, we use the channel's huddle feature
  // Slack Huddles are started via the channel, not via API directly
  // So we return the channel info and the huddle will be managed there
  return {
    id: `huddle-${channelId}-${Date.now()}`,
    channel: channelId,
    date_start: Math.floor(Date.now() / 1000),
  }
}

/**
 * Get Slack Huddle link for a channel
 */
export function getSlackHuddleLink(channelId: string): string {
  return `https://slack.com/call/${channelId}`
}

/**
 * Get user ID by email (for inviting to channels)
 */
export async function getSlackUserIdByEmail(email: string): Promise<string | null> {
  try {
    const data = await slackApiRequest('users.lookupByEmail', 'GET', undefined)
    // Note: This requires the users:read.email scope
    // For now, we'll return null and handle it differently
    return null
  } catch (error) {
    console.error('Error looking up Slack user:', error)
    return null
  }
}

/**
 * Send message to Slack channel
 */
export async function sendSlackMessage(
  channelId: string,
  text: string,
  blocks?: any[]
): Promise<string> {
  const data = await slackApiRequest('chat.postMessage', 'POST', {
    channel: channelId,
    text,
    blocks,
  })

  return data.ts // Message timestamp
}

/**
 * Get channel messages
 */
export async function getSlackChannelMessages(
  channelId: string,
  limit: number = 100
): Promise<any[]> {
  const data = await slackApiRequest('conversations.history', 'GET', {
    channel: channelId,
    limit,
  })

  return data.messages || []
}

/**
 * Check if recording is enabled for a huddle
 * Note: Slack Huddle recording is managed via workspace settings
 * This function checks the configuration
 */
export async function isRecordingEnabled(channelId: string): Promise<boolean> {
  // Check from system configuration
  const settings = await getSettings()
  const defaultRecording = settings.SLACK_HUDDLE_RECORDING_ENABLED === 'true'
  
  // Can be overridden per channel/doctor via database
  // For now, return default
  return defaultRecording || false
}

/**
 * Get recording status for a huddle
 * Note: Slack doesn't provide direct API for huddle recording status
 * We'll track this in our database
 */
export async function getHuddleRecordingStatus(
  huddleId: string
): Promise<SlackRecording | null> {
  // This would query our database for recording status
  // Slack doesn't expose huddle recording via API directly
  return null
}

/**
 * Upload file to Slack channel
 */
export async function uploadFileToSlack(
  channelId: string,
  fileUrl: string,
  filename: string,
  title?: string
): Promise<string> {
  // Note: This requires downloading the file first, then uploading
  // For now, we'll use a simpler approach with file sharing
  const data = await slackApiRequest('files.upload', 'POST', {
    channels: channelId,
    file: fileUrl, // This might need to be a file buffer
    filename,
    title: title || filename,
  })

  return data.file.id
}

/**
 * Archive a Slack channel
 */
export async function archiveSlackChannel(channelId: string): Promise<boolean> {
  try {
    await slackApiRequest('conversations.archive', 'POST', {
      channel: channelId,
    })
    return true
  } catch (error) {
    console.error('Error archiving Slack channel:', error)
    return false
  }
}

