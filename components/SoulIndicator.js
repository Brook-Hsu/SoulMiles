'use client';

import { useState, useEffect } from 'react';

/**
 * SoulIndicator - 靈魂純淨度指示器
 * 顯示用戶靈魂強度的視覺化元件，靈魂越強，光環越明亮
 */
export default function SoulIndicator({ soulLevel = 50 }) {
  const [glowIntensity, setGlowIntensity] = useState(0.6);

  // 根據靈魂等級計算光環強度 (0-100 映射到 0.3-1.0)
  useEffect(() => {
    const intensity = 0.3 + (soulLevel / 100) * 0.7;
    setGlowIntensity(intensity);
  }, [soulLevel]);

  return (
    <div className="relative flex items-center justify-center scale-75 sm:scale-100">
      {/* 最外層動態光環 - 強調純淨靈魂的能源中心 */}
      <div
        className="absolute rounded-full animate-pulse-soul"
        style={{
          width: '140px',
          height: '140px',
          background: `radial-gradient(circle, rgba(167, 139, 250, ${glowIntensity * 0.3}) 0%, transparent 75%)`,
          filter: 'blur(20px)',
          animation: 'pulseSoul 2.5s ease-in-out infinite',
        }}
      />
      
      {/* 外層光環 */}
      <div
        className="absolute rounded-full animate-pulse-soul"
        style={{
          width: '120px',
          height: '120px',
          background: `radial-gradient(circle, rgba(167, 139, 250, ${glowIntensity * 0.5}) 0%, transparent 70%)`,
          filter: 'blur(15px)',
          animation: 'pulseSoul 2s ease-in-out infinite',
          animationDelay: '0.3s',
        }}
      />
      
      {/* 中層光環 - 更強烈的脈動 */}
      <div
        className="absolute rounded-full"
        style={{
          width: '100px',
          height: '100px',
          background: `radial-gradient(circle, rgba(167, 139, 250, ${glowIntensity * 0.7}) 0%, rgba(107, 70, 193, ${glowIntensity * 0.4}) 40%, transparent 65%)`,
          filter: 'blur(12px)',
          animation: 'pulseSoul 1.5s ease-in-out infinite',
        }}
      />
      
      {/* 內層光環 - 快速脈動 */}
      <div
        className="absolute rounded-full"
        style={{
          width: '90px',
          height: '90px',
          background: `radial-gradient(circle, rgba(251, 191, 36, ${glowIntensity * 0.3}) 0%, transparent 60%)`,
          filter: 'blur(8px)',
          animation: 'pulseSoul 1s ease-in-out infinite',
          animationDelay: '0.5s',
        }}
      />
      
      {/* 核心靈魂光點 - 最強動態效果 */}
      <div
        className="relative rounded-full border-2 border-soul-glow animate-pulse"
        style={{
          width: '80px',
          height: '80px',
          background: `radial-gradient(circle at 30% 30%, rgba(167, 139, 250, ${glowIntensity}), rgba(107, 70, 193, ${glowIntensity * 0.7}), rgba(251, 191, 36, ${glowIntensity * 0.3}), transparent)`,
          boxShadow: `
            0 0 40px rgba(167, 139, 250, ${glowIntensity * 0.9}),
            0 0 60px rgba(167, 139, 250, ${glowIntensity * 0.5}),
            0 0 80px rgba(107, 70, 193, ${glowIntensity * 0.3})
          `,
          animation: 'pulseSoul 2s ease-in-out infinite',
        }}
      >
        {/* 靈魂符號 - 簡單的星形或光點 */}
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <div
            className="text-2xl"
            style={{
              color: `rgba(167, 139, 250, ${glowIntensity})`,
              textShadow: `
                0 0 15px rgba(167, 139, 250, ${glowIntensity}),
                0 0 25px rgba(167, 139, 250, ${glowIntensity * 0.7}),
                0 0 35px rgba(251, 191, 36, ${glowIntensity * 0.4})
              `,
            }}
          >
            ✦
          </div>
        </div>
      </div>

      {/* 提示文字 */}
      <div className="absolute -bottom-6 sm:-bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-xs text-soul-glow/70 font-medium">
          靈魂純淨度: {soulLevel}%
        </p>
        <p className="text-xs text-soul-glow/50 mt-1">
          {soulLevel >= 70 ? '迷霧已散去' : soulLevel >= 40 ? '迷霧漸散' : '迷霧籠罩'}
        </p>
      </div>
    </div>
  );
}

