import { NextResponse } from 'next/server';

/**
 * 從台灣觀光署 Open Data API 取得指定縣市的景點資料
 * API 文件：https://data.gov.tw/dataset/7777
 */

// 縣市名稱對應到觀光署 API 的區域代碼
const CITY_MAPPING = {
  'Taipei': 'Taipei',
  '新北市': 'NewTaipei',
  'NewTaipei': 'NewTaipei',
  'Keelung': 'Keelung',
  '基隆': 'Keelung',
  'Taoyuan': 'Taoyuan',
  '桃園': 'Taoyuan',
  'Hsinchu': 'Hsinchu',
  '新竹': 'Hsinchu',
  'Yilan': 'Yilan',
  '宜蘭': 'Yilan',
  'Taichung': 'Taichung',
  '台中': 'Taichung',
  '台中市': 'Taichung',
  'Changhua': 'Changhua',
  '彰化': 'Changhua',
  'Yunlin': 'Yunlin',
  '雲林': 'Yunlin',
  'Nantou': 'Nantou',
  '南投': 'Nantou',
  'Chiayi': 'Chiayi',
  '嘉義': 'Chiayi',
  'Tainan': 'Tainan',
  '台南': 'Tainan',
  '台南市': 'Tainan',
  'Kaohsiung': 'Kaohsiung',
  '高雄': 'Kaohsiung',
  '高雄市': 'Kaohsiung',
  'Pingtung': 'Pingtung',
  '屏東': 'Pingtung',
  'Hualien': 'Hualien',
  '花蓮': 'Hualien',
  'Taitung': 'Taitung',
  '台東': 'Taitung',
  'Penghu': 'Penghu',
  '澎湖': 'Penghu',
  'Kinmen': 'Kinmen',
  '金門': 'Kinmen',
  'Lienchiang': 'Lienchiang',
  '連江': 'Lienchiang',
  '馬祖': 'Lienchiang',
};

// 觀光署 Open Data API 基礎 URL
const TOURISM_API_BASE = 'https://media.taiwan.net.tw';

/**
 * 從觀光署 Open Data API 取得景點資料
 * 使用觀光署的景點查詢 API
 */
// 縣市名稱對應（中文名稱對應）
const CITY_CHINESE_MAPPING = {
  'Taipei': '臺北市',
  '台北': '臺北市',
  '台北市': '臺北市',
  '新北市': '新北市',
  'NewTaipei': '新北市',
  '基隆': '基隆市',
  'Keelung': '基隆市',
  '桃園': '桃園市',
  'Taoyuan': '桃園市',
  '新竹': '新竹市',
  'Hsinchu': '新竹市',
  '宜蘭': '宜蘭縣',
  'Yilan': '宜蘭縣',
  '台中': '臺中市',
  '台中市': '臺中市',
  'Taichung': '臺中市',
  '彰化': '彰化縣',
  'Changhua': '彰化縣',
  '雲林': '雲林縣',
  'Yunlin': '雲林縣',
  '南投': '南投縣',
  'Nantou': '南投縣',
  '嘉義': '嘉義市',
  'Chiayi': '嘉義市',
  '台南': '臺南市',
  '台南市': '臺南市',
  'Tainan': '臺南市',
  '高雄': '高雄市',
  '高雄市': '高雄市',
  'Kaohsiung': '高雄市',
  '屏東': '屏東縣',
  'Pingtung': '屏東縣',
  '花蓮': '花蓮縣',
  'Hualien': '花蓮縣',
  '台東': '臺東縣',
  'Taitung': '臺東縣',
  '澎湖': '澎湖縣',
  'Penghu': '澎湖縣',
  '金門': '金門縣',
  'Kinmen': '金門縣',
  '連江': '連江縣',
  '馬祖': '連江縣',
  'Lienchiang': '連江縣',
};

