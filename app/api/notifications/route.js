import { NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

// 取得通知列表
export async function GET(request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: '使用者不存在' }, { status: 404 });
    }

    const notifications = await prisma.notification.findMany({
      where: { user_id: user.id },
      orderBy: { Create_time: 'desc' },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('取得通知列表失敗:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

