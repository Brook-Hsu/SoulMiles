import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { booleanPointInPolygon, point } from '@turf/turf';

/**
 * 根據經緯度判斷台灣縣市名稱（使用資料庫中的 twgeojson 資料）
 * @param {number} lat - 緯度
 * @param {number} lon - 經度
 * @returns {Promise<string>} 縣市名稱
 */
async function getLocationNameByCoordinates(lat, lon) {
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  // 建立點（Turf.js 使用 [longitude, latitude] 格式）
  const pointFeature = point([lonNum, latNum]);

  try {
    // 檢查 Prisma 是否可用
    if (!prisma || !prisma.twGeoJson) {
      console.warn('Prisma 不可用，使用備用方案');
      return getLocationNameByCoordinatesFallback(lat, lon);
    }

    // 從資料庫查詢所有縣市邊界資料
    const counties = await prisma.twGeoJson.findMany({
      select: {
        Name: true,
        Area: true,
      },
    });

    // 如果沒有資料，使用備用方案
    if (!counties || counties.length === 0) {
      console.warn('資料庫中沒有縣市邊界資料，使用備用方案');
      return getLocationNameByCoordinatesFallback(lat, lon);
    }

    // 遍歷每個縣市，檢查點是否在邊界內
    for (const county of counties) {
      if (!county.Area) continue;

      try {
        // 解析 GeoJSON 資料
        const geoJsonData = JSON.parse(county.Area);
        const geometry = geoJsonData.geometry;

        if (!geometry) continue;

        // 處理 Polygon 和 MultiPolygon 兩種幾何類型
        if (geometry.type === 'Polygon') {
          // 對於 Polygon，檢查點是否在外環（第一個座標陣列）內
          const polygon = {
            type: 'Feature',
            geometry: geometry,
          };
          if (booleanPointInPolygon(pointFeature, polygon)) {
            return county.Name || '未知縣市';
          }
        } else if (geometry.type === 'MultiPolygon') {
          // 對於 MultiPolygon，檢查點是否在任何一個 Polygon 內
          for (const polygonCoords of geometry.coordinates) {
            const polygon = {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: polygonCoords,
              },
            };
            if (booleanPointInPolygon(pointFeature, polygon)) {
              return county.Name || '未知縣市';
            }
          }
        }
      } catch (parseError) {
        // 如果解析失敗，跳過這個縣市
        console.error(`解析縣市 ${county.Name} 的 GeoJSON 失敗:`, parseError);
        continue;
      }
    }

    // 如果資料庫查詢失敗或找不到匹配的縣市，使用備用方案
    console.warn('無法從資料庫找到匹配的縣市，使用備用方案');
    return getLocationNameByCoordinatesFallback(lat, lon);
  } catch (error) {
    // 如果資料庫查詢失敗，使用備用方案
    console.error('查詢資料庫失敗，使用備用方案:', error);
    return getLocationNameByCoordinatesFallback(lat, lon);
  }
}

/**
 * 備用方案：使用硬編碼的經緯度範圍對照表
 * @param {number} lat - 緯度
 * @param {number} lon - 經度
 * @returns {string} 縣市名稱
 */
