/**
 * 網格工具函數
 * 用於將台灣地區劃分為 1km x 1km 的方塊，並進行座標與網格 ID 的轉換
 */

export const TAIWAN_BOUNDS = {
  minLat: 21.5, // 更南
  maxLat: 25.5, // 更北
  minLon: 119.0, // 更西
  maxLon: 122.5, // 更東
};

// 1km 約等於 0.009 度（緯度）
const GRID_SIZE_LAT = 0.009;
// 1km 約等於 0.011 度（經度，在台灣緯度範圍內）
const GRID_SIZE_LON = 0.011;

/**
 * 將座標轉換為網格 ID
 * @param lat 緯度
 * @param lon 經度
 * @returns 網格 ID，格式為 "grid_{gridLat}_{gridLon}"
 */
export function coordinateToGridId(lat: number, lon: number): string | null {
  if (
    lat < TAIWAN_BOUNDS.minLat ||
    lat > TAIWAN_BOUNDS.maxLat ||
    lon < TAIWAN_BOUNDS.minLon ||
    lon > TAIWAN_BOUNDS.maxLon
  ) {
    return null; // 座標不在台灣範圍內
  }

  // 計算網格左下角的座標
  const gridLat = Math.floor((lat - TAIWAN_BOUNDS.minLat) / GRID_SIZE_LAT) * GRID_SIZE_LAT + TAIWAN_BOUNDS.minLat;
  const gridLon = Math.floor((lon - TAIWAN_BOUNDS.minLon) / GRID_SIZE_LON) * GRID_SIZE_LON + TAIWAN_BOUNDS.minLon;

  // 格式化為固定小數位數，避免浮點數誤差
  const formattedLat = gridLat.toFixed(6);
  const formattedLon = gridLon.toFixed(6);

  return `grid_${formattedLat}_${formattedLon}`;
}

/**
 * 從網格 ID 解析網格座標
 * @param gridId 網格 ID
 * @returns 網格左下角的座標 { lat, lon }
 */
export function gridIdToBounds(gridId: string): { lat: number; lon: number; latMax: number; lonMax: number } | null {
  const parts = gridId.split('_');
  if (parts.length !== 3 || parts[0] !== 'grid') {
    return null;
  }

  const gridLat = parseFloat(parts[1]);
  const gridLon = parseFloat(parts[2]);

  if (isNaN(gridLat) || isNaN(gridLon)) {
    return null;
  }

  return {
    lat: gridLat,
    lon: gridLon,
    latMax: gridLat + GRID_SIZE_LAT,
    lonMax: gridLon + GRID_SIZE_LON,
  };
}

/**
 * 將多個網格 ID 轉換為 GeoJSON 格式
 * @param gridIds 網格 ID 陣列
 * @returns GeoJSON FeatureCollection
 */
export function gridIdsToGeoJSON(gridIds: string[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = gridIds
    .map((gridId) => {
      const bounds = gridIdToBounds(gridId);
      if (!bounds) return null;

      return {
        type: 'Feature',
        properties: { gridId },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [bounds.lon, bounds.lat],
              [bounds.lonMax, bounds.lat],
              [bounds.lonMax, bounds.latMax],
              [bounds.lat, bounds.latMax],
              [bounds.lon, bounds.lat],
            ],
          ],
        },
      } as GeoJSON.Feature;
    })
    .filter((feature): feature is GeoJSON.Feature => feature !== null);

  return {
    type: 'FeatureCollection',
    features,
  };
}

// 模組級快取：所有台灣網格 ID
let cachedAllTaiwanGridIds: string[] | null = null;

/**
 * 獲取所有台灣網格 ID（使用快取）
 * @returns 所有台灣網格 ID 陣列
 */
export function getAllTaiwanGridIds(): string[] {
  if (cachedAllTaiwanGridIds !== null) {
    return cachedAllTaiwanGridIds;
  }

  const gridIds: string[] = [];
  const latSteps = Math.ceil((TAIWAN_BOUNDS.maxLat - TAIWAN_BOUNDS.minLat) / GRID_SIZE_LAT);
  const lonSteps = Math.ceil((TAIWAN_BOUNDS.maxLon - TAIWAN_BOUNDS.minLon) / GRID_SIZE_LON);

  for (let i = 0; i < latSteps; i++) {
    for (let j = 0; j < lonSteps; j++) {
      const lat = TAIWAN_BOUNDS.minLat + i * GRID_SIZE_LAT;
      const lon = TAIWAN_BOUNDS.minLon + j * GRID_SIZE_LON;
      const gridId = coordinateToGridId(lat, lon);
      if (gridId) {
        gridIds.push(gridId);
      }
    }
  }

  cachedAllTaiwanGridIds = gridIds;
  return gridIds;
}

/**
 * 獲取可見區域內的網格 ID
 * @param bounds 地圖邊界 { north, south, east, west }
 * @returns 可見區域內的網格 ID 陣列
 */
export function getVisibleGridIds(bounds: { north: number; south: number; east: number; west: number }): string[] {
  const gridIds: string[] = [];
  
  // 確保邊界在台灣範圍內
  const minLat = Math.max(bounds.south, TAIWAN_BOUNDS.minLat);
  const maxLat = Math.min(bounds.north, TAIWAN_BOUNDS.maxLat);
  const minLon = Math.max(bounds.west, TAIWAN_BOUNDS.minLon);
  const maxLon = Math.min(bounds.east, TAIWAN_BOUNDS.maxLon);

  // 計算起始和結束的網格索引
  const startLatIndex = Math.floor((minLat - TAIWAN_BOUNDS.minLat) / GRID_SIZE_LAT);
  const endLatIndex = Math.ceil((maxLat - TAIWAN_BOUNDS.minLat) / GRID_SIZE_LAT);
  const startLonIndex = Math.floor((minLon - TAIWAN_BOUNDS.minLon) / GRID_SIZE_LON);
  const endLonIndex = Math.ceil((maxLon - TAIWAN_BOUNDS.minLon) / GRID_SIZE_LON);

  for (let i = startLatIndex; i <= endLatIndex; i++) {
    for (let j = startLonIndex; j <= endLonIndex; j++) {
      const lat = TAIWAN_BOUNDS.minLat + i * GRID_SIZE_LAT;
      const lon = TAIWAN_BOUNDS.minLon + j * GRID_SIZE_LON;
      const gridId = coordinateToGridId(lat, lon);
      if (gridId) {
        gridIds.push(gridId);
      }
    }
  }

  return gridIds;
}

