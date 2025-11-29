import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { auth } from '../../../../lib/auth';

// 強制動態路由
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

// 使用模板生成任務內容（成本優化：不使用 AI）
function generateTaskContentFromTemplate(placeName: string, placeType?: string, location?: string) {
  const taskNameTemplates = [
    `探索神秘的${placeName}`,
    `發現${placeName}的隱藏寶藏`,
    `在${placeName}尋找失落的秘密`,
    `踏上${placeName}的冒險之旅`,
    `解開${placeName}的謎團`,
    `追尋${placeName}的傳說`,
    `探索${placeName}的未知領域`,
  ];

  const taskDescriptionTemplates = [
    `在迷霧籠罩的${placeName}，隱藏著古老的秘密等待被發現。踏上這段冒險旅程，感受神秘力量的召喚，尋找失落的寶藏。`,
    `${placeName}散發著神秘的氣息，彷彿在訴說著古老的傳說。勇敢的探險者啊，這裡有你追尋的答案。`,
    `傳說中的${placeName}，是迷霧中最閃亮的指引。前往此地，你將發現意想不到的驚喜，讓靈魂得到淨化。`,
    `在${placeName}的深處，隱藏著等待被探索的秘密。這是一次考驗勇氣與智慧的旅程，準備好迎接挑戰了嗎？`,
    `${placeName}如同迷霧中的燈塔，指引著探險者前進。踏上這段旅程，你將收穫珍貴的回憶與成長。`,
  ];

  // 隨機選擇模板
  const nameIndex = Math.floor(Math.random() * taskNameTemplates.length);
  const descIndex = Math.floor(Math.random() * taskDescriptionTemplates.length);

  return {
    name: taskNameTemplates[nameIndex],
    description: taskDescriptionTemplates[descIndex],
  };
}

