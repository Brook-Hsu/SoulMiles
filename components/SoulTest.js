'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from './Header';

const questions = [
  {
    key: 'soulFire',
    title: 'Q1. 靈魂之火',
    options: [
      { label: '熾熱燃燒', value: 'joy', note: '愉悅 / 開心' },
      { label: '穩定餘燼', value: 'steady', note: '普通 / 平靜' },
      { label: '黯淡內斂', value: 'quiet', note: '難過 / 生氣' },
    ],
  },
  {
    key: 'trial',
    title: 'Q2. 神諭試煉',
    options: [
      { label: '極端考驗', value: 'extreme', note: '大雷雨 / 大太陽' },
      { label: '溫和洗禮', value: 'mild', note: '陣雨 / 陣風 / 毛毛雨' },
      { label: '風平浪靜', value: 'calm', note: '晴天 / 陰天' },
    ],
  },
  {
    key: 'karma',
    title: 'Q3. 業力足跡',
    options: [
      { label: '核心精華', value: 'core', note: '1 ~ 2 個地點' },
      { label: '深度探索', value: 'depth', note: '3 ~ 4 個地點' },
      { label: '瘋狂掠奪', value: 'wild', note: '5 ~ 7 個地點' },
    ],
  },
  {
    key: 'fleet',
    title: 'Q4. 亡靈艦隊',
    options: [
      { label: '獨行鬼魅', value: 'solo', note: '0 ~ 1 人' },
      { label: '盟友小隊', value: 'squad', note: '2 ~ 3 人' },
      { label: '結盟勢力', value: 'alliance', note: '4 ~ 7 人' },
    ],
  },
  {
    key: 'body',
    title: 'Q5. 肉身傾向',
    options: [
      { label: '衝鋒陷陣', value: 'active', note: '動態' },
      { label: '靜默冥想', value: 'calm', note: '靜態' },
      { label: '隨心所欲', value: 'flex', note: '動靜皆可' },
    ],
  },
  {
    key: 'region',
    title: 'Q6. 生命羅盤',
    options: [
      { label: '北部', value: 'north', note: '寒潮與霧燈' },
      { label: '中部', value: 'central', note: '迷霧樞紐' },
      { label: '南部', value: 'south', note: '熔岩群島' },
      { label: '東部', value: 'east', note: '潮汐祕境' },
    ],
  },
  {
    key: 'duration',
    title: 'Q7. 獻祭時光',
    options: [
      { label: '瞬間閃現', value: 'short', note: '1 ~ 2 小時' },
      { label: '完整循環', value: 'medium', note: '3 ~ 8 小時' },
      { label: '史詩級篇章', value: 'long', note: '9 ~ 12 小時' },
    ],
  },
  {
    key: 'mobility',
    title: 'Q8. 幽冥座駕',
    options: [
      { label: '專屬座駕', value: 'drive', note: '開車' },
      { label: '集體召喚', value: 'transit', note: '大眾運輸' },
      { label: '靈魂漫步', value: 'walk', note: '步行' },
      { label: '隨意切換', value: 'hybrid', note: '都可以' },
    ],
  },
];

const answerLabelLookup = questions.reduce((acc, question) => {
  question.options.forEach((option) => {
    acc[`${question.key}-${option.value}`] = option.label;
  });
  return acc;
}, {});

const journeySummaries = {
  '聖殿淨化': '在遺忘神殿完成儀式，迷霧會為你讓路。',
  '狂歡派對': '霓虹航道與祭典同步上演，靈魂得以釋放。',
  '船難記': '追溯沉沒航線，撿拾被遺忘的靈魂碎片。',
  '寶藏獵人': '跳上疾風船隊，突襲每個標記的 X。',
  '孤獨艦長': '全船只剩你一人，與星圖對話找到出口。',
};

function calculateResult(answers, mode = 'guide') {
  const rules = [
    {
      type: '聖殿淨化',
      match: () =>
        answers.soulFire === 'joy' && ['core', 'depth'].includes(answers.karma),
    },
    {
      type: '狂歡派對',
      match: () =>
        answers.soulFire === 'joy' && ['extreme', 'mild'].includes(answers.trial),
    },
    {
      type: '孤獨艦長',
      match: () => answers.fleet === 'solo' || answers.soulFire === 'quiet',
    },
    {
      type: '船難記',
      match: () => answers.trial === 'extreme' || answers.duration === 'long',
    },
    {
      type: '寶藏獵人',
      match: () => answers.karma === 'wild' || answers.body === 'active',
    },
  ];

  let journeyType = '寶藏獵人';
  for (const rule of rules) {
    if (rule.match()) {
      journeyType = rule.type;
      break;
    }
  }

  if (mode === 'guide-hard') {
    journeyType = '孤獨艦長';
  }

  const regionMap = {
    north: '北境幽港',
    central: '迷霧樞紐',
    south: '赤焰群島',
    east: '潮汐祕境',
  };

  const location = regionMap[answers.region] || '迷霧航道';

  return {
    journeyType,
    location,
    summary: journeySummaries[journeyType],
  };
}

