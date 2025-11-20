import { NextResponse } from 'next/server';

/**
 * 獲取附近地點數據 API Route
 * 使用 Google Maps Platform Places API
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const type = searchParams.get('type'); // e.g., 'lodging', 'restaurant', 'bus_station'
  const radius = searchParams.get('radius') || '5000'; // default 5km

  if (!lat || !lon || !type) {
    return NextResponse.json({ error: 'Latitude, longitude, and type are required' }, { status: 400 });
  }

  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_MAPS_API_KEY) {
    // 如果沒有 API Key，返回空數據
    return NextResponse.json({ places: [] });
  }

  try {
    const placesApiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(placesApiUrl);
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API returned status:', data.status, data.error_message);
      return NextResponse.json({ places: [] });
    }

    // 提取相關資訊
    const places = (data.results || []).map((place) => ({
      name: place.name,
      rating: place.rating,
      vicinity: place.vicinity, // 地址
    }));

    return NextResponse.json({ places });
  } catch (error) {
    console.error('Error fetching places data:', error);
    return NextResponse.json({ places: [] });
  }
}

