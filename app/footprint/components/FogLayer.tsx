'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import { gridIdsToGeoJSON, getAllTaiwanGridIds, getVisibleGridIds, TAIWAN_BOUNDS } from '../../../lib/utils/gridUtils';
import dynamic from 'next/dynamic';
import StarMarker from './StarMarker';

const GeoJSON = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false }
) as React.ComponentType<any>;

interface FogLayerProps {
  exploredGridIds: Set<string>;
}

export default function FogLayer({ exploredGridIds }: FogLayerProps) {
  const map = useMap();
  const [mapBounds, setMapBounds] = useState<{ north: number; south: number; east: number; west: number } | null>(null);
  const [mapZoom, setMapZoom] = useState<number | null>(null);
  const [fogLayerReady, setFogLayerReady] = useState(false);

  useEffect(() => {
    if (!map) return;

    const updateBounds = () => {
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      setMapBounds({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
      setMapZoom(zoom);
      setFogLayerReady(true);
    };

    // 初始更新
    updateBounds();
    
    // 監聽地圖移動和縮放結束事件（適度更新，避免過度渲染）
    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);

    return () => {
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };
  }, [map]);

  const visibleGridIds = useMemo(() => {
    if (!mapBounds) return [];
    // 傳入縮放級別以優化網格密度
    return getVisibleGridIds(mapBounds, mapZoom || undefined);
  }, [mapBounds, mapZoom]);

  const unexploredGridIds = useMemo(() => {
    if (visibleGridIds.length === 0) return [];
    return visibleGridIds.filter((gridId) => !exploredGridIds.has(gridId));
  }, [visibleGridIds, exploredGridIds]);

  const fogGeoJSON = useMemo(() => {
    if (unexploredGridIds.length === 0) return null;
    return gridIdsToGeoJSON(unexploredGridIds);
  }, [unexploredGridIds]);

  const starPositions = useMemo(() => {
    if (!mapBounds || unexploredGridIds.length === 0) return [];
    
    const stars: Array<{ id: string; position: [number, number] }> = [];
    const numStars = Math.min(30, Math.max(10, Math.floor(unexploredGridIds.length / 20)));
    
    const shuffled = [...unexploredGridIds].sort(() => Math.random() - 0.5);
    const selectedGrids = shuffled.slice(0, numStars);
    
    selectedGrids.forEach((gridId, index) => {
      const parts = gridId.split('_');
      if (parts.length === 3) {
        const gridLat = parseFloat(parts[1]);
        const gridLon = parseFloat(parts[2]);
        
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


  // 生成一個唯一的 key，包含地圖狀態和探索狀態，確保縮放時會重新渲染
  // 必須在條件返回之前調用 useMemo（React Hooks 規則）
  const geoJsonKey = useMemo(() => {
    if (!mapBounds || mapZoom === null) return `fog-${exploredGridIds.size}`;
    // 使用邊界和縮放級別生成 key，確保當地圖變化時會重新渲染
    const boundsKey = `${mapBounds.north.toFixed(2)}-${mapBounds.south.toFixed(2)}-${mapBounds.east.toFixed(2)}-${mapBounds.west.toFixed(2)}`;
    return `fog-${boundsKey}-${mapZoom}-${exploredGridIds.size}-${fogGeoJSON?.features.length || 0}`;
  }, [mapBounds, mapZoom, exploredGridIds.size, fogGeoJSON?.features.length]);

  if (!fogLayerReady || !fogGeoJSON || fogGeoJSON.features.length === 0) return null;

  return (
    <>
      <GeoJSON
        key={geoJsonKey}
        data={fogGeoJSON}
        style={{
          fillColor: '#fbbf24',
          fillOpacity: 0.35, // 降低填充透明度，確保能看到底下的地圖
          color: 'rgba(251, 191, 36, 0.3)', // 降低邊框透明度
          weight: 0.2,
          opacity: 0.3, // 降低整體透明度
        }}
        interactive={false}
      />
      {starPositions.map((star) => (
        <StarMarker key={star.id} position={star.position} id={star.id} />
      ))}
    </>
  );
}

