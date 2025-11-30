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
  const [fogLayerReady, setFogLayerReady] = useState(false);

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

    updateBounds();
    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);

    return () => {
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };
  }, [map]);

  const visibleGridIds = useMemo(() => {
    if (!mapBounds) return [];
    return getVisibleGridIds(mapBounds);
  }, [mapBounds]);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let filterDef = document.getElementById('fog-particle-filter-defs');
    if (!filterDef) {
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
      
      const turbulence = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
      turbulence.setAttribute('type', 'fractalNoise');
      turbulence.setAttribute('baseFrequency', '0.6');
      turbulence.setAttribute('numOctaves', '2');
      turbulence.setAttribute('result', 'noise');
      turbulence.setAttribute('seed', '1');
      
      const colorMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'feColorMatrix');
      colorMatrix.setAttribute('in', 'noise');
      colorMatrix.setAttribute('type', 'saturate');
      colorMatrix.setAttribute('values', '0');
      colorMatrix.setAttribute('result', 'grayscale-noise');
      
      const composite = document.createElementNS('http://www.w3.org/2000/svg', 'feComposite');
      composite.setAttribute('in', 'SourceGraphic');
      composite.setAttribute('in2', 'grayscale-noise');
      composite.setAttribute('operator', 'multiply');
      composite.setAttribute('result', 'particle-effect');
      
      const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
      blur.setAttribute('in', 'particle-effect');
      blur.setAttribute('stdDeviation', '0.3');
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

  if (!fogLayerReady || !fogGeoJSON || fogGeoJSON.features.length === 0) return null;

  return (
    <>
      <GeoJSON
        key={`fog-${exploredGridIds.size}`}
        data={fogGeoJSON}
        style={{
          fillColor: '#fbbf24',
          fillOpacity: 0.65,
          color: 'rgba(251, 191, 36, 0.4)',
          weight: 0.2,
          opacity: 0.4,
        }}
        interactive={false}
        onEachFeature={(feature, layer) => {
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              const pathElement = (layer as any)._path as SVGPathElement;
              if (pathElement) {
                pathElement.style.filter = 'url(#fog-particle-filter)';
                pathElement.style.mixBlendMode = 'multiply';
              }
            }, 0);
          }
        }}
      />
      {starPositions.map((star) => (
        <StarMarker key={star.id} position={star.position} id={star.id} />
      ))}
    </>
  );
}

