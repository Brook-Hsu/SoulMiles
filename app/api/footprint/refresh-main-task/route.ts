import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/middleware/auth';
import { successResponse, errorResponse, ApiErrors } from '../../../../lib/utils/api-response';
import type { FoursquarePlace, FoursquareAttraction } from '../../../../lib/types/foursquare';

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
    console.error('[fetchNearbyAttractions] Foursquare API key 未配置');
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
      const errorText = await response.text();
      console.error('[fetchNearbyAttractions] API 錯誤:', response.status, errorText);
      throw new Error(`Foursquare API error: ${response.status}`);
    }

    const data = await response.json() as { results?: FoursquarePlace[]; data?: FoursquarePlace[] };
    const results: FoursquarePlace[] = data.results || data.data || [];

    if (results.length === 0) {
      console.warn('[fetchNearbyAttractions] API 返回空結果');
      throw new Error('No attractions found');
    }

    // 計算距離並排序
    const attractionsWithDistance: FoursquareAttraction[] = results
      .filter((place: FoursquarePlace) => {
        const hasGeocode = place.geocodes?.main || place.latitude;
        if (!hasGeocode) {
          console.warn('[fetchNearbyAttractions] 景點缺少地理位置:', place.name);
        }
        return hasGeocode;
      })
      .map((place: FoursquarePlace): FoursquareAttraction => {
        // 兼容新舊 API 格式
        const placeLat = place.latitude || place.geocodes?.main?.latitude;
        const placeLon = place.longitude || place.geocodes?.main?.longitude;
        
        if (!placeLat || !placeLon) {
          throw new Error(`景點 ${place.name} 缺少有效的地理位置資訊`);
        }
        
        const distance = calculateDistance(lat, lon, placeLat, placeLon);
        
        return {
          ...place,
          distance,
          lat: placeLat,
          lon: placeLon,
        };
      })
      .filter((place) => place.distance <= radius) // 確保在範圍內
      .sort((a, b) => a.distance - b.distance); // 按距離排序

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

// 獲取7天前的日期（用於清理舊任務）
function getSevenDaysAgoDate(): Date {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  return sevenDaysAgo;
}

