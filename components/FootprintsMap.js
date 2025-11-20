'use client';

import { useState, useEffect, useMemo } from 'react';
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

/**
 * FootprintsMap - 可展開式地圖組件
 * 顯示使用者當前位置和去過的地點
 */
export default function FootprintsMap() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [visitedPlaces, setVisitedPlaces] = useState([]);
  const [mapReady, setMapReady] = useState(false);

  // 預設中心點（台北）
  const defaultCenter = [25.0330, 121.5654];
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(13);

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
          // 使用預設位置
          setUserLocation(defaultCenter);
        }
      );
    } else {
      // 瀏覽器不支援地理位置
      setUserLocation(defaultCenter);
    }
  }, []);

  // 模擬去過的地點（之後可以從 API 或狀態管理獲取）
  useEffect(() => {
    // 範例資料：一些台灣的熱門景點
    const samplePlaces = [
      { id: 1, name: '台北 101', position: [25.0340, 121.5645], date: '2024-01-15' },
      { id: 2, name: '西門町', position: [25.0420, 121.5069], date: '2024-02-20' },
      { id: 3, name: '淡水老街', position: [25.1676, 121.4435], date: '2024-03-10' },
      { id: 4, name: '陽明山', position: [25.1825, 121.5447], date: '2024-04-05' },
    ];
    setVisitedPlaces(samplePlaces);
    setMapReady(true);
  }, []);

  // 切換地圖展開/收起狀態
  const toggleMap = () => {
    setIsExpanded(!isExpanded);
  };

  // 創建自訂圖標（使用 useMemo 避免重複創建）
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

  const visitedIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    return L.divIcon({
      className: 'custom-visited-marker',
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

  return (
    <div className="w-full h-full relative">
      {/* 地圖控制按鈕 */}
      <button
        onClick={toggleMap}
        className="absolute top-4 right-4 z-[1000] gothic-button px-4 py-2 rounded-lg flex items-center gap-2 text-soul-glow hover:text-treasure-gold transition-colors shadow-lg"
        style={{ zIndex: 1000 }}
      >
        <span className="text-lg">{isExpanded ? '🗺️' : '🧭'}</span>
        <span className="text-sm font-bold">{isExpanded ? '收起地圖' : '展開地圖'}</span>
      </button>

      {/* 地圖容器 - 可展開/收起 */}
      <div
        className={`absolute inset-0 transition-all duration-500 ease-in-out ${
          isExpanded
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
        style={{
          height: isExpanded ? '100%' : '0%',
          zIndex: 900,
          visibility: isExpanded ? 'visible' : 'hidden',
        }}
      >
        {isExpanded && mapReady && typeof window !== 'undefined' && userIcon && visitedIcon && (
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            className="rounded-lg overflow-hidden z-0"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
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

            {/* 去過的地點 */}
            {visitedPlaces.map((place) => (
              <Marker
                key={place.id}
                position={place.position}
                icon={visitedIcon}
              >
                <Popup>
                  <div className="text-gray-800">
                    <strong className="text-amber-600">⚓ {place.name}</strong>
                    <p className="text-xs mt-1 text-gray-600">到訪日期: {place.date}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* 地圖預覽縮圖 - 未展開時顯示 */}
      {!isExpanded && (
        <div className="absolute inset-0 bg-gothic-dark/80 backdrop-blur-sm rounded-lg border-2 border-soul-glow/30 flex items-center justify-center" style={{ zIndex: 800 }}>
          <div className="text-center p-6">
            <div className="text-4xl mb-4 animate-pulse-soul">🗺️</div>
            <h3 className="text-xl font-bold text-soul-glow mb-2">足跡地圖</h3>
            <p className="text-sm text-soul-glow/70 mb-4">
              點擊展開查看您的足跡
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-xs text-soul-glow/60">
              <div className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-soul-glow"></span>
                <span>您的位置</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-treasure-gold"></span>
                <span>去過的地點 ({visitedPlaces.length})</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
