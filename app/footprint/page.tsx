'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '../../components/Header';
import SubNavbar from './components/SubNavbar';
import QuestTab from './components/QuestTab';

// 動態導入 MyMapTab，避免在 Client Component 中直接導入 Server Component
const MyMapTab = dynamic(() => import('./components/MyMapTab'), {
  ssr: true,
});

/**
 * 足跡之光頁面
 * 包含 TopNav 和 SubNavbar，以及兩個主要 Tab 內容
 */
export default function FootprintPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'myMap' | 'quest'>('myMap');

  return (
    <div className="route-page text-[#f7e7c7]">
      <div className="route-page__bg" style={{ backgroundImage: 'url(/images/routes/route-bg.jpg)' }} />
      <div className="route-page__veil" />

      <div className="route-page__content">
        {/* TopNav */}
        <Header />

        {/* SubNavbar - 子導航欄 */}
        <div className="w-full mb-4">
          <SubNavbar activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* 頁面內容區域 */}
        <div className="flex-1 w-full">
          {activeTab === 'myMap' ? <MyMapTab /> : <QuestTab />}
        </div>

        {/* 底部導航欄 */}
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
            onClick={() => router.push('/footprint')}
            className="route-footer__icon route-footer__icon--active"
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

