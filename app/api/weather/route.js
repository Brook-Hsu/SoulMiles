import { NextResponse } from 'next/server';

/**
 * 根據經緯度判斷台灣縣市名稱
 * @param {number} lat - 緯度
 * @param {number} lon - 經度
 * @returns {string} 縣市名稱
 */
function getLocationNameByCoordinates(lat, lon) {
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

  // 如果找不到，根據緯度大致判斷區域，預設返回臺北市
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
    // 根據經緯度動態決定位置名稱
    const locationName = getLocationNameByCoordinates(lat, lon);
    
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

