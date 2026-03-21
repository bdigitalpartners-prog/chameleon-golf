import { Resend } from 'resend';

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// Default sender — update domain after DNS verification
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@golfequalizer.ai';
export const REPLY_TO = process.env.RESEND_REPLY_TO || 'support@golfequalizer.ai';
