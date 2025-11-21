import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '../../../../lib/auth';

// 強制動態路由，避免建置時嘗試靜態生成
export const dynamic = 'force-dynamic';

/**
 * 獲取使用者的所有 MapRecord 數據（用於地圖顯示）
 */
export async function GET() {
  try {
    // 獲取當前用戶的 session
    const session = await auth();
    
    // 檢查用戶是否已登入
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { footprints: [] },
        { status: 200 }
      );
    }

    const userId = (session.user as any).id;

    // 查詢 MapRecord 而不是 Footprint
    const mapRecords = await prisma.mapRecord.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        Create_time: 'desc',
      },
    });

    // 轉換為 Footprint 格式以保持 API 兼容性
    const footprints = mapRecords.map((record) => ({
      id: record.id,
      coordinate: record.coordinate,
      name: record.name,
      description: record.description,
    }));

    return NextResponse.json({ footprints });
  } catch (error: any) {
    console.error('獲取 MapRecord 失敗:', error);
    // 如果是資料庫連接錯誤，返回空陣列而不是錯誤
    if (error?.message?.includes('Environment variable') || error?.message?.includes('DATABASE_URL')) {
      return NextResponse.json({ footprints: [] }, { status: 200 });
    }
    return NextResponse.json(
      { error: '獲取足跡失敗' },
      { status: 500 }
    );
  }
}

