import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { fetchGhinHandicap } from '@/lib/ghin/client';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // Find existing GHIN profile
    const ghinProfile = await prisma.ghinProfile.findUnique({
      where: { userId },
    });

    if (!ghinProfile) {
      return NextResponse.json(
        { error: 'No GHIN profile found. Please connect your GHIN number first.' },
        { status: 404 }
      );
    }

    // Fetch latest handicap data from GHIN
    const handicapData = await fetchGhinHandicap(ghinProfile.ghinNumber);

    // Determine trend direction
    const previousIndex = ghinProfile.handicapIndex ? Number(ghinProfile.handicapIndex) : null;
    let trendDirection = 'stable';
    if (previousIndex !== null) {
      if (handicapData.handicapIndex < previousIndex) {
        trendDirection = 'improving';
      } else if (handicapData.handicapIndex > previousIndex) {
        trendDirection = 'rising';
      }
    }

    // Update GhinProfile
    const updatedProfile = await prisma.ghinProfile.update({
      where: { userId },
      data: {
        handicapIndex: handicapData.handicapIndex,
        clubName: handicapData.clubName,
        association: handicapData.association,
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
        rawData: handicapData as any,
      },
    });

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: {
        handicapIndex: handicapData.handicapIndex,
        ghinLastSynced: new Date(),
      },
    });

    // Create handicap history entry
    await prisma.handicapHistory.create({
      data: {
        userId,
        handicapIndex: handicapData.handicapIndex,
        lowIndex: handicapData.lowIndex,
        highIndex: handicapData.highIndex,
        trendDirection,
        source: 'ghin_sync',
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedProfile.id,
        ghinNumber: updatedProfile.ghinNumber,
        handicapIndex: Number(updatedProfile.handicapIndex),
        clubName: updatedProfile.clubName,
        association: updatedProfile.association,
        isVerified: updatedProfile.isVerified,
        lastSyncedAt: updatedProfile.lastSyncedAt,
      },
      trend: trendDirection,
      previousIndex,
    });
  } catch (err) {
    console.error('GHIN sync error:', err);
    return NextResponse.json(
      { error: 'Failed to sync handicap data' },
      { status: 500 }
    );
  }
}