// AI 生成任務內容（可選，需要 OPENAI_API_KEY）
async function generateTaskContentWithAI(placeName: string, placeType?: string, location?: string) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  // 如果沒有 API Key，使用模板生成
  if (!OPENAI_API_KEY) {
    return generateTaskContentFromTemplate(placeName, placeType, location);
  }

  try {
    const prompt = `你是一個旅遊任務生成器，請根據以下景點資訊生成一個吸引人的任務：

景點名稱：${placeName}
景點類型：${placeType || '景點'}
景點位置：${location || '未知'}

請生成：
1. 任務名稱（10-20字，帶有冒險、探索、神秘感）
2. 任務描述（50-100字，描述任務目標和期待發現的事物）

風格：暗黑哥德 x 航海尋寶主題，使用繁體中文

請以 JSON 格式回應：
{
  "name": "任務名稱",
  "description": "任務描述"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // 使用較便宜的模型
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 200, // 限制 token 數量以節省成本
      }),
    });

    if (!response.ok) {
      console.warn('OpenAI API 調用失敗，使用模板生成');
      return generateTaskContentFromTemplate(placeName, placeType, location);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return generateTaskContentFromTemplate(placeName, placeType, location);
    }

    // 嘗試解析 JSON
    try {
      const parsed = JSON.parse(content);
      if (parsed.name && parsed.description) {
        return {
          name: parsed.name,
          description: parsed.description,
        };
      }
    } catch (e) {
      console.warn('AI 回應格式錯誤，使用模板生成');
    }

    return generateTaskContentFromTemplate(placeName, placeType, location);
  } catch (error) {
    console.error('AI 生成任務內容失敗:', error);
    // 發生錯誤時使用模板生成
    return generateTaskContentFromTemplate(placeName, placeType, location);
  }
}

// 獲取附近景點（使用 Foursquare API）
async function fetchNearbyAttractions(lat: number, lon: number, radius: number = 30000) {
  const FOURSQUARE_API_KEY = process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY || 
                              process.env.FOURSQUARE_API_KEY;
  
  if (!FOURSQUARE_API_KEY) {
    throw new Error('Foursquare API key not configured');
  }

  try {
    const searchUrl = `https://places-api.foursquare.com/places/search`;
    const searchParams = new URLSearchParams({
      ll: `${lat},${lon}`,
      radius: radius.toString(),
      categories: '16000,10000', // 景區和戶外景點類別
      limit: '10', // 獲取多個景點以便隨機選擇
    });

    const response = await fetch(`${searchUrl}?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${FOURSQUARE_API_KEY}`,
        'X-Places-Api-Version': '2025-06-17',
      },
    });

    if (!response.ok) {
      throw new Error(`Foursquare API error: ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || data.data || [];

    if (results.length === 0) {
      throw new Error('No attractions found');
    }

    // 計算距離並排序
    const attractionsWithDistance = results
      .filter((place: any) => place.geocodes?.main)
      .map((place: any) => {
        const placeLat = place.geocodes.main.latitude;
        const placeLon = place.geocodes.main.longitude;
        const distance = calculateDistance(lat, lon, placeLat, placeLon);
        
        return {
          ...place,
          distance,
          lat: placeLat,
          lon: placeLon,
        };
      })
      .filter((place: any) => place.distance <= radius) // 確保在範圍內
      .sort((a: any, b: any) => a.distance - b.distance); // 按距離排序

    return attractionsWithDistance;
  } catch (error) {
    console.error('獲取附近景點失敗:', error);
    throw error;
  }
}

// 獲取今天的日期（僅日期部分，不包含時間）
function getTodayDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * 刷新主要任務
 * POST /api/footprint/refresh-main-task
 * body: { lat?: number, lon?: number, useAI?: boolean }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const body = await request.json().catch(() => ({}));
    const { lat, lon, useAI = false } = body || {};

    // 獲取用戶位置
    let userLat = lat;
    let userLon = lon;

    // 如果沒有提供位置，嘗試從資料庫獲取或使用預設值
    if (typeof userLat !== 'number' || typeof userLon !== 'number') {
      // 可以從 User 模型獲取 lastKnownLat/Lon（如果有的話）
      // 這裡使用預設位置（台北）
      userLat = 25.0330;
      userLon = 121.5654;
    }

    const today = getTodayDate();

    // 檢查用戶是否已有今天的主要任務
    const existingMainTask = await prisma.task.findFirst({
      where: {
        isMainTask: true,
        assignedUserId: userId,
        refreshDate: {
          gte: today,
        },
      },
    });

    // 如果已有今天的主要任務，直接返回
    if (existingMainTask) {
      return NextResponse.json({
        success: true,
        task: existingMainTask,
        refreshed: false,
        message: '今天的主要任務已存在',
      });
    }

    // 獲取附近景點
    let attractions;
    try {
      attractions = await fetchNearbyAttractions(userLat, userLon, 30000);
    } catch (error) {
      console.error('獲取景點失敗:', error);
      return NextResponse.json(
        { error: '無法獲取附近景點，請稍後再試' },
        { status: 500 }
      );
    }

    if (attractions.length === 0) {
      return NextResponse.json(
        { error: '附近沒有找到景點' },
        { status: 404 }
      );
    }

    // 隨機選擇一個景點（避免每次都選同一個）
    const selectedAttraction = attractions[Math.floor(Math.random() * Math.min(attractions.length, 5))];

    const placeName = selectedAttraction.name || '未知景點';
    const placeType = selectedAttraction.categories?.[0]?.name || '景點';
    const location = selectedAttraction.location?.formatted_address || 
                     selectedAttraction.location?.address || 
                     '未知位置';

    // 生成任務內容（根據 useAI 參數決定是否使用 AI）
    // 預設使用模板生成以節省成本
    const taskContent = useAI && process.env.OPENAI_API_KEY
      ? await generateTaskContentWithAI(placeName, placeType, location)
      : generateTaskContentFromTemplate(placeName, placeType, location);

    // 計算任務獎勵（根據距離調整，越遠獎勵越高）
    const baseReward = 50;
    const distanceBonus = Math.floor(selectedAttraction.distance / 1000) * 5; // 每公里 +5 幣
    const coinReward = Math.min(baseReward + distanceBonus, 200); // 最高 200 幣

    // 更新或建立主要任務
    let mainTask;
    
    // 先查找是否有舊的主要任務（需要更新）
    const oldMainTask = await prisma.task.findFirst({
      where: {
        isMainTask: true,
        assignedUserId: userId,
      },
    });

    if (oldMainTask) {
      // 更新現有任務
      mainTask = await prisma.task.update({
        where: { id: oldMainTask.id },
        data: {
          name: taskContent.name,
          description: taskContent.description,
          coordinate: `${selectedAttraction.lat},${selectedAttraction.lon}`,
          Coin: coinReward,
          refreshDate: today,
        },
      });
    } else {
      // 建立新任務
      mainTask = await prisma.task.create({
        data: {
          name: taskContent.name,
          description: taskContent.description,
          coordinate: `${selectedAttraction.lat},${selectedAttraction.lon}`,
          Coin: coinReward,
          isMainTask: true,
          assignedUserId: userId,
          refreshDate: today,
        },
      });
    }

    // 確保 UserTask 記錄存在
    const existingUserTask = await prisma.userTask.findUnique({
      where: {
        user_id_task_id: {
          user_id: userId,
          task_id: mainTask.id,
        },
      },
    });

    if (!existingUserTask) {
      await prisma.userTask.create({
        data: {
          user_id: userId,
          task_id: mainTask.id,
          isDone: false,
          Field: 'main_task',
        },
      });
    } else if (existingUserTask.isDone) {
      // 如果舊任務已完成，重置為未完成（讓用戶可以再次完成新任務）
      await prisma.userTask.update({
        where: { id: existingUserTask.id },
        data: { isDone: false },
      });
    }

    return NextResponse.json({
      success: true,
      task: mainTask,
      refreshed: true,
      usedAI: useAI && !!process.env.OPENAI_API_KEY,
      attraction: {
        name: placeName,
        distance: Math.round(selectedAttraction.distance),
      },
    });
  } catch (error: any) {
    console.error('刷新主要任務失敗:', error);
    return NextResponse.json(
      { error: '刷新主要任務失敗', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * 獲取當前主要任務
 * GET /api/footprint/refresh-main-task
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const today = getTodayDate();

    // 查找今天的主要任務
    const mainTask = await prisma.task.findFirst({
      where: {
        isMainTask: true,
        assignedUserId: userId,
        refreshDate: {
          gte: today,
        },
      },
      include: {
        userTasks: {
          where: {
            user_id: userId,
          },
        },
      },
    });

    if (!mainTask) {
      return NextResponse.json({
        success: true,
        task: null,
        needsRefresh: true,
      });
    }

    const userTask = mainTask.userTasks[0];
    const isDone = userTask?.isDone || false;

    return NextResponse.json({
      success: true,
      task: {
        ...mainTask,
        isDone,
      },
      needsRefresh: false,
    });
  } catch (error: any) {
    console.error('獲取主要任務失敗:', error);
    return NextResponse.json(
      { error: '獲取主要任務失敗' },
      { status: 500 }
    );
  }
}

