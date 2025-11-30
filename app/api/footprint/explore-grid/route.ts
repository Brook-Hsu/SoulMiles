import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '../../../../lib/auth';
import { coordinateToGridId } from '../../../../lib/utils/gridUtils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { lat, lon } = body;

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json({ error: '無效的座標' }, { status: 400 });
    }

    // 計算網格 ID
    const gridId = coordinateToGridId(lat, lon);
    if (!gridId) {
      return NextResponse.json({ error: '座標不在台灣範圍內' }, { status: 400 });
    }

    // 檢查是否已經記錄過這個網格
    const coordinate = `${lat},${lon}`;
    const existingFootprint = await prisma.footprint.findFirst({
      where: {
        user_id: userId,
        coordinate: coordinate,
      },
    });

    if (existingFootprint) {
      // 已經記錄過，更新時間
      await prisma.footprint.update({
        where: { id: existingFootprint.id },
        data: {
          Update_time: new Date(),
        },
      });
      return NextResponse.json({ success: true, message: '已更新探索記錄' });
    }

    // 創建新的足跡記錄
    await prisma.footprint.create({
      data: {
        user_id: userId,
        coordinate: coordinate,
        Create_time: new Date(),
        Update_time: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: '探索記錄已保存' });
  } catch (error: any) {
    console.error('記錄探索方塊失敗:', error);
    const errorMessage = error?.message || '';
    if (
      errorMessage.includes('Environment variable') ||
      errorMessage.includes('DATABASE_URL') ||
      errorMessage.includes('Access denied') ||
      errorMessage.includes('Account is locked')
    ) {
      return NextResponse.json(
        {
          error: '資料庫暫時無法連接，探索記錄將在資料庫恢復後自動同步',
          success: false,
          databaseUnavailable: true,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: '記錄探索方塊失敗' }, { status: 500 });
  }
}

