import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '../../../../lib/auth';
import { coordinateToGridId } from '../../../../lib/utils/gridUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ grids: [] }, { status: 200 });
    }

    const userId = (session.user as any).id;

    const footprints = await prisma.footprint.findMany({
      where: {
        user_id: userId,
        coordinate: { not: null },
      },
      select: {
        id: true,
        coordinate: true,
        Create_time: true,
      },
    });

    const gridMap = new Map<string, { coordinate: string; exploredAt: string }>();

    footprints.forEach((footprint) => {
      if (footprint.coordinate) {
        const [latStr, lonStr] = footprint.coordinate.split(',');
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        if (!isNaN(lat) && !isNaN(lon)) {
          const gridId = coordinateToGridId(lat, lon);
          if (gridId) {
            const existing = gridMap.get(gridId);
            if (!existing || new Date(footprint.Create_time) > new Date(existing.exploredAt)) {
              gridMap.set(gridId, {
                coordinate: footprint.coordinate,
                exploredAt: footprint.Create_time.toISOString(),
              });
            }
          }
        }
      }
    });

    const grids = Array.from(gridMap.entries()).map(([gridId, data]) => ({
      gridId,
      coordinate: data.coordinate,
      exploredAt: data.exploredAt,
    }));

    return NextResponse.json({ grids });
  } catch (error: any) {
    console.error('獲取已探索方塊失敗:', error);
    const errorMessage = error?.message || '';
    if (
      errorMessage.includes('Environment variable') ||
      errorMessage.includes('DATABASE_URL') ||
      errorMessage.includes('Access denied') ||
      errorMessage.includes('Account is locked')
    ) {
      return NextResponse.json({ grids: [] }, { status: 200 });
    }
    return NextResponse.json({ error: '獲取已探索方塊失敗' }, { status: 500 });
  }
}

