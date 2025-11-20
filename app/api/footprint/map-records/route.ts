import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '../../../../lib/auth';

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

    return NextResponse.json({ records });
  } catch (error) {
    console.error('獲取 MapRecord 失敗:', error);
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

