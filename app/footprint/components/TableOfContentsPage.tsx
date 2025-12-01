'use client';

import { useMemo, useRef, useEffect, useState } from 'react';

interface MapRecordPicture {
  id: string;
  picture: string | null;
}

interface MapRecord {
  id: string;
  name: string | null;
  description: string | null;
  coordinate: string | null;
  Create_time: string;
  pictures: MapRecordPicture[];
}

interface TableOfContentsPageProps {
  records: MapRecord[];
  pageIndex: number; // 第幾頁目錄（從 0 開始）
  recordsPerPage?: number; // 每頁顯示幾個印記
  onRecordClick?: (record: MapRecord) => void;
}

/**
 * TableOfContentsPage - 目錄頁組件
 * 顯示印記列表，從右上到左下排列，蜿蜒連接線從鯨魚到寶藏
 */
export default function TableOfContentsPage({
  records,
  pageIndex,
  recordsPerPage = 3,
  onRecordClick,
}: TableOfContentsPageProps) {
  const whaleRef = useRef<HTMLDivElement>(null);
  const treasureRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [whaleCenter, setWhaleCenter] = useState({ x: 9, y: 9 });
  const [treasureCenter, setTreasureCenter] = useState({ x: 91, y: 91 });

  // 計算當前頁應該顯示的印記
  const displayedRecords = useMemo(() => {
    const startIndex = pageIndex * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return records.slice(startIndex, endIndex);
  }, [records, pageIndex, recordsPerPage]);

  // 計算圖片中心點（轉換為 SVG 座標系統 0-100）
  useEffect(() => {
    const updateCenters = () => {
      if (!whaleRef.current || !treasureRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // 計算鯨魚中心
      const whaleRect = whaleRef.current.getBoundingClientRect();
      const whaleCenterX = ((whaleRect.left + whaleRect.width / 2 - containerRect.left) / containerWidth) * 100;
      const whaleCenterY = ((whaleRect.top + whaleRect.height / 2 - containerRect.top) / containerHeight) * 100;

      // 計算寶藏中心
      const treasureRect = treasureRef.current.getBoundingClientRect();
      const treasureCenterX = ((treasureRect.left + treasureRect.width / 2 - containerRect.left) / containerWidth) * 100;
      const treasureCenterY = ((treasureRect.top + treasureRect.height / 2 - containerRect.top) / containerHeight) * 100;

      setWhaleCenter({ x: whaleCenterX, y: whaleCenterY });
      setTreasureCenter({ x: treasureCenterX, y: treasureCenterY });
    };

    // 初始計算
    updateCenters();

    // 監聽窗口大小變化
    window.addEventListener('resize', updateCenters);
    // 使用 setTimeout 確保 DOM 已渲染（延遲時間增加以確保圖片已載入）
    const timer = setTimeout(updateCenters, 200);
    const timer2 = setTimeout(updateCenters, 500); // 額外延遲以確保圖片完全載入

    return () => {
      window.removeEventListener('resize', updateCenters);
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [displayedRecords.length, displayedRecords]); // 添加 displayedRecords 作為依賴

  // 計算單一連續連接線的路徑
  const calculateSinglePath = () => {
    if (displayedRecords.length === 0) return '';

    // 使用實際計算的圖片中心點
    const whaleX = whaleCenter.x;
    const whaleY = whaleCenter.y;
    const treasureX = treasureCenter.x;
    const treasureY = treasureCenter.y;

    // 計算所有印記的位置（沿對角線排列）
    const recordPositions = displayedRecords.map((_, index) => {
      const position = getRecordPosition(index, displayedRecords.length);
      return { x: position.recordX, y: position.recordY };
    });

    // 構建單一連續路徑
    let path = `M ${whaleX} ${whaleY}`;

    // 從鯨魚連接到第一個印記
    if (recordPositions.length > 0) {
      const firstRecord = recordPositions[0];
      // 使用控制點創建蜿蜒效果
      const control1X = whaleX + (firstRecord.x - whaleX) * 0.3;
      const control1Y = whaleY + (firstRecord.y - whaleY) * 0.4;
      path += ` Q ${control1X} ${control1Y} ${firstRecord.x} ${firstRecord.y}`;
    }

    // 連接所有印記（從第一個到最後一個）
    for (let i = 1; i < recordPositions.length; i++) {
      const prevRecord = recordPositions[i - 1];
      const currentRecord = recordPositions[i];
      
      // 計算控制點（創建蜿蜒效果）
      const midX = prevRecord.x + (currentRecord.x - prevRecord.x) * 0.5;
      const midY = prevRecord.y + (currentRecord.y - prevRecord.y) * 0.5;
      // 添加偏移以創建更自然的蜿蜒效果（交替左右偏移）
      const offsetX = (i % 2 === 0 ? 1 : -1) * 4; // 交替偏移，增加蜿蜒感
      const controlX = midX + offsetX;
      const controlY = midY;
      path += ` Q ${controlX} ${controlY} ${currentRecord.x} ${currentRecord.y}`;
    }

    // 從最後一個印記連接到寶藏
    if (recordPositions.length > 0) {
      const lastRecord = recordPositions[recordPositions.length - 1];
      const control1X = lastRecord.x + (treasureX - lastRecord.x) * 0.3;
      const control1Y = lastRecord.y + (treasureY - lastRecord.y) * 0.4;
      const control2X = lastRecord.x + (treasureX - lastRecord.x) * 0.7;
      const control2Y = lastRecord.y + (treasureY - lastRecord.y) * 0.6;
      path += ` Q ${control1X} ${control1Y} ${control2X} ${control2Y} T ${treasureX} ${treasureY}`;
    } else {
      // 如果沒有印記，直接從鯨魚連到寶藏
      const control1X = whaleX + (treasureX - whaleX) * 0.3;
      const control1Y = whaleY + (treasureY - whaleY) * 0.4;
      const control2X = whaleX + (treasureX - whaleX) * 0.7;
      const control2Y = whaleY + (treasureY - whaleY) * 0.6;
      path += ` Q ${control1X} ${control1Y} ${control2X} ${control2Y} T ${treasureX} ${treasureY}`;
    }

    return path;
  };

  // 計算印記位置（沿對角線排列，帶隨機偏移，遠離起點和終點）
  const getRecordPosition = (index: number, total: number) => {
    // 使用實際計算的鯨魚和寶藏中心點作為對角線起點和終點
    const startX = whaleCenter.x;
    const startY = whaleCenter.y;
    const endX = treasureCenter.x;
    const endY = treasureCenter.y;

    // 計算對角線的垂直方向（用於左右偏移）
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / length; // 垂直方向的單位向量 X（左側為正）
    const perpY = dx / length; // 垂直方向的單位向量 Y

    // 沿對角線均勻分佈，但避開起點和終點（各保留 20% 的區域）
    const margin = 0.2; // 起點和終點各保留 20% 的區域
    const effectiveRange = 1 - 2 * margin; // 有效範圍 60%
    const t = margin + (effectiveRange / (total - 1 || 1)) * index; // 從 0.2 到 0.8 之間分佈
    const baseX = startX + (endX - startX) * t;
    const baseY = startY + (endY - startY) * t;

    // 使用基於索引的偽隨機偏移（確保每次渲染位置一致）
    // 使用簡單的哈希函數生成偏移，範圍在 -12 到 +12 之間（更劇烈的偏移）
    const seed = index * 17 + pageIndex * 31;
    const randomOffset = ((seed % 240) / 240) * 24 - 12; // -12 到 12 的偏移

    // 應用垂直偏移（左右偏移）
    const recordX = baseX + perpX * randomOffset;
    const recordY = baseY + perpY * randomOffset;

    // 確保不超過方形區域（10% 到 90%）
    const clampedX = Math.max(10, Math.min(90, recordX));
    const clampedY = Math.max(10, Math.min(90, recordY));

    return { recordX: clampedX, recordY: clampedY };
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-gradient-to-br from-[#2d1b3d] via-[#1a1a2e] to-[#0f0a1a] rounded-lg shadow-2xl border-4 border-[#f0d9b5]/30 p-6 sm:p-8 overflow-hidden"
    >
      {/* 頁面裝飾 */}
      <div className="absolute inset-4 border-2 border-[#6b46c1]/20 rounded-lg" />

      {/* SVG 容器 - 用於繪製連接線 */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* 繪製單一連續連接線 */}
        <path
          d={calculateSinglePath()}
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
      </svg>

      {/* 鯨魚圖標（左上角） */}
      <div
        ref={whaleRef}
        className="absolute"
        style={{
          top: '4%',
          left: '4%',
          width: '100px',
          height: '100px',
          zIndex: 3,
        }}
      >
        <img
          src="/images/maps/whale.png"
          alt="鯨魚"
          className="w-full h-full object-contain drop-shadow-2xl filter brightness-110"
        />
      </div>

      {/* 寶藏圖標（右下角） */}
      <div
        ref={treasureRef}
        className="absolute"
        style={{
          bottom: '4%',
          right: '4%',
          width: '100px',
          height: '100px',
          zIndex: 3,
        }}
      >
        <img
          src="/images/maps/treasure.png"
          alt="寶藏"
          className="w-full h-full object-contain drop-shadow-2xl filter brightness-110"
        />
      </div>

      {/* 印記列表（沿對角線排列） */}
      <div className="relative z-10 h-full flex flex-col justify-center">
        {displayedRecords.map((record, index) => {
          const position = getRecordPosition(index, displayedRecords.length);
          return (
            <div
              key={record.id}
              className="absolute cursor-pointer group"
              style={{
                left: `${position.recordX}%`,
                top: `${position.recordY}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => onRecordClick?.(record)}
            >
              {/* 印記節點 */}
              <div className="relative">
                {/* 外圈光暈 */}
                <div className="absolute inset-0 rounded-full bg-[#fbbf24]/30 blur-md group-hover:bg-[#fbbf24]/50 transition-all duration-300" />
                {/* 節點圓圈 */}
                <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] border-2 border-[#f7e7c7] shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-lg sm:text-2xl">⚓</span>
                </div>
                {/* 印記名稱標籤 */}
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="bg-[#2d1b3d]/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#fbbf24]/40 shadow-lg">
                    <p className="text-sm font-semibold text-[#fbbf24]">
                      {record.name || '未命名地點'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 頁面標題 */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
        <h2
          className="text-2xl sm:text-3xl font-bold text-[#fbbf24] text-center"
          style={{ fontFamily: 'serif', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}
        >
          目錄
        </h2>
        <div className="h-1 w-20 bg-gradient-to-r from-transparent via-[#fbbf24] to-transparent mx-auto mt-2" />
      </div>
    </div>
  );
}

