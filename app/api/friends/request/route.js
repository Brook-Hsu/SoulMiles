import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

// 發送好友請求
export async function POST(request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    const body = await request.json();
    const { friendId } = body;

    if (!friendId) {
      return NextResponse.json({ error: '缺少好友 ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, UserName: true },
    });

    if (!user) {
      return NextResponse.json({ error: '使用者不存在' }, { status: 404 });
    }

    if (user.id === friendId) {
      return NextResponse.json({ error: '不能加自己為好友' }, { status: 400 });
    }

    // 檢查目標使用者是否存在
    const friendUser = await prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true, name: true, UserName: true },
    });

    if (!friendUser) {
      return NextResponse.json({ error: '目標使用者不存在' }, { status: 404 });
    }

    // 檢查是否已經是好友或已有待處理的請求
    const existingFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { user_id: user.id, friend_id: friendId },
          { user_id: friendId, friend_id: user.id },
        ],
      },
    });

    if (existingFriend) {
      if (existingFriend.status === 'accepted') {
        return NextResponse.json({ error: '已經是好友了' }, { status: 400 });
      } else {
        return NextResponse.json({ error: '好友請求已存在' }, { status: 400 });
      }
    }

    // 建立好友請求（狀態為 pending）
    const friendRequest = await prisma.friend.create({
      data: {
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      },
    });

    // 建立通知給目標使用者
    await prisma.notification.create({
      data: {
        user_id: friendId,
        type: 'friend_request',
        title: '好友請求',
        message: `${user.name || user.UserName || '某位使用者'} 想要加您為好友`,
        related_id: friendRequest.id,
        isRead: false,
      },
    });

    return NextResponse.json({ 
      message: '好友請求已發送',
      requestId: friendRequest.id 
    });
  } catch (error) {
    console.error('發送好友請求失敗:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

