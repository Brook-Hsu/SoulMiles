'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

interface MapRecord {
  id: string;
  name: string | null;
  description: string | null;
  Create_time: string;
  pictures: MapRecordPicture[];
}

interface MapRecordPicture {
  id: string;
  picture: string | null;
}

interface InteractiveFlipBookProps {
  records: MapRecord[];
  onRecordClick?: (record: MapRecord) => void;
}

/**
 * InteractiveFlipBook - 可拖曳翻頁的互動書籍組件
 * 實現真實的拖曳翻頁動畫效果
 */
export default function InteractiveFlipBook({ records, onRecordClick }: InteractiveFlipBookProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right' | null>(null);
  const bookRef = useRef<HTMLDivElement>(null);

  // 總頁數（封面 + 內容頁）
  const totalPages = records.length + 1;

  // 處理拖曳結束
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 80; // 拖曳閾值

    if (info.offset.x > threshold && currentPage > 0) {
      // 向右拖曳，翻到上一頁
      setCurrentPage(currentPage - 1);
      setFlipDirection('right');
      setTimeout(() => setFlipDirection(null), 600);
    } else if (info.offset.x < -threshold && currentPage < totalPages - 1) {
      // 向左拖曳，翻到下一頁
      setCurrentPage(currentPage + 1);
      setFlipDirection('left');
      setTimeout(() => setFlipDirection(null), 600);
    } else {
      setFlipDirection(null);
    }
  };

  // 點擊翻頁（作為拖曳的備選方案）
  const handlePageClick = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(currentPage - 1);
      setFlipDirection('right');
      setTimeout(() => setFlipDirection(null), 600);
    } else if (direction === 'next' && currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      setFlipDirection('left');
      setTimeout(() => setFlipDirection(null), 600);
    }
  };

  // 封面頁
  if (currentPage === 0) {
    return (
      <div className="w-full h-[500px] sm:h-[600px] relative perspective-1000">
        <motion.div
          ref={bookRef}
          className="w-full h-full relative cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          animate={{
            rotateY: flipDirection === 'left' ? -180 : flipDirection === 'right' ? 180 : 0,
            scale: isDragging ? 0.98 : 1,
          }}
          transition={{ 
            duration: 0.6, 
            ease: [0.4, 0, 0.2, 1],
            rotateY: { duration: 0.6 }
          }}
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* 封面 - 復古世界地圖風格 */}
          <div className="absolute inset-0 rounded-lg shadow-2xl border-4 border-[#8b6f47]/40 overflow-hidden">
            {/* 復古地圖背景 */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: 'url(/images/maps/gothic_map_01.jpg)',
                filter: 'sepia(0.6) contrast(1.1) brightness(0.9)',
              }}
            />
            
            {/* 復古紙張質感覆蓋層 */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#8b6f47]/20 via-transparent to-[#5d4a2f]/30" />
            <div className="absolute inset-0" style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 111, 71, 0.03) 2px, rgba(139, 111, 71, 0.03) 4px),
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139, 111, 71, 0.03) 2px, rgba(139, 111, 71, 0.03) 4px)
              `,
            }} />

            {/* 封面內容 - 半透明背景確保文字可讀 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
              <div className="bg-[#2d1b3d]/85 backdrop-blur-sm rounded-lg border-2 border-[#f0d9b5]/30 p-8 sm:p-12 shadow-2xl max-w-2xl w-full">
                <div className="text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#8b6f47] to-[#5d4a2f] flex items-center justify-center border-4 border-[#fbbf24]/40 shadow-lg">
                      <span className="text-4xl sm:text-5xl">📖</span>
                    </div>
                  </div>
                  <h1
                    className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#fbbf24] mb-4"
                    style={{ 
                      fontFamily: 'serif', 
                      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 20px rgba(251, 191, 36, 0.5)',
                      letterSpacing: '0.1em'
                    }}
                  >
                    命運之書
                  </h1>
                  <p 
                    className="text-lg sm:text-xl md:text-2xl text-[#f7e7c7]/90 mb-4" 
                    style={{ 
                      fontFamily: 'serif',
                      textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
                    }}
                  >
                    足跡影片紀錄
                  </p>
                  <div className="mt-6 pt-4 border-t border-[#f0d9b5]/30">
                    <p className="text-sm text-[#f0d9b5]/80" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)' }}>
                      共 {records.length} 頁回憶
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 翻頁提示 */}
            {records.length > 0 && (
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <div className="flex items-center gap-2 text-[#f7e7c7]/60 text-sm">
                  <span>←</span>
                  <span>拖曳或點擊開始閱讀</span>
                  <span>→</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // 內容頁
  const record = records[currentPage - 1];
  if (!record) return null;

  return (
    <div className="w-full h-[500px] sm:h-[600px] relative perspective-1000">
      <motion.div
        ref={bookRef}
        className="w-full h-full relative cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        animate={{
          rotateY: flipDirection === 'left' ? -180 : flipDirection === 'right' ? 180 : 0,
          scale: isDragging ? 0.98 : 1,
        }}
        transition={{ 
          duration: 0.6, 
          ease: [0.4, 0, 0.2, 1],
          rotateY: { duration: 0.6 }
        }}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* 頁面內容 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2d1b3d] via-[#1a1a2e] to-[#0f0a1a] rounded-lg shadow-2xl border-4 border-[#f0d9b5]/30 p-6 sm:p-8 overflow-y-auto">
          {/* 頁面裝飾 */}
          <div className="absolute inset-4 border-2 border-[#6b46c1]/20 rounded-lg" />

          {/* 頁面內容 */}
          <div className="relative z-10 space-y-4">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#fbbf24] mb-2" style={{ fontFamily: 'serif' }}>
                  {record.name || '未命名地點'}
                </h2>
                {onRecordClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRecordClick(record);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#fbbf24]/20 text-[#fbbf24] hover:bg-[#fbbf24]/30 transition-colors text-sm border border-[#fbbf24]/40"
                    title="編輯此記錄"
                  >
                    編輯
                  </button>
                )}
              </div>
              <div className="h-1 w-20 bg-gradient-to-r from-[#fbbf24] to-transparent mb-4" />
            </div>

            {record.description && (
              <div className="mb-6">
                <p className="text-[#f7e7c7]/90 whitespace-pre-wrap leading-relaxed" style={{ fontFamily: 'serif' }}>
                  {record.description}
                </p>
              </div>
            )}

            {record.pictures && record.pictures.length > 0 && (
              <div className="space-y-3 mb-6">
                {record.pictures.map((pic) => (
                  <div key={pic.id} className="rounded-lg overflow-hidden border-2 border-[#f0d9b5]/20">
                    {pic.picture && (
                      <img
                        src={pic.picture}
                        alt="回憶照片"
                        className="w-full h-auto max-h-64 sm:max-h-80 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-[#f0d9b5]/20">
              <p className="text-xs text-[#f0d9b5]/60">
                {new Date(record.Create_time).toLocaleString('zh-TW', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* 翻頁控制 */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-between items-center px-4 sm:px-8">
            <button
              onClick={() => handlePageClick('prev')}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-[#6b46c1]/80 text-[#f7e7c7] hover:bg-[#5b21b6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              ← 上一頁
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#f7e7c7]/70">
                {currentPage} / {totalPages}
              </span>
            </div>
            <button
              onClick={() => handlePageClick('next')}
              disabled={currentPage >= totalPages - 1}
              className="px-4 py-2 rounded-lg bg-[#fbbf24] text-[#1b0e07] hover:bg-[#f59e0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {currentPage >= totalPages - 1 ? '封底' : '下一頁 →'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

