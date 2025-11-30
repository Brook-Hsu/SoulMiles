'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
) as React.ComponentType<any>;

interface StarMarkerProps {
  position: [number, number];
  id: string;
}

function createStarIcon(animationDelay: number = 0) {
  if (typeof window === 'undefined') return null; // SSR check
  const L = require('leaflet'); // Dynamically import Leaflet

  return L.divIcon({
    className: 'star-marker',
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        animation: starTwinkle 2.5s ease-in-out infinite;
        animation-delay: ${animationDelay}s;
        opacity: 1;
      ">
        <svg width="32" height="32" viewBox="0 0 24 24" style="
          filter: drop-shadow(0 0 8px rgba(255, 255, 255, 1)) drop-shadow(0 0 16px rgba(251, 191, 36, 0.9));
        ">
          <!-- 八芒星外層（大） -->
          <path d="M 12 0.5 L 14.5 9.5 L 23.5 11.5 L 14.5 13.5 L 12 22.5 L 9.5 13.5 L 0.5 11.5 L 9.5 9.5 Z" 
                fill="white" 
                stroke="rgba(251, 191, 36, 0.5)" 
                stroke-width="0.4"
                opacity="1"/>
          <!-- 八芒星中層 -->
          <path d="M 12 3 L 13.5 9.5 L 20 11 L 13.5 12.5 L 12 19 L 10.5 12.5 L 4 11 L 10.5 9.5 Z" 
                fill="white" 
                opacity="1"/>
          <!-- 八芒星內層（小） -->
          <path d="M 12 5.5 L 13 10 L 17 10.8 L 13 11.6 L 12 16.5 L 11 11.6 L 7 10.8 L 11 10 Z" 
                fill="white" 
                opacity="1"/>
          <!-- 中心點增強亮度 -->
          <circle cx="12" cy="11" r="2.5" fill="white" opacity="1"/>
          <circle cx="12" cy="11" r="1.5" fill="rgba(251, 191, 36, 0.7)" opacity="1"/>
          <circle cx="12" cy="11" r="0.8" fill="rgba(255, 255, 255, 1)" opacity="1"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function StarMarker({ position, id }: StarMarkerProps) {
  const animationDelay = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 200) / 100; // 0-2 秒的延遲
  }, [id]);

  const icon = useMemo(() => createStarIcon(animationDelay), [animationDelay]);

  if (!icon) return null;

  return (
    <Marker position={position} icon={icon} zIndexOffset={1000} />
  );
}

