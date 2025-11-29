import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

// 拒絕好友請求
export async function POST(request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ error: '缺少請求 ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: '使用者不存在' }, { status: 404 });
    }

    // 找到好友請求
    const friendRequest = await prisma.friend.findUnique({
      where: { id: requestId },
    });

    if (!friendRequest) {
      return NextResponse.json({ error: '好友請求不存在' }, { status: 404 });
    }

    // 檢查是否為自己的請求
    if (friendRequest.friend_id !== user.id) {
      return NextResponse.json({ error: '無權限處理此請求' }, { status: 403 });
    }

    // 刪除好友請求
    await prisma.friend.delete({
      where: { id: requestId },
    });

    // 標記通知為已讀
    await prisma.notification.updateMany({
      where: {
        user_id: user.id,
        related_id: requestId,
        type: 'friend_request',
      },
      data: { isRead: true },
    });

    return NextResponse.json({ message: '好友請求已拒絕' });
  } catch (error) {
    console.error('拒絕好友請求失敗:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

