import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

export async function GET(request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ users: [] });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: '使用者不存在' }, { status: 404 });
    }

    const searchQuery = query.trim();

    // 搜尋使用者名稱或 ID 後五碼
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUser.id } }, // 排除自己
          {
            OR: [
              { name: { contains: searchQuery } },
              { UserName: { contains: searchQuery } },
              { id: { endsWith: searchQuery } }, // ID 後五碼
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        UserName: true,
        image: true,
      },
      take: 10, // 限制結果數量
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('搜尋使用者失敗:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

