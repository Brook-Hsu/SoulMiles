'use client';

import { useEffect, useState } from 'react';

/**
 * LoadingAnimation - 船隻在海上航行的載入動畫
 * 類似可不可熟成紅茶的船隻航行風格
 */
export default function LoadingAnimation({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 3000; // 3秒動畫
    const interval = 50; // 每50ms更新一次
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete?.();
          }, 500);
          return 100;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-gothic-dark flex items-center justify-center overflow-hidden">
      {/* 海洋背景層 */}
      <div className="absolute inset-0 bg-gradient-to-b from-mist-blue/30 via-gothic-dark to-mist-blue/20" />
      
      {/* 海浪動畫層 */}
      <div className="absolute bottom-0 left-0 right-0 h-1/3 overflow-hidden">
        {/* 海浪層 1 */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-mist-blue/40 to-transparent animate-wave"
          style={{
            clipPath: 'polygon(0 60%, 10% 55%, 20% 58%, 30% 52%, 40% 55%, 50% 50%, 60% 53%, 70% 48%, 80% 52%, 90% 49%, 100% 53%, 100% 100%, 0 100%)',
          }}
        />
        {/* 海浪層 2 */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-mist-blue/30 to-transparent"
          style={{
            clipPath: 'polygon(0 65%, 15% 60%, 25% 63%, 35% 58%, 45% 61%, 55% 57%, 65% 60%, 75% 55%, 85% 59%, 100% 56%, 100% 100%, 0 100%)',
            animation: 'wave 4s ease-in-out infinite reverse',
            animationDelay: '0.5s',
          }}
        />
      </div>

      {/* 船隻 SVG - 加入左右移動的航行效果 */}
      <div className="relative z-10 animate-ship-sail">
        <svg
          width="200"
          height="150"
          viewBox="0 0 200 150"
          className="animate-ship-float"
        >
          {/* 船身 */}
          <path
            d="M 50 100 L 150 100 L 140 80 L 60 80 Z"
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="2"
          />
          
          {/* 船底（吃水線） */}
          <line
            x1="55"
            y1="95"
            x2="145"
            y2="95"
            stroke="#654321"
            strokeWidth="3"
          />
          
          {/* 船艙 */}
          <rect
            x="70"
            y="70"
            width="60"
            height="25"
            fill="#5C4033"
            stroke="#654321"
            strokeWidth="1"
          />
          
          {/* 窗戶 */}
          <circle cx="85" cy="82" r="4" fill="#FFD700" opacity="0.8" />
          <circle cx="115" cy="82" r="4" fill="#FFD700" opacity="0.8" />
          
          {/* 主桅杆 */}
          <line
            x1="100"
            y1="70"
            x2="100"
            y2="30"
            stroke="#654321"
            strokeWidth="4"
          />
          
          {/* 帆 - 主帆 */}
          <path
            d="M 100 35 L 100 65 L 130 55 Z"
            fill="#F5F5DC"
            stroke="#D3D3D3"
            strokeWidth="2"
          />
          
          {/* 帆 - 前帆 */}
          <path
            d="M 100 40 L 100 60 L 75 55 Z"
            fill="#F5F5DC"
            stroke="#D3D3D3"
            strokeWidth="2"
            opacity="0.9"
          />
          
          {/* 旗幟 */}
          <path
            d="M 100 30 L 100 20 L 110 25 Z"
            fill="#8B0000"
            stroke="#654321"
            strokeWidth="1"
          />
          
          {/* 船頭裝飾 */}
          <circle cx="55" cy="90" r="3" fill="#FFD700" />
        </svg>
      </div>

      {/* 載入進度條 */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-64 max-w-[80%]">
        <div className="relative h-1 bg-mist-blue/20 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-treasure-gold to-soul-glow rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-sm text-soul-glow/70 mt-3">
          正在啟航...
        </p>
      </div>

    </div>
  );
}

