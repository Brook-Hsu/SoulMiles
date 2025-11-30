'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';

const useMap = dynamic(
  () => import('react-leaflet').then((mod) => mod.useMap),
  { ssr: false }
) as any;

interface LocateButtonProps {
  userLocation: [number, number] | null;
  defaultZoom?: number;
}

export default function LocateButton({ userLocation, defaultZoom = 15 }: LocateButtonProps) {
  const map = useMap();

  const handleLocate = useCallback(() => {
    if (userLocation && map) {
      map.flyTo(userLocation, defaultZoom);
    } else {
      alert('無法取得您的位置，請檢查瀏覽器設定。');
    }
  }, [map, userLocation, defaultZoom]);

  return (
    <button
      onClick={handleLocate}
      className="absolute top-4 left-4 z-[1000] gothic-button px-3 py-2 rounded-lg flex items-center gap-2 text-soul-glow hover:text-treasure-gold transition-all duration-300 shadow-lg"
      title="回到我的位置"
    >
      <span className="text-lg">📍</span>
      <span className="text-sm font-bold hidden sm:inline">回到我的位置</span>
    </button>
  );
}

