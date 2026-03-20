export function notificationEmail({
  name,
  title,
  body,
  actionUrl,
  actionLabel,
}: {
  name: string;
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
}) {
  const actionButton = actionUrl
    ? `<div style="text-align: center; margin: 24px 0;">
         <a href="${actionUrl}" style="background-color: #16a34a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
           ${actionLabel || 'View Details'}
         </a>
       </div>`
    : '';

  return {
    subject: title,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 16px;">${title}</h2>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          Hi ${name},
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          ${body}
        </p>
        ${actionButton}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Chameleon Golf — chameleongolf.ai
        </p>
      </div>
    `,
    text: `${title}\n\nHi ${name},\n\n${body}${actionUrl ? `\n\n${actionLabel || 'View Details'}: ${actionUrl}` : ''}`,
  };
}
