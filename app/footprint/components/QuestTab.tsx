'use client';

import { useState, useEffect } from 'react';
import QuestMap from './QuestMap';
import QuestList from './QuestList';
import QuestDetailModal from './QuestDetailModal';

interface Task {
  id: string;
  name: string | null;
  description: string | null;
  coordinate: string | null;
  Coin: number;
  isTemporary?: boolean;
  isMainTask?: boolean;
}

/**
 * QuestTab - 今日主線任務 Tab 內容
 * 包含任務地圖和任務列表
 */
export default function QuestTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [friendCheckEnabled, setFriendCheckEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  // 獲取用戶位置
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => {
          console.error('獲取位置失敗:', error);
          // 使用預設位置（台北）
          setUserLocation({ lat: 25.0330, lon: 121.5654 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      // 使用預設位置
      setUserLocation({ lat: 25.0330, lon: 121.5654 });
    }
  }, []);

  // 檢查並刷新主要任務
  useEffect(() => {
    if (userLocation) {
      checkAndRefreshMainTask();
    }
  }, [userLocation]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const checkAndRefreshMainTask = async () => {
    try {
      const response = await fetch('/api/footprint/refresh-main-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat: userLocation?.lat,
          lon: userLocation?.lon,
          useAI: false, // 預設不使用 AI 以節省成本
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.refreshed) {
          console.log('主要任務已刷新');
          // 刷新任務列表
          await fetchTasks();
        }
      }
    } catch (error) {
      console.error('檢查主要任務失敗:', error);
    }
  };

  // 每五分鐘檢查一次附近好友足跡，產生臨時任務
  useEffect(() => {
    if (!friendCheckEnabled) return;

    let isCancelled = false;

    const getCurrentPosition = () =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
          reject(new Error('瀏覽器不支援定位'));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

    const checkFriendTasks = async () => {
      try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;

        await fetch('/api/footprint/friend-tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lat: latitude,
            lon: longitude,
          }),
        });

        // 檢查完後重新載入任務列表
        if (!isCancelled) {
          await fetchTasks();
        }
      } catch (error) {
        console.error('檢查好友足跡失敗:', error);
      }
    };

    // 進入頁面時先檢查一次
    checkFriendTasks();

    // 每 5 分鐘檢查一次
    const intervalId = setInterval(() => {
      checkFriendTasks();
    }, 5 * 60 * 1000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [friendCheckEnabled]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/footprint/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('獲取任務失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  return (
    <div className="flex flex-col gap-4 mb-4">
      {/* 好友臨時任務偵測開關 */}
      <div className="w-full flex items-center justify-between gothic-button p-4 rounded-lg">
        <div>
          <h3 className="text-sm font-semibold text-soul-glow">好友臨時任務</h3>
          <p className="text-xs text-soul-glow/70">
            開啟後，每 5 分鐘偵測一公里內好友足跡，並在任務列表新增臨時任務
          </p>
        </div>
        <button
          onClick={() => setFriendCheckEnabled((prev) => !prev)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            friendCheckEnabled ? 'bg-soul-glow' : 'bg-gray-500'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              friendCheckEnabled ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* 任務地圖區域 */}
      <div className="w-full h-[300px] sm:h-[400px] relative rounded-lg overflow-hidden border border-[#f0d9b5]/30">
        <QuestMap tasks={tasks} />
      </div>

      {/* 任務列表區域 */}
      <div className="w-full">
        <QuestList tasks={tasks} onViewTask={handleViewTask} loading={loading} />
      </div>

      {/* 任務詳情模態視窗 */}
      {showDetailModal && selectedTask && (
        <QuestDetailModal
          task={selectedTask}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTask(null);
          }}
          onTaskComplete={fetchTasks}
        />
      )}
    </div>
  );
}

