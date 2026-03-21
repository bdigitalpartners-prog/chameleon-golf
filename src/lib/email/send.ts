import { getResend, FROM_EMAIL, REPLY_TO } from './resend';

export type EmailResult = {
  success: boolean;
  id?: string;
  error?: string;
};

/**
 * Send a transactional email via Resend.
 * All emails go through this single function for consistent error handling and logging.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  tags,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}): Promise<EmailResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log(`[Email Skipped] No API key — would send "${subject}" to ${to}`);
      return { success: true, id: 'skipped-no-api-key' };
    }

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo: replyTo || REPLY_TO,
      tags,
    });

    if (error) {
      console.error('[Email Error]', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email Sent] "${subject}" to ${to} — id: ${data?.id}`);
    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Email Exception]', message);
    return { success: false, error: message };
  }
}
