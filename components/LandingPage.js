'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import SoulIndicator from './SoulIndicator';
import LoadingAnimation from './LoadingAnimation';

/**
 * LandingPage - SoulMiles 啟動頁面
 * 原始首頁：Q版暗黑哥德 x 迷霧尋寶
 */
export default function LandingPage() {
  const router = useRouter();
  const [soulLevel] = useState(50);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const handleNavigation = (path) => {
    router.push(path);
  };

  if (isLoading) {
    return <LoadingAnimation onComplete={handleLoadingComplete} />;
  }

  return (
    <div className="fixed inset-0 w-screen h-screen min-h-screen treasure-map-bg relative overflow-hidden text-white">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-mist-blue/10 rounded-full blur-3xl animate-mist-flow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gothic-purple/10 rounded-full blur-3xl animate-mist-flow" style={{ animationDelay: '5s' }} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-soul-glow/5 rounded-full blur-3xl animate-mist-flow" style={{ animationDelay: '10s' }} />
      </div>

      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute top-8 left-4 sm:top-12 sm:left-8">
          <svg width="60" height="60" viewBox="0 0 100 100" className="text-soul-glow/30">
            <circle cx="50" cy="45" r="25" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="40" cy="40" r="3" fill="currentColor" />
            <circle cx="60" cy="40" r="3" fill="currentColor" />
            <path d="M 40 55 Q 50 60 60 55" stroke="currentColor" strokeWidth="2" fill="none" />
            <rect x="35" y="70" width="30" height="15" rx="2" fill="currentColor" />
            <rect x="40" y="75" width="6" height="8" fill="#0a0a0a" />
            <rect x="54" y="75" width="6" height="8" fill="#0a0a0a" />
          </svg>
        </div>

        <div className="absolute top-8 right-4 sm:top-12 sm:right-8">
          <svg width="60" height="60" viewBox="0 0 100 100" className="text-treasure-gold/20">
            <path d="M 30 50 Q 50 30 70 50 Q 50 70 30 50" fill="currentColor" opacity="0.5" />
            <circle cx="45" cy="45" r="4" fill="#0a0a0a" />
            <circle cx="55" cy="45" r="4" fill="#0a0a0a" />
            <path d="M 25 60 L 35 55 L 30 65 Z" fill="currentColor" />
            <path d="M 75 60 L 65 55 L 70 65 Z" fill="currentColor" />
            <path d="M 20 70 L 30 65 L 25 75 Z" fill="currentColor" />
            <path d="M 80 70 L 70 65 L 75 75 Z" fill="currentColor" />
          </svg>
        </div>

        <div className="absolute bottom-20 left-4 sm:bottom-24 sm:left-8">
          <svg width="50" height="50" viewBox="0 0 100 100" className="text-soul-glow/20">
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M 50 20 L 52 40 L 50 50 L 48 40 Z" fill="currentColor" />
            <path d="M 80 50 L 60 48 L 50 50 L 60 52 Z" fill="currentColor" />
            <path d="M 50 80 L 48 60 L 50 50 L 52 60 Z" fill="currentColor" />
            <path d="M 20 50 L 40 52 L 50 50 L 40 48 Z" fill="currentColor" />
          </svg>
        </div>

        <div className="absolute bottom-20 right-4 sm:bottom-24 sm:right-8">
          <svg width="50" height="50" viewBox="0 0 100 100" className="text-treasure-gold/25">
            <rect x="25" y="40" width="50" height="40" rx="2" fill="currentColor" stroke="#654321" strokeWidth="2" />
            <rect x="30" y="45" width="40" height="30" fill="#0a0a0a" />
            <path d="M 20 40 L 80 40 L 75 35 L 25 35 Z" fill="currentColor" />
            <circle cx="50" cy="47" r="3" fill="#FFD700" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 w-full h-full min-h-screen flex flex-col items-center justify-between px-4 py-4 sm:py-6 overflow-hidden">
        <div className="w-full flex-shrink-0 mb-2 sm:mb-4">
          <Header />
        </div>
        
        <div className="w-full text-center flex-shrink-0 mt-2 sm:mt-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 sm:mb-2 text-transparent bg-clip-text bg-gradient-to-r from-soul-glow via-gothic-purple to-treasure-gold drop-shadow-[0_0_10px_rgba(167,139,250,0.5)]">
            SoulMiles
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-soul-glow/60">
            迷霧中的靈魂之旅
          </p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md overflow-hidden min-h-0 py-2">
          <div className="relative mb-1 sm:mb-2 animate-float scale-75 sm:scale-100">
            <svg width="200" height="200" viewBox="0 0 200 200" className="drop-shadow-2xl">
              <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(167, 139, 250, 0.3)" strokeWidth="2" strokeDasharray="5,5" />
              <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(107, 70, 193, 0.4)" strokeWidth="1" />
              <circle cx="100" cy="100" r="75" fill="rgba(10, 10, 26, 0.8)" stroke="rgba(167, 139, 250, 0.5)" strokeWidth="3" />
              <line x1="100" y1="100" x2="100" y2="40" stroke="rgba(251, 191, 36, 0.8)" strokeWidth="3" strokeLinecap="round" />
              <line x1="100" y1="100" x2="100" y2="160" stroke="rgba(107, 70, 193, 0.6)" strokeWidth="2" strokeLinecap="round" />
              <text x="100" y="30" textAnchor="middle" fill="rgba(167, 139, 250, 0.8)" fontSize="16" fontWeight="bold">N</text>
              <text x="100" y="185" textAnchor="middle" fill="rgba(107, 70, 193, 0.6)" fontSize="14">S</text>
              <text x="30" y="105" textAnchor="middle" fill="rgba(167, 139, 250, 0.6)" fontSize="14">W</text>
              <text x="170" y="105" textAnchor="middle" fill="rgba(167, 139, 250, 0.6)" fontSize="14">E</text>
              <circle cx="100" cy="100" r="5" fill="rgba(167, 139, 250, 0.8)" />
              <path d="M 100 35 L 95 50 L 100 45 L 105 50 Z" fill="rgba(251, 191, 36, 0.9)" />
            </svg>
          </div>

          <div className="mb-0 sm:mb-2">
            <SoulIndicator soulLevel={soulLevel} />
          </div>
        </div>

        <div className="w-full max-w-md space-y-2 sm:space-y-3 flex-shrink-0 mb-2 sm:mb-4">
          <button
            onClick={() => handleNavigation('/routes')}
            className="gothic-button w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg text-left"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl">🧭</span>
              <div className="flex-1">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-soul-glow mb-0.5 sm:mb-1">
                  藏寶圖尋蹤
                </h3>
                <p className="text-xs sm:text-sm text-soul-glow/70">
                  航向迷霧，尋找潮酷路線
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleNavigation('/footprints')}
            className="gothic-button w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg text-left"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl">⚓</span>
              <div className="flex-1">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-soul-glow mb-0.5 sm:mb-1">
                  足跡之光
                </h3>
                <p className="text-xs sm:text-sm text-soul-glow/70">
                  足跡灑下，照亮秘境寶藏
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleNavigation('/exchange')}
            className="gothic-button w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg text-left"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl">💎</span>
              <div className="flex-1">
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-soul-glow mb-0.5 sm:mb-1">
                  靈魂兌換所
                </h3>
                <p className="text-xs sm:text-sm text-soul-glow/70">
                  淨化污穢，兌換專屬榮光
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

