import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

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
  } catch (error) {
    console.error('獲取 Task 失敗:', error);
    return NextResponse.json(
      { error: '獲取任務失敗' },
      { status: 500 }
    );
  }
}

