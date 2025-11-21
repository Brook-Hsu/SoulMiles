import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// 強制動態路由，避免建置時嘗試靜態生成
export const dynamic = 'force-dynamic';

/**
 * 獲取所有 Task 數據
 */
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        Create_time: 'desc',
      },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('獲取 Task 失敗:', error);
    // 如果是資料庫連接錯誤，返回空陣列而不是錯誤
    if (error?.message?.includes('Environment variable') || error?.message?.includes('DATABASE_URL')) {
      return NextResponse.json({ tasks: [] }, { status: 200 });
    }
    return NextResponse.json(
      { error: '獲取任務失敗' },
      { status: 500 }
    );
  }
}

