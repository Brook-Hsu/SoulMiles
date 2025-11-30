'use client';

import { useMemo, useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { gridIdsToGeoJSON, getAllTaiwanGridIds, getVisibleGridIds, TAIWAN_BOUNDS } from '../../../lib/utils/gridUtils';
import dynamic from 'next/dynamic';
import StarMarker from './StarMarker';

// 動態導入 Marker 以避免 SSR 問題
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
) as React.ComponentType<any>;

const GeoJSON = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false }
) as React.ComponentType<any>;

interface FogLayerProps {
  exploredGridIds: Set<string>;
}

/**
 * 迷霧圖層組件 - 必須在 MapContainer 內部使用
 * 使用視窗內渲染優化，只顯示可見區域的未探索方塊
 */
export default function FogLayer({ exploredGridIds }: FogLayerProps) {
  const map = useMap();
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [fogLayerReady, setFogLayerReady] = useState(false);

  // 監聽地圖邊界變化
  useEffect(() => {
    if (!map) return;

    const updateBounds = () => {
      const bounds = map.getBounds();
      setMapBounds({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
      setFogLayerReady(true);
    };

    // 初始載入時獲取邊界
    updateBounds();

    // 監聽地圖移動和縮放事件
    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);

    return () => {
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };
  }, [map]);

  // 獲取可見區域內的所有方塊 ID（視窗內渲染優化）
  const visibleGridIds = useMemo(() => {
    if (!mapBounds) return [];
    return getVisibleGridIds(mapBounds);
  }, [mapBounds]);

  // 過濾出可見區域內未探索的方塊
  const unexploredGridIds = useMemo(() => {
    if (visibleGridIds.length === 0) return [];
    return visibleGridIds.filter((gridId) => !exploredGridIds.has(gridId));
  }, [visibleGridIds, exploredGridIds]);

  // 轉換為 GeoJSON（只在未探索方塊變化時重新計算）
  const fogGeoJSON = useMemo(() => {
    if (unexploredGridIds.length === 0) return null;
    return gridIdsToGeoJSON(unexploredGridIds);
  }, [unexploredGridIds]);

  // 生成隨機金星位置（只在可見區域內的未探索區域）
  const starPositions = useMemo(() => {
    if (!mapBounds || unexploredGridIds.length === 0) return [];
    
    const stars: Array<{ id: string; position: [number, number] }> = [];
    // 根據可見區域大小動態調整金星數量（最多 30 顆，減少渲染負擔）
    const numStars = Math.min(30, Math.max(10, Math.floor(unexploredGridIds.length / 20)));
    
    // 從未探索的方塊中隨機選擇位置
    const shuffled = [...unexploredGridIds].sort(() => Math.random() - 0.5);
    const selectedGrids = shuffled.slice(0, numStars);
    
    selectedGrids.forEach((gridId, index) => {
      // 從方塊 ID 解析出座標範圍
      const parts = gridId.split('_');
      if (parts.length === 3) {
        const gridLat = parseFloat(parts[1]);
        const gridLon = parseFloat(parts[2]);
        
        // 確保金星在可見區域內
        const randomLat = Math.max(mapBounds.south, Math.min(mapBounds.north, gridLat + 0.002 + Math.random() * 0.005));
        const randomLon = Math.max(mapBounds.west, Math.min(mapBounds.east, gridLon + 0.002 + Math.random() * 0.006));
        
        stars.push({
          id: `star-${gridId}-${index}`,
          position: [randomLat, randomLon],
        });
      }
    });
    
    return stars;
  }, [unexploredGridIds, mapBounds]);

  // 確保 SVG 濾鏡定義存在
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 檢查是否已經存在濾鏡定義
    let filterDef = document.getElementById('fog-particle-filter-defs');
    if (!filterDef) {
      // 創建 SVG 定義元素
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', 'fog-particle-filter-defs');
      svg.setAttribute('class', 'fog-particle-filter-defs');
      svg.setAttribute('style', 'position: absolute; width: 0; height: 0; pointer-events: none;');
      
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.setAttribute('id', 'fog-particle-filter');
      filter.setAttribute('x', '-50%');
      filter.setAttribute('y', '-50%');
      filter.setAttribute('width', '200%');
      filter.setAttribute('height', '200%');
      filter.setAttribute('color-interpolation-filters', 'sRGB');
      
      // 添加噪點效果（創建粒子感）- 優化效能：降低計算複雜度
      const turbulence = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
      turbulence.setAttribute('type', 'fractalNoise');
      turbulence.setAttribute('baseFrequency', '0.6'); // 降低頻率以減少計算
      turbulence.setAttribute('numOctaves', '2'); // 減少八度音階以提升效能
      turbulence.setAttribute('result', 'noise');
      turbulence.setAttribute('seed', '1');
      
      // 調整噪點顏色和對比度
      const colorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
      colorMatrix.setAttribute('in', 'noise');
      colorMatrix.setAttribute('type', 'saturate');
      colorMatrix.setAttribute('values', '0');
      colorMatrix.setAttribute('result', 'grayscale-noise');
      
      // 混合噪點和原始圖形（使用 multiply 創建粒子效果）
      const composite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
      composite.setAttribute('in', 'SourceGraphic');
      composite.setAttribute('in2', 'grayscale-noise');
      composite.setAttribute('operator', 'multiply');
      composite.setAttribute('result', 'particle-effect');
      
      // 添加輕微模糊以增強粒子感 - 優化：減少模糊強度
      const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
      blur.setAttribute('in', 'particle-effect');
      blur.setAttribute('stdDeviation', '0.3'); // 降低模糊強度以提升效能
      blur.setAttribute('result', 'final');
      
      filter.appendChild(turbulence);
      filter.appendChild(colorMatrix);
      filter.appendChild(composite);
      filter.appendChild(blur);
      defs.appendChild(filter);
      svg.appendChild(defs);
      document.body.appendChild(svg);
    }
  }, []);

  // 延遲載入：等待地圖準備好且邊界已計算
  if (!fogLayerReady || !fogGeoJSON || fogGeoJSON.features.length === 0) return null;

  return (
    <>
      <GeoJSON
        key={`fog-${exploredGridIds.size}`}
        data={fogGeoJSON}
        style={{
          fillColor: '#fbbf24', // 金色
          fillOpacity: 0.65,
          color: 'rgba(251, 191, 36, 0.4)',
          weight: 0.2,
          opacity: 0.4,
        }}
        interactive={false}
        onEachFeature={(feature, layer) => {
          // 為每個方塊添加粒子效果的 CSS 樣式
          if (typeof window !== 'undefined') {
            // 使用 setTimeout 確保 DOM 元素已創建
            setTimeout(() => {
              const pathElement = (layer as any)._path as SVGPathElement;
              if (pathElement) {
                // 添加 SVG 濾鏡以創建粒子/噪點效果
                pathElement.style.filter = 'url(#fog-particle-filter)';
                // 添加輕微的模糊以增強粒子感
                pathElement.style.mixBlendMode = 'multiply';
              }
            }, 0);
          }
        }}
      />
      {/* 在迷霧中隨機放置金星 */}
      {starPositions.map((star) => (
        <StarMarker key={star.id} position={star.position} id={star.id} />
      ))}
    </>
  );
}

