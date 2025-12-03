'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import LocateButton from './LocateButton';
import FogLayer from './FogLayer';
import { coordinateToGridId } from '../../../lib/utils/gridUtils';

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

const ScaleControl = dynamic(
  () => import('react-leaflet').then((mod) => mod.ScaleControl),
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

/**
 * FootprintMap - 顯示使用者所有足跡點的地圖
 * 使用 Stamen Watercolor 復古水彩風格圖層
 */
export default function FootprintMap() {
  const [footprints, setFootprints] = useState<Footprint[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exploredGrids, setExploredGrids] = useState<Array<{ gridId: string; coordinate: string; exploredAt: string }>>([]);
  const [exploredGridIds, setExploredGridIds] = useState<Set<string>>(new Set());

  // 預設中心點（台北）
  const defaultCenter: [number, number] = [25.0330, 121.5654];
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);

  // 追蹤當前所在的網格 ID，用於判斷是否進入新網格
  const currentGridIdRef = useRef<string | null>(null);
  // 追蹤位置監聽器的 ID，用於清理
  const watchPositionIdRef = useRef<number | null>(null);
  // 使用 ref 來追蹤最新的 exploredGridIds，避免閉包問題
  const exploredGridIdsRef = useRef<Set<string>>(new Set());

  const fetchFootprints = async () => {
    try {
      const response = await fetch('/api/footprint/footprints');
      if (response.ok) {
        const result = await response.json();
        const data = result.success ? result.data : result;
        setFootprints(data.footprints || []);
      }
    } catch (error) {
      console.error('獲取足跡失敗:', error);
    }
  };

  const fetchExploredGrids = useCallback(async () => {
    try {
      const response = await fetch('/api/footprint/explored-grids');
      if (response.ok) {
        const result = await response.json();
        const data = result.success ? result.data : result;
        const gridIds = (data.grids || []).map((g: { gridId: string }) => g.gridId) as string[];
        const newGridIds = new Set<string>(gridIds);
        setExploredGrids(data.grids || []);
        setExploredGridIds(newGridIds);
        // 更新 ref，確保位置追蹤回調能訪問最新的值
        exploredGridIdsRef.current = newGridIds;
      }
    } catch (error) {
      console.error('獲取已探索方塊失敗:', error);
    }
  }, []);

  // 自動記錄新網格的函數
  const recordNewGrid = useCallback(async (lat: number, lon: number) => {
    try {
      const response = await fetch('/api/footprint/explore-grid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lon }),
      });

      if (response.ok) {
        // 如果成功創建或更新，重新獲取已探索網格列表
        await fetchExploredGrids();
      }
    } catch (error) {
      console.error('自動記錄網格失敗:', error);
    }
  }, [fetchExploredGrids]);

  // 從 API 獲取 Footprint 數據和已探索方塊 (並行請求)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchFootprints(), fetchExploredGrids()]);
      } catch (error) {
        console.error('獲取地圖數據失敗:', error);
      } finally {
        setLoading(false);
        setMapReady(true);
      }
    };
    fetchData();
  }, [fetchExploredGrids]);

  // 取得使用者當前位置並開始追蹤
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      // 先獲取一次當前位置
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setMapZoom(15);

          // 計算當前網格 ID
          const gridId = coordinateToGridId(latitude, longitude);
          if (gridId) {
            currentGridIdRef.current = gridId;
            // 檢查是否已經探索過，如果沒有則記錄（使用 ref 獲取最新值）
            // 這裡會等待 exploredGridIdsRef 初始化完成（在 fetchExploredGrids 中更新）
            if (!exploredGridIdsRef.current.has(gridId)) {
              recordNewGrid(latitude, longitude);
            }
          }
        },
        (error) => {
          console.error('無法取得位置:', error);
          setUserLocation(defaultCenter);
        }
      );

      // 開始監聽位置變化（當使用者移動時）
      watchPositionIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);

          // 計算當前網格 ID
          const gridId = coordinateToGridId(latitude, longitude);
          if (gridId && gridId !== currentGridIdRef.current) {
            // 進入新網格
            currentGridIdRef.current = gridId;
            // 檢查是否已經探索過，如果沒有則記錄（使用 ref 獲取最新值）
            if (!exploredGridIdsRef.current.has(gridId)) {
              recordNewGrid(latitude, longitude);
            }
          }
        },
        (error) => {
          console.error('位置追蹤失敗:', error);
        },
        {
          enableHighAccuracy: true, // 使用高精度定位
          maximumAge: 30000, // 快取位置的最大年齡（30秒）
          timeout: 10000, // 超時時間（10秒）
        }
      );
    } else {
      setUserLocation(defaultCenter);
    }

    // 清理函數：停止位置監聽
    return () => {
      if (watchPositionIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
        watchPositionIdRef.current = null;
      }
    };
  }, [recordNewGrid]); // 只依賴 recordNewGrid，避免無限循環

  // 當已探索網格列表載入完成後，檢查當前位置是否需要記錄
  // 這確保了在開啟地圖時，即使位置獲取比數據載入快，也能正確檢查並記錄
  useEffect(() => {
    // 只有在數據已載入（mapReady）且用戶位置已取得時才檢查
    if (mapReady && userLocation && currentGridIdRef.current) {
      const gridId = currentGridIdRef.current;
      // 檢查當前網格是否已記錄（確保在數據載入後檢查一次）
      // 使用 exploredGridIds（state）而不是 ref，因為這是響應式的檢查
      if (!exploredGridIds.has(gridId)) {
        recordNewGrid(userLocation[0], userLocation[1]);
      }
    }
  }, [mapReady, exploredGridIds, userLocation, recordNewGrid]); // 當數據載入完成時檢查

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
          
          {/* 迷霧圖層 - 顯示未探索的方塊 (延遲載入) */}
          {typeof window !== 'undefined' && mapReady && (
            <FogLayer exploredGridIds={exploredGridIds} />
          )}

          {/* 縮放比例尺 - 左下角 */}
          {typeof window !== 'undefined' && (
            <ScaleControl
              position="bottomleft"
              imperial={false}
              metric={true}
            />
          )}

          {/* 回到現在定位按鈕 */}
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

