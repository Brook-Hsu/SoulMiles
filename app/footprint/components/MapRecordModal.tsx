'use client';

import { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';

interface MapRecord {
  id: string;
  name: string | null;
  description: string | null;
  coordinate: string | null;
  pictures: MapRecordPicture[];
}

interface MapRecordPicture {
  id: string;
  picture: string | null;
}

interface MapRecordModalProps {
  mode: 'input' | 'edit' | null;
  record?: MapRecord | null;
  records?: MapRecord[];
  onClose: () => void;
  onInputClick: () => void;
  onEditClick: () => void;
  onSuccess?: () => void;
  onRecordSelect?: (record: MapRecord) => void;
}

/**
 * MapRecordModal - 足跡記錄模態視窗
 * 包含選擇「輸入」或「編輯」的初始狀態，以及實際的輸入/編輯表單
 */
export default function MapRecordModal({ mode, record, records = [], onClose, onInputClick, onEditClick, onSuccess, onRecordSelect }: MapRecordModalProps) {
  const [showModeSelection, setShowModeSelection] = useState(mode === null);
  const [currentMode, setCurrentMode] = useState<'input' | 'edit' | null>(mode);
  const [showEditList, setShowEditList] = useState(mode === 'edit' && !record);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pictures, setPictures] = useState<string[]>([]);
  const [currentPicture, setCurrentPicture] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 當進入編輯模式且有記錄時，載入現有數據
  useEffect(() => {
    if (currentMode === 'edit' && record) {
      setName(record.name || '');
      setDescription(record.description || '');
      setPictures(record.pictures.map(pic => pic.picture || '').filter(Boolean));
      setShowEditList(false); // 有記錄時不顯示列表
    } else if (currentMode === 'edit' && !record) {
      setShowEditList(true); // 沒有記錄時顯示列表
    } else if (currentMode === 'input') {
      // 重置表單
      setName('');
      setDescription('');
      setPictures([]);
      setCurrentPicture('');
      setShowEditList(false);
    }
  }, [currentMode, record]);

  // 如果是編輯模式且沒有選中記錄，顯示記錄列表
  if (showEditList && currentMode === 'edit') {
    return (
      <Modal
        title="編輯足跡記錄"
        subtitle="選擇要編輯的記錄"
        onClose={onClose}
      >
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {records.length === 0 ? (
            <p className="text-center text-[#f7e7c7]/70 py-8">尚無記錄</p>
          ) : (
            records.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-lg border border-[#fbbf24]/30 bg-[#2b1a10]/70 hover:border-[#fbbf24] transition-colors"
              >
                <span className="text-sm font-semibold text-[#f7e7c7] flex-1 truncate">
                  {rec.name || '未命名地點'}
                </span>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => {
                      if (onRecordSelect) {
                        onRecordSelect(rec);
                      }
                      setShowEditList(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#fbbf24] text-[#1b0e07] hover:bg-[#f59e0b] transition-colors text-sm font-semibold"
                  >
                    編輯
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`確定要刪除「${rec.name || '未命名地點'}」嗎？`)) {
                        return;
                      }
                      setDeletingId(rec.id);
                      try {
                        const response = await fetch(`/api/footprint/map-records?id=${rec.id}`, {
                          method: 'DELETE',
                        });
                        if (response.ok) {
                          if (onSuccess) {
                            onSuccess();
                          }
                          // 如果刪除的是當前選中的記錄，關閉模態視窗
                          if (record && record.id === rec.id) {
                            onClose();
                          }
                        } else {
                          const error = await response.json();
                          alert(`刪除失敗: ${error.error || '未知錯誤'}`);
                        }
                      } catch (error) {
                        console.error('刪除記錄失敗:', error);
                        alert('刪除失敗，請稍後再試');
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    disabled={deletingId === rec.id}
                    className="px-3 py-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === rec.id ? '刪除中...' : '刪除'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    );
  }

  // 如果是初始狀態，顯示模式選擇
  if (showModeSelection || currentMode === null) {
    return (
      <Modal
        title="印記"
        subtitle="選擇您的操作"
        onClose={onClose}
      >
        <div className="space-y-3">
          <button
            onClick={() => {
              setShowModeSelection(false);
              setCurrentMode('input');
              onInputClick();
            }}
            className="w-full rounded-xl border border-[#fbbf24]/30 bg-[#2b1a10]/70 px-4 py-3 text-left hover:border-[#fbbf24] transition-colors"
          >
            <p className="text-sm font-semibold text-[#fbbf24]">輸入</p>
            <p className="text-xs text-[#f7e7c7]/70">新增新的足跡記錄</p>
          </button>
          <button
            onClick={() => {
              setShowModeSelection(false);
              setCurrentMode('edit');
              setShowEditList(true);
              onEditClick();
            }}
            className="w-full rounded-xl border border-[#fbbf24]/30 bg-[#2b1a10]/70 px-4 py-3 text-left hover:border-[#fbbf24] transition-colors"
          >
            <p className="text-sm font-semibold text-[#fbbf24]">編輯</p>
            <p className="text-xs text-[#f7e7c7]/70">編輯現有的足跡記錄</p>
          </button>
        </div>
      </Modal>
    );
  }

  const handleAddPicture = () => {
    if (currentPicture.trim()) {
      setPictures([...pictures, currentPicture]);
      setCurrentPicture('');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 驗證文件類型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('只能上傳 JPG 或 PNG 格式的圖片');
      return;
    }

    // 驗證文件大小（限制為 5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('圖片大小不能超過 5MB');
      return;
    }

    // 將文件轉換為 Base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      if (base64String) {
        setPictures([...pictures, base64String]);
      }
    };
    reader.onerror = () => {
      alert('讀取文件失敗，請稍後再試');
    };
    reader.readAsDataURL(file);

    // 重置 input，以便可以再次選擇同一個文件
    event.target.value = '';
  };

  const handleAddButtonClick = () => {
    // 觸發隱藏的文件選擇器
    const fileInput = document.getElementById('photo-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleRemovePicture = (index: number) => {
    setPictures(pictures.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('請輸入地點名稱');
      return;
    }

    setLoading(true);
    try {
      // 獲取當前位置（僅在輸入模式下，編輯模式保留原有座標）
      let coordinate: string | null = null;
      if (currentMode === 'input') {
        if (typeof window !== 'undefined' && navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            coordinate = `${position.coords.latitude},${position.coords.longitude}`;
          } catch (error) {
            console.error('獲取位置失敗:', error);
            // 位置獲取失敗不阻止提交
          }
        }
      } else if (currentMode === 'edit' && record) {
        // 編輯模式保留原有座標
        coordinate = record.coordinate;
      }

      const isEdit = currentMode === 'edit' && record;
      const url = '/api/footprint/map-records';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit
        ? {
            id: record.id,
            name,
            description,
            coordinate,
            pictures,
          }
        : {
            name,
            description,
            coordinate,
            pictures,
          };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        alert(isEdit ? '足跡記錄已更新' : '足跡記錄已保存');
        onClose();
        // 重置表單
        setName('');
        setDescription('');
        setPictures([]);
        setCurrentPicture('');
        // 觸發成功回調以刷新數據
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const error = await response.json();
        alert(`${isEdit ? '更新' : '保存'}失敗: ${error.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error(`${currentMode === 'edit' ? '更新' : '保存'}足跡記錄失敗:`, error);
      alert(`${currentMode === 'edit' ? '更新' : '保存'}失敗，請稍後再試`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={currentMode === 'input' ? '輸入足跡記錄' : '編輯足跡記錄'}
      subtitle="記錄您的美好回憶"
      onClose={onClose}
      primaryAction={
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-lg bg-[#fbbf24] py-2 text-sm font-semibold text-[#1b0e07] shadow-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '保存中...' : '保存'}
        </button>
      }
    >
      <div className="space-y-4">
        {/* 地點名稱 */}
        <div>
          <label className="block text-sm font-semibold text-[#f7e7c7] mb-2">
            地點名稱 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-[#2b1a10]/70 border border-[#fbbf24]/30 px-3 py-2 text-[#f7e7c7] focus:border-[#fbbf24] focus:outline-none"
            placeholder="輸入地點名稱"
          />
        </div>

        {/* 地點回憶 */}
        <div>
          <label className="block text-sm font-semibold text-[#f7e7c7] mb-2">
            地點回憶
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg bg-[#2b1a10]/70 border border-[#fbbf24]/30 px-3 py-2 text-[#f7e7c7] focus:border-[#fbbf24] focus:outline-none resize-none"
            placeholder="記錄您在此地的回憶..."
          />
        </div>

        {/* 照片輸入 */}
        <div>
          <label className="block text-sm font-semibold text-[#f7e7c7] mb-2">
            照片 (Base64 或 URL)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={currentPicture}
              onChange={(e) => setCurrentPicture(e.target.value)}
              className="flex-1 rounded-lg bg-[#2b1a10]/70 border border-[#fbbf24]/30 px-3 py-2 text-[#f7e7c7] focus:border-[#fbbf24] focus:outline-none"
              placeholder="輸入照片 URL 或 Base64"
            />
            {/* 隱藏的文件選擇器 */}
            <input
              id="photo-file-input"
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={handleAddButtonClick}
              className="px-4 py-2 rounded-lg bg-[#6b46c1] text-[#f7e7c7] hover:bg-[#5b21b6] transition-colors"
            >
              添加
            </button>
            {/* 保留手動輸入的添加功能 */}
            {currentPicture.trim() && (
              <button
                onClick={handleAddPicture}
                className="px-4 py-2 rounded-lg bg-[#8b5cf6] text-[#f7e7c7] hover:bg-[#7c3aed] transition-colors"
                title="添加 URL 或 Base64"
              >
                添加文字
              </button>
            )}
          </div>
          {pictures.length > 0 && (
            <div className="mt-2 space-y-2">
              {pictures.map((pic, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-[#2b1a10]/50 rounded">
                  <span className="text-xs text-[#f7e7c7]/70 flex-1 truncate">
                    {pic.startsWith('data:image') ? '圖片文件' : pic.substring(0, 50)}...
                  </span>
                  <button
                    onClick={() => handleRemovePicture(index)}
                    className="text-[#fbbf24] hover:text-red-400 text-sm"
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

