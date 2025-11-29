import { NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';

/**
 * 計算出遊合適度並轉換為懸賞金額
 * 考慮因素：
 * 1. 天氣（30%）：溫度適宜度、是否晴天
 * 2. 交通便利性（25%）：最近交通站點距離
 * 3. 時間因素（20%）：星期幾、時段
 * 4. 周邊設施（15%）：住宿、餐廳可用性
 * 5. 人潮狀況（10%）：景區人潮等級
 */

// 計算兩點之間的距離（Haversine 公式，返回公尺）
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 地球半徑（公尺）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 計算天氣合適度（0-100）
function calculateWeatherScore(weatherData) {
  if (!weatherData) return 50; // 預設中等

  let score = 50; // 基礎分數

  // 溫度適宜度（15-30度為最佳）
  const temp = parseFloat(weatherData.temperature) || 25;
  if (temp >= 18 && temp <= 28) {
    score += 30; // 最適宜溫度
  } else if (temp >= 15 && temp <= 30) {
    score += 20; // 良好溫度
  } else if (temp >= 10 && temp <= 35) {
    score += 10; // 可接受溫度
  } else {
    score -= 10; // 溫度不適宜
  }

  // 是否晴天（晴天加分）
  if (weatherData.isSunny) {
    score += 20;
  } else {
    score -= 10; // 陰雨天減分
  }

  return Math.max(0, Math.min(100, score));
}

// 計算交通便利性分數（0-100）
function calculateTransportScore(transportData, userLocation) {
  if (!transportData || !userLocation) return 50; // 預設中等

  let score = 0;
  let availableCount = 0;

  // 檢查各種交通方式的距離
  const transportTypes = [
    { data: transportData.train, weight: 0.4, name: '火車站' },
    { data: transportData.bus, weight: 0.35, name: '公車站' },
    { data: transportData.youbike, weight: 0.25, name: 'YouBike' },
  ];

  transportTypes.forEach(({ data, weight }) => {
    if (data && data.distance !== null && data.distance !== undefined) {
      availableCount++;
      const distance = data.distance;
      
      // 距離越近分數越高
      if (distance <= 200) {
        score += weight * 100; // 200公尺內：滿分
      } else if (distance <= 500) {
        score += weight * 80; // 500公尺內：80分
      } else if (distance <= 1000) {
        score += weight * 60; // 1公里內：60分
      } else if (distance <= 2000) {
        score += weight * 40; // 2公里內：40分
      } else {
        score += weight * 20; // 超過2公里：20分
      }
    }
  });

  // 如果沒有任何交通方式，給基礎分數
  if (availableCount === 0) {
    return 30;
  }

  // 如果有至少一種交通方式，給予額外加分
  if (availableCount >= 2) {
    score += 10; // 多種交通方式加分
  }

  return Math.max(0, Math.min(100, score));
}

// 計算時間因素分數（0-100）
function calculateTimeScore() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = 週日, 1 = 週一, ..., 6 = 週六
  const hour = now.getHours();
  
  let score = 50; // 基礎分數

  // 星期因素
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    score += 20; // 週末加分
  } else if (dayOfWeek === 5) {
    score += 10; // 週五加分
  } else {
    score -= 5; // 平日減分
  }

  // 時段因素（10-18點為最佳出遊時段）
  if (hour >= 10 && hour <= 18) {
    score += 20; // 白天時段
  } else if (hour >= 8 && hour <= 20) {
    score += 10; // 可接受時段
  } else {
    score -= 10; // 非出遊時段
  }

  // 季節因素（簡單判斷，3-5月、9-11月為最佳）
  const month = now.getMonth() + 1; // 1-12
  if ((month >= 3 && month <= 5) || (month >= 9 && month <= 11)) {
    score += 10; // 春秋季節
  } else if (month === 6 || month === 7 || month === 8) {
    score += 5; // 夏季
  } else {
    score -= 5; // 冬季
  }

  return Math.max(0, Math.min(100, score));
}