/**
 * 刷新主要任務
 * POST /api/footprint/refresh-main-task
 * body: { lat?: number, lon?: number, useAI?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
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
    const sevenDaysAgo = getSevenDaysAgoDate();

    // 清理超過7天的任務（包括主要任務和臨時任務）
    try {
      await prisma.task.deleteMany({
        where: {
          Create_time: {
            lt: sevenDaysAgo,
          },
        },
      });
    } catch (error) {
      console.error('清理舊任務失敗:', error);
      // 不中斷流程，繼續執行
    }

    // 檢查用戶當前的任務總數（7天內的任務）
    // 包括：1. 分配給用戶的主要任務（通過 assignedUserId） 2. 用戶有 UserTask 關聯的任務（包括臨時任務）
    const userMainTasks = await prisma.task.findMany({
      where: {
        isMainTask: true,
        assignedUserId: userId,
        Create_time: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        id: true,
      },
    });

    const userTemporaryTasks = await prisma.userTask.findMany({
      where: {
        user_id: userId,
        task: {
          Create_time: {
            gte: sevenDaysAgo,
          },
          isTemporary: true,
        },
      },
      select: {
        task_id: true,
      },
    });

    // 計算用戶可見的任務總數（主要任務 + 臨時任務）
    const currentTaskCount = userMainTasks.length + userTemporaryTasks.length;

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

    // 如果任務總數已經達到3個或以上，且今天的主要任務已存在，直接返回
    if (currentTaskCount >= 3 && existingMainTask) {
      return successResponse({
        task: existingMainTask,
        refreshed: false,
        currentTaskCount,
      }, '任務總數已達標');
    }

    // 如果任務總數少於3個，需要生成任務
    const tasksNeeded = Math.max(0, 3 - currentTaskCount);

    // 如果不需要生成任務，直接返回
    if (tasksNeeded === 0) {
      return successResponse({
        task: existingMainTask,
        refreshed: false,
        currentTaskCount,
      }, '任務總數已達標，無需生成新任務');
    }

    // 獲取附近景點
    let attractions;
    try {
      attractions = await fetchNearbyAttractions(userLat, userLon, 30000);
    } catch (error) {
      console.error('[refresh-main-task] 獲取景點失敗:', error);
      return ApiErrors.INTERNAL_ERROR('無法獲取附近景點，請稍後再試');
    }

    if (!attractions || attractions.length === 0) {
      return ApiErrors.NOT_FOUND('附近景點');
    }

    // 計算需要生成的任務數量（最多生成到3個任務）
    const tasksToGenerate = Math.max(1, Math.min(tasksNeeded, 3));

    const createdTasks = [];
    const usedAttractionIndices = new Set<number>();

    // 生成任務直到達到3個或沒有更多景點可用
    for (let i = 0; i < tasksToGenerate && usedAttractionIndices.size < attractions.length; i++) {
      // 隨機選擇一個未使用的景點
      let selectedIndex;
      do {
        selectedIndex = Math.floor(Math.random() * Math.min(attractions.length, 10));
      } while (usedAttractionIndices.has(selectedIndex) && usedAttractionIndices.size < attractions.length);
      
      usedAttractionIndices.add(selectedIndex);
      const selectedAttraction = attractions[selectedIndex];

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

      // 所有自動生成的任務都標記為主要任務
      const isMainTask = true;

      // 如果今天的主要任務不存在，且這是第一個要生成的任務，刪除用戶的舊主要任務（非今天的）
      if (i === 0 && !existingMainTask) {
        await prisma.task.deleteMany({
          where: {
            isMainTask: true,
            assignedUserId: userId,
            refreshDate: {
              lt: today,
            },
          },
        });
      }

      // 建立任務
      const task = await prisma.task.create({
        data: {
          name: taskContent.name,
          description: taskContent.description,
          coordinate: `${selectedAttraction.lat},${selectedAttraction.lon}`,
          Coin: coinReward,
          isMainTask: isMainTask,
          isShared: false, // 確保不是共享任務
          assignedUserId: userId,
          refreshDate: today,
        },
      });

      // 確保 UserTask 記錄存在
      const existingUserTask = await prisma.userTask.findUnique({
        where: {
          user_id_task_id: {
            user_id: userId,
            task_id: task.id,
          },
        },
      });

      if (!existingUserTask) {
        await prisma.userTask.create({
          data: {
            user_id: userId,
            task_id: task.id,
            isDone: false,
            Field: isMainTask ? 'main_task' : 'additional_task',
          },
        });
      } else if (existingUserTask.isDone) {
        // 如果舊任務已完成，重置為未完成（讓用戶可以再次完成新任務）
        await prisma.userTask.update({
          where: { id: existingUserTask.id },
          data: { isDone: false },
        });
      }

      createdTasks.push({
        task,
        attraction: {
          name: placeName,
          distance: Math.round(selectedAttraction.distance),
        },
      });
    }

    return successResponse({
      tasks: createdTasks,
      mainTask: createdTasks[0]?.task, // 第一個任務作為主要任務返回（向後兼容）
      refreshed: true,
      usedAI: useAI && !!process.env.OPENAI_API_KEY,
      currentTaskCount: currentTaskCount + createdTasks.length,
      tasksGenerated: createdTasks.length,
    });
  } catch (error) {
    console.error('[refresh-main-task] 刷新主要任務失敗:', error);
    
    // 如果是 API 錯誤回應（來自中間件），直接返回
    if (error && typeof error === 'object' && 'status' in error) {
      return error as ReturnType<typeof ApiErrors.UNAUTHORIZED>;
    }
    
    const errorMessage = error instanceof Error ? error.message : '未知錯誤';
    return errorResponse('刷新主要任務失敗', 500, errorMessage);
  }
}

/**
 * 獲取當前主要任務
 * GET /api/footprint/refresh-main-task
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth(request);
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
      return successResponse({
        task: null,
        needsRefresh: true,
      });
    }

    const userTask = mainTask.userTasks[0];
    const isDone = userTask?.isDone || false;

    return successResponse({
      task: {
        ...mainTask,
        isDone,
      },
      needsRefresh: false,
    });
  } catch (error) {
    console.error('獲取主要任務失敗:', error);
    
    // 如果是 API 錯誤回應（來自中間件），直接返回
    if (error && typeof error === 'object' && 'status' in error) {
      return error as ReturnType<typeof ApiErrors.UNAUTHORIZED>;
    }
    
    return ApiErrors.INTERNAL_ERROR('獲取主要任務失敗');
  }
}

