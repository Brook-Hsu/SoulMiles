import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { successResponse, errorResponse, ApiErrors } from '../../../../lib/utils/api-response';

export const dynamic = 'force-dynamic';

/**
 * 軟體擁有者 API：管理共享任務
 * 
 * 使用環境變數 ADMIN_API_KEY 進行驗證
 * 
 * POST /api/admin/shared-tasks - 新增共享任務
 * body: {
 *   name: string,
 *   description: string,
 *   coordinate: string (格式: "lat,lon"),
 *   Coin: number
 * }
 * 
 * GET /api/admin/shared-tasks - 獲取所有共享任務
 * 
 * DELETE /api/admin/shared-tasks - 刪除共享任務
 * body: { taskId: string }
 */

// 驗證管理員 API Key
function verifyAdminKey(request: NextRequest): boolean {
  const adminApiKey = process.env.ADMIN_API_KEY;
  if (!adminApiKey) {
    console.warn('[Admin API] ADMIN_API_KEY 未配置');
    return false;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return false;
  }

  // 支援 Bearer token 或直接 API Key
  const providedKey = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  return providedKey === adminApiKey;
}

/**
 * 新增共享任務
 */
export async function POST(request: NextRequest) {
  try {
    // 驗證管理員 API Key
    if (!verifyAdminKey(request)) {
      return ApiErrors.UNAUTHORIZED();
    }

    const body = await request.json().catch(() => ({}));
    const { name, description, coordinate, Coin } = body as {
      name?: string;
      description?: string;
      coordinate?: string;
      Coin?: number;
    };

    // 驗證必填欄位
    if (!name || !description || !coordinate || Coin === undefined) {
      return ApiErrors.BAD_REQUEST('缺少必填欄位：name, description, coordinate, Coin');
    }

    // 驗證座標格式
    const coordParts = coordinate.split(',');
    if (coordParts.length !== 2) {
      return ApiErrors.BAD_REQUEST('座標格式錯誤，應為 "lat,lon"');
    }

    const lat = parseFloat(coordParts[0]);
    const lon = parseFloat(coordParts[1]);
    if (isNaN(lat) || isNaN(lon)) {
      return ApiErrors.BAD_REQUEST('座標格式錯誤，lat 和 lon 必須為數字');
    }

    // 創建共享任務
    const task = await prisma.task.create({
      data: {
        name,
        description,
        coordinate,
        Coin: parseInt(Coin.toString(), 10),
        isShared: true, // 標記為共享任務
        isMainTask: false,
        isTemporary: false,
      },
    });

    return successResponse({ task }, '共享任務已創建');
  } catch (error) {
    console.error('[Admin API] 創建共享任務失敗:', error);
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return errorResponse('創建共享任務失敗', 500, errorMessage);
  }
}

/**
 * 獲取所有共享任務
 */
export async function GET(request: NextRequest) {
  try {
    // 驗證管理員 API Key
    if (!verifyAdminKey(request)) {
      return ApiErrors.UNAUTHORIZED();
    }

    const tasks = await prisma.task.findMany({
      where: {
        isShared: true,
      },
      orderBy: {
        Create_time: 'desc',
      },
    });

    return successResponse({ tasks, count: tasks.length });
  } catch (error) {
    console.error('[Admin API] 獲取共享任務失敗:', error);
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return errorResponse('獲取共享任務失敗', 500, errorMessage);
  }
}

/**
 * 刪除共享任務
 */
export async function DELETE(request: NextRequest) {
  try {
    // 驗證管理員 API Key
    if (!verifyAdminKey(request)) {
      return ApiErrors.UNAUTHORIZED();
    }

    const body = await request.json().catch(() => ({}));
    const { taskId } = body as { taskId?: string };

    if (!taskId || typeof taskId !== 'string') {
      return ApiErrors.BAD_REQUEST('缺少必填欄位：taskId');
    }

    // 檢查任務是否存在且為共享任務
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return ApiErrors.NOT_FOUND('任務');
    }

    if (!task.isShared) {
      return ApiErrors.BAD_REQUEST('只能刪除共享任務');
    }

    // 刪除任務（會自動刪除相關的 UserTask 記錄，因為有 onDelete: Cascade）
    await prisma.task.delete({
      where: { id: taskId },
    });

    return successResponse({ deleted: true }, '共享任務已刪除');
  } catch (error) {
    console.error('[Admin API] 刪除共享任務失敗:', error);
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return errorResponse('刪除共享任務失敗', 500, errorMessage);
  }
}

