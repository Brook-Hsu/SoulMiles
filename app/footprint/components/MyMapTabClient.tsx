'use client';

import { useState } from 'react';
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
  records: MapRecord[];
}

/**
 * MyMapTabClient - Client Component
 * 包含地圖顯示、印記按鈕、互動翻書組件
 */
export default function MyMapTabClient({ records }: MyMapTabClientProps) {
  const router = useRouter();
  const [showMapRecordModal, setShowMapRecordModal] = useState(false);
  const [mapRecordMode, setMapRecordMode] = useState<'input' | 'edit' | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MapRecord | null>(null);

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

  const handleSuccess = () => {
    // 刷新數據：重新獲取頁面數據
    router.refresh();
  };

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
          onClose={() => {
            setShowMapRecordModal(false);
            setMapRecordMode(null);
            setSelectedRecord(null);
          }}
          onInputClick={handleInputClick}
          onEditClick={handleEditClick}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

