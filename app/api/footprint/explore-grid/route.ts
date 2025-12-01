import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/middleware/auth';
import { coordinateToGridId } from '../../../../lib/utils/gridUtils';
import { successResponse, ApiErrors } from '../../../../lib/utils/api-response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const body = await request.json();
    const { lat, lon } = body as { lat?: number; lon?: number };

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return ApiErrors.BAD_REQUEST('無效的座標');
    }

    // 計算網格 ID
    const gridId = coordinateToGridId(lat, lon);
    if (!gridId) {
      return ApiErrors.BAD_REQUEST('座標不在台灣範圍內');
    }

    // 檢查是否已經記錄過這個網格
    const coordinate = `${lat},${lon}`;
    const existingFootprint = await prisma.footprint.findFirst({
      where: {
        user_id: userId,
        coordinate: coordinate,
      },
    });

    if (existingFootprint) {
      // 已經記錄過，更新時間
      await prisma.footprint.update({
        where: { id: existingFootprint.id },
        data: {
          Update_time: new Date(),
        },
      });
      return successResponse({ updated: true }, '已更新探索記錄');
    }

    // 創建新的足跡記錄
    await prisma.footprint.create({
      data: {
        user_id: userId,
        coordinate: coordinate,
        Create_time: new Date(),
        Update_time: new Date(),
      },
    });

    return successResponse({ created: true }, '探索記錄已保存');
  } catch (error) {
    console.error('記錄探索方塊失敗:', error);
    
    // 如果是 API 錯誤回應（來自中間件），直接返回
    if (error && typeof error === 'object' && 'status' in error) {
      return error as ReturnType<typeof ApiErrors.UNAUTHORIZED>;
    }
    
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (
        errorMessage.includes('Environment variable') ||
        errorMessage.includes('DATABASE_URL') ||
        errorMessage.includes('Access denied') ||
        errorMessage.includes('Account is locked')
      ) {
        return ApiErrors.DATABASE_ERROR();
      }
    }
    
    return ApiErrors.INTERNAL_ERROR('記錄探索方塊失敗');
  }
}

