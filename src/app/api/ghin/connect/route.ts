import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { verifyGhinNumber, fetchGhinHandicap } from '@/lib/ghin/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    const { ghinNumber } = await request.json();

    if (!ghinNumber || typeof ghinNumber !== 'string' || ghinNumber.length < 5) {
      return NextResponse.json(
        { error: 'Valid GHIN number required (minimum 5 characters)' },
        { status: 400 }
      );
    }

    // Verify the GHIN number
    const verification = await verifyGhinNumber(ghinNumber);
    if (!verification.valid) {
      return NextResponse.json(
        { error: 'Invalid GHIN number. Please check and try again.' },
        { status: 400 }
      );
    }

    // Fetch current handicap data
    const handicapData = await fetchGhinHandicap(ghinNumber);

    // Create or update GhinProfile
    const ghinProfile = await prisma.ghinProfile.upsert({
      where: { userId },
      create: {
        userId,
        ghinNumber,
        handicapIndex: handicapData.handicapIndex,
        clubName: handicapData.clubName,
        association: handicapData.association,
        isVerified: true,
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
        rawData: handicapData as any,
      },
      update: {
        ghinNumber,
        handicapIndex: handicapData.handicapIndex,
        clubName: handicapData.clubName,
        association: handicapData.association,
        isVerified: true,
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
        rawData: handicapData as any,
      },
    });

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: {
        ghinNumber,
        handicapIndex: handicapData.handicapIndex,
        ghinVerified: true,
        ghinVerifiedAt: new Date(),
        ghinLastSynced: new Date(),
      },
    });

    // Create initial handicap history entry
    await prisma.handicapHistory.create({
      data: {
        userId,
        handicapIndex: handicapData.handicapIndex,
        lowIndex: handicapData.lowIndex,
        highIndex: handicapData.highIndex,
        trendDirection: 'stable',
        source: 'ghin_connect',
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: ghinProfile.id,
        ghinNumber: ghinProfile.ghinNumber,
        handicapIndex: Number(ghinProfile.handicapIndex),
        clubName: ghinProfile.clubName,
        association: ghinProfile.association,
        isVerified: ghinProfile.isVerified,
        lastSyncedAt: ghinProfile.lastSyncedAt,
      },
      golferName: verification.name,
    });
  } catch (err) {
    console.error('GHIN connect error:', err);
    return NextResponse.json(
      { error: 'Failed to connect GHIN account' },
      { status: 500 }
    );
  }
}
