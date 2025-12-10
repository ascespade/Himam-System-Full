/**
 * Email Service
 * Centralized email sending with templates
 */

import { BaseService, ServiceException } from '@/core/services'

// ============================================================================
// Types
// ============================================================================

export interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
  attachments?: EmailAttachment[]
}

export interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

// ============================================================================
// Email Service
// ============================================================================

export class EmailService extends BaseService {
  private fromEmail: string
  private fromName: string

  constructor() {
    super()
    this.fromEmail = process.env.SMTP_USER || 'noreply@example.com'
    this.fromName = process.env.SMTP_FROM_NAME || 'Himam System'
  }

  /**
   * Sends an email
   */
  async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    try {
      // In production, integrate with email service (SendGrid, AWS SES, etc.)
      // For now, log the email (development mode)
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent:', {
          to: options.to,
          subject: options.subject,
          from: options.from || `${this.fromName} <${this.fromEmail}>`,
        })
        return {
          success: true,
          messageId: `dev-${Date.now()}`,
        }
      }

      // Production email sending would go here
      // Example: await sendGrid.send(options)
      
      throw new ServiceException('Email service not configured', 'EMAIL_NOT_CONFIGURED')
    } catch (error) {
      if (error instanceof ServiceException) {
        throw error
      }
      throw this.handleError(error, 'sendEmail')
    }
  }

  /**
   * Sends an email using a template
   */
  async sendTemplateEmail(
    templateName: string,
    to: string | string[],
    templateData: Record<string, unknown>
  ): Promise<SendEmailResult> {
    // Import template dynamically
    const template = await this.getTemplate(templateName)
    
    const html = this.renderTemplate(template.html, templateData)
    const text = this.renderTemplate(template.text, templateData)

    return this.sendEmail({
      to,
      subject: this.renderTemplate(template.subject, templateData),
      html,
      text,
    })
  }

  /**
   * Gets email template
   */
  private async getTemplate(templateName: string) {
    // Dynamic import of template
    try {
      const template = await import(`./templates/${templateName}`)
      return template.default
    } catch (error) {
      throw new ServiceException(`Template ${templateName} not found`, 'TEMPLATE_NOT_FOUND')
    }
  }

  /**
   * Renders template with data
   */
  private renderTemplate(template: string, data: Record<string, unknown>): string {
    let rendered = template
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      rendered = rendered.replace(regex, String(value))
    }
    return rendered
  }
}

// Export singleton instance
export const emailService = new EmailService()
