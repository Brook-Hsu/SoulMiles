'use client';

import { useState, useRef, useEffect } from 'react';

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
 * 參考 Book-Flip-CSS 實現真實的 CSS 翻書動畫效果
 */
export default function InteractiveFlipBook({ records, onRecordClick }: InteractiveFlipBookProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 總頁數（封面 + 內容頁）
  const totalPages = records.length + 1; // 封面(1) + 內容頁(records.length)

  // 處理翻頁
  const flipPage = (direction: 'next' | 'prev') => {
    if (isFlipping) return;

    if (direction === 'next' && currentPage < totalPages - 1) {
      setIsFlipping(true);
      setFlipDirection('next');
      const currentPageElement = pageRefs.current[currentPage];
      if (currentPageElement) {
        currentPageElement.classList.add('flip-next');
      }
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsFlipping(false);
        setFlipDirection(null);
        if (currentPageElement) {
          currentPageElement.classList.remove('flip-next');
        }
      }, 600);
    } else if (direction === 'prev' && currentPage > 0) {
      setIsFlipping(true);
      setFlipDirection('prev');
      const currentPageElement = pageRefs.current[currentPage];
      if (currentPageElement) {
        // 先將當前頁面翻轉到背面（顯示上一頁的背面）
        currentPageElement.style.transform = 'rotateY(-180deg)';
        // 強制重排以確保狀態更新
        currentPageElement.offsetHeight;
        // 然後添加翻轉動畫（從背面翻回正面）
        currentPageElement.classList.add('flip-prev');
      }
      // 在動畫開始後立即切換頁面，這樣新頁面會從背面顯示
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
      }, 50); // 稍微延遲以確保動畫開始
      setTimeout(() => {
        setIsFlipping(false);
        setFlipDirection(null);
        if (currentPageElement) {
          currentPageElement.classList.remove('flip-prev');
          currentPageElement.style.transform = '';
        }
      }, 600);
    }
  };

  // 處理點擊翻頁
  const handlePageClick = (direction: 'prev' | 'next') => {
    flipPage(direction);
  };

  // 處理拖曳翻頁
  useEffect(() => {
    const bookElement = bookRef.current;
    if (!bookElement) return;

    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let dragThreshold = 50; // 拖曳閾值

    const handleMouseDown = (e: MouseEvent) => {
      if (isFlipping) return;
      startX = e.clientX;
      isDragging = true;
      bookElement.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isFlipping) return;
      currentX = e.clientX - startX;
    };

    const handleMouseUp = () => {
      if (!isDragging || isFlipping) return;
      isDragging = false;
      bookElement.style.cursor = 'grab';

      if (Math.abs(currentX) > dragThreshold) {
        if (currentX < 0 && currentPage < totalPages - 1) {
          // 向左拖曳，翻到下一頁
          flipPage('next');
        } else if (currentX > 0 && currentPage > 0) {
          // 向右拖曳，翻到上一頁
          flipPage('prev');
        }
      }
      currentX = 0;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (isFlipping) return;
      startX = e.touches[0].clientX;
      isDragging = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || isFlipping) return;
      currentX = e.touches[0].clientX - startX;
    };

    const handleTouchEnd = () => {
      if (!isDragging || isFlipping) return;
      isDragging = false;

      if (Math.abs(currentX) > dragThreshold) {
        if (currentX < 0 && currentPage < totalPages - 1) {
          flipPage('next');
        } else if (currentX > 0 && currentPage > 0) {
          flipPage('prev');
        }
      }
      currentX = 0;
    };

    bookElement.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    bookElement.addEventListener('touchstart', handleTouchStart);
    bookElement.addEventListener('touchmove', handleTouchMove);
    bookElement.addEventListener('touchend', handleTouchEnd);

    return () => {
      bookElement.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      bookElement.removeEventListener('touchstart', handleTouchStart);
      bookElement.removeEventListener('touchmove', handleTouchMove);
      bookElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentPage, totalPages, isFlipping]);

  // 封面頁
  if (currentPage === 0) {
    return (
      <div className="w-full relative">
        <div
          ref={bookRef}
          className="book-container"
          style={{
            perspective: '1500px',
            perspectiveOrigin: 'center center',
          }}
        >
          <div
            ref={(el) => (pageRefs.current[0] = el)}
            className="book-page book-cover"
          >
            <div className="page-front">
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
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 111, 71, 0.03) 2px, rgba(139, 111, 71, 0.03) 4px),
                      repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139, 111, 71, 0.03) 2px, rgba(139, 111, 71, 0.03) 4px)
                    `,
                  }}
                />

                {/* 封面內容 */}
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
                          letterSpacing: '0.1em',
                        }}
                      >
                        命運之書
                      </h1>
                      <p
                        className="text-lg sm:text-xl md:text-2xl text-[#f7e7c7]/90 mb-4"
                        style={{
                          fontFamily: 'serif',
                          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
                        }}
                      >
                        足跡影片紀錄
                      </p>
                      <div className="mt-6 pt-4 border-t border-[#f0d9b5]/30">
                        <p
                          className="text-sm text-[#f0d9b5]/80"
                          style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)' }}
                        >
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
            </div>
            <div className="page-back"></div>
          </div>
        </div>

        {/* 翻頁控制 */}
        <div className="mt-4 flex justify-between items-center px-4 sm:px-8">
          <button
            onClick={() => handlePageClick('prev')}
            disabled={currentPage === 0 || isFlipping}
            className="px-4 py-2 rounded-lg bg-[#6b46c1]/80 text-[#f7e7c7] hover:bg-[#5b21b6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            ← 上一頁
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#f7e7c7]/70">
              {currentPage + 1} / {totalPages}
            </span>
          </div>
          <button
            onClick={() => handlePageClick('next')}
            disabled={currentPage >= totalPages - 1 || isFlipping}
            className="px-4 py-2 rounded-lg bg-[#fbbf24] text-[#1b0e07] hover:bg-[#f59e0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            下一頁 →
          </button>
        </div>
      </div>
    );
  }

  // 內容頁
  const record = records[currentPage - 1];
  if (!record) {
    return null;
  }

  return (
    <div className="w-full relative">
      <div
        ref={bookRef}
        className="book-container"
        style={{
          perspective: '1500px',
          perspectiveOrigin: 'center center',
        }}
      >
        {/* 當前頁 */}
        <div
          ref={(el) => (pageRefs.current[currentPage] = el)}
          className="book-page book-content-page"
        >
          <div className="page-front">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2d1b3d] via-[#1a1a2e] to-[#0f0a1a] rounded-lg shadow-2xl border-4 border-[#f0d9b5]/30 p-6 sm:p-8 overflow-y-auto">
              {/* 頁面裝飾 */}
              <div className="absolute inset-4 border-2 border-[#6b46c1]/20 rounded-lg" />

              {/* 頁面內容 */}
              <div className="relative z-10 space-y-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h2
                      className="text-2xl sm:text-3xl font-bold text-[#fbbf24] mb-2"
                      style={{ fontFamily: 'serif' }}
                    >
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
                    <p
                      className="text-[#f7e7c7]/90 whitespace-pre-wrap leading-relaxed"
                      style={{ fontFamily: 'serif' }}
                    >
                      {record.description}
                    </p>
                  </div>
                )}

                {record.pictures && record.pictures.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {record.pictures.map((pic) => (
                      <div
                        key={pic.id}
                        className="rounded-lg overflow-hidden border-2 border-[#f0d9b5]/20"
                      >
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
            </div>
          </div>
          <div className="page-back">
            {/* 下一頁的背面內容（翻頁時顯示） */}
            {currentPage < totalPages - 1 && records[currentPage] && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#2d1b3d] via-[#1a1a2e] to-[#0f0a1a] rounded-lg border-4 border-[#f0d9b5]/30 p-6 sm:p-8 overflow-y-auto">
                <div className="mb-4">
                  <h2
                    className="text-2xl sm:text-3xl font-bold text-[#fbbf24] mb-2"
                    style={{ fontFamily: 'serif' }}
                  >
                    {records[currentPage].name || '未命名地點'}
                  </h2>
                  <div className="h-1 w-20 bg-gradient-to-r from-[#fbbf24] to-transparent mb-4" />
                </div>
                {records[currentPage].pictures && records[currentPage].pictures.length > 0 && (
                  <div className="rounded-lg overflow-hidden border-2 border-[#f0d9b5]/20 opacity-70">
                    {records[currentPage].pictures[0]?.picture && (
                      <img
                        src={records[currentPage].pictures[0].picture}
                        alt="下一頁預覽"
                        className="w-full h-auto max-h-48 object-cover"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 翻頁控制 */}
      <div className="mt-4 flex justify-between items-center px-4 sm:px-8">
        <button
          onClick={() => handlePageClick('prev')}
          disabled={currentPage === 1 || isFlipping}
          className="px-4 py-2 rounded-lg bg-[#6b46c1]/80 text-[#f7e7c7] hover:bg-[#5b21b6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          ← 上一頁
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#f7e7c7]/70">
            {currentPage + 1} / {totalPages}
          </span>
        </div>
        <button
          onClick={() => handlePageClick('next')}
          disabled={currentPage >= totalPages - 1 || isFlipping}
          className="px-4 py-2 rounded-lg bg-[#fbbf24] text-[#1b0e07] hover:bg-[#f59e0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          {currentPage >= totalPages - 1 ? '封底' : '下一頁 →'}
        </button>
      </div>
    </div>
  );
}
