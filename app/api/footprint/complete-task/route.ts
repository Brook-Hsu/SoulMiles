import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '../../../../lib/auth';

// 強制動態路由，避免建置時嘗試靜態生成
export const dynamic = 'force-dynamic';

/**
 * 完成任務
 * 更新 UserTask 表的 isDone 狀態，並增加使用者的 coin
 */
export async function POST(request: Request) {
  try {
    // 獲取當前用戶的 session
    const session = await auth();
    
    // 檢查用戶是否已登入
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: '任務 ID 為必填項' },
        { status: 400 }
      );
    }

    // 獲取任務資訊
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { error: '任務不存在' },
        { status: 404 }
      );
    }

    // 檢查是否已有 UserTask 記錄
    let userTask = await prisma.userTask.findUnique({
      where: {
        user_id_task_id: {
          user_id: userId,
          task_id: taskId,
        },
      },
    });

    if (userTask) {
      // 如果已存在且已完成，返回錯誤
      if (userTask.isDone) {
        return NextResponse.json(
          { error: '任務已完成' },
          { status: 400 }
        );
      }

      // 更新為已完成
      userTask = await prisma.userTask.update({
        where: {
          id: userTask.id,
        },
        data: {
          isDone: true,
        },
      });
    } else {
      // 創建新的 UserTask 記錄
      userTask = await prisma.userTask.create({
        data: {
          user_id: userId,
          task_id: taskId,
          isDone: true,
        },
      });
    }

    // 增加使用者的 coin
    await prisma.user.update({
      where: { id: userId },
      data: {
        coin: {
          increment: task.Coin,
        },
      },
    });

    return NextResponse.json({
      success: true,
      coinEarned: task.Coin,
      userTask,
    });
  } catch (error) {
    console.error('完成任務失敗:', error);
    return NextResponse.json(
      { error: '完成任務失敗' },
      { status: 500 }
    );
  }
}

