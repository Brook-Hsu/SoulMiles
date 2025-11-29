import { NextResponse } from 'next/server';

/**
 * 獲取附近地點數據 API Route
 * - 餐廳 (restaurant): 使用 OpenStreetMap Overpass API
 * - 住宿 (lodging): 使用 OpenStreetMap Overpass API
 * - 火車站 (train_station): 使用 OpenStreetMap Overpass API
 * - 公車站 (bus_station): 使用 OpenStreetMap Overpass API
 * - YouBike 租借站 (bicycle_rental): 使用 OpenStreetMap Overpass API
 * - 景區 (tourist_attraction): 使用 Foursquare Places API
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

// 從 Foursquare 資料計算人潮等級
function calculateCrowdLevelFromFoursquare(place, placeDetails) {
  // 方法 1: 使用 popularity 欄位（如果可用）
  if (place.popularity !== undefined && place.popularity !== null) {
    // popularity 通常是 0-1 之間的值，轉換為百分比
    const percentage = place.popularity * 100;
    return getCrowdLevelFromPercentage(percentage);
  }

  // 方法 2: 使用 placeDetails 中的 stats 或 popularity
  if (placeDetails) {
    // 檢查是否有當前人流資訊
    if (placeDetails.popularity) {
      const percentage = placeDetails.popularity * 100;
      return getCrowdLevelFromPercentage(percentage);
    }
    
    // 檢查是否有 stats 資料
    if (placeDetails.stats && placeDetails.stats.total_ratings) {
      // 根據評分數估算人氣
      const ratingCount = placeDetails.stats.total_ratings;
      let estimatedPercentage = 40; // 預設中等
      
      if (ratingCount >= 10000) {
        estimatedPercentage = 75;
      } else if (ratingCount >= 1000) {
        estimatedPercentage = 60;
      } else if (ratingCount >= 100) {
        estimatedPercentage = 45;
      } else {
        estimatedPercentage = 30;
      }
      
      // 根據當前時間調整
      const now = new Date();
      const currentDay = now.getDay();
      const currentHour = now.getHours();
      
      if (currentDay === 5 && currentHour >= 18) {
        estimatedPercentage += 15;
      } else if (currentDay === 6) {
        estimatedPercentage += 20;
      } else if (currentDay === 0) {
        estimatedPercentage += 15;
      }
      
      estimatedPercentage = Math.min(100, estimatedPercentage);
      return getCrowdLevelFromPercentage(estimatedPercentage);
    }
  }

  // 方法 3: 使用評分數估算（從 place 物件）
  if (place.rating && place.rating >= 0) {
    // 評分通常影響人氣
    const rating = place.rating;
    let estimatedPercentage = 40;
    
    if (rating >= 9.0) {
      estimatedPercentage = 70;
    } else if (rating >= 8.0) {
      estimatedPercentage = 60;
    } else if (rating >= 7.0) {
      estimatedPercentage = 50;
    } else if (rating >= 6.0) {
      estimatedPercentage = 40;
    } else {
      estimatedPercentage = 30;
    }
    
    return getCrowdLevelFromPercentage(estimatedPercentage);
  }

  // 方法 4: 根據時間估算（作為備用方案）
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  
  let estimatedPercentage = 40; // 預設中等
  
  if (currentDay === 5 && currentHour >= 18) {
    estimatedPercentage = 70;
  } else if (currentDay === 6) {
    estimatedPercentage = 75;
  } else if (currentDay === 0) {
    estimatedPercentage = 65;
  } else if (currentDay >= 1 && currentDay <= 4) {
    if (currentHour >= 10 && currentHour <= 17) {
      estimatedPercentage = 45;
    } else {
      estimatedPercentage = 25;
    }
  }

  return getCrowdLevelFromPercentage(estimatedPercentage);
}

// 根據百分比計算人潮等級
function getCrowdLevelFromPercentage(percentage) {
  let level, levelText;
  
  if (percentage >= 0 && percentage <= 20) {
    level = 0;
    levelText = '很少人';
  } else if (percentage > 20 && percentage <= 40) {
    level = 1;
    levelText = '少數人';
  } else if (percentage > 40 && percentage <= 60) {
    level = 2;
    levelText = '中度擁擠';
  } else if (percentage > 60 && percentage <= 80) {
    level = 3;
    levelText = '很多人';
  } else if (percentage > 80 && percentage <= 100) {
    level = 4;
    levelText = '非常擁擠';
  } else {
    level = null;
    levelText = '無法取得';
  }
  
  return {
    level,
    levelText,
    percentage: Math.round(percentage),
  };
}

// 解析營業時間並判斷當前是否營業（簡化版本）
function isCurrentlyOpen(openingHours) {
  if (!openingHours || openingHours.trim() === '') {
    // 如果沒有營業時間資訊，假設是營業中
    return true;
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0 = 週日, 1 = 週一, ..., 6 = 週六
  const currentTime = now.getHours() * 100 + now.getMinutes(); // 例如 1430 = 14:30

  // 將週日轉換為 7 以便排序（Mo=1, Tu=2, ..., Su=7）
  const dayMap = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
  const currentDayOSM = dayMap[currentDay];

  const dayNames = {
    'Mo': 1, 'Tu': 2, 'We': 3, 'Th': 4, 'Fr': 5, 'Sa': 6, 'Su': 7
  };

  // 檢查是否為 24/7
  if (openingHours.toLowerCase().includes('24/7') || 
      openingHours.toLowerCase().includes('24 hours') ||
      openingHours.toLowerCase().includes('always open')) {
    return true;
  }

  // 處理多個時間段（用分號分隔）
  const timeSlots = openingHours.split(';').map(s => s.trim());
  
  for (const slot of timeSlots) {
    // 匹配格式如 "Mo-Fr 09:00-17:00" 或 "Mo-Su 22:00-02:00"
    const match = slot.match(/([A-Za-z]+)-([A-Za-z]+)\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
    if (match) {
      const startDay = dayNames[match[1]] || 1;
      const endDay = dayNames[match[2]] || 7;
      const startTime = parseInt(match[3]) * 100 + parseInt(match[4]);
      const endTime = parseInt(match[5]) * 100 + parseInt(match[6]);

      // 檢查當前日期是否在範圍內
      const dayInRange = (currentDayOSM >= startDay && currentDayOSM <= endDay) ||
                        (startDay > endDay && (currentDayOSM >= startDay || currentDayOSM <= endDay));

      if (dayInRange) {
        // 處理跨日期時間段（例如 22:00-02:00）
        if (endTime < startTime) {
          // 跨日：當前時間在開始時間之後，或在結束時間之前
          if (currentTime >= startTime || currentTime <= endTime) {
            return true;
          }
        } else {
          // 正常時間段：當前時間在範圍內
          if (currentTime >= startTime && currentTime <= endTime) {
            return true;
          }
        }
      }
    }
  }

  // 如果無法解析，假設營業中（避免過濾掉太多餐廳，因為很多 OSM 資料可能沒有完整的營業時間）
  return true;
}

// 從 OSM 元素提取座標
function getCoordinates(element) {
  if (element.type === 'node') {
    return { lat: element.lat, lon: element.lon };
  } else if (element.type === 'way' || element.type === 'relation') {
    // 對於 way 和 relation，使用 center 屬性（由 out center 提供）
    if (element.center) {
      return { lat: element.center.lat, lon: element.center.lon };
    }
    // 備用方案：如果有 lat/lon（某些情況下可能直接提供）
    if (element.lat && element.lon) {
      return { lat: element.lat, lon: element.lon };
    }
  }
  return null;
}

// 使用 OSM Overpass API 查詢住宿
async function fetchLodgingsFromOSM(lat, lon, radius) {
  try {
    // Overpass QL 查詢語句 - 查詢各種類型的住宿
    const overpassQuery = `
[out:json][timeout:25];
(
  node["tourism"="hotel"](around:${radius},${lat},${lon});
  way["tourism"="hotel"](around:${radius},${lat},${lon});
  relation["tourism"="hotel"](around:${radius},${lat},${lon});
  node["tourism"="hostel"](around:${radius},${lat},${lon});
  way["tourism"="hostel"](around:${radius},${lat},${lon});
  relation["tourism"="hostel"](around:${radius},${lat},${lon});
  node["tourism"="guest_house"](around:${radius},${lat},${lon});
  way["tourism"="guest_house"](around:${radius},${lat},${lon});
  relation["tourism"="guest_house"](around:${radius},${lat},${lon});
  node["tourism"="apartment"](around:${radius},${lat},${lon});
  way["tourism"="apartment"](around:${radius},${lat},${lon});
  relation["tourism"="apartment"](around:${radius},${lat},${lon});
  node["amenity"="hotel"](around:${radius},${lat},${lon});
  way["amenity"="hotel"](around:${radius},${lat},${lon});
  relation["amenity"="hotel"](around:${radius},${lat},${lon});
);
out center meta;
`;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: overpassQuery
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    // 處理結果
    const lodgings = [];

    for (const element of elements) {
      if (!element.tags || !element.tags.name) continue;

      const coords = getCoordinates(element);
      if (!coords || !coords.lat || !coords.lon) continue;

      // 計算距離
      const distance = calculateDistance(parseFloat(lat), parseFloat(lon), coords.lat, coords.lon);

      lodgings.push({
        name: element.tags.name,
        lat: coords.lat,
        lon: coords.lon,
        distance: Math.round(distance),
        vicinity: element.tags['addr:full'] || 
                  `${element.tags['addr:street'] || ''} ${element.tags['addr:housenumber'] || ''}`.trim() ||
                  element.tags['addr:city'] ||
                  '',
        phone: element.tags.phone || '',
        website: element.tags.website || '',
        tourism_type: element.tags.tourism || element.tags.amenity || '',
      });
    }

    // 按距離排序
    lodgings.sort((a, b) => a.distance - b.distance);
    return lodgings;

  } catch (error) {
    console.error('Error fetching lodgings from OSM:', error);
    return [];
  }
}

// 使用 Travelpayouts API 檢查空房狀態
// Travelpayouts API 文檔：https://support.travelpayouts.com/hc/en-us/categories/200358578-API-and-data
async function checkAvailabilityWithTravelpayouts(lodging, checkInDate, checkOutDate) {
  // 優先使用環境變數，如果沒有則使用提供的 token（建議將 token 移到 .env.local）
  const TRAVELPAYOUTS_API_TOKEN = process.env.TRAVELPAYOUTS_API_TOKEN;
  
  if (!TRAVELPAYOUTS_API_TOKEN) {
    // 如果沒有 API Token，返回 true（假設有空房，避免過度過濾）
    return { hasRooms: true, price: null, source: 'osm' };
  }

  try {
    // Travelpayouts Data API 端點
    // 使用酒店價格搜尋 API，根據位置和日期查詢
    // 注意：Travelpayouts 主要提供價格資訊，而非直接的空房狀態
    // 如果有價格資訊，通常表示可能有空房
    
    // 方法 1: 使用酒店價格 API（根據座標搜尋）
    // Travelpayouts 的 API 可能需要先找到酒店 ID，然後查詢價格
    // 這裡先嘗試使用位置搜尋
    
    // 嘗試使用 Travelpayouts 的酒店搜尋 API
    // 注意：實際端點可能需要根據官方文檔調整
    const searchUrl = `https://api.travelpayouts.com/v1/city-directions`;
    
    // 由於 Travelpayouts API 可能需要不同的參數格式
    // 先嘗試使用酒店價格查詢 API
    // 如果 API 端點不同，需要根據實際文檔調整
    
    // 方法 2: 使用酒店價格 API（需要酒店 ID 或位置）
    // 由於我們有座標，嘗試根據座標搜尋附近的酒店
    const params = new URLSearchParams({
      token: TRAVELPAYOUTS_API_TOKEN,
      origin: 'iata', // 可能需要 IATA 代碼，但我們有座標
      destination: 'iata',
      // 或者使用座標
      // lat: lodging.lat.toString(),
      // lon: lodging.lon.toString(),
    });

    // 由於 Travelpayouts 的 API 結構可能不同，先實作一個基礎版本
    // 實際使用時可能需要：
    // 1. 先搜尋酒店 ID（根據名稱或位置）
    // 2. 然後查詢該酒店的價格和空房狀態
    
    // 目前先使用簡化邏輯：
    // 如果有聯絡資訊（電話或網站），認為可能有空房資訊可查詢
    const hasContactInfo = !!(lodging.phone || lodging.website);
    
    if (!hasContactInfo) {
      // 沒有聯絡資訊的住宿，跳過 Travelpayouts 檢查
      return { hasRooms: true, price: null, source: 'osm' };
    }

    // 嘗試呼叫 Travelpayouts API
    // 注意：實際 API 端點和參數格式需要根據官方文檔調整
    // 這裡提供一個框架，可以根據實際 API 回應調整
    
    // 範例：使用酒店價格 API
    // const priceUrl = `https://api.travelpayouts.com/v1/hotels/prices`;
    // const priceParams = new URLSearchParams({
    //   token: TRAVELPAYOUTS_API_TOKEN,
    //   location: `${lodging.lat},${lodging.lon}`,
    //   checkIn: checkInDate,
    //   checkOut: checkOutDate,
    // });
    
    // const response = await fetch(`${priceUrl}?${priceParams.toString()}`, {
    //   method: 'GET',
    //   headers: {
    //     'Accept': 'application/json',
    //   },
    // });
    
    // if (response.ok) {
    //   const data = await response.json();
    //   // 解析回應，檢查是否有價格資訊（表示可能有空房）
    //   if (data.results && data.results.length > 0) {
    //     const hotel = data.results[0];
    //     return {
    //       hasRooms: true, // 有價格資訊通常表示有空房
    //       price: hotel.price || null,
    //       currency: hotel.currency || 'USD',
    //       source: 'travelpayouts',
    //     };
    //   }
    // }

    // 目前先返回有聯絡資訊的住宿（假設可能有空房）
    // 未來可以根據實際 API 回應調整
    return { hasRooms: true, price: null, source: 'osm_with_contact' };

  } catch (error) {
    console.error('Error checking availability with Travelpayouts:', error);
    // 發生錯誤時，返回 true（假設有空房，避免過度過濾）
    return { hasRooms: true, price: null, source: 'osm' };
  }
}

// 使用 OSM Overpass API 查詢火車站
async function fetchTrainStationsFromOSM(lat, lon, radius) {
  try {
    const overpassQuery = `
[out:json][timeout:25];
(
  node["railway"="station"](around:${radius},${lat},${lon});
  way["railway"="station"](around:${radius},${lat},${lon});
  relation["railway"="station"](around:${radius},${lat},${lon});
  node["public_transport"="station"]["railway"="rail"](around:${radius},${lat},${lon});
  way["public_transport"="station"]["railway"="rail"](around:${radius},${lat},${lon});
);
out center meta;
`;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: overpassQuery
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    const stations = [];

    for (const element of elements) {
      const coords = getCoordinates(element);
      if (!coords || !coords.lat || !coords.lon) continue;

      const distance = calculateDistance(parseFloat(lat), parseFloat(lon), coords.lat, coords.lon);

      stations.push({
        name: element.tags?.name || element.tags?.['name:zh'] || '火車站',
        lat: coords.lat,
        lon: coords.lon,
        distance: Math.round(distance),
        vicinity: element.tags?.['addr:full'] || 
                  `${element.tags?.['addr:street'] || ''} ${element.tags?.['addr:housenumber'] || ''}`.trim() ||
                  element.tags?.['addr:city'] || '',
      });
    }

    stations.sort((a, b) => a.distance - b.distance);
    return stations;

  } catch (error) {
    console.error('Error fetching train stations from OSM:', error);
    return [];
  }
}

// 使用 OSM Overpass API 查詢公車站
async function fetchBusStationsFromOSM(lat, lon, radius) {
  try {
    const overpassQuery = `
[out:json][timeout:25];
(
  node["public_transport"="platform"]["bus"="yes"](around:${radius},${lat},${lon});
  way["public_transport"="platform"]["bus"="yes"](around:${radius},${lat},${lon});
  node["highway"="bus_stop"](around:${radius},${lat},${lon});
  node["amenity"="bus_station"](around:${radius},${lat},${lon});
  way["amenity"="bus_station"](around:${radius},${lat},${lon});
);
out center meta;
`;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: overpassQuery
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    const stations = [];

    for (const element of elements) {
      const coords = getCoordinates(element);
      if (!coords || !coords.lat || !coords.lon) continue;

      const distance = calculateDistance(parseFloat(lat), parseFloat(lon), coords.lat, coords.lon);

      stations.push({
        name: element.tags?.name || element.tags?.['name:zh'] || '公車站',
        lat: coords.lat,
        lon: coords.lon,
        distance: Math.round(distance),
        vicinity: element.tags?.['addr:full'] || 
                  `${element.tags?.['addr:street'] || ''} ${element.tags?.['addr:housenumber'] || ''}`.trim() ||
                  element.tags?.['addr:city'] || '',
      });
    }

    stations.sort((a, b) => a.distance - b.distance);
    return stations;

  } catch (error) {
    console.error('Error fetching bus stations from OSM:', error);
    return [];
  }
}

// 使用 OSM Overpass API 查詢 YouBike 租借站
async function fetchYouBikeStationsFromOSM(lat, lon, radius) {
  try {
    const overpassQuery = `
[out:json][timeout:25];
(
  node["amenity"="bicycle_rental"]["network"="YouBike"](around:${radius},${lat},${lon});
  node["amenity"="bicycle_rental"]["operator"="YouBike"](around:${radius},${lat},${lon});
  node["amenity"="bicycle_rental"](around:${radius},${lat},${lon});
  way["amenity"="bicycle_rental"](around:${radius},${lat},${lon});
);
out center meta;
`;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: overpassQuery
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    const stations = [];

    for (const element of elements) {
      const coords = getCoordinates(element);
      if (!coords || !coords.lat || !coords.lon) continue;

      const distance = calculateDistance(parseFloat(lat), parseFloat(lon), coords.lat, coords.lon);

      stations.push({
        name: element.tags?.name || element.tags?.['name:zh'] || 'YouBike 站',
        lat: coords.lat,
        lon: coords.lon,
        distance: Math.round(distance),
        vicinity: element.tags?.['addr:full'] || 
                  `${element.tags?.['addr:street'] || ''} ${element.tags?.['addr:housenumber'] || ''}`.trim() ||
                  element.tags?.['addr:city'] || '',
      });
    }

    stations.sort((a, b) => a.distance - b.distance);
    return stations;

  } catch (error) {
    console.error('Error fetching YouBike stations from OSM:', error);
    return [];
  }
}

// 使用 OSM Overpass API 查詢餐廳
async function fetchRestaurantsFromOSM(lat, lon, radius) {
  try {
    // Overpass QL 查詢語句
    // 使用 out center 來取得 way 和 relation 的中心點座標
    const overpassQuery = `
[out:json][timeout:25];
(
  node["amenity"="restaurant"](around:${radius},${lat},${lon});
  way["amenity"="restaurant"](around:${radius},${lat},${lon});
  relation["amenity"="restaurant"](around:${radius},${lat},${lon});
);
out center meta;
`;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: overpassQuery
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    // 處理結果
    const restaurants = [];

    for (const element of elements) {
      if (!element.tags || !element.tags.name) continue;

      const coords = getCoordinates(element);
      if (!coords || !coords.lat || !coords.lon) continue;

      // 計算距離
      const distance = calculateDistance(parseFloat(lat), parseFloat(lon), coords.lat, coords.lon);

      // 檢查營業狀態
      const openingHours = element.tags.opening_hours || '';
      const isOpen = isCurrentlyOpen(openingHours);

      // 只保留營業中的餐廳
      if (isOpen) {
        restaurants.push({
          name: element.tags.name,
          lat: coords.lat,
          lon: coords.lon,
          distance: Math.round(distance),
          vicinity: element.tags['addr:full'] || 
                    `${element.tags['addr:street'] || ''} ${element.tags['addr:housenumber'] || ''}`.trim() ||
                    element.tags['addr:city'] ||
                    '',
          opening_hours: openingHours,
          phone: element.tags.phone || '',
          website: element.tags.website || '',
        });
      }
    }

    // 按距離排序，取最近 3 家
    restaurants.sort((a, b) => a.distance - b.distance);
    return restaurants.slice(0, 3);

  } catch (error) {
    console.error('Error fetching restaurants from OSM:', error);
    return [];
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const type = searchParams.get('type'); // e.g., 'lodging', 'restaurant', 'bus_station'
  const radius = searchParams.get('radius') || '5000'; // default 5km

  if (!lat || !lon || !type) {
    return NextResponse.json({ error: 'Latitude, longitude, and type are required' }, { status: 400 });
  }

  // 如果是餐廳，使用 OSM Overpass API
  if (type === 'restaurant') {
    try {
      const restaurants = await fetchRestaurantsFromOSM(lat, lon, radius);
      // 轉換為與 Google Places API 相同的格式，保持相容性
      const places = restaurants.map(restaurant => ({
        name: restaurant.name,
        rating: null, // OSM 通常沒有評分
        vicinity: restaurant.vicinity || `${Math.round(restaurant.distance)}m`,
        distance: restaurant.distance,
        lat: restaurant.lat,
        lon: restaurant.lon,
        opening_hours: restaurant.opening_hours,
        phone: restaurant.phone,
        website: restaurant.website,
      }));

      return NextResponse.json({ places });
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      return NextResponse.json({ places: [] });
    }
  }

  // 如果是住宿，使用 OSM Overpass API + Travelpayouts API
  if (type === 'lodging') {
    try {
      // 先從 OSM 取得附近住宿
      const lodgings = await fetchLodgingsFromOSM(lat, lon, radius);
      
      // 設定查詢日期（今晚入住，明晚退房）
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      
      const checkInDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
      const checkOutDate = dayAfter.toISOString().split('T')[0]; // YYYY-MM-DD

      // 對於前 10-15 個住宿，使用 Travelpayouts API 檢查空房狀態
      // 限制數量以減少 API 呼叫
      const lodgingsToCheck = lodgings.slice(0, 15);
      const availabilityResults = await Promise.all(
        lodgingsToCheck.map(async (lodging) => {
          const availability = await checkAvailabilityWithTravelpayouts(lodging, checkInDate, checkOutDate);
          return {
            ...lodging,
            hasRooms: availability.hasRooms,
            price: availability.price,
            currency: availability.currency,
          };
        })
      );

      // 過濾有空房的住宿
      // 優先保留有明確空房資訊的，其次是有聯絡資訊的（表示可能有空房資訊可查詢）
      const availableLodgings = availabilityResults.filter(lodging => {
        // 如果有明確的空房資訊，使用它
        if (lodging.hasRooms === false) {
          return false; // 明確沒有空房，過濾掉
        }
        // 如果有空房或來源為 travelpayouts（表示已檢查過），保留
        if (lodging.hasRooms === true && lodging.source === 'travelpayouts') {
          return true;
        }
        // 如果有聯絡方式（電話或網站），認為可能有空房
        return lodging.phone || lodging.website;
      });

      // 對於沒有檢查的住宿（超過前 15 個的），優先選擇有聯絡資訊的
      const remainingLodgings = lodgings.slice(15)
        .filter(lodging => lodging.phone || lodging.website)
        .map(lodging => ({ ...lodging, hasRooms: true, source: 'osm' }));

      // 合併結果並排序
      // 優先順序：1. 有明確空房資訊的（Travelpayouts 檢查過） 2. 有聯絡資訊的
      const allAvailableLodgings = [...availableLodgings, ...remainingLodgings]
        .sort((a, b) => {
          // 先按距離排序
          if (a.distance !== b.distance) {
            return a.distance - b.distance;
          }
          // 距離相同時，優先顯示有明確空房資訊的
          if (a.source === 'travelpayouts' && b.source !== 'travelpayouts') return -1;
          if (b.source === 'travelpayouts' && a.source !== 'travelpayouts') return 1;
          return 0;
        })
        .slice(0, 3); // 只返回最近 3 間

      // 轉換為與 Google Places API 相同的格式，保持相容性
      const places = allAvailableLodgings.map(lodging => ({
        name: lodging.name,
        rating: null, // OSM 通常沒有評分
        vicinity: lodging.vicinity || `${Math.round(lodging.distance)}m`,
        distance: lodging.distance,
        lat: lodging.lat,
        lon: lodging.lon,
        phone: lodging.phone,
        website: lodging.website,
        price: lodging.price,
        currency: lodging.currency,
        hasRooms: lodging.hasRooms, // 空房狀態
        availabilitySource: lodging.source || 'osm', // 空房資訊來源
      }));

      return NextResponse.json({ places });
    } catch (error) {
      console.error('Error fetching lodgings:', error);
      return NextResponse.json({ places: [] });
    }
  }

  // 如果是景區，使用 Foursquare Places API
  if (type === 'tourist_attraction') {
    const FOURSQUARE_API_KEY = process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY || 
                                process.env.FOURSQUARE_API_KEY;
    
    if (!FOURSQUARE_API_KEY) {
      console.warn('Foursquare API key not configured');
      return NextResponse.json({ places: [] });
    }

    try {
      // 使用 Foursquare Places API 搜尋附近景區
      // 注意：根據 Foursquare API 遷移指南，可能需要使用新的端點格式
      // 如果此端點仍然返回 410，請參考遷移指南更新端點 URL
      const searchUrl = `https://places-api.foursquare.com/places/search`;
      
      const searchParams = new URLSearchParams({
        ll: `${lat},${lon}`, // 經緯度
        radius: parseInt(radius), // 搜尋半徑（公尺）
        categories: '16000,10000', // 景區和戶外景點類別
        limit: '1', // 只取最近的 1 個景區
      });
      
      // 注意：sort 參數已被移除，因為新 API 不支援

      // Foursquare Places API 使用 API Key 作為 Authorization header
      const response = await fetch(`${searchUrl}?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${FOURSQUARE_API_KEY}`,
          'X-Places-Api-Version': '2025-06-17',
        },
      });
      
      // 記錄 API 請求資訊（用於除錯）
      console.log('Foursquare API 請求:', {
        url: `${searchUrl}?${searchParams.toString()}`,
        hasApiKey: !!FOURSQUARE_API_KEY,
        apiKeyPrefix: FOURSQUARE_API_KEY ? FOURSQUARE_API_KEY.substring(0, 10) + '...' : 'none',
        status: response.status,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Foursquare API error:', response.status, response.statusText, errorText);
        return NextResponse.json({ places: [], error: 'api_error' });
      }

      const data = await response.json();
      
      // 記錄完整的 API 回應（用於除錯，僅開發環境）
      if (process.env.NODE_ENV === 'development') {
        console.log('Foursquare API 完整回應:', JSON.stringify(data, null, 2));
      }
      
      // 記錄 API 回應結構（用於除錯）
      console.log('Foursquare API 回應資料:', {
        hasResults: !!data.results,
        hasData: !!data.data,
        resultsLength: data.results?.length || 0,
        dataLength: data.data?.length || 0,
        keys: Object.keys(data),
      });
      
      // 檢查回應格式（Foursquare API v3 可能使用 results 陣列）
      const results = data.results || data.data || [];
      
      if (results.length === 0) {
        console.warn('Foursquare API 沒有返回任何景區結果');
        return NextResponse.json({ places: [], error: 'no_results' });
      }

      // 處理最近的景區
      const place = results[0];
      
      if (!place.geocodes || !place.geocodes.main) {
        console.warn('景區缺少地理位置資訊');
        return NextResponse.json({ places: [], error: 'invalid_data' });
      }

      // 計算距離
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lon),
        place.geocodes.main.latitude,
        place.geocodes.main.longitude
      );

      // 取得景區詳細資訊
      let placeDetails = null;
      try {
        const detailsUrl = `https://places-api.foursquare.com/places/${place.fsq_id}`;
        const detailsResponse = await fetch(detailsUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${FOURSQUARE_API_KEY}`,
            'X-Places-Api-Version': '2025-06-17',
          },
        });

        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          placeDetails = detailsData;
        }
      } catch (error) {
        console.error(`Error fetching place details for ${place.fsq_id}:`, error);
      }

      // 計算人潮等級
      const crowdInfo = calculateCrowdLevelFromFoursquare(place, placeDetails);
      
      return NextResponse.json({ 
        places: [{
          name: place.name,
          distance: Math.round(distance),
          vicinity: place.location?.formatted_address || place.location?.address || '',
          lat: place.geocodes.main.latitude,
          lon: place.geocodes.main.longitude,
          crowdLevel: crowdInfo.level,
          crowdLevelText: crowdInfo.levelText,
          busyPercentage: crowdInfo.percentage,
        }]
      });
    } catch (error) {
      console.error('Error fetching tourist attractions from Foursquare:', error);
      console.error('錯誤詳情:', error.message, error.stack);
      return NextResponse.json({ places: [], error: 'api_error' });
    }
  }

  // 如果是火車站，使用 OSM Overpass API
  if (type === 'train_station') {
    try {
      const stations = await fetchTrainStationsFromOSM(lat, lon, radius);
      const places = stations.map(station => ({
        name: station.name,
        distance: station.distance,
        vicinity: station.vicinity || '',
        lat: station.lat,
        lon: station.lon,
      }));

      return NextResponse.json({ places });
    } catch (error) {
      console.error('Error fetching train stations:', error);
      return NextResponse.json({ places: [] });
    }
  }

  // 如果是公車站，使用 OSM Overpass API
  if (type === 'bus_station') {
    try {
      const stations = await fetchBusStationsFromOSM(lat, lon, radius);
      const places = stations.map(station => ({
        name: station.name,
        distance: station.distance,
        vicinity: station.vicinity || '',
        lat: station.lat,
        lon: station.lon,
      }));

      return NextResponse.json({ places });
    } catch (error) {
      console.error('Error fetching bus stations:', error);
      return NextResponse.json({ places: [] });
    }
  }

  // 如果是 YouBike 租借站，使用 OSM Overpass API
  if (type === 'bicycle_rental') {
    try {
      const stations = await fetchYouBikeStationsFromOSM(lat, lon, radius);
      const places = stations.map(station => ({
        name: station.name,
        distance: station.distance,
        vicinity: station.vicinity || '',
        lat: station.lat,
        lon: station.lon,
      }));

      return NextResponse.json({ places });
    } catch (error) {
      console.error('Error fetching YouBike stations:', error);
      return NextResponse.json({ places: [] });
    }
  }

  // 其他類型返回空數據（不再使用 Google Places API）
  return NextResponse.json({ places: [] });
}

