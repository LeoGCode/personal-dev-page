import { Resend } from "resend";
import type { EmailService, SendEmailParams } from "./base";

const EMAIL_FROM = process.env.EMAIL_FROM || "Leonel <hello@leoneldev.com>";

export class ResendEmailService implements EmailService {
  private client: Resend;

  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY);
  }

  async send(params: SendEmailParams): Promise<{ id?: string }> {
    const result = await this.client.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      text: params.text,
      ...(params.html && { html: params.html }),
    });

    return { id: result.data?.id };
  }
}
