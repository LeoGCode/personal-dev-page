import { Resend } from "resend";
import type { EmailService, SendEmailParams } from "./base";

const EMAIL_FROM = process.env.EMAIL_FROM || "Leonel <hello@leoneldev.com>";

export function createResendService(): EmailService {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  const client = new Resend(apiKey);

  return {
    async send(params: SendEmailParams): Promise<{ id?: string }> {
      const result = await client.emails.send({
        from: EMAIL_FROM,
        to: params.to,
        subject: params.subject,
        text: params.text,
        ...(params.html && { html: params.html }),
      });

      return { id: result.data?.id };
    },
  };
}
