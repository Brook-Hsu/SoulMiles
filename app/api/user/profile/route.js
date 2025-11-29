import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

// 取得使用者資料
export async function GET(request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        UserName: true,
        coin: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: '使用者不存在' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('取得使用者資料失敗:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

// 更新使用者資料
export async function PATCH(request) {
  try {
    const session = await auth();

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: '使用者名稱不能為空' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name: name.trim(),
        UserName: name.trim(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        UserName: true,
        coin: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('更新使用者資料失敗:', error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}

