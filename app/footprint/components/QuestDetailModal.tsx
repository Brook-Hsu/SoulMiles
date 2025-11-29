'use client';

import { useState } from 'react';
import Modal from '../../../components/Modal';

interface Task {
  id: string;
  name: string | null;
  description: string | null;
  coordinate: string | null;
  Coin: number;
}

interface QuestDetailModalProps {
  task: Task;
  onClose: () => void;
  onTaskComplete: () => void;
}

/**
 * QuestDetailModal - 任務詳情模態視窗
 * 顯示任務資訊、天堂幣獎勵，以及「完成任務」按鈕（需判斷使用者地點是否在任務附近）
 */
export default function QuestDetailModal({ task, onClose, onTaskComplete }: QuestDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [canComplete, setCanComplete] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // 計算兩點之間的距離（使用 Haversine 公式，單位：公尺）
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // 地球半徑（公尺）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 檢查使用者位置
  const checkLocation = async () => {
    if (!task.coordinate) {
      alert('此任務沒有設定位置');
      return;
    }

    setIsChecking(true);
    try {
      // 解析任務座標
      const [taskLat, taskLon] = task.coordinate.split(',').map(Number);
      if (isNaN(taskLat) || isNaN(taskLon)) {
        alert('任務座標格式錯誤');
        return;
      }

      // 獲取使用者當前位置
      if (typeof window === 'undefined' || !navigator.geolocation) {
        alert('您的瀏覽器不支援地理位置功能');
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;

      // 計算距離
      const dist = calculateDistance(userLat, userLon, taskLat, taskLon);
      setDistance(dist);

      // 判斷是否在 500 公尺內
      const threshold = 500; // 500 公尺
      setCanComplete(dist <= threshold);

      if (dist > threshold) {
        alert(`您距離任務地點還有 ${Math.round(dist)} 公尺，請靠近任務地點（需在 ${threshold} 公尺內）`);
      }
    } catch (error) {
      console.error('獲取位置失敗:', error);
      alert('無法獲取您的位置，請確保已允許位置權限');
    } finally {
      setIsChecking(false);
    }
  };

  // 完成任務
  const handleCompleteTask = async () => {
    if (!canComplete) {
      await checkLocation();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/footprint/complete-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`任務完成！獲得 ${task.Coin} 天堂幣`);
        onTaskComplete();
        onClose();
      } else {
        const error = await response.json();
        alert(`完成任務失敗: ${error.error || '未知錯誤'}`);
      }
    } catch (error) {
      console.error('完成任務失敗:', error);
      alert('完成任務失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={task.name || '任務詳情'}
      subtitle="查看任務資訊並完成任務"
      onClose={onClose}
      primaryAction={
        <div className="space-y-2">
          <button
            onClick={checkLocation}
            disabled={isChecking}
            className="w-full rounded-lg border border-[#fbbf24]/50 py-2 text-sm font-semibold text-[#f6d8a7] hover:bg-[#2b1a10]/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChecking ? '檢查位置中...' : '檢查位置'}
          </button>
          <button
            onClick={handleCompleteTask}
            disabled={loading || !canComplete}
            className="w-full rounded-lg bg-[#fbbf24] py-2 text-sm font-semibold text-[#1b0e07] shadow-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '完成中...' : '完成任務'}
          </button>
          {distance !== null && (
            <p className="text-xs text-center text-[#f7e7c7]/70">
              距離: {Math.round(distance)} 公尺
              {canComplete ? ' ✓ 可以完成' : ' (需在 500 公尺內)'}
            </p>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {/* 任務描述 */}
        {task.description && (
          <div>
            <label className="block text-sm font-semibold text-[#f7e7c7] mb-2">
              任務描述
            </label>
            <p className="text-sm text-[#f0d9b5]/80 bg-[#2b1a10]/50 p-3 rounded-lg">
              {task.description}
            </p>
          </div>
        )}

        {/* 天堂幣獎勵 */}
        <div>
          <label className="block text-sm font-semibold text-[#f7e7c7] mb-2">
            天堂幣獎勵
          </label>
          <div className="flex items-center gap-2 p-3 bg-[#2b1a10]/50 rounded-lg">
            <span className="text-2xl">💰</span>
            <span className="text-lg font-bold text-[#fbbf24]">{task.Coin}</span>
            <span className="text-sm text-[#f0d9b5]/70">天堂幣</span>
          </div>
        </div>

        {/* 任務位置 */}
        {task.coordinate && (
          <div>
            <label className="block text-sm font-semibold text-[#f7e7c7] mb-2">
              任務位置
            </label>
            <p className="text-xs text-[#f0d9b5]/70 bg-[#2b1a10]/50 p-2 rounded">
              {task.coordinate}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

