'use client';

import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import FootprintsMap from '../../components/FootprintsMap';

/**
 * 足跡之光頁面
 * 顯示使用者的足跡地圖和去過的地點
 */
export default function FootprintsPage() {
  const router = useRouter();

  return (
    <div className="route-page text-[#f7e7c7]">
      <div className="route-page__bg" style={{ backgroundImage: 'url(/images/routes/route-bg.jpg)' }} />
      <div className="route-page__veil" />

      <div className="route-page__content">
        <Header />

        {/* 標題區域 */}
        <div className="w-full text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-soul-glow via-gothic-purple to-treasure-gold">
            ⚓ 足跡之光
          </h1>
          <p className="text-xs sm:text-sm text-soul-glow/60">
            足跡灑下，照亮秘境寶藏
          </p>
        </div>

        {/* 地圖區域 */}
        <div className="flex-1 w-full relative min-h-[500px] mb-4">
          <FootprintsMap />
        </div>

        {/* 底部資訊區域 */}
        <div className="w-full mb-4">
          <div className="gothic-button p-4 rounded-lg">
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full bg-soul-glow"></span>
                <span className="text-soul-glow/80">您的位置</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full bg-treasure-gold"></span>
                <span className="text-soul-glow/80">去過的地點</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-treasure-gold">✨</span>
                <span className="text-soul-glow/80">探索更多秘境</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="route-footer">
          <button
            onClick={() => router.push('/routes')}
            className="route-footer__icon"
            aria-label="藏寶圖尋蹤"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="route-footer__label">藏寶圖尋蹤</span>
          </button>
          <button
            onClick={() => router.push('/footprints')}
            className="route-footer__icon"
            aria-label="足跡之光"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="route-footer__label">足跡之光</span>
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="route-footer__icon"
            aria-label="心魂監控台"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <span className="route-footer__label">心魂監控台</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

