export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailService {
  send(params: SendEmailParams): Promise<{ id?: string }>;
}
