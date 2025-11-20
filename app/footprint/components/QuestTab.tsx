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

  useEffect(() => {
    fetchTasks();
  }, []);

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

