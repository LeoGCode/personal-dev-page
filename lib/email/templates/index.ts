/**
 * Email template rendering utilities.
 *
 * Renders React Email components into `{ html, text }` pairs ready
 * for the email service.  All templates support `locale` for i18n.
 */

import { render } from "@react-email/components";
import ConfirmationEmail, {
  type ConfirmationEmailProps,
} from "./confirmation";
import NotificationEmail, {
  type NotificationEmailProps,
} from "./notification";

export type { ConfirmationEmailProps } from "./confirmation";
export type { NotificationEmailProps } from "./notification";

/**
 * Render the confirmation email sent to the person who submitted the form.
 */
export async function renderConfirmationEmail(
  props: ConfirmationEmailProps,
): Promise<{ html: string; text: string }> {
  const [html, text] = await Promise.all([
    render(ConfirmationEmail(props)),
    render(ConfirmationEmail(props), { plainText: true }),
  ]);
  return { html, text };
}

/**
 * Render the notification email sent to the site owner.
 */
export async function renderNotificationEmail(
  props: NotificationEmailProps,
): Promise<{ html: string; text: string }> {
  const [html, text] = await Promise.all([
    render(NotificationEmail(props)),
    render(NotificationEmail(props), { plainText: true }),
  ]);
  return { html, text };
}
