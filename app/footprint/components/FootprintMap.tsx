'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { coordinateToGridId } from '../../../lib/utils/gridUtils';
import FogLayer from './FogLayer';
import LocateButton from './LocateButton';

// 動態導入地圖組件以避免 SSR 問題
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
) as React.ComponentType<any>;

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
) as React.ComponentType<any>;

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
) as React.ComponentType<any>;

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
) as React.ComponentType<any>;

const GeoJSON = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false }
) as React.ComponentType<any>;

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

interface Footprint {
  id: string;
  coordinate: string | null;
  name?: string | null;
  description?: string | null;
}

interface ExploredGrid {
  gridId: string;
  coordinate: string;
  exploredAt: string;
}


/**
 * FootprintMap - 顯示使用者所有足跡點的地圖，包含迷霧散去效果
 * 使用 Stamen Watercolor 復古水彩風格圖層
 */
export default function FootprintMap() {
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [exploredGrids, setExploredGrids] = useState<ExploredGrid[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentGridIdRef = useRef<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // 預設中心點（台北）
  const defaultCenter: [number, number] = [25.0330, 121.5654];
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);

  // 已探索方塊 ID 的 Set（用於快速查詢）
  const exploredGridIds = useMemo(() => {
    return new Set(exploredGrids.map((grid) => grid.gridId));
  }, [exploredGrids]);

  // 取得使用者當前位置
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setMapZoom(15);
        },
        (error) => {
          console.error('無法取得位置:', error);
          setUserLocation(defaultCenter);
        }
      );
    } else {
      setUserLocation(defaultCenter);
    }
  }, []);

  // 從 API 獲取 Footprint 數據和已探索方塊（並行請求）
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 並行執行兩個 API 請求
        const [footprintsResponse, gridsResponse] = await Promise.all([
          fetch('/api/footprint/footprints'),
          fetch('/api/footprint/explored-grids'),
        ]);

        // 處理足跡資料
        if (footprintsResponse.ok) {
          const footprintsData = await footprintsResponse.json();
          setFootprints(footprintsData.footprints || []);
        }

        // 處理已探索方塊資料
        if (gridsResponse.ok) {
          const gridsData = await gridsResponse.json();
          setExploredGrids(gridsData.grids || []);
        }
      } catch (error) {
        console.error('獲取資料失敗:', error);
      } finally {
        setLoading(false);
        setMapReady(true);
      }
    };

    fetchData();
  }, []);

  // 記錄探索方塊
  const exploreGrid = useCallback(async (lat: number, lon: number) => {
    try {
      const response = await fetch('/api/footprint/explore-grid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lon }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.footprint) {
          // 如果成功記錄，更新已探索方塊列表
          if (!data.alreadyExplored) {
            setExploredGrids((prev) => [
              {
                gridId: data.footprint.gridId,
                coordinate: data.footprint.coordinate,
                exploredAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        }
      }
    } catch (error) {
      console.error('記錄探索方塊失敗:', error);
    }
  }, []);

  // 位置監聽 - 自動記錄探索的方塊
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    // 先獲取一次位置
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const gridId = coordinateToGridId(latitude, longitude);
        if (gridId && gridId !== currentGridIdRef.current) {
          currentGridIdRef.current = gridId;
          exploreGrid(latitude, longitude);
        }
      },
      (error) => {
        console.error('獲取位置失敗:', error);
      }
    );

    // 監聽位置變化（每 30 秒或移動超過 100 公尺）
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const gridId = coordinateToGridId(latitude, longitude);
        
        // 如果進入新的方塊，記錄探索
        if (gridId && gridId !== currentGridIdRef.current) {
          currentGridIdRef.current = gridId;
          exploreGrid(latitude, longitude);
        }
      },
      (error) => {
        console.error('位置監聽失敗:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // 30 秒
      }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [exploreGrid]);

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

  // 創建自訂圖標
  const userIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    return L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="
          background: radial-gradient(circle, #a78bfa 0%, #6b46c1 100%);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 0 15px rgba(167,139,250,0.9), 0 0 30px rgba(167,139,250,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            color: white;
            font-size: 18px;
          ">📍</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  }, []);

  const footprintIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    return L.divIcon({
      className: 'custom-footprint-marker',
      html: `
        <div style="
          background: radial-gradient(circle, #fbbf24 0%, #f59e0b 100%);
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 0 12px rgba(251,191,36,0.8), 0 0 24px rgba(251,191,36,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-size: 16px;
          ">⚓</div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -28],
    });
  }, []);

  if (loading || !mapReady) {
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
      {typeof window !== 'undefined' && userIcon && footprintIcon && (
        <MapContainer
          center={mapCenter as [number, number]}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%', minHeight: '400px' }}
          className="rounded-lg overflow-hidden z-0"
          scrollWheelZoom={true}
          zoomControl={false}
          key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
        >
          <MapResizeHandler />
          {/* CartoDB Dark Matter 暗色風格圖層 - 符合哥德式主題 */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />
          
          {/* 迷霧圖層 - 顯示未探索的方塊 */}
          {typeof window !== 'undefined' && (
            <FogLayer exploredGridIds={exploredGridIds} />
          )}

          {/* 定位按鈕 - 回到使用者當前位置 */}
          {typeof window !== 'undefined' && userLocation && (
            <LocateButton userLocation={userLocation} />
          )}
          
          {/* 使用者當前位置 */}
          {userLocation && (
            <Marker position={userLocation} icon={userIcon}>
              <Popup>
                <div className="text-gray-800">
                  <strong className="text-purple-600">📍 您的位置</strong>
                  <p className="text-xs mt-1">緯度: {userLocation[0].toFixed(4)}</p>
                  <p className="text-xs">經度: {userLocation[1].toFixed(4)}</p>
                  {currentGridIdRef.current && (
                    <p className="text-xs mt-1 text-gray-500">方塊: {currentGridIdRef.current}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* 足跡點 */}
          {footprints.map((footprint) => {
            const coord = parseCoordinate(footprint.coordinate);
            if (!coord) return null;
            return (
              <Marker key={footprint.id} position={coord} icon={footprintIcon}>
                <Popup>
                  <div className="text-gray-800">
                    <strong className="text-amber-600">⚓ {footprint.name || '足跡點'}</strong>
                    {footprint.description && (
                      <p className="text-xs mt-1 text-gray-600">{footprint.description}</p>
                    )}
                    <p className="text-xs mt-1 text-gray-400">座標: {coord[0].toFixed(4)}, {coord[1].toFixed(4)}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      )}
    </div>
  );
}

