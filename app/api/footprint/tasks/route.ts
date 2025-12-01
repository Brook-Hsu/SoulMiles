import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserId } from '../../../../lib/middleware/auth';
import { successResponse, errorResponse, ApiErrors } from '../../../../lib/utils/api-response';

// 強制動態路由，避免建置時嘗試靜態生成
export const dynamic = 'force-dynamic';

/**
 * 獲取任務列表
 * - 共享任務（isShared: true）：所有用戶都可見
 * - 主要任務（isMainTask: true）：只有 assignedUserId 為當前用戶的任務
 * - 臨時任務（isTemporary: true）：只有通過 UserTask 關聯的任務
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();

    // 計算7天前的日期
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 構建查詢條件
    const whereConditions: {
      Create_time: { gte: Date };
      OR: Array<Record<string, unknown>>;
    } = {
      Create_time: {
        gte: sevenDaysAgo, // 只獲取7天內的任務
      },
      OR: [],
    };

    // 1. 共享任務：所有用戶都可見
    whereConditions.OR.push({
      isShared: true,
    });

    // 2. 主要任務：只有當前用戶的任務
    if (userId) {
      whereConditions.OR.push({
        isMainTask: true,
        assignedUserId: userId,
        isShared: false, // 確保不是共享任務
      });
    }

    // 3. 臨時任務：通過 UserTask 關聯查詢
    if (userId) {
      // 先查詢用戶的 UserTask 關聯
      const userTasks = await prisma.userTask.findMany({
        where: {
          user_id: userId,
          task: {
            Create_time: {
              gte: sevenDaysAgo,
            },
            isTemporary: true,
            isShared: false, // 確保不是共享任務
          },
        },
        select: {
          task_id: true,
        },
      });

      const temporaryTaskIds = userTasks.map((ut) => ut.task_id);
      if (temporaryTaskIds.length > 0) {
        whereConditions.OR.push({
          id: { in: temporaryTaskIds },
        });
      }
    }

    // 如果沒有登入，只返回共享任務
    if (!userId) {
      whereConditions.OR = [{ isShared: true }];
    }

    const tasks = await prisma.task.findMany({
      where: whereConditions,
      orderBy: [
        {
          isShared: 'desc', // 共享任務優先
        },
        {
          isMainTask: 'desc', // 主要任務優先
        },
        {
          Create_time: 'desc',
        },
      ],
    });

    return successResponse({ tasks });
  } catch (error) {
    console.error('獲取 Task 失敗:', error);
    
    // 如果是資料庫連接錯誤，返回空陣列而不是錯誤
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (
        errorMessage.includes('Environment variable') ||
        errorMessage.includes('DATABASE_URL') ||
        errorMessage.includes('Access denied') ||
        errorMessage.includes('Account is locked')
      ) {
        return successResponse({ tasks: [] });
      }
    }
    
    // 如果是 API 錯誤回應（來自中間件），直接返回
    if (error && typeof error === 'object' && 'status' in error) {
      return error as ReturnType<typeof ApiErrors.UNAUTHORIZED>;
    }
    
    return ApiErrors.INTERNAL_ERROR('獲取任務失敗');
  }
}

