'use client';

import { useState, useEffect } from 'react';

const channelMessages = [
  '黑鬍子海賊團來襲！！！',
  '教堂候選聖女名單出爐',
  '神秘海怪出沒百慕達三角洲',
  '香料聯盟商船遇難',
  '梅林的鬍子，失竊的寶藏！',
  '吟遊詩人新作，歌頌無畏的探險家。',
  '地精工程師們宣佈發明了新一代蒸汽飛艇。',
];

export default function WorldChannelTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // 觸發淡出動畫
      setIsFading(true);
      
      // 在淡出動畫完成後切換訊息並淡入
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % channelMessages.length);
        setIsFading(false);
      }, 300); // 淡出動畫持續時間的一半
    }, 5000); // 每 5 秒切換一次

    // 清除計時器以避免記憶體洩漏
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-[300px] sm:w-[400px] px-4 py-2 rounded-lg bg-transparent">
      <div className="relative h-6 sm:h-7 flex items-center justify-center">
        <p
          className={`text-sm sm:text-base text-[#fbbf24]/90 font-medium text-center whitespace-nowrap transition-opacity duration-300 ease-in-out ${
            isFading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {channelMessages[currentIndex]}
        </p>
      </div>
    </div>
  );
}

