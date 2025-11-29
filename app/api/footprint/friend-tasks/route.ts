import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '../../../../lib/auth';

// 強制動態路由，避免建置時嘗試靜態生成
export const dynamic = 'force-dynamic';

// 計算兩點之間的距離（Haversine 公式，返回公尺）
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // 地球半徑（公尺）
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 解析 "lat,lng" 座標字串
function parseCoordinate(coord: string | null): { lat: number; lon: number } | null {
  if (!coord) return null;
  try {
    const [latStr, lonStr] = coord.split(',');
    const lat = Number(latStr);
    const lon = Number(lonStr);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}

/**
 * 檢查好友足跡是否在使用者一公里內，並為使用者建立臨時任務
 * POST /api/footprint/friend-tasks
 * body: { lat: number, lon: number }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    const body = await request.json().catch(() => ({}));
    const { lat, lon } = body || {};

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json({ error: '缺少或格式錯誤的座標資料' }, { status: 400 });
    }

    // 取得好友列表（已接受的雙向好友）
    const friends = await prisma.friend.findMany({
      where: {
        status: 'accepted',
        OR: [
          { user_id: userId },
          { friend_id: userId },
        ],
      },
      select: {
        user_id: true,
        friend_id: true,
      },
    });

    if (!friends.length) {
      return NextResponse.json({ createdTasks: 0, matchedRecords: 0 });
    }

    // 取得好友 ID 清單（排除自己，去重複）
    const friendIds = Array.from(
      new Set(
        friends.map((f) => (f.user_id === userId ? f.friend_id : f.user_id))
      )
    );

    if (!friendIds.length) {
      return NextResponse.json({ createdTasks: 0, matchedRecords: 0 });
    }

    // 為了避免查詢量過大，只取最近 3 個月的足跡
    const since = new Date();
    since.setMonth(since.getMonth() - 3);

    const friendRecords = await prisma.mapRecord.findMany({
      where: {
        user_id: { in: friendIds },
        coordinate: { not: null },
        Create_time: { gte: since },
      },
      select: {
        id: true,
        user_id: true,
        coordinate: true,
        name: true,
        description: true,
      },
    });

    if (!friendRecords.length) {
      return NextResponse.json({ createdTasks: 0, matchedRecords: 0 });
    }

    // 取得好友的基本資料，用於任務名稱/描述
    const friendUsers = await prisma.user.findMany({
      where: {
        id: { in: friendIds },
      },
      select: {
        id: true,
        name: true,
        UserName: true,
      },
    });

    const friendNameMap = new Map<string, string>();
    for (const fu of friendUsers) {
      friendNameMap.set(fu.id, fu.name || fu.UserName || '旅者');
    }

    let createdTasks = 0;
    let matchedRecords = 0;

    for (const record of friendRecords) {
      const coord = parseCoordinate(record.coordinate);
      if (!coord) continue;

      const distance = calculateDistance(lat, lon, coord.lat, coord.lon);
      if (distance > 1000) continue; // 僅限 1 公里內

      matchedRecords += 1;

      // 檢查是否已有針對此 MapRecord 的臨時任務
      let task = await prisma.task.findFirst({
        where: {
          isTemporary: true,
          relatedMapRecordId: record.id,
        },
      });

      if (!task) {
        const friendName = friendNameMap.get(record.user_id) || '旅者';

        task = await prisma.task.create({
          data: {
            name: `附近好友：${friendName}`,
            description:
              record.description ||
              `好友「${friendName}」在附近留下足跡：${record.name || '未知地點'}`,
            coordinate: record.coordinate,
            Coin: 10,
            isTemporary: true,
            relatedUserId: record.user_id,
            relatedMapRecordId: record.id,
          },
        });

        createdTasks += 1;
      }

      // 為當前使用者建立 UserTask（如果尚未建立）
      const existingUserTask = await prisma.userTask.findFirst({
        where: {
          user_id: userId,
          task_id: task.id,
        },
      });

      if (!existingUserTask) {
        await prisma.userTask.create({
          data: {
            user_id: userId,
            task_id: task.id,
            isDone: false,
            Field: 'friend_temporary_task',
          },
        });
      }
    }

    return NextResponse.json({
      createdTasks,
      matchedRecords,
    });
  } catch (error: any) {
    console.error('檢查好友足跡並建立臨時任務失敗:', error);
    return NextResponse.json(
      { error: '檢查好友足跡失敗' },
      { status: 500 }
    );
  }
}