function getLocationNameByCoordinatesFallback(lat, lon) {
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  // 台灣主要縣市的經緯度範圍對照表
  const locations = [
    { name: '臺北市', latMin: 24.9, latMax: 25.2, lonMin: 121.4, lonMax: 121.7 },
    { name: '新北市', latMin: 24.8, latMax: 25.2, lonMin: 121.2, lonMax: 122.0 },
    { name: '桃園市', latMin: 24.7, latMax: 25.1, lonMin: 121.0, lonMax: 121.5 },
    { name: '臺中市', latMin: 24.0, latMax: 24.5, lonMin: 120.5, lonMax: 121.2 },
    { name: '臺南市', latMin: 22.9, latMax: 23.4, lonMin: 120.0, lonMax: 120.5 },
    { name: '高雄市', latMin: 22.5, latMax: 23.0, lonMin: 120.1, lonMax: 120.6 },
    { name: '基隆市', latMin: 25.0, latMax: 25.2, lonMin: 121.6, lonMax: 121.8 },
    { name: '新竹市', latMin: 24.7, latMax: 24.9, lonMin: 120.9, lonMax: 121.1 },
    { name: '新竹縣', latMin: 24.4, latMax: 24.9, lonMin: 120.8, lonMax: 121.3 },
    { name: '苗栗縣', latMin: 24.3, latMax: 24.8, lonMin: 120.6, lonMax: 121.2 },
    { name: '彰化縣', latMin: 23.8, latMax: 24.2, lonMin: 120.3, lonMax: 120.7 },
    { name: '南投縣', latMin: 23.5, latMax: 24.2, lonMin: 120.6, lonMax: 121.2 },
    { name: '雲林縣', latMin: 23.5, latMax: 23.9, lonMin: 120.1, lonMax: 120.6 },
    { name: '嘉義市', latMin: 23.4, latMax: 23.5, lonMin: 120.4, lonMax: 120.5 },
    { name: '嘉義縣', latMin: 23.2, latMax: 23.6, lonMin: 120.1, lonMax: 120.6 },
    { name: '屏東縣', latMin: 22.0, latMax: 22.8, lonMin: 120.3, lonMax: 120.8 },
    { name: '宜蘭縣', latMin: 24.3, latMax: 24.8, lonMin: 121.5, lonMax: 122.0 },
    { name: '花蓮縣', latMin: 23.3, latMax: 24.4, lonMin: 121.2, lonMax: 121.8 },
    { name: '臺東縣', latMin: 22.3, latMax: 23.4, lonMin: 120.8, lonMax: 121.5 },
    { name: '澎湖縣', latMin: 23.2, latMax: 23.7, lonMin: 119.3, lonMax: 119.7 },
    { name: '金門縣', latMin: 24.2, latMax: 24.5, lonMin: 118.2, lonMax: 118.5 },
    { name: '連江縣', latMin: 25.9, latMax: 26.4, lonMin: 119.8, lonMax: 120.1 },
  ];

  // 尋找符合的縣市
  for (const location of locations) {
    if (
      latNum >= location.latMin &&
      latNum <= location.latMax &&
      lonNum >= location.lonMin &&
      lonNum <= location.lonMax
    ) {
      return location.name;
    }
  }

  // 如果找不到，預設返回臺北市
  return '臺北市';
}

/**
 * 獲取天氣數據 API Route
 * 使用 CWA OpenData API
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  const CWA_API_KEY = process.env.CWA_API_KEY;

  if (!CWA_API_KEY) {
    // 如果沒有 API Key，返回模擬數據
    return NextResponse.json({
      weather: '多雲',
      temperature: '25',
      isSunny: false,
    });
  }

  try {
    // 根據經緯度動態決定位置名稱（使用資料庫中的 twgeojson 資料）
    const locationName = await getLocationNameByCoordinates(lat, lon);
    
    // CWA API 請求
    const cwaApiUrl = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${CWA_API_KEY}&format=JSON&locationName=${encodeURIComponent(locationName)}`;

    const response = await fetch(cwaApiUrl, { next: { revalidate: 3600 } });
    
    if (!response.ok) {
      throw new Error(`CWA API error: ${response.statusText}`);
    }

    const data = await response.json();

    // 處理 CWA 數據（簡化版）
    const locationData = data.records?.location?.[0];
    const weatherElement = locationData?.weatherElement?.find((elem) => elem.elementName === 'Wx');
    const tempElement = locationData?.weatherElement?.find((elem) => elem.elementName === 'MinT');

    const weather = weatherElement?.time?.[0]?.parameter?.parameterName || '未知';
    const temperature = tempElement?.time?.[0]?.parameter?.parameterName || '25';
    const isSunny = !weather.includes('雨') && !weather.includes('陰');

    return NextResponse.json({ weather, temperature, isSunny });
  } catch (error) {
    console.error('Error fetching weather data:', error);
    // 返回模擬數據作為備用
    return NextResponse.json({
      weather: '多雲',
      temperature: '25',
      isSunny: false,
    });
  }
}

