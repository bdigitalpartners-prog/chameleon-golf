import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  // Require authentication
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, subject, html, text } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html' },
        { status: 400 }
      );
    }

    const result = await sendEmail({ to, subject, html, text });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ id: result.id });
  } catch (error) {
    console.error('[API /email/send]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