// 計算周邊設施分數（0-100）
function calculateFacilityScore(recommendations) {
  if (!recommendations) return 50; // 預設中等

  let score = 50;
  
  // 住宿可用性
  const lodgingCount = recommendations.lodging?.length || 0;
  if (lodgingCount >= 3) {
    score += 10;
  } else if (lodgingCount >= 1) {
    score += 5;
  }

  // 餐廳可用性
  const restaurantCount = recommendations.restaurant?.length || 0;
  if (restaurantCount >= 3) {
    score += 10;
  } else if (restaurantCount >= 1) {
    score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

// 計算人潮狀況分數（0-100）
function calculateCrowdScore(crowdData) {
  if (!crowdData || typeof crowdData !== 'object') return 50; // 預設中等

  const crowdLevel = crowdData.crowdLevel;
  
  if (crowdLevel === null || crowdLevel === undefined) {
    return 50; // 無法取得資料，給中等分數
  }

  // 人潮等級 0-4，0=很少人，4=非常擁擠
  // 適中的人潮（1-2級）最適合出遊
  if (crowdLevel <= 1) {
    return 80; // 人少，適合出遊
  } else if (crowdLevel === 2) {
    return 70; // 適中人潮
  } else if (crowdLevel === 3) {
    return 40; // 人多，不太適合
  } else {
    return 20; // 非常擁擠，不適合
  }
}

// 將合適度百分比轉換為懸賞金額（1000-1,000,000）
function convertScoreToBounty(score) {
  // score 是 0-100 的合適度百分比
  // 轉換為 1000-1,000,000 的懸賞金額
  // 使用指數曲線，讓高分數有更大的金額差異
  const minBounty = 1000;
  const maxBounty = 1000000;
  
  // 使用平方函數讓高分數更突出
  const normalizedScore = score / 100; // 0-1
  const bounty = minBounty + (maxBounty - minBounty) * (normalizedScore * normalizedScore);
  
  return Math.round(bounty);
}

export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: '未登入' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json({ error: '缺少位置資訊' }, { status: 400 });
    }

    // 構建基礎 URL（用於內部 API 調用）
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
    
    // 並行獲取所有需要的資料
    const [weatherRes, trainRes, busRes, bikeRes, lodgingRes, restaurantRes, crowdRes] = await Promise.all([
      fetch(`${baseUrl}/api/weather?lat=${lat}&lon=${lon}`).catch(() => null),
      fetch(`${baseUrl}/api/places?lat=${lat}&lon=${lon}&type=train_station&radius=2000`).catch(() => null),
      fetch(`${baseUrl}/api/places?lat=${lat}&lon=${lon}&type=bus_station&radius=2000`).catch(() => null),
      fetch(`${baseUrl}/api/places?lat=${lat}&lon=${lon}&type=bicycle_rental&radius=2000`).catch(() => null),
      fetch(`${baseUrl}/api/places?lat=${lat}&lon=${lon}&type=lodging&radius=5000`).catch(() => null),
      fetch(`${baseUrl}/api/places?lat=${lat}&lon=${lon}&type=restaurant&radius=5000`).catch(() => null),
      fetch(`${baseUrl}/api/places?lat=${lat}&lon=${lon}&type=tourist_attraction&radius=5000`).catch(() => null),
    ]);

    // 解析回應
    const weatherData = weatherRes?.ok ? await weatherRes.json().catch(() => null) : null;
    const trainData = trainRes?.ok ? await trainRes.json().catch(() => null) : null;
    const busData = busRes?.ok ? await busRes.json().catch(() => null) : null;
    const bikeData = bikeRes?.ok ? await bikeRes.json().catch(() => null) : null;
    const lodgingData = lodgingRes?.ok ? await lodgingRes.json().catch(() => null) : null;
    const restaurantData = restaurantRes?.ok ? await restaurantRes.json().catch(() => null) : null;
    const crowdData = crowdRes?.ok ? await crowdRes.json().catch(() => null) : null;

    // 整理資料
    const transportData = {
      train: trainData?.places?.[0] || null,
      bus: busData?.places?.[0] || null,
      youbike: bikeData?.places?.[0] || null,
    };

    const recommendations = {
      lodging: lodgingData?.places?.slice(0, 3) || [],
      restaurant: restaurantData?.places?.slice(0, 3) || [],
    };

    const crowdInfo = crowdData?.places?.[0] || null;

    // 計算各項分數
    const weatherScore = calculateWeatherScore(weatherData);
    const transportScore = calculateTransportScore(transportData, { lat: parseFloat(lat), lon: parseFloat(lon) });
    const timeScore = calculateTimeScore();
    const facilityScore = calculateFacilityScore(recommendations);
    const crowdScore = calculateCrowdScore(crowdInfo);

    // 加權計算總分
    const weights = {
      weather: 0.30,    // 天氣 30%
      transport: 0.25, // 交通 25%
      time: 0.20,      // 時間 20%
      facility: 0.15,  // 設施 15%
      crowd: 0.10,     // 人潮 10%
    };

    const totalScore = 
      weatherScore * weights.weather +
      transportScore * weights.transport +
      timeScore * weights.time +
      facilityScore * weights.facility +
      crowdScore * weights.crowd;

    // 轉換為懸賞金額
    const bountyAmount = convertScoreToBounty(totalScore);

    return NextResponse.json({
      bountyAmount,
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown: {
        weather: {
          score: Math.round(weatherScore * 100) / 100,
          weight: weights.weather,
          contribution: Math.round(weatherScore * weights.weather * 100) / 100,
        },
        transport: {
          score: Math.round(transportScore * 100) / 100,
          weight: weights.transport,
          contribution: Math.round(transportScore * weights.transport * 100) / 100,
        },
        time: {
          score: Math.round(timeScore * 100) / 100,
          weight: weights.time,
          contribution: Math.round(timeScore * weights.time * 100) / 100,
        },
        facility: {
          score: Math.round(facilityScore * 100) / 100,
          weight: weights.facility,
          contribution: Math.round(facilityScore * weights.facility * 100) / 100,
        },
        crowd: {
          score: Math.round(crowdScore * 100) / 100,
          weight: weights.crowd,
          contribution: Math.round(crowdScore * weights.crowd * 100) / 100,
        },
      },
    });
  } catch (error) {
    console.error('計算懸賞金額失敗:', error);
    // 發生錯誤時返回預設值
    return NextResponse.json({
      bountyAmount: 50000,
      totalScore: 50,
      breakdown: null,
    });
  }
}

