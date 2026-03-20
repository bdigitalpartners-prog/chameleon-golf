export function passwordResetEmail({ name, resetUrl }: { name: string; resetUrl: string }) {
  return {
    subject: 'Reset your golfEQUALIZER password',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 16px;">Password Reset</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Hi ${name},
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password. Click below to choose a new one:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #16a34a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          golfEQUALIZER — golfequalizer.ai
        </p>
      </div>
    `,
    text: `Hi ${name},\n\nReset your password here: ${resetUrl}\n\nThis link expires in 1 hour.`,
  };
}
