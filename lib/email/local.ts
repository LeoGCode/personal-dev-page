import type { EmailService, SendEmailParams } from "./base";
import { EMAIL_FROM } from "@/lib/site";

const MAILPIT_SMTP_HOST = process.env.MAILPIT_SMTP_HOST || "localhost";
const MAILPIT_SMTP_PORT = Number(process.env.MAILPIT_SMTP_PORT || "1025");

/**
 * Local email service that sends via Mailpit SMTP for development.
 * Viewable at http://localhost:8025.
 */
export function createLocalService(): EmailService {
  return {
    async send(params: SendEmailParams): Promise<{ id?: string }> {
      const { createTransport } = await import("nodemailer");

      const transport = createTransport({
        host: MAILPIT_SMTP_HOST,
        port: MAILPIT_SMTP_PORT,
        secure: false,
      });

      const result = await transport.sendMail({
        from: EMAIL_FROM,
        to: params.to,
        subject: params.subject,
        text: params.text,
        ...(params.html && { html: params.html }),
      });

      console.log(`[LocalEmail] Sent to ${params.to}: ${params.subject}`);

      return { id: result.messageId };
    },
  };
}
