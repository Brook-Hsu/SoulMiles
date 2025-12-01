import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { getUserId } from '../../../../lib/middleware/auth';
import { successResponse, ApiErrors } from '../../../../lib/utils/api-response';

// 強制動態路由，避免建置時嘗試靜態生成
export const dynamic = 'force-dynamic';

/**
 * 獲取使用者的所有 MapRecord 數據（用於地圖顯示）
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return successResponse({ footprints: [] });
    }

    // 查詢 MapRecord 而不是 Footprint
    const mapRecords = await prisma.mapRecord.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        Create_time: 'desc',
      },
    });

    // 轉換為 Footprint 格式以保持 API 兼容性
    const footprints = mapRecords.map((record) => ({
      id: record.id,
      coordinate: record.coordinate,
      name: record.name,
      description: record.description,
    }));

    return successResponse({ footprints });
  } catch (error) {
    console.error('獲取 MapRecord 失敗:', error);
    
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (
        errorMessage.includes('Environment variable') ||
        errorMessage.includes('DATABASE_URL') ||
        errorMessage.includes('Access denied') ||
        errorMessage.includes('Account is locked') ||
        errorMessage.includes('PrismaClientInitializationError')
      ) {
        return successResponse({ footprints: [] });
      }
    }
    
    return ApiErrors.INTERNAL_ERROR('獲取足跡失敗');
  }
}

