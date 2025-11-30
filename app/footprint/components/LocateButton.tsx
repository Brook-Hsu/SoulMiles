'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface LocateButtonProps {
  userLocation: [number, number] | null;
}

/**
 * 定位按鈕組件 - 點擊後回到使用者當前位置
 * 必須在 MapContainer 內部使用
 */
export default function LocateButton({ userLocation }: LocateButtonProps) {
  const map = useMap();

  const handleLocate = () => {
    if (!userLocation || !map) return;

    // 平滑移動到使用者位置
    map.flyTo(userLocation, 15, {
      animate: true,
      duration: 1.0,
    });
  };

  if (!userLocation) return null;

  return (
    <div className="leaflet-top leaflet-right" style={{ zIndex: 1000, marginTop: '10px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar" style={{ border: 'none', background: 'transparent' }}>
        <button
          onClick={handleLocate}
          style={{
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid rgba(167, 139, 250, 0.5)',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(15, 15, 35, 0.95) 100%)',
            color: '#a78bfa',
            cursor: 'pointer',
            fontSize: '22px',
            boxShadow: 
              '0 4px 12px rgba(251, 191, 36, 0.15), 0 2px 4px rgba(139, 69, 19, 0.3), inset 0 2px 4px rgba(0, 0, 0, 0.5)',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(107, 70, 193, 0.9) 0%, rgba(26, 26, 46, 0.9) 100%)';
            e.currentTarget.style.color = '#fbbf24';
            e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.7)';
            e.currentTarget.style.boxShadow = 
              '0 6px 20px rgba(251, 191, 36, 0.25), 0 4px 8px rgba(139, 69, 19, 0.4), inset 0 2px 6px rgba(251, 191, 36, 0.1)';
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(26, 26, 46, 0.95) 0%, rgba(15, 15, 35, 0.95) 100%)';
            e.currentTarget.style.color = '#a78bfa';
            e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.5)';
            e.currentTarget.style.boxShadow = 
              '0 4px 12px rgba(251, 191, 36, 0.15), 0 2px 4px rgba(139, 69, 19, 0.3), inset 0 2px 4px rgba(0, 0, 0, 0.5)';
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          }}
          title="回到我的位置"
          aria-label="回到我的位置"
        >
          📍
        </button>
      </div>
    </div>
  );
}

