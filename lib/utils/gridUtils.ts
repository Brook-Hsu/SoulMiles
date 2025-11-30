/**
 * 方塊網格工具函數
 * 用於將台灣區域分割成 1km x 1km 的方塊
 */

// 台灣範圍定義（擴大範圍以確保完整覆蓋）
export const TAIWAN_BOUNDS = {
  minLat: 21.5,  // 更南邊（原本 22.0）
  maxLat: 25.5,  // 更北邊（原本 25.0）
  minLon: 119.0, // 更西邊（原本 120.0）
  maxLon: 122.5, // 更東邊（原本 122.0）
};

// 方塊大小（約 1km）
const GRID_SIZE_LAT = 0.009; // 約 1km 的緯度差
const GRID_SIZE_LON = 0.01;  // 約 1km 的經度差

/**
 * 檢查座標是否在台灣範圍內
 */
export function isInTaiwanBounds(lat: number, lon: number): boolean {
  return (
    lat >= TAIWAN_BOUNDS.minLat &&
    lat <= TAIWAN_BOUNDS.maxLat &&
    lon >= TAIWAN_BOUNDS.minLon &&
    lon <= TAIWAN_BOUNDS.maxLon
  );
}

/**
 * 將實際座標轉換為方塊 ID
 * 方塊 ID 格式: "grid_{gridLat}_{gridLon}"
 * 其中 gridLat 和 gridLon 是方塊左下角的座標
 */
export function coordinateToGridId(lat: number, lon: number): string | null {
  if (!isInTaiwanBounds(lat, lon)) {
    return null;
  }

  // 計算方塊左下角座標（向下取整）
  const gridLat = Math.floor(lat / GRID_SIZE_LAT) * GRID_SIZE_LAT;
  const gridLon = Math.floor(lon / GRID_SIZE_LON) * GRID_SIZE_LON;

  // 格式化為固定小數位數，確保一致性
  return `grid_${gridLat.toFixed(3)}_${gridLon.toFixed(2)}`;
}

/**
 * 從方塊 ID 解析出方塊左下角座標
 */
export function gridIdToCoordinate(gridId: string): { lat: number; lon: number } | null {
  try {
    const parts = gridId.split('_');
    if (parts.length !== 3 || parts[0] !== 'grid') {
      return null;
    }
    const lat = parseFloat(parts[1]);
    const lon = parseFloat(parts[2]);
    if (isNaN(lat) || isNaN(lon)) {
      return null;
    }
    return { lat, lon };
  } catch {
    return null;
  }
}

/**
 * 從方塊 ID 計算方塊的四個角座標（用於繪製多邊形）
 * 返回 GeoJSON Polygon 格式的座標陣列
 */
export function gridIdToBounds(gridId: string): number[][][] | null {
  const coord = gridIdToCoordinate(gridId);
  if (!coord) return null;

  const { lat, lon } = coord;

  // 計算方塊的四個角（順時針：左下、左上、右上、右下）
  const bounds: number[][][] = [
    [
      [lon, lat],                           // 左下
      [lon, lat + GRID_SIZE_LAT],           // 左上
      [lon + GRID_SIZE_LON, lat + GRID_SIZE_LAT], // 右上
      [lon + GRID_SIZE_LON, lat],           // 右下
      [lon, lat],                           // 閉合多邊形
    ],
  ];

  return bounds;
}

/**
 * 從方塊 ID 計算方塊中心點座標
 */
export function gridIdToCenter(gridId: string): { lat: number; lon: number } | null {
  const coord = gridIdToCoordinate(gridId);
  if (!coord) return null;

  return {
    lat: coord.lat + GRID_SIZE_LAT / 2,
    lon: coord.lon + GRID_SIZE_LON / 2,
  };
}

/**
 * 計算可見區域內的所有方塊 ID
 * 用於優化渲染，只顯示可見區域的方塊
 */
export function getVisibleGridIds(
  bounds: { north: number; south: number; east: number; west: number }
): string[] {
  const gridIds: string[] = [];
  
  // 確保在台灣範圍內
  const minLat = Math.max(bounds.south, TAIWAN_BOUNDS.minLat);
  const maxLat = Math.min(bounds.north, TAIWAN_BOUNDS.maxLat);
  const minLon = Math.max(bounds.west, TAIWAN_BOUNDS.minLon);
  const maxLon = Math.min(bounds.east, TAIWAN_BOUNDS.maxLon);

  // 計算起始方塊
  const startGridLat = Math.floor(minLat / GRID_SIZE_LAT) * GRID_SIZE_LAT;
  const startGridLon = Math.floor(minLon / GRID_SIZE_LON) * GRID_SIZE_LON;

  // 遍歷所有可見方塊
  let currentLat = startGridLat;
  while (currentLat <= maxLat) {
    let currentLon = startGridLon;
    while (currentLon <= maxLon) {
      const gridId = `grid_${currentLat.toFixed(3)}_${currentLon.toFixed(2)}`;
      gridIds.push(gridId);
      currentLon += GRID_SIZE_LON;
    }
    currentLat += GRID_SIZE_LAT;
  }

  return gridIds;
}

// 快取所有台灣方塊 ID（模組級別快取，只計算一次）
let cachedAllTaiwanGridIds: string[] | null = null;

/**
 * 獲取整個台灣範圍內的所有方塊 ID
 * 用於顯示完整的迷霧覆蓋
 * 使用模組級別快取，只計算一次
 */
export function getAllTaiwanGridIds(): string[] {
  // 如果已經計算過，直接返回快取
  if (cachedAllTaiwanGridIds !== null) {
    return cachedAllTaiwanGridIds;
  }

  const gridIds: string[] = [];

  // 計算起始方塊（從台灣範圍的最小值開始）
  const startGridLat = Math.floor(TAIWAN_BOUNDS.minLat / GRID_SIZE_LAT) * GRID_SIZE_LAT;
  const startGridLon = Math.floor(TAIWAN_BOUNDS.minLon / GRID_SIZE_LON) * GRID_SIZE_LON;

  // 遍歷整個台灣範圍的所有方塊
  let currentLat = startGridLat;
  while (currentLat < TAIWAN_BOUNDS.maxLat) {
    let currentLon = startGridLon;
    while (currentLon < TAIWAN_BOUNDS.maxLon) {
      const gridId = `grid_${currentLat.toFixed(3)}_${currentLon.toFixed(2)}`;
      gridIds.push(gridId);
      currentLon += GRID_SIZE_LON;
    }
    currentLat += GRID_SIZE_LAT;
  }

  // 快取結果
  cachedAllTaiwanGridIds = gridIds;
  return gridIds;
}

/**
 * 將方塊 ID 列表轉換為 GeoJSON FeatureCollection
 * 用於批次繪製地圖圖層
 */
export function gridIdsToGeoJSON(gridIds: string[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = gridIds.map((gridId) => {
    const bounds = gridIdToBounds(gridId);
    if (!bounds) {
      return null;
    }

    return {
      type: 'Feature',
      properties: {
        gridId,
      },
      geometry: {
        type: 'Polygon',
        coordinates: bounds,
      },
    } as GeoJSON.Feature;
  }).filter((f): f is GeoJSON.Feature => f !== null);

  return {
    type: 'FeatureCollection',
    features,
  };
}

