'use client';

import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  maxHeight?: string;
  priority?: boolean; // 是否優先載入
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage - 優化的圖片組件
 * 支援 Base64 和 URL，包含 lazy loading、模糊佔位符、載入狀態
 * 不改變原始圖片數據，僅優化顯示方式
 */
export default function OptimizedImage({
  src,
  alt,
  className = '',
  maxHeight = 'max-h-80',
  priority = false,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const [blurDataUrl, setBlurDataUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 生成模糊佔位符（僅用於 URL，Base64 不生成）
  useEffect(() => {
    if (!src || src.startsWith('data:image')) return; // Base64 不生成模糊佔位符

    // 對於 URL，創建一個小的模糊版本
    // 這裡使用 CSS filter 來實現模糊效果，而不是實際生成小圖
    // 因為我們不能改變原始圖片
    setBlurDataUrl(src);
  }, [src]);

  // 如果是優先載入，立即設置 shouldLoad
  useEffect(() => {
    if (priority) {
      setShouldLoad(true);
    }
  }, [priority]);

  // Intersection Observer 實現智能 lazy loading
  useEffect(() => {
    if (priority || shouldLoad) return; // 優先載入的圖片不需要觀察

    // 使用一個容器 div 來觀察，而不是 img 元素（因為 img 在 shouldLoad 為 false 時不存在）
    const container = imgRef.current?.parentElement;
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // 提前 50px 開始載入
        threshold: 0.01,
      }
    );

    observerRef.current.observe(container);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, shouldLoad]);

  if (hasError) {
    return (
      <div
        className={`${className} ${maxHeight} flex items-center justify-center bg-[#2b1a10]/50 border-2 border-[#f0d9b5]/20 rounded-lg`}
      >
        <div className="text-center p-4">
          <span className="text-2xl mb-2 block">📷</span>
          <p className="text-xs text-[#f7e7c7]/50">圖片載入失敗</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {/* 模糊佔位符（載入前顯示） */}
      {!isLoaded && shouldLoad && blurDataUrl && !src.startsWith('data:image') && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${blurDataUrl})`,
            filter: 'blur(20px) brightness(0.5)',
            transform: 'scale(1.1)', // 稍微放大以覆蓋模糊邊緣
          }}
        />
      )}

      {/* 載入中的佔位符（僅在 shouldLoad 為 true 但圖片未載入時顯示） */}
      {shouldLoad && !isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#2b1a10]/80 to-[#1a0f0a]/80 z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#fbbf24]/30 border-t-[#fbbf24] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-[#f7e7c7]/50">載入中...</p>
          </div>
        </div>
      )}

      {/* 如果還沒開始載入，顯示佔位符 */}
      {!shouldLoad && (
        <div className="w-full aspect-video bg-gradient-to-br from-[#2b1a10]/80 to-[#1a0f0a]/80 flex items-center justify-center">
          <div className="text-center">
            <span className="text-3xl mb-2 block opacity-50">📷</span>
            <p className="text-xs text-[#f7e7c7]/30">圖片待載入</p>
          </div>
        </div>
      )}

      {/* 實際圖片 */}
      {shouldLoad && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`${className} ${maxHeight} w-full h-auto object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => {
            setIsLoaded(true);
            if (onLoad) onLoad();
          }}
          onError={() => {
            setHasError(true);
            if (onError) onError();
          }}
        />
      )}
    </div>
  );
}

