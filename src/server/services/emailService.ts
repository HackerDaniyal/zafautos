import { db } from '@/server/db/client';
import { emailLogs } from '@/server/db/schema/messages';
import { eq } from 'drizzle-orm';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface NotificationEmailData {
  to: string;
  ticketId?: string;
  ticketSubject?: string;
  action: 'ticket_created' | 'ticket_reply' | 'ticket_resolved' | 'ticket_closed' | 'payment_confirmed' | 'shipment_update' | 'document_available';
  metadata?: Record<string, unknown>;
}

/**
 * Email service abstraction.
 * In development, logs payloads to console and email_logs table.
 * In production, can be extended with any provider (Resend, SendGrid, etc.)
 */
export class EmailService {
  /**
   * Send an email. Logs to email_logs table regardless of provider.
   */
  async send(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
    // Log to database
    try {
      await db.insert(emailLogs).values({
        recipient: payload.to,
        subject: payload.subject,
        content: payload.html,
        status: 'sent',
      });
    } catch (err) {
      console.error('Failed to log email:', err);
    }

    // In development, just log
    if (process.env.NODE_ENV === 'development' || process.env.EMAIL_PROVIDER === 'log') {
      console.log(`[EMAIL] To: ${payload.to} | Subject: ${payload.subject}`);
      console.log(`[EMAIL] Preview: ${payload.text || payload.html.slice(0, 200)}`);
      return { success: true };
    }

    // Production: extend with actual provider
    // Example for Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({ from: '...', to: payload.to, subject: payload.subject, html: payload.html });

    return { success: true };
  }

  /**
   * Send a support ticket notification email.
   */
  async sendTicketNotification(data: NotificationEmailData): Promise<void> {
    const templates: Record<string, { subject: string; body: string }> = {
      ticket_created: {
        subject: `Support Ticket Created: ${data.ticketSubject}`,
        body: `Your support request "${data.ticketSubject}" has been received. Our team will review it shortly.`,
      },
      ticket_reply: {
        subject: `New Reply on Ticket: ${data.ticketSubject}`,
        body: `A support agent has replied to your ticket "${data.ticketSubject}". Log in to view the response.`,
      },
      ticket_resolved: {
        subject: `Ticket Resolved: ${data.ticketSubject}`,
        body: `Your ticket "${data.ticketSubject}" has been resolved. If you need further assistance, please create a new ticket.`,
      },
      ticket_closed: {
        subject: `Ticket Closed: ${data.ticketSubject}`,
        body: `Your ticket "${data.ticketSubject}" has been closed.`,
      },
      payment_confirmed: {
        subject: 'Payment Confirmed',
        body: 'Your payment has been confirmed. Thank you!',
      },
      shipment_update: {
        subject: 'Shipment Status Updated',
        body: 'Your shipment status has been updated. Log in to view details.',
      },
      document_available: {
        subject: 'Document Available',
        body: 'A new document is available for download. Log in to view it.',
      },
    };

    const template = templates[data.action];
    if (!template) return;

    await this.send({
      to: data.to,
      subject: template.subject,
      html: `<p>${template.body}</p>`,
      text: template.body,
    });
  }
}

export const emailService = new EmailService();
