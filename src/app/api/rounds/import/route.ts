import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { importRoundsFromGhin } from '@/lib/rounds/import';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const result = await importRoundsFromGhin(userId);

    return NextResponse.json({
      success: true,
      imported: result.imported,
      skipped: result.skipped,
      message: `Imported ${result.imported} round(s), skipped ${result.skipped}.`,
    });
  } catch (err) {
    console.error('Round import error:', err);
    return NextResponse.json(
      { error: 'Failed to import rounds from GHIN' },
      { status: 500 },
    );
  }
}