async function fetchTouristAttractions(cityName) {
  try {
    // 將輸入的縣市名稱轉換為觀光署 API 使用的格式
    const chineseCityName = CITY_CHINESE_MAPPING[cityName] || cityName;
    
    // 觀光署 Open Data API 端點（所有景點資料）
    const apiUrl = `${TOURISM_API_BASE}/XMLReleaseALL_public/scenic_spot_C_f.json`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }, // 快取 1 小時
    });

    if (!response.ok) {
      throw new Error(`API 請求失敗: ${response.status}`);
    }

    // 處理 UTF-8 BOM
    const text = await response.text();
    const data = JSON.parse(text.replace(/^\uFEFF/, ''));
    
    // 過濾出指定縣市的景點
    let attractions = [];
    
    if (data.XML_Head && data.XML_Head.Infos && data.XML_Head.Infos.Info) {
      // 觀光署 API 的實際格式
      const infos = Array.isArray(data.XML_Head.Infos.Info) 
        ? data.XML_Head.Infos.Info 
        : [data.XML_Head.Infos.Info];
      
      attractions = infos.filter(attraction => {
        const region = attraction.Region || '';
        // 比對縣市名稱（支援完整名稱和部分匹配）
        return region.includes(chineseCityName) || 
               region.includes(cityName) ||
               chineseCityName.includes(region) ||
               (attraction.Add && attraction.Add.includes(chineseCityName)) ||
               (attraction.Add && attraction.Add.includes(cityName));
      });
    } else if (Array.isArray(data)) {
      // 如果是直接陣列格式
      attractions = data.filter(attraction => {
        const region = attraction.Region || attraction.City || attraction.city || '';
        return region.includes(chineseCityName) || 
               region.includes(cityName) ||
               (attraction.Add && attraction.Add.includes(chineseCityName)) ||
               (attraction.Add && attraction.Add.includes(cityName));
      });
    }

    return attractions;
  } catch (error) {
    console.error('[Tourist Attractions API] 錯誤:', error);
    return [];
  }
}

/**
 * GET /api/tourist-attractions?city=縣市名稱
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    if (!city) {
      return NextResponse.json(
        { error: '請提供縣市名稱 (city 參數)' },
        { status: 400 }
      );
    }

    // 取得該縣市的所有景點
    const attractions = await fetchTouristAttractions(city);

    if (!attractions || attractions.length === 0) {
      return NextResponse.json(
        { 
          error: `找不到 ${city} 的景點資料`,
          city,
          suggestions: '請確認縣市名稱是否正確'
        },
        { status: 404 }
      );
    }

    // 隨機選擇一個景點
    const randomIndex = Math.floor(Math.random() * attractions.length);
    const selectedAttraction = attractions[randomIndex];

    // 格式化景點資料（根據觀光署 API 實際格式）
    const formattedAttraction = {
      id: selectedAttraction.Id || selectedAttraction.ID || selectedAttraction.id || '',
      name: selectedAttraction.Name || selectedAttraction.name || '未知景點',
      description: selectedAttraction.Description || selectedAttraction.Toldescribe || selectedAttraction.description || '',
      address: selectedAttraction.Add || selectedAttraction.Address || selectedAttraction.address || '',
      city: selectedAttraction.Region || selectedAttraction.City || selectedAttraction.city || city,
      phone: selectedAttraction.Tel || selectedAttraction.Phone || selectedAttraction.phone || '',
      website: selectedAttraction.Website || selectedAttraction.website || '',
      openTime: selectedAttraction.Opentime || selectedAttraction.OpenTime || selectedAttraction.openTime || '',
      pictureUrl: selectedAttraction.Picture1 || 
                  selectedAttraction.Picture2 || 
                  selectedAttraction.Picture?.PictureUrl1 || 
                  selectedAttraction.Picture?.PictureUrl2 || 
                  selectedAttraction.picture?.pictureUrl1 || 
                  selectedAttraction.picture?.pictureUrl2 || '',
      position: {
        lat: selectedAttraction.Py || 
             selectedAttraction.Position?.PositionLat || 
             selectedAttraction.Position?.positionLat || 
             selectedAttraction.position?.lat || null,
        lon: selectedAttraction.Px || 
             selectedAttraction.Position?.PositionLon || 
             selectedAttraction.Position?.positionLon || 
             selectedAttraction.position?.lon || null,
      },
      total: attractions.length, // 該縣市的總景點數
    };

    return NextResponse.json({
      success: true,
      attraction: formattedAttraction,
      city,
    });
  } catch (error) {
    console.error('[Tourist Attractions API] 錯誤:', error);
    return NextResponse.json(
      { 
        error: '取得景點資料時發生錯誤',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
