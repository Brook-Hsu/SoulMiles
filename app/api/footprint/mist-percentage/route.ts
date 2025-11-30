import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '../../../../lib/auth';
import { coordinateToGridId, getAllTaiwanGridIds } from '../../../../lib/utils/gridUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ percentage: 0 }, { status: 200 });
    }

    const userId = (session.user as any).id;

    // 獲取所有台灣方塊的 ID (使用快取)
    const allGridIds = getAllTaiwanGridIds();
    const totalGridCount = allGridIds.length;

    if (totalGridCount === 0) {
      return NextResponse.json({ percentage: 0 });
    }

    // 查詢使用者已探索的方塊
    const exploredFootprints = await prisma.footprint.findMany({
      where: {
        user_id: userId,
        coordinate: { not: null },
      },
      select: {
        coordinate: true,
      },
    });

    // 使用 Set 儲存已探索的 gridId，確保去重
    const uniqueExploredGridIds = new Set<string>();
    exploredFootprints.forEach((footprint) => {
      if (footprint.coordinate) {
        const [latStr, lonStr] = footprint.coordinate.split(',');
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        if (!isNaN(lat) && !isNaN(lon)) {
          const gridId = coordinateToGridId(lat, lon);
          if (gridId) {
            uniqueExploredGridIds.add(gridId);
          }
        }
      }
    });

    const exploredCount = uniqueExploredGridIds.size;
    const percentage = (exploredCount / totalGridCount) * 100;

    return NextResponse.json({ percentage: parseFloat(percentage.toFixed(2)) });
  } catch (error: any) {
    console.error('獲取迷霧百分比失敗:', error);
    const errorMessage = error?.message || '';
    if (
      errorMessage.includes('Environment variable') ||
      errorMessage.includes('DATABASE_URL') ||
      errorMessage.includes('Access denied') ||
      errorMessage.includes('Account is locked') ||
      errorMessage.includes('PrismaClientInitializationError')
    ) {
      return NextResponse.json({ percentage: 0 }, { status: 200 });
    }
    return NextResponse.json({ error: '獲取迷霧百分比失敗' }, { status: 500 });
  }
}

