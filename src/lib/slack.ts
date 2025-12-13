/**
 * Slack Notification Utility
 * Sends notifications to a configured Slack Webhook URL.
 */

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

interface SlackPayload {
  text?: string;
  blocks?: any[];
  attachments?: any[];
}

export async function sendSlackNotification(payload: SlackPayload): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    const { logWarn } = await import('@/shared/utils/logger')
    logWarn('SLACK_WEBHOOK_URL is not defined. Skipping notification.')
    return false;
  }

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const { logError } = await import('@/shared/utils/logger')
      logError('Failed to send Slack notification', { status: response.status, statusText: response.statusText })
      return false;
    }

    return true;
  } catch (error) {
    const { logError } = await import('@/shared/utils/logger')
    logError('Error sending Slack notification', error)
    return false;
  }
}

export async function notifyNewAppointment(appointment: Record<string, unknown>) {
  const message = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📅 New Appointment Booked",
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Patient:*\n${appointment.patient_name}`
          },
          {
            type: "mrkdwn",
            text: `*Doctor:*\n${appointment.doctor_name || 'N/A'}`
          }
        ]
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Date:*\n${(() => {
              const date = appointment.date && (typeof appointment.date === 'string' || appointment.date instanceof Date)
                ? new Date(appointment.date)
                : new Date()
              return date.toLocaleDateString()
            })()}`
          },
          {
            type: "mrkdwn",
            text: `*Time:*\n${(() => {
              const date = appointment.date && (typeof appointment.date === 'string' || appointment.date instanceof Date)
                ? new Date(appointment.date)
                : new Date()
              return date.toLocaleTimeString()
            })()}`
          }
        ]
      }
    ]
  };

  return sendSlackNotification(message);
}

export async function notifyCriticalLabResult(patientName: string, testName: string, value: string) {
  const message = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🚨 Critical Lab Result",
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Critical result for *${patientName}*`
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Test:*\n${testName}`
          },
          {
            type: "mrkdwn",
            text: `*Value:*\n${value}`
          }
        ]
      }
    ]
  };

  return sendSlackNotification(message);
}
