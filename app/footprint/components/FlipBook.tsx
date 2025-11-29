'use client';

import { useState, useEffect } from 'react';

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

interface FlipBookProps {
  onClose: () => void;
}

/**
 * FlipBook - 翻書動畫組件
 * 顯示所有使用者的 MapRecord 記錄，封面寫著 "命運之書"
 */
export default function FlipBook({ onClose }: FlipBookProps) {
  const [records, setRecords] = useState<MapRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMapRecords();
  }, []);

  const fetchMapRecords = async () => {
    try {
      const response = await fetch('/api/footprint/map-records');
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error('獲取 MapRecord 失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (currentPage < records.length) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage + 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(currentPage - 1);
        setIsFlipping(false);
      }, 300);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse-soul">📖</div>
          <p className="text-[#f7e7c7]">載入命運之書中...</p>
        </div>
      </div>
    );
  }

  // 封面頁（第 0 頁）
  if (currentPage === 0) {
    return (
      <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 p-4">
        <div className="relative w-full max-w-2xl">
          {/* 書本容器 */}
          <div
            className={`relative bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-lg shadow-2xl border-4 border-[#f0d9b5]/30 p-8 min-h-[500px] flex flex-col items-center justify-center ${
              isFlipping ? 'flip-animation' : ''
            }`}
          >
            {/* 封面內容 */}
            <div className="text-center">
              <h1 className="text-5xl font-bold text-[#fbbf24] mb-4" style={{ fontFamily: 'serif' }}>
                命運之書
              </h1>
              <p className="text-xl text-[#f7e7c7]/80 mb-8">記錄您的足跡與回憶</p>
              <p className="text-sm text-[#f0d9b5]/60">共 {records.length} 頁</p>
            </div>

            {/* 翻頁按鈕 */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-[#6b46c1] text-[#f7e7c7] hover:bg-[#5b21b6] transition-colors"
              >
                關閉
              </button>
              {records.length > 0 && (
                <button
                  onClick={handleNextPage}
                  className="px-6 py-2 rounded-lg bg-[#fbbf24] text-[#1b0e07] hover:bg-[#f59e0b] transition-colors"
                >
                  開始閱讀 →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 內容頁（第 1 頁開始）
  const record = records[currentPage - 1];
  if (!record) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-2xl">
        {/* 書本容器 */}
        <div
          className={`relative bg-gradient-to-br from-[#2d1b3d] to-[#1a1a2e] rounded-lg shadow-2xl border-4 border-[#f0d9b5]/30 p-8 min-h-[500px] ${
            isFlipping ? 'flip-animation' : ''
          }`}
        >
          {/* 頁面內容 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-[#fbbf24] mb-2">
              {record.name || '未命名地點'}
            </h2>
            {record.description && (
              <p className="text-[#f7e7c7]/80 whitespace-pre-wrap mb-4">
                {record.description}
              </p>
            )}
            {record.pictures && record.pictures.length > 0 && (
              <div className="space-y-2">
                {record.pictures.map((pic) => (
                  <div key={pic.id} className="rounded-lg overflow-hidden">
                    {pic.picture && (
                      <img
                        src={pic.picture}
                        alt="回憶照片"
                        className="w-full h-auto max-h-64 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-[#f0d9b5]/60 mt-4">
              {new Date(record.Create_time).toLocaleString('zh-TW')}
            </p>
          </div>

          {/* 翻頁按鈕 */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-between px-8">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-[#6b46c1] text-[#f7e7c7] hover:bg-[#5b21b6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← 上一頁
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#f7e7c7]/70">
                {currentPage} / {records.length}
              </span>
            </div>
            <button
              onClick={currentPage < records.length ? handleNextPage : onClose}
              className="px-4 py-2 rounded-lg bg-[#fbbf24] text-[#1b0e07] hover:bg-[#f59e0b] transition-colors"
            >
              {currentPage < records.length ? '下一頁 →' : '關閉'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

