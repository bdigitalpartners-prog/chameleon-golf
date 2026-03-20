import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set — email sending will be disabled');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender — update domain after DNS verification
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@golfequalizer.ai';
export const REPLY_TO = process.env.RESEND_REPLY_TO || 'support@golfequalizer.ai';
