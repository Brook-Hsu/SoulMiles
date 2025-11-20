'use client';

interface SubNavbarProps {
  activeTab: 'myMap' | 'quest';
  onTabChange: (tab: 'myMap' | 'quest') => void;
}

/**
 * SubNavbar - 子導航欄
 * 包含「我的地圖」和「今日主線任務」兩個 Tab
 */
export default function SubNavbar({ activeTab, onTabChange }: SubNavbarProps) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-full border border-[#f0d9b5]/30 bg-[#1c1422]/80 px-2 py-2 shadow-lg backdrop-blur">
      <button
        onClick={() => onTabChange('myMap')}
        className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
          activeTab === 'myMap'
            ? 'bg-[#6b46c1] text-[#f7e7c7] shadow-inner'
            : 'text-[#f0d9b5]/70 hover:text-[#f7e7c7] hover:bg-[#2a1c2f]/50'
        }`}
      >
        我的地圖
      </button>
      <button
        onClick={() => onTabChange('quest')}
        className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
          activeTab === 'quest'
            ? 'bg-[#6b46c1] text-[#f7e7c7] shadow-inner'
            : 'text-[#f0d9b5]/70 hover:text-[#f7e7c7] hover:bg-[#2a1c2f]/50'
        }`}
      >
        今日主線任務
      </button>
    </div>
  );
}

