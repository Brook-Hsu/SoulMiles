import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '../../../../lib/auth';
import { coordinateToGridId } from '../../../../lib/utils/gridUtils';

// 強制動態路由
export const dynamic = 'force-dynamic';

/**
 * 獲取使用者已探索的所有方塊
 * GET /api/footprint/explored-grids
 */
export async function GET() {
  try {
    // 獲取當前用戶的 session
    const session = await auth();

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ grids: [] }, { status: 200 });
    }

    const userId = (session.user as any).id;

    // 查詢使用者的所有 Footprint
    // 注意：建議在 Footprint 表的 user_id 和 coordinate 欄位添加索引以提升查詢效能
    // CREATE INDEX idx_footprint_user_coordinate ON Footprint(user_id, coordinate);
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
      // 不需要排序，因為我們會去重
      // orderBy: {
      //   Create_time: 'desc',
      // },
    });

    // 使用 Set 去重 gridId，並記錄最新的探索時間
    const gridMap = new Map<string, { coordinate: string; exploredAt: string }>();

    // 將 Footprint 轉換為方塊資訊並去重
    footprints.forEach((footprint) => {
      if (!footprint.coordinate) return;

      try {
        const [latStr, lonStr] = footprint.coordinate.split(',');
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);

        if (isNaN(lat) || isNaN(lon)) return;

        const gridId = coordinateToGridId(lat, lon);
        if (!gridId) return;

        // 如果已存在，保留最新的探索時間
        const existing = gridMap.get(gridId);
        if (!existing || new Date(footprint.Create_time) > new Date(existing.exploredAt)) {
          gridMap.set(gridId, {
            coordinate: footprint.coordinate,
            exploredAt: footprint.Create_time.toISOString(),
          });
        }
      } catch {
        // 忽略錯誤
      }
    });

    // 轉換為陣列格式
    const grids = Array.from(gridMap.entries()).map(([gridId, data]) => ({
      gridId,
      coordinate: data.coordinate,
      exploredAt: data.exploredAt,
    }));

    return NextResponse.json({ grids });
  } catch (error: any) {
    console.error('獲取已探索方塊失敗:', error);

    // 處理資料庫連接錯誤（包括帳號被鎖定）
    const errorMessage = error?.message || '';
    if (
      errorMessage.includes('Environment variable') ||
      errorMessage.includes('DATABASE_URL') ||
      errorMessage.includes('Access denied') ||
      errorMessage.includes('Account is locked') ||
      errorMessage.includes('PrismaClientInitializationError')
    ) {
      // 資料庫不可用時，返回空陣列
      return NextResponse.json({ grids: [] }, { status: 200 });
    }

    return NextResponse.json(
      { error: '獲取已探索方塊失敗' },
      { status: 500 }
    );
  }
}

