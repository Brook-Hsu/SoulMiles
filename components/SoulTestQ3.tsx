'use client';

import { useState } from 'react';

interface Dimension {
  name: string;
  dataValue: string;
  optionA: {
    label: string;
    value: string;
  };
  optionB: {
    label: string;
    value: string;
  };
}

const dimensions: Dimension[] = [
  {
    name: '能量羅盤',
    dataValue: 'energy',
    optionA: { label: 'I (獨行者)', value: 'I' },
    optionB: { label: 'E (引導者)', value: 'E' },
  },
  {
    name: '資訊足跡',
    dataValue: 'information',
    optionA: { label: 'N (先知)', value: 'N' },
    optionB: { label: 'S (實證者)', value: 'S' },
  },
  {
    name: '決策天平',
    dataValue: 'decision',
    optionA: { label: 'F (共鳴)', value: 'F' },
    optionB: { label: 'T (邏輯)', value: 'T' },
  },
  {
    name: '行動風格',
    dataValue: 'lifestyle',
    optionA: { label: 'P (隨機應變)', value: 'P' },
    optionB: { label: 'J (計劃航線)', value: 'J' },
  },
];

interface QuestionBlockProps {
  dimension: Dimension;
  selectedValue: string | null;
  onSelect: (value: string) => void;
}

function QuestionBlock({ dimension, selectedValue, onSelect }: QuestionBlockProps) {
  return (
    <div className="space-y-3">
      {/* 維度名稱 - 水平置中 */}
      <h3 className="text-center text-lg font-semibold text-[#fde8b0] mb-4">
        {dimension.name}
      </h3>
      
      {/* 兩個選項按鈕 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onSelect(dimension.optionA.value)}
          className={`relative rounded-2xl border px-4 py-4 text-left transition-all ${
            selectedValue === dimension.optionA.value
              ? 'border-[#fbbf24] bg-[#fbbf24]/10 text-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.3)]'
              : 'border-white/10 bg-white/5 text-white/80 hover:border-[#fbbf24]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{dimension.optionA.label}</p>
            </div>
            {selectedValue === dimension.optionA.value && (
              <svg
                className="w-5 h-5 text-[#fbbf24]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </button>

        <button
          onClick={() => onSelect(dimension.optionB.value)}
          className={`relative rounded-2xl border px-4 py-4 text-left transition-all ${
            selectedValue === dimension.optionB.value
              ? 'border-[#fbbf24] bg-[#fbbf24]/10 text-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.3)]'
              : 'border-white/10 bg-white/5 text-white/80 hover:border-[#fbbf24]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{dimension.optionB.label}</p>
            </div>
            {selectedValue === dimension.optionB.value && (
              <svg
                className="w-5 h-5 text-[#fbbf24]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

interface SoulTestQ3Props {
  onComplete?: (answers: Record<string, string>) => void;
}

function SoulTestQ3({ onComplete }: SoulTestQ3Props) {
  const [currentDimension, setCurrentDimension] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [allCompleted, setAllCompleted] = useState(false);

  const handleSelect = (value: string) => {
    const currentDim = dimensions[currentDimension];
    const newAnswers = {
      ...answers,
      [currentDim.dataValue]: value,
    };
    setAnswers(newAnswers);

    // 檢查是否所有維度都已完成
    const completed = dimensions.every((dim) => newAnswers[dim.dataValue]);
    
    if (completed) {
      setAllCompleted(true);
      // 延遲一下顯示確認畫面，然後自動提交
      setTimeout(() => {
        if (onComplete) {
          // 將答案轉換為 karma 格式以保持兼容性
          const karmaAnswer = {
            energy: newAnswers.energy,
            information: newAnswers.information,
            decision: newAnswers.decision,
            lifestyle: newAnswers.lifestyle,
            // 為了兼容現有系統，將 MBTI 結果存儲為 karma 值
            karma: [newAnswers.energy, newAnswers.information, newAnswers.decision, newAnswers.lifestyle].join(''),
          };
          onComplete(karmaAnswer);
        }
      }, 1500); // 顯示確認畫面 1.5 秒後自動推進
    } else {
      // 自動推進到下一個維度
      setTimeout(() => {
        setCurrentDimension((prev) => Math.min(prev + 1, dimensions.length - 1));
      }, 300);
    }
  };

  const handleConfirm = () => {
    // 構建 MBTI 結果（例如：ENFP）
    const mbtiResult = [
      answers.energy || '',
      answers.information || '',
      answers.decision || '',
      answers.lifestyle || '',
    ].join('');

    // 通知父組件完成並傳遞答案
    if (onComplete) {
      const karmaAnswer = {
        energy: answers.energy,
        information: answers.information,
        decision: answers.decision,
        lifestyle: answers.lifestyle,
        karma: mbtiResult,
      };
      onComplete(karmaAnswer);
    }
  };

  const currentDim = dimensions[currentDimension];
  const progress = ((currentDimension + 1) / dimensions.length) * 100;

  return (
    <div className="space-y-6">
      {/* 標題和進度 */}
      <div>
        <p className="text-xs text-[#f7e7c7]/60 mb-2">第 3/8 題</p>
        <h2 className="text-xl font-semibold text-[#fde8b0] mb-4">Q3. 靈魂能量維度</h2>
        
        {/* 進度指示器 */}
        <div className="mb-4 h-1 w-full rounded-full bg-[#f7e7c7]/10">
          <div
            className="h-1 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#ff6b2c] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-[#f7e7c7]/50 text-center">
          {currentDimension + 1} / {dimensions.length}
        </p>
      </div>

      {/* 當前維度的問題區塊 */}
      {!allCompleted ? (
        <QuestionBlock
          dimension={currentDim}
          selectedValue={answers[currentDim.dataValue] || null}
          onSelect={handleSelect}
        />
      ) : (
        <div className="space-y-4">
          {/* 顯示所有選擇的結果 */}
          <div className="rounded-2xl border border-[#fbbf24]/30 bg-[#301b13]/60 p-4">
            <h3 className="text-lg font-semibold text-[#fde8b0] mb-2">靈魂向度確認</h3>
            <p className="text-xs text-[#f7e7c7]/70 mb-4">
              你的靈魂能量維度已確定，請確認後繼續。
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              {dimensions.map((dim) => (
                <div
                  key={dim.dataValue}
                  className="rounded-xl border border-[#fbbf24]/20 bg-[#1c0f13]/80 px-3 py-2"
                >
                  <p className="text-[#f7e7c7]/60">{dim.name}</p>
                  <p className="font-semibold text-[#fbbf24]">
                    {answers[dim.dataValue] === dim.optionA.value
                      ? dim.optionA.label
                      : dim.optionB.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 確認按鈕 */}
          <button
            onClick={handleConfirm}
            className="w-full rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#ff9e2c] px-4 py-3 text-sm font-semibold text-[#241208] shadow-lg transition-all hover:shadow-[0_0_30px_rgba(251,191,36,0.4)]"
          >
            確認靈魂向度
          </button>
        </div>
      )}
    </div>
  );
}

export default SoulTestQ3;

