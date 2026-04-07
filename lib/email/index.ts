import type { EmailService } from "./base";

export type { EmailService, SendEmailParams } from "./base";

let _instance: EmailService | null = null;

export async function getEmailService(): Promise<EmailService> {
  if (_instance) return _instance;

  if (process.env.NODE_ENV === "production" || process.env.RESEND_API_KEY) {
    const { createResendService } = await import("./resend");
    _instance = createResendService();
  } else {
    const { createLocalService } = await import("./local");
    _instance = createLocalService();
  }

  return _instance;
}