export default function SoulTest() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'guide';

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSummaryReady, setIsSummaryReady] = useState(false);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep) / questions.length) * 100;

  const handleSelectOption = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.key]: value,
    }));

    if (currentStep === questions.length - 1) {
      setIsSummaryReady(true);
    } else {
      setTimeout(() => {
        setCurrentStep((prev) => Math.min(prev + 1, questions.length - 1));
      }, 200);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setIsSummaryReady(false);
  };

  const handleSubmit = () => {
    const result = calculateResult(answers, mode);
    const query = new URLSearchParams({
      mode,
      result: result.journeyType,
      location: result.location,
      summary: result.summary,
    }).toString();
    router.push(`/treasure-map?${query}`);
  };

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden arcane-bg text-[#f1e3c3]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(240,217,181,0.1),transparent_55%)] opacity-70" />
      <div className="relative z-10 flex h-full flex-col gap-4 px-4 py-4 sm:py-6">
        <Header />

        <section className="rounded-3xl border border-[#f0d9b5]/30 bg-[#201016]/80 p-4 shadow-2xl backdrop-blur">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.5em] text-[#fbbf24]/80">Soul Test</p>
            <h1 className="text-2xl font-bold text-[#fde8b0]">靈魂試煉問卷</h1>
            <p className="text-xs text-[#f7e7c7]/70 mt-1">
              8 個題目解析你的靈魂向度，決定航海儀錶板。
            </p>
          </div>

          <div className="mb-4 h-2 w-full rounded-full bg-[#f7e7c7]/10">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#ff6b2c]"
              style={{ width: `${Math.max(progress, 8)}%` }}
            />
          </div>

          {!isSummaryReady ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-[#f7e7c7]/60">第 {currentStep + 1} / {questions.length} 題</p>
                <h2 className="text-xl font-semibold text-[#fde8b0]">{currentQuestion.title}</h2>
              </div>

              <div className="space-y-3">
                {currentQuestion.options.map((option) => {
                  const isActive = answers[currentQuestion.key] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelectOption(option.value)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                        isActive
                          ? 'border-[#fbbf24] bg-[#fbbf24]/10 text-[#fbbf24]'
                          : 'border-white/10 bg-white/5 text-white/80 hover:border-[#fbbf24]/40'
                      }`}
                    >
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-xs text-[#f7e7c7]/60">{option.note}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <SummaryPanel answers={answers} onBack={handleBack} onSubmit={handleSubmit} />
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryPanel({ answers, onBack, onSubmit }) {
  const highlightList = useMemo(() => {
    const mapping = {
      soulFire: '靈魂溫度',
      trial: '神諭天氣',
      karma: '欲望濃度',
      fleet: '同行人數',
      body: '肢體偏好',
      region: '地脈方位',
      duration: '可用時間',
      mobility: '移動方式',
    };
    return Object.entries(mapping)
      .filter(([key]) => answers[key])
      .map(([key, label]) => ({
        key,
        label,
        value: answers[key],
      }));
  }, [answers]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#fbbf24]/30 bg-[#301b13]/60 p-4">
        <h3 className="text-lg font-semibold text-[#fde8b0]">試煉完成</h3>
        <p className="text-xs text-[#f7e7c7]/70">
          以下是你的靈魂設定，請確認後交給航海圖演算。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {highlightList.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[#fbbf24]/20 bg-[#1c0f13]/80 px-3 py-2"
          >
            <p className="text-[#f7e7c7]/60">{item.label}</p>
            <p className="font-semibold text-[#fbbf24]">
              {answerLabelLookup[`${item.key}-${item.value}`] || item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-xl border border-white/20 px-4 py-3 text-sm text-white/80"
        >
          回上一題
        </button>
        <button
          onClick={onSubmit}
          className="flex-1 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#ff9e2c] px-4 py-3 text-sm font-semibold text-[#241208] shadow-lg"
        >
          送出結果
        </button>
      </div>
    </div>
  );
}

