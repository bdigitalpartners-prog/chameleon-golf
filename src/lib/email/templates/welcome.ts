export function welcomeEmail({ name, loginUrl }: { name: string; loginUrl?: string }) {
  const url = loginUrl || 'https://chameleongolf.ai/auth/login';

  return {
    subject: 'Welcome to Chameleon Golf',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1a1a1a; font-size: 28px; margin: 0;">Welcome to Chameleon Golf</h1>
        </div>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Hey ${name},
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Your account is set up and ready to go. Start exploring courses, tracking rounds, and connecting with other golfers.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${url}" style="background-color: #16a34a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
            Get Started
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
          If you have any questions, reply to this email — we're here to help.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Chameleon Golf — chameleongolf.ai
        </p>
      </div>
    `,
    text: `Welcome to Chameleon Golf, ${name}! Get started at ${url}`,
  };
}
