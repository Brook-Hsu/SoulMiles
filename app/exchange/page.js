'use client';

import { useRouter } from 'next/navigation';
import Header from '../../components/Header';

/**
 * 靈魂兌換所頁面
 * 整合旅遊資訊並提供兌換功能
 */
export default function ExchangePage() {
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
            💎 靈魂兌換所
          </h1>
          <p className="text-xs sm:text-sm text-soul-glow/60">
            淨化污穢，兌換專屬榮光
          </p>
        </div>

        {/* 內容區域 */}
        <div className="flex-1 w-full mb-4">
          <div className="gothic-button p-6 rounded-lg text-center">
            <p className="text-soul-glow/80">靈魂兌換所功能開發中...</p>
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
            onClick={() => router.push('/exchange')}
            className="route-footer__icon"
            aria-label="靈魂兌換所"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="route-footer__label">靈魂兌換所</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

