'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FootprintMap from './FootprintMap';
import InteractiveFlipBook from './InteractiveFlipBook';
import MapRecordModal from './MapRecordModal';

interface MapRecord {
  id: string;
  name: string | null;
  description: string | null;
  coordinate: string | null;
  Create_time: string;
  pictures: MapRecordPicture[];
}

interface MapRecordPicture {
  id: string;
  picture: string | null;
}

interface MyMapTabClientProps {
  records?: MapRecord[];
}

/**
 * MyMapTabClient - Client Component
 * 包含地圖顯示、印記按鈕、互動翻書組件
 * 從 API Route 獲取數據，或使用傳入的 records prop
 */
export default function MyMapTabClient({ records: initialRecords }: MyMapTabClientProps = {}) {
  const router = useRouter();
  const [records, setRecords] = useState<MapRecord[]>(initialRecords || []);
  const [loading, setLoading] = useState(!initialRecords);
  const [showMapRecordModal, setShowMapRecordModal] = useState(false);
  const [mapRecordMode, setMapRecordMode] = useState<'input' | 'edit' | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MapRecord | null>(null);

  // 從 API 獲取數據（只有在沒有初始 records 時才獲取）
  useEffect(() => {
    // 如果已經有初始 records，跳過 API 請求
    if (initialRecords) {
      setLoading(false);
      return;
    }

    const fetchRecords = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/footprint/map-records');
        if (response.ok) {
          const data = await response.json();
          setRecords(data.records || []);
        } else {
          // 如果未登入或其他錯誤，設置為空陣列
          setRecords([]);
        }
      } catch (error) {
        console.error('獲取 MapRecord 失敗:', error);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [initialRecords]);

  const handleImprintClick = () => {
    setSelectedRecord(null);
    setMapRecordMode(null);
    setShowMapRecordModal(true);
  };

  const handleInputClick = () => {
    setSelectedRecord(null);
    setMapRecordMode('input');
    setShowMapRecordModal(true);
  };

  const handleEditClick = () => {
    setMapRecordMode('edit');
    setShowMapRecordModal(true);
  };

  const handleRecordClick = (record: MapRecord) => {
    setSelectedRecord(record);
    setMapRecordMode('edit');
    setShowMapRecordModal(true);
  };

  const handleRecordSelect = (record: MapRecord) => {
    setSelectedRecord(record);
    setMapRecordMode('edit');
    setShowMapRecordModal(true);
  };

  const handleSuccess = async () => {
    // 刷新數據：重新從 API 獲取數據
    try {
      const response = await fetch('/api/footprint/map-records');
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records || []);
      }
    } catch (error) {
      console.error('刷新 MapRecord 失敗:', error);
    }
  };

  // 載入中顯示
  if (loading) {
    return (
      <div className="flex flex-col gap-4 mb-16 sm:mb-20">
        <div className="w-full h-[400px] sm:h-[500px] relative rounded-lg overflow-hidden border border-[#f0d9b5]/30">
          <FootprintMap />
        </div>
        <div className="w-full flex items-center justify-center py-8">
          <p className="text-[#f7e7c7]/70">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mb-16 sm:mb-20">
      {/* 地圖區域 */}
      <div className="w-full h-[400px] sm:h-[500px] relative rounded-lg overflow-hidden border border-[#f0d9b5]/30">
        <FootprintMap />
      </div>

      {/* 命運之書 - 直接嵌入 */}
      <div className="w-full">
        <InteractiveFlipBook records={records} onRecordClick={handleRecordClick} />
      </div>

      {/* 功能按鈕區域 */}
      <div className="flex flex-col gap-3 w-full">
        {/* 印記按鈕 */}
        <button
          onClick={handleImprintClick}
          className="gothic-button px-6 py-3 rounded-lg text-center font-bold text-lg text-[#f7e7c7] hover:text-[#fbbf24] transition-colors shadow-lg"
          style={{
            fontFamily: 'serif',
            letterSpacing: '0.1em',
          }}
        >
          ✨ 印記
        </button>
      </div>

      {/* MapRecord 模態視窗 */}
      {showMapRecordModal && (
        <MapRecordModal
          mode={mapRecordMode}
          record={selectedRecord}
          records={records}
          onClose={() => {
            setShowMapRecordModal(false);
            setMapRecordMode(null);
            setSelectedRecord(null);
          }}
          onInputClick={handleInputClick}
          onEditClick={handleEditClick}
          onSuccess={handleSuccess}
          onRecordSelect={handleRecordSelect}
        />
      )}
    </div>
  );
}

