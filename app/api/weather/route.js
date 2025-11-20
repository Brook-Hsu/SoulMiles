import { NextResponse } from 'next/server';

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
    // CWA API 範例（需要根據實際 API 文檔調整）
    // 這裡使用簡化的模擬數據
    const cwaApiUrl = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${CWA_API_KEY}&format=JSON&locationName=臺北市`;

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

