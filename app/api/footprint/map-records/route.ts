import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '../../../../lib/auth';

// 強制動態路由，避免建置時嘗試靜態生成
export const dynamic = 'force-dynamic';

/**
 * 獲取使用者的所有 MapRecord 數據（包含 MapRecordPicture）
 */
export async function GET() {
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

    return NextResponse.json({ records: formattedRecords });
  } catch (error: any) {
    console.error('獲取 MapRecord 失敗:', error);
    // 如果是資料庫連接錯誤，返回空陣列而不是錯誤
    if (error?.message?.includes('Environment variable') || error?.message?.includes('DATABASE_URL')) {
      return NextResponse.json({ records: [] }, { status: 200 });
    }
    return NextResponse.json(
      { error: '獲取記錄失敗' },
      { status: 500 }
    );
  }
}

/**
 * 創建新的 MapRecord（包含 MapRecordPicture）
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
    const { name, description, coordinate, pictures } = body;

    if (!name) {
      return NextResponse.json(
        { error: '地點名稱為必填項' },
        { status: 400 }
      );
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

    return NextResponse.json({ record: mapRecord });
  } catch (error) {
    console.error('創建 MapRecord 失敗:', error);
    return NextResponse.json(
      { error: '創建記錄失敗' },
      { status: 500 }
    );
  }
}

/**
 * 更新現有的 MapRecord（包含 MapRecordPicture）
 */
export async function PUT(request: Request) {
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
    const { id, name, description, coordinate, pictures } = body;

    if (!id) {
      return NextResponse.json(
        { error: '記錄 ID 為必填項' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: '地點名稱為必填項' },
        { status: 400 }
      );
    }

    // 檢查記錄是否存在且屬於當前用戶
    const existingRecord = await prisma.mapRecord.findUnique({
      where: { id },
      include: { pictures: true },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: '記錄不存在' },
        { status: 404 }
      );
    }

    if (existingRecord.user_id !== userId) {
      return NextResponse.json(
        { error: '無權限修改此記錄' },
        { status: 403 }
      );
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

    return NextResponse.json({ record: finalRecord });
  } catch (error) {
    console.error('更新 MapRecord 失敗:', error);
    return NextResponse.json(
      { error: '更新記錄失敗' },
      { status: 500 }
    );
  }
}

/**
 * 刪除 MapRecord（包含相關的 MapRecordPicture）
 */
export async function DELETE(request: Request) {
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '記錄 ID 為必填項' },
        { status: 400 }
      );
    }

    // 檢查記錄是否存在且屬於當前用戶
    const existingRecord = await prisma.mapRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: '記錄不存在' },
        { status: 404 }
      );
    }

    if (existingRecord.user_id !== userId) {
      return NextResponse.json(
        { error: '無權限刪除此記錄' },
        { status: 403 }
      );
    }

    // 刪除記錄（相關的 MapRecordPicture 會因為 onDelete: Cascade 自動刪除）
    await prisma.mapRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('刪除 MapRecord 失敗:', error);
    return NextResponse.json(
      { error: '刪除記錄失敗' },
      { status: 500 }
    );
  }
}

