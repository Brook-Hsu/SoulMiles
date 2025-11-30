import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

// 標記通知為已讀
export async function POST(request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json({ error: '缺少通知 ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: '使用者不存在' }, { status: 404 });
    }

    // 更新通知為已讀
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    // 檢查是否為當前用戶的通知
    if (notification.user_id !== user.id) {
      return NextResponse.json({ error: '無權限' }, { status: 403 });
    }

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('標記通知已讀失敗:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}


