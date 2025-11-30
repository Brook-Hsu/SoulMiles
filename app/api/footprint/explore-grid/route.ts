import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '../../../../lib/auth';
import { coordinateToGridId, gridIdToCenter, isInTaiwanBounds } from '../../../../lib/utils/gridUtils';

// 強制動態路由
export const dynamic = 'force-dynamic';

/**
 * 記錄使用者探索的方塊
 * POST /api/footprint/explore-grid
 * body: { lat: number, lon: number }
 */
export async function POST(request: Request) {
  try {
    // 獲取當前用戶的 session
    const session = await auth();

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: '請先登入' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { lat, lon } = body;

    // 驗證輸入
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json({ error: '座標格式錯誤' }, { status: 400 });
    }

    // 檢查是否在台灣範圍內
    if (!isInTaiwanBounds(lat, lon)) {
      return NextResponse.json({ error: '座標不在台灣範圍內' }, { status: 400 });
    }

    // 計算方塊 ID
    const gridId = coordinateToGridId(lat, lon);
    if (!gridId) {
      return NextResponse.json({ error: '無法計算方塊 ID' }, { status: 400 });
    }

    // 計算方塊中心點座標（用於儲存）
    const center = gridIdToCenter(gridId);
    if (!center) {
      return NextResponse.json({ error: '無法計算方塊中心點' }, { status: 400 });
    }

    const coordinate = `${center.lat},${center.lon}`;

    // 檢查是否已經記錄過這個方塊
    const existingFootprint = await prisma.footprint.findFirst({
      where: {
        user_id: userId,
        coordinate: coordinate,
      },
    });

    if (existingFootprint) {
      // 已經記錄過，返回現有記錄
      return NextResponse.json({
        success: true,
        alreadyExplored: true,
        footprint: {
          id: existingFootprint.id,
          gridId,
          coordinate: existingFootprint.coordinate,
        },
      });
    }

    // 創建新的 Footprint 記錄
    const footprint = await prisma.footprint.create({
      data: {
        user_id: userId,
        coordinate: coordinate,
      },
    });

    return NextResponse.json({
      success: true,
      alreadyExplored: false,
      footprint: {
        id: footprint.id,
        gridId,
        coordinate: footprint.coordinate,
      },
    });
  } catch (error: any) {
    console.error('記錄探索方塊失敗:', error);
    
    // 處理資料庫連接錯誤（包括帳號被鎖定）
    const errorMessage = error?.message || '';
    if (
      errorMessage.includes('Environment variable') ||
      errorMessage.includes('DATABASE_URL') ||
      errorMessage.includes('Access denied') ||
      errorMessage.includes('Account is locked') ||
      errorMessage.includes('PrismaClientInitializationError')
    ) {
      // 資料庫不可用時，返回友好錯誤但不阻止前端繼續運作
      return NextResponse.json(
        { 
          error: '資料庫暫時無法連接，探索記錄將在資料庫恢復後自動同步',
          success: false,
          databaseUnavailable: true
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: '記錄探索方塊失敗' },
      { status: 500 }
    );
  }
}

