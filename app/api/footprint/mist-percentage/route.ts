import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '../../../../lib/auth';
import { coordinateToGridId, getAllTaiwanGridIds } from '../../../../lib/utils/gridUtils';

// 強制動態路由
export const dynamic = 'force-dynamic';

/**
 * 獲取使用者迷霧去除百分比
 * GET /api/footprint/mist-percentage
 * 返回：{ percentage: number } (0-100)
 */
export async function GET() {
  try {
    // 獲取當前用戶的 session
    const session = await auth();

    if (!session || !session.user || !(session.user as any).id) {
      // 未登入時返回 0%
      return NextResponse.json({ percentage: 0 }, { status: 200 });
    }

    const userId = (session.user as any).id;

    // 獲取所有台灣方塊 ID（使用快取）
    const allGridIds = getAllTaiwanGridIds();
    const totalGrids = allGridIds.length;

    if (totalGrids === 0) {
      return NextResponse.json({ percentage: 0 }, { status: 200 });
    }

    // 查詢使用者的所有 Footprint
    const footprints = await prisma.footprint.findMany({
      where: {
        user_id: userId,
        coordinate: { not: null },
      },
      select: {
        coordinate: true,
      },
    });

    // 使用 Set 去重已探索的方塊 ID
    const exploredGridIds = new Set<string>();

    footprints.forEach((footprint) => {
      if (!footprint.coordinate) return;

      try {
        const [latStr, lonStr] = footprint.coordinate.split(',');
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);

        if (isNaN(lat) || isNaN(lon)) return;

        const gridId = coordinateToGridId(lat, lon);
        if (gridId) {
          exploredGridIds.add(gridId);
        }
      } catch {
        // 忽略錯誤
      }
    });

    // 計算百分比（已探索 / 總數 * 100）
    const exploredCount = exploredGridIds.size;
    const percentage = Math.round((exploredCount / totalGrids) * 100);

    return NextResponse.json({ percentage });
  } catch (error: any) {
    console.error('獲取迷霧去除百分比失敗:', error);

    // 處理資料庫連接錯誤
    const errorMessage = error?.message || '';
    if (
      errorMessage.includes('Environment variable') ||
      errorMessage.includes('DATABASE_URL') ||
      errorMessage.includes('Access denied') ||
      errorMessage.includes('Account is locked') ||
      errorMessage.includes('PrismaClientInitializationError')
    ) {
      // 資料庫不可用時，返回 0%
      return NextResponse.json({ percentage: 0 }, { status: 200 });
    }

    return NextResponse.json(
      { error: '獲取迷霧去除百分比失敗', percentage: 0 },
      { status: 500 }
    );
  }
}

