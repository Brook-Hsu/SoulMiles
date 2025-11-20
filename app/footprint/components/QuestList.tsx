'use client';

interface Task {
  id: string;
  name: string | null;
  description: string | null;
  coordinate: string | null;
  Coin: number;
}

interface QuestListProps {
  tasks: Task[];
  onViewTask: (task: Task) => void;
  loading: boolean;
}

/**
 * QuestList - 任務列表組件
 * 顯示任務名稱和描述，每個任務旁有「查看」按鈕
 */
export default function QuestList({ tasks, onViewTask, loading }: QuestListProps) {
  if (loading) {
    return (
      <div className="gothic-button p-4 rounded-lg text-center">
        <p className="text-soul-glow/70">載入任務中...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="gothic-button p-4 rounded-lg text-center">
        <p className="text-soul-glow/70">目前沒有任務</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-[#f7e7c7] mb-3">任務列表</h3>
      {tasks.map((task) => (
        <div
          key={task.id}
          className="gothic-button p-4 rounded-lg border border-[#f0d9b5]/30 hover:border-[#fbbf24]/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="text-base font-semibold text-[#f7e7c7] mb-1">
                {task.name || '未命名任務'}
              </h4>
              {task.description && (
                <p className="text-sm text-[#f0d9b5]/70 line-clamp-2">
                  {task.description}
                </p>
              )}
              <p className="text-xs text-[#fbbf24] mt-2">
                獎勵: {task.Coin} 天堂幣
              </p>
            </div>
            <button
              onClick={() => onViewTask(task)}
              className="px-4 py-2 rounded-lg bg-[#6b46c1] text-[#f7e7c7] hover:bg-[#5b21b6] transition-colors text-sm font-semibold whitespace-nowrap"
            >
              查看
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

