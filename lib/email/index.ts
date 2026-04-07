import type { EmailService } from "./base";

export type { EmailService, SendEmailParams } from "./base";

let _instance: EmailService | null = null;

export async function getEmailService(): Promise<EmailService> {
  if (_instance) return _instance;

  if (process.env.NODE_ENV === "production" || process.env.RESEND_API_KEY) {
    const { ResendEmailService } = await import("./resend");
    _instance = new ResendEmailService();
  } else {
    const { LocalEmailService } = await import("./local");
    _instance = new LocalEmailService();
  }

  return _instance!;
}
