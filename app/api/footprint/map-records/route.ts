import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/middleware/auth';
import { successResponse, ApiErrors } from '../../../../lib/utils/api-response';

// 強制動態路由，避免建置時嘗試靜態生成
export const dynamic = 'force-dynamic';

/**
 * 獲取使用者的所有 MapRecord 數據（包含 MapRecordPicture）
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);

    const records = await prisma.mapRecord.findMany({
      where: {
        user_id: userId,
      },
      include: {
        pictures: true,
      },
      orderBy: {
        Create_time: 'desc',
      },
    });

    // 轉換日期為字符串以便序列化
    const formattedRecords = records.map((record) => ({
      id: record.id,
      name: record.name,
      description: record.description,
      coordinate: record.coordinate,
      Create_time: record.Create_time.toISOString(),
      pictures: record.pictures.map((pic) => ({
        id: pic.id,
        picture: pic.picture,
      })),
    }));

    return successResponse({ records: formattedRecords });
  } catch (error) {
    console.error('獲取 MapRecord 失敗:', error);
    
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
        return successResponse({ records: [] });
      }
    }
    
    return ApiErrors.INTERNAL_ERROR('獲取記錄失敗');
  }
}

/**
 * 創建新的 MapRecord（包含 MapRecordPicture）
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const body = await request.json();
    const { name, description, coordinate, pictures } = body as {
      name?: string;
      description?: string;
      coordinate?: string;
      pictures?: string[];
    };

    if (!name || typeof name !== 'string') {
      return ApiErrors.BAD_REQUEST('地點名稱為必填項');
    }

    // 創建 MapRecord 和相關的 MapRecordPicture
    const mapRecord = await prisma.mapRecord.create({
      data: {
        user_id: userId,
        name,
        description: description || null,
        coordinate: coordinate || null,
        pictures: {
          create: (pictures || []).map((picture: string) => ({
            picture,
          })),
        },
      },
      include: {
        pictures: true,
      },
    });

    return successResponse({ record: mapRecord });
  } catch (error) {
    console.error('創建 MapRecord 失敗:', error);
    
    // 如果是 API 錯誤回應（來自中間件），直接返回
    if (error && typeof error === 'object' && 'status' in error) {
      return error as ReturnType<typeof ApiErrors.UNAUTHORIZED>;
    }
    
    return ApiErrors.INTERNAL_ERROR('創建記錄失敗');
  }
}

/**
 * 更新現有的 MapRecord（包含 MapRecordPicture）
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const body = await request.json();
    const { id, name, description, coordinate, pictures } = body as {
      id?: string;
      name?: string;
      description?: string;
      coordinate?: string;
      pictures?: string[];
    };

    if (!id || typeof id !== 'string') {
      return ApiErrors.BAD_REQUEST('記錄 ID 為必填項');
    }

    if (!name || typeof name !== 'string') {
      return ApiErrors.BAD_REQUEST('地點名稱為必填項');
    }

    // 檢查記錄是否存在且屬於當前用戶
    const existingRecord = await prisma.mapRecord.findUnique({
      where: { id },
      include: { pictures: true },
    });

    if (!existingRecord) {
      return ApiErrors.NOT_FOUND('記錄');
    }

    if (existingRecord.user_id !== userId) {
      return ApiErrors.FORBIDDEN();
    }

    // 更新 MapRecord
    const updatedRecord = await prisma.mapRecord.update({
      where: { id },
      data: {
        name,
        description: description || null,
        coordinate: coordinate || null,
      },
      include: {
        pictures: true,
      },
    });

    // 處理圖片：刪除現有圖片，創建新圖片
    if (pictures !== undefined) {
      // 刪除所有現有圖片
      await prisma.mapRecordPicture.deleteMany({
        where: { record_id: id },
      });

      // 創建新圖片
      if (pictures && pictures.length > 0) {
        await prisma.mapRecordPicture.createMany({
          data: pictures.map((picture: string) => ({
            record_id: id,
            picture,
          })),
        });
      }
    }

    // 重新獲取更新後的記錄（包含新圖片）
    const finalRecord = await prisma.mapRecord.findUnique({
      where: { id },
      include: {
        pictures: true,
      },
    });

    return successResponse({ record: finalRecord });
  } catch (error) {
    console.error('更新 MapRecord 失敗:', error);
    
    // 如果是 API 錯誤回應（來自中間件），直接返回
    if (error && typeof error === 'object' && 'status' in error) {
      return error as ReturnType<typeof ApiErrors.UNAUTHORIZED>;
    }
    
    return ApiErrors.INTERNAL_ERROR('更新記錄失敗');
  }
}

/**
 * 刪除 MapRecord（包含相關的 MapRecordPicture）
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return ApiErrors.BAD_REQUEST('記錄 ID 為必填項');
    }

    // 檢查記錄是否存在且屬於當前用戶
    const existingRecord = await prisma.mapRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return ApiErrors.NOT_FOUND('記錄');
    }

    if (existingRecord.user_id !== userId) {
      return ApiErrors.FORBIDDEN();
    }

    // 刪除記錄（相關的 MapRecordPicture 會因為 onDelete: Cascade 自動刪除）
    await prisma.mapRecord.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('刪除 MapRecord 失敗:', error);
    
    // 如果是 API 錯誤回應（來自中間件），直接返回
    if (error && typeof error === 'object' && 'status' in error) {
      return error as ReturnType<typeof ApiErrors.UNAUTHORIZED>;
    }
    
    return ApiErrors.INTERNAL_ERROR('刪除記錄失敗');
  }
}

