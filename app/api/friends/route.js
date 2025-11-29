import { NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

// 取得好友列表
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

    // 取得已接受的好友關係（雙向）
    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { user_id: user.id, status: 'accepted' },
          { friend_id: user.id, status: 'accepted' },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            UserName: true,
            image: true,
          },
        },
        friendUser: {
          select: {
            id: true,
            name: true,
            UserName: true,
            image: true,
          },
        },
      },
    });

    // 轉換為統一格式（總是顯示好友的資訊）
    const friendsList = friends.map((friend) => ({
      id: friend.id,
      friendUser: friend.user_id === user.id ? friend.friendUser : friend.user,
    }));

    return NextResponse.json({ friends: friendsList });
  } catch (error) {
    console.error('取得好友列表失敗:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

