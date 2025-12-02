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

// 1km 約等於 0.009 度（緯度，全球一致）
// 1度緯度 = 111km，所以 1km = 1/111 ≈ 0.009009 度
const GRID_SIZE_LAT = 0.009009;

// 1km 約等於 0.01 度（經度，在台灣緯度約25度時）
// 1度經度 = 111 * cos(25°) ≈ 100.6km，所以 1km = 1/100.6 ≈ 0.00994 度
// 使用 0.01 度確保至少 1km（約1.1km，略大於1km以確保覆蓋）
const GRID_SIZE_LON = 0.01;

/**
 * 將座標轉換為網格 ID
 * @param lat 緯度
 * @param lon 經度
 * @returns 網格 ID，格式為 "grid_{gridLat}_{gridLon}"
 */
export function coordinateToGridId(lat: number, lon: number): string | null {
  // 使用 <= 和 >= 確保邊界座標也能被接受
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

  // 計算網格邊界，確保與網格生成邏輯一致
  // 網格的左下角是 (gridLat, gridLon)，右上角是 (gridLat + GRID_SIZE_LAT, gridLon + GRID_SIZE_LON)
  // 使用相同的 GRID_SIZE 常數，確保網格之間沒有間隙
  const latMax = parseFloat((gridLat + GRID_SIZE_LAT).toFixed(6));
  const lonMax = parseFloat((gridLon + GRID_SIZE_LON).toFixed(6));
  
  return {
    lat: gridLat,
    lon: gridLon,
    latMax: latMax,
    lonMax: lonMax,
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
              [bounds.lon, bounds.lat],         // 左下角 (西南)
              [bounds.lonMax, bounds.lat],      // 右下角 (東南)
              [bounds.lonMax, bounds.latMax],    // 右上角 (東北)
              [bounds.lon, bounds.latMax],      // 左上角 (西北)
              [bounds.lon, bounds.lat],         // 回到起點（閉合多邊形）
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
 * 獲取可見區域內的網格 ID（重構版本）
 * 簡化邏輯，確保正確覆蓋台灣區域內的 1km x 1km 網格
 * @param bounds 地圖邊界 { north, south, east, west }
 * @param zoomLevel 可選的地圖縮放級別，用於優化網格密度
 * @returns 可見區域內的網格 ID 陣列
 */
export function getVisibleGridIds(
  bounds: { north: number; south: number; east: number; west: number },
  zoomLevel?: number
): string[] {
  const gridIds: string[] = [];
  
  // 計算地圖可見區域與台灣範圍的交集
  const visibleMinLat = Math.max(bounds.south, TAIWAN_BOUNDS.minLat);
  const visibleMaxLat = Math.min(bounds.north, TAIWAN_BOUNDS.maxLat);
  const visibleMinLon = Math.max(bounds.west, TAIWAN_BOUNDS.minLon);
  const visibleMaxLon = Math.min(bounds.east, TAIWAN_BOUNDS.maxLon);

  // 如果沒有交集，返回空陣列
  if (visibleMinLat >= visibleMaxLat || visibleMinLon >= visibleMaxLon) {
    return gridIds;
  }

  // 根據縮放級別決定網格採樣間隔（效能優化，避免小範圍縮放時疊圖嚴重）
  // 縮放級別越低（視野越大），step 越大，減少網格密度
  // 1km 縮放對應約 zoom 10-11，500m 對應約 zoom 11-12，50m 對應約 zoom 14-15
  let step = 1;
  if (zoomLevel !== undefined) {
    if (zoomLevel < 7) {
      step = 12; // 縮放級別極低時（視野很大），每 12 個網格取一個（大幅減少疊圖）
    } else if (zoomLevel < 8) {
      step = 10; // 縮放級別很低時，每 10 個網格取一個
    } else if (zoomLevel < 9) {
      step = 8; // 縮放級別較低時，每 8 個網格取一個
    } else if (zoomLevel < 10) {
      step = 6; // 縮放級別低時，每 6 個網格取一個
    } else if (zoomLevel < 11) {
      step = 4; // 接近 1km 縮放時，每 4 個網格取一個（減少疊圖）
    } else if (zoomLevel < 12) {
      step = 2; // 500m 縮放時，每 2 個網格取一個
    }
    // zoom >= 12 時（1km 縮放以上），step = 1，顯示所有網格（詳細視圖，表現很好）
  }

  // 計算網格索引範圍（基於台灣邊界的起始點）
  // 起始索引：向下取整，確保包含邊界
  let startLatIndex = Math.floor((visibleMinLat - TAIWAN_BOUNDS.minLat) / GRID_SIZE_LAT);
  let startLonIndex = Math.floor((visibleMinLon - TAIWAN_BOUNDS.minLon) / GRID_SIZE_LON);
  
  // 結束索引：向上取整，確保包含邊界
  // 對於結束索引，我們需要確保能包含到 visibleMaxLat/visibleMaxLon 所在的網格
  let endLatIndex = Math.ceil((visibleMaxLat - TAIWAN_BOUNDS.minLat) / GRID_SIZE_LAT);
  let endLonIndex = Math.ceil((visibleMaxLon - TAIWAN_BOUNDS.minLon) / GRID_SIZE_LON);
  
  // 確保索引在有效範圍內
  startLatIndex = Math.max(0, startLatIndex);
  startLonIndex = Math.max(0, startLonIndex);
  
  // 計算台灣範圍內的最大有效索引
  // 最大索引應該對應最後一個網格的左下角座標不超過 maxLat/maxLon
  const maxLatIndex = Math.floor((TAIWAN_BOUNDS.maxLat - TAIWAN_BOUNDS.minLat) / GRID_SIZE_LAT);
  const maxLonIndex = Math.floor((TAIWAN_BOUNDS.maxLon - TAIWAN_BOUNDS.minLon) / GRID_SIZE_LON);
  
  // 確保結束索引不超過台灣範圍的最大索引
  // 但允許 endLatIndex 等於 maxLatIndex，這樣可以包含最後一個網格
  endLatIndex = Math.min(endLatIndex, maxLatIndex);
  endLonIndex = Math.min(endLonIndex, maxLonIndex);
  
  // 確保結束索引至少等於起始索引
  if (endLatIndex < startLatIndex) endLatIndex = startLatIndex;
  if (endLonIndex < startLonIndex) endLonIndex = startLonIndex;

  // 當使用 step > 1 時，調整起始索引以確保完整覆蓋
  if (step > 1) {
    startLatIndex = Math.floor(startLatIndex / step) * step;
    startLonIndex = Math.floor(startLonIndex / step) * step;
  }

  // 生成網格 ID
  // 直接使用索引計算網格座標，確保網格之間沒有間隙
  for (let i = startLatIndex; i <= endLatIndex; i += step) {
    for (let j = startLonIndex; j <= endLonIndex; j += step) {
      // 直接計算網格左下角的座標，與 coordinateToGridId 的計算方式一致
      const gridLat = TAIWAN_BOUNDS.minLat + i * GRID_SIZE_LAT;
      const gridLon = TAIWAN_BOUNDS.minLon + j * GRID_SIZE_LON;
      
      // 檢查網格左下角座標是否在台灣範圍內
      // 網格的右上角座標是 (gridLat + GRID_SIZE_LAT, gridLon + GRID_SIZE_LON)
      // 只要左下角在範圍內，且右上角不超過邊界，就應該包含這個網格
      if (
        gridLat >= TAIWAN_BOUNDS.minLat &&
        gridLat < TAIWAN_BOUNDS.maxLat &&
        gridLon >= TAIWAN_BOUNDS.minLon &&
        gridLon < TAIWAN_BOUNDS.maxLon
      ) {
        // 格式化為固定小數位數，避免浮點數誤差
        const formattedLat = gridLat.toFixed(6);
        const formattedLon = gridLon.toFixed(6);
        const gridId = `grid_${formattedLat}_${formattedLon}`;
        gridIds.push(gridId);
      }
    }
  }

  return gridIds;
}

