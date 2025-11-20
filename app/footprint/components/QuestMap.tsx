'use client';

import { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// 動態導入地圖組件以避免 SSR 問題
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

// 地圖尺寸處理組件
function MapResizeHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 延遲執行以確保地圖已完全初始化
    const timer = setTimeout(() => {
      const L = require('leaflet');
      // 通過 DOM 查找地圖容器並觸發尺寸重新計算
      const containers = document.querySelectorAll('.leaflet-container');
      containers.forEach((container) => {
        // 嘗試從容器獲取地圖實例
        const mapId = (container as HTMLElement).getAttribute('id');
        if (mapId) {
          const mapInstance = (L as any).Map.prototype.get(mapId);
          if (mapInstance && typeof mapInstance.invalidateSize === 'function') {
            mapInstance.invalidateSize();
          }
        }
      });
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

interface Task {
  id: string;
  name: string | null;
  description: string | null;
  coordinate: string | null;
  Coin: number;
}

interface QuestMapProps {
  tasks: Task[];
}

/**
 * QuestMap - 顯示所有任務點位置的地圖
 * 使用 Stamen Watercolor 復古水彩風格圖層
 */
export default function QuestMap({ tasks }: QuestMapProps) {
  // 預設中心點（台北）
  const defaultCenter: [number, number] = [25.0330, 121.5654];
  const [mapCenter] = useState<[number, number]>(defaultCenter);
  const [mapZoom] = useState(13);

  // 解析座標字符串為 [lat, lng]
  const parseCoordinate = (coord: string | null): [number, number] | null => {
    if (!coord) return null;
    try {
      const [lat, lng] = coord.split(',').map(Number);
      if (isNaN(lat) || isNaN(lng)) return null;
      return [lat, lng];
    } catch {
      return null;
    }
  };

  // 創建任務圖標
  const taskIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    return L.divIcon({
      className: 'custom-task-marker',
      html: `
        <div style="
          background: radial-gradient(circle, #6b46c1 0%, #4c1d95 100%);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 0 15px rgba(107,70,193,0.9), 0 0 30px rgba(107,70,193,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            color: white;
            font-size: 18px;
            font-weight: bold;
          ">!</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  }, []);

  if (typeof window === 'undefined' || !taskIcon) {
    return (
      <div className="w-full h-full bg-gothic-dark/80 backdrop-blur-sm rounded-lg border-2 border-soul-glow/30 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-4xl mb-4 animate-pulse-soul">🗺️</div>
          <h3 className="text-xl font-bold text-soul-glow mb-2">載入地圖中...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
        className="rounded-lg overflow-hidden z-0"
        scrollWheelZoom={true}
      >
        <MapResizeHandler />
        {/* CartoDB Dark Matter 暗色風格圖層 - 符合哥德式主題 */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        
        {/* 任務點 */}
        {tasks.map((task) => {
          const coord = parseCoordinate(task.coordinate);
          if (!coord) return null;
          return (
            <Marker key={task.id} position={coord} icon={taskIcon}>
              <Popup>
                <div className="text-gray-800">
                  <strong className="text-purple-600">! {task.name || '任務'}</strong>
                  {task.description && (
                    <p className="text-xs mt-1 text-gray-600">{task.description}</p>
                  )}
                  <p className="text-xs mt-1 text-amber-600">獎勵: {task.Coin} 天堂幣</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

