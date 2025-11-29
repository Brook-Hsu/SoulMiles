'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '../../components/Header';

/**
 * 心魂監控台頁面
 * Q版暗黑哥德 x 航海主題儀表板
 * 參考附圖排版：懸賞單、天氣/溫度、交通/人潮、住宿/餐廳
 */
export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [userLocation, setUserLocation] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [transportData, setTransportData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [crowdData, setCrowdData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bountyAmount, setBountyAmount] = useState(null); // 懸賞金額（從 API 獲取）
  const [bountyDisplayAmount, setBountyDisplayAmount] = useState(1000); // 顯示的金額（動畫用）
  const [bountyLoading, setBountyLoading] = useState(true); // 懸賞金額載入狀態
  const [bountyBreakdown, setBountyBreakdown] = useState(null); // 懸賞金額詳細分解
  const [bountyTotalScore, setBountyTotalScore] = useState(null); // 總合適度分數
  const [bountyIndex, setBountyIndex] = useState(0); // 懸賞單分頁索引
  const [bountyShowDetails, setBountyShowDetails] = useState(false); // 是否顯示詳細評分
  const [bountySwipeStart, setBountySwipeStart] = useState(null); // 滑動起始位置
  const [selectedTarotCard, setSelectedTarotCard] = useState(null); // 選中的塔羅牌

  // 獲取用戶位置
  useEffect(() => {
    if (navigator.geolocation) {
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

  // 獲取天氣數據
  useEffect(() => {
    if (userLocation) {
      fetch(`/api/weather?lat=${userLocation.lat}&lon=${userLocation.lon}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setWeatherData(data);
          }
        })
        .catch((err) => console.error('獲取天氣失敗:', err))
        .finally(() => setLoading(false));
    }
  }, [userLocation]);

  // 獲取交通和推薦數據
  useEffect(() => {
    if (userLocation) {
      // 獲取交通資訊（火車站、公車站、YouBike 租借點）
      Promise.all([
        fetch(`/api/places?lat=${userLocation.lat}&lon=${userLocation.lon}&type=train_station&radius=2000`).then((res) => res.json()),
        fetch(`/api/places?lat=${userLocation.lat}&lon=${userLocation.lon}&type=bus_station&radius=2000`).then((res) => res.json()),
        fetch(`/api/places?lat=${userLocation.lat}&lon=${userLocation.lon}&type=bicycle_rental&radius=2000`).then((res) => res.json()),
      ])
        .then(([trainData, busData, bikeData]) => {
          setTransportData({
            train: trainData.places?.[0] || null, // 只取最近的一個
            bus: busData.places?.[0] || null, // 只取最近的一個
            youbike: bikeData.places?.[0] || null, // 只取最近的一個
          });
        })
        .catch((err) => console.error('獲取交通資訊失敗:', err));

      // 獲取推薦（住宿和餐廳）
      Promise.all([
        fetch(`/api/places?lat=${userLocation.lat}&lon=${userLocation.lon}&type=lodging&radius=5000`).then((res) => res.json()),
        fetch(`/api/places?lat=${userLocation.lat}&lon=${userLocation.lon}&type=restaurant&radius=5000`).then((res) => res.json()),
      ])
        .then(([lodgingData, restaurantData]) => {
          setRecommendations({
            lodging: lodgingData.places?.slice(0, 3) || [],
            restaurant: restaurantData.places?.slice(0, 3) || [],
          });
        })
        .catch((err) => console.error('獲取推薦失敗:', err));

      // 獲取景區人潮資料
      fetch(`/api/places?lat=${userLocation.lat}&lon=${userLocation.lon}&type=tourist_attraction&radius=5000`)
        .then((res) => {
          if (!res.ok) {
            console.error('景區人潮 API 回應錯誤:', res.status, res.statusText);
            return { places: [] };
          }
          return res.json();
        })
        .then((data) => {
          console.log('景區人潮 API 回應:', data);
          // 取最近的景區（API 已經排序）
          const nearestAttraction = data.places?.[0] || null;
          if (nearestAttraction) {
            console.log('找到最近景區:', nearestAttraction);
            setCrowdData(nearestAttraction);
          } else {
            console.warn('沒有找到景區資料');
            // 即使沒有資料也設置為 false 以停止載入狀態
            setCrowdData(false);
          }
        })
        .catch((err) => {
          console.error('獲取景區人潮失敗:', err);
          // 設置為 false 以停止載入狀態
          setCrowdData(false);
        });
    }
  }, [userLocation]);

  // 獲取出遊合適度並計算懸賞金額
  useEffect(() => {
    if (userLocation && session) {
      setBountyLoading(true);
      setBountyDisplayAmount(1000); // 重置顯示金額
      
      // 開始數字動畫（快速變化）
      const minAmount = 1000;
      const maxAmount = 1000000;
      let currentAmount = minAmount;
      let transitionInterval = null;
      
      const animationInterval = setInterval(() => {
        // 每次增加隨機值，讓數字快速變化
        const increment = Math.random() * (maxAmount - minAmount) * 0.1;
        currentAmount = Math.min(maxAmount, currentAmount + increment);
        setBountyDisplayAmount(Math.floor(currentAmount));
      }, 50); // 每 50ms 更新一次，讓數字快速變化
      
      fetch(`/api/dashboard/bounty?lat=${userLocation.lat}&lon=${userLocation.lon}`)
        .then((res) => res.json())
        .then((data) => {
          clearInterval(animationInterval); // 停止快速變化動畫
          
          if (data.bountyAmount) {
            // 平滑過渡到實際金額
            const targetAmount = data.bountyAmount;
            const startAmount = currentAmount;
            const duration = 500; // 500ms 過渡時間
            const startTime = Date.now();
            
            transitionInterval = setInterval(() => {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(1, elapsed / duration);
              
              // 使用緩動函數讓過渡更平滑
              const easeOutCubic = 1 - Math.pow(1 - progress, 3);
              const newAmount = Math.floor(startAmount + (targetAmount - startAmount) * easeOutCubic);
              
              setBountyDisplayAmount(newAmount);
              
              if (progress >= 1) {
                clearInterval(transitionInterval);
                transitionInterval = null;
                setBountyAmount(targetAmount);
                setBountyDisplayAmount(targetAmount);
                setBountyBreakdown(data.breakdown);
                setBountyTotalScore(data.totalScore);
                setBountyLoading(false);
              }
            }, 16); // 約 60fps
            
            // 先設置其他資料
            setBountyBreakdown(data.breakdown);
            setBountyTotalScore(data.totalScore);
          } else {
            // 如果 API 失敗，使用預設值
            setBountyAmount(50000);
            setBountyDisplayAmount(50000);
            setBountyTotalScore(50);
            setBountyLoading(false);
          }
        })
        .catch((err) => {
          console.error('獲取懸賞金額失敗:', err);
          clearInterval(animationInterval);
          // 發生錯誤時使用預設值
          setBountyAmount(50000);
          setBountyDisplayAmount(50000);
          setBountyLoading(false);
        });
      
      // 清理函數
      return () => {
        clearInterval(animationInterval);
        if (transitionInterval) {
          clearInterval(transitionInterval);
        }
      };
    } else if (!session) {
      // 未登入時使用預設值
      setBountyAmount(50000);
      setBountyDisplayAmount(50000);
      setBountyLoading(false);
    }
  }, [userLocation, session]);

  // 觸發登入模態視窗
  const handleLoginClick = () => {
    const headerButton = document.querySelector('header button[title="靈魂聖殿"]');
    if (headerButton) {
      headerButton.click();
    }
  };

  // 將分數轉換為星星數量（0-100分轉換為0-5顆星，精確到小數點後兩位）
  const scoreToStars = (score) => {
    if (!score && score !== 0) return 0;
    // 將 0-100 分線性轉換為 0-5 顆星
    const stars = (score / 100) * 5;
    return Math.round(stars * 100) / 100; // 保留兩位小數
  };

  // 渲染星星（支持部分星星）
  const renderStars = (starValue) => {
    const fullStars = Math.floor(starValue);
    const partialStar = starValue - fullStars;
    const emptyStars = 5 - Math.ceil(starValue);
    
    return (
      <div className="flex items-center gap-1">
        {/* 完整星星 */}
        {Array.from({ length: fullStars }).map((_, index) => (
          <span key={`full-${index}`} className="text-lg text-treasure-gold">
            ★
          </span>
        ))}
        {/* 部分星星 */}
        {partialStar > 0 && (
          <span className="text-lg relative inline-block">
            <span className="text-soul-glow/20">★</span>
            <span
              className="text-treasure-gold absolute left-0 top-0 overflow-hidden"
              style={{ width: `${partialStar * 100}%` }}
            >
              ★
            </span>
          </span>
        )}
        {/* 空星星 */}
        {Array.from({ length: emptyStars }).map((_, index) => (
          <span key={`empty-${index}`} className="text-lg text-soul-glow/20">
            ★
          </span>
        ))}
        {/* 顯示數值 */}
        <span className="text-xs text-soul-glow/70 ml-2 tabular-nums">
          {starValue.toFixed(2)}
        </span>
      </div>
    );
  };

  // 處理滑動開始
  const handleBountySwipeStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setBountySwipeStart(clientX);
  };

  // 塔羅牌數據（22張大阿卡納牌）
  const tarotCards = [
    { name: '愚者', emoji: '🃏', message: '放下包袱，踏上未知的旅程，每一次出發都是新的開始。' },
    { name: '魔術師', emoji: '🪄', message: '運用你的智慧與創意，規劃一場完美的旅行，讓夢想成真。' },
    { name: '女祭司', emoji: '🌙', message: '靜下心來，聆聽內心的聲音，選擇最適合你的目的地。' },
    { name: '皇后', emoji: '👑', message: '享受旅程中的每一刻美好，讓自己沉浸在當下的幸福中。' },
    { name: '皇帝', emoji: '⚔️', message: '制定明確的旅行計劃，掌控行程，讓旅程井然有序。' },
    { name: '教皇', emoji: '📿', message: '探索當地的文化與傳統，讓旅行成為一次心靈的洗禮。' },
    { name: '戀人', emoji: '💑', message: '與摯愛同行，創造屬於你們的美好回憶，讓愛在旅途中綻放。' },
    { name: '戰車', emoji: '🏇', message: '勇敢前行，克服旅途中的困難，勝利就在前方等待。' },
    { name: '力量', emoji: '💪', message: '相信自己，你有足夠的力量去探索這個美麗的世界。' },
    { name: '隱者', emoji: '🔦', message: '獨自旅行，在寧靜中尋找自我，發現內心的平靜與智慧。' },
    { name: '命運之輪', emoji: '🎡', message: '命運的輪盤正在轉動，新的旅程即將展開，把握機會。' },
    { name: '正義', emoji: '⚖️', message: '在旅途中保持平衡，做出明智的選擇，讓旅程更加完美。' },
    { name: '倒吊人', emoji: '🙃', message: '換個角度看世界，也許會發現意想不到的美麗風景。' },
    { name: '死神', emoji: '💀', message: '結束舊的旅程，迎接新的開始，每一次結束都是新的起點。' },
    { name: '節制', emoji: '🍷', message: '在旅途中保持節制與平衡，享受當下，不要過度消耗。' },
    { name: '惡魔', emoji: '😈', message: '小心旅途中的誘惑，保持理性，不要被表面的美好迷惑。' },
    { name: '塔', emoji: '🗼', message: '打破舊有的框架，勇敢嘗試新的體驗，讓旅行改變你。' },
    { name: '星星', emoji: '⭐', message: '在旅途中尋找希望與靈感，讓星星指引你前進的方向。' },
    { name: '月亮', emoji: '🌙', message: '在夜晚的旅途中，感受神秘與浪漫，讓月光照亮你的路。' },
    { name: '太陽', emoji: '☀️', message: '陽光普照的旅程，充滿活力與歡樂，享受每一刻的溫暖。' },
    { name: '審判', emoji: '📯', message: '回顧過去的旅程，從中學習與成長，為下一次旅行做準備。' },
    { name: '世界', emoji: '🌍', message: '完成一次完美的旅程，收穫滿滿的回憶與成長，準備探索更廣闊的世界。' },
  ];

  // 隨機選擇一張塔羅牌
  const selectRandomTarotCard = () => {
    const randomIndex = Math.floor(Math.random() * tarotCards.length);
    setSelectedTarotCard(tarotCards[randomIndex]);
  };

  // 處理滑動結束
  const handleBountySwipeEnd = (e) => {
    if (bountySwipeStart === null) return;
    
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const deltaX = clientX - bountySwipeStart;
    
    // 如果往右滑動超過 50px
    if (deltaX > 50) {
      if (bountyIndex === 0) {
        setBountyIndex(1);
        setBountyShowDetails(true);
      } else if (bountyIndex === 1) {
        setBountyIndex(2);
        selectRandomTarotCard();
      }
    }
    // 如果往左滑動超過 50px
    else if (deltaX < -50) {
      if (bountyIndex === 2) {
        setBountyIndex(1);
        setBountyShowDetails(true);
      } else if (bountyIndex === 1) {
        setBountyIndex(0);
        setBountyShowDetails(false);
      }
    }
    
    setBountySwipeStart(null);
  };

  // 處理點擊分頁指示器
  const handleBountyPageClick = (index) => {
    setBountyIndex(index);
    if (index === 0) {
      setBountyShowDetails(false);
    } else if (index === 1) {
      setBountyShowDetails(true);
    } else if (index === 2) {
      selectRandomTarotCard();
    }
  };

  const isSunny = weatherData?.isSunny ?? true;

  return (
    <div className="route-page text-[#f7e7c7]">
      <div className="route-page__bg" style={{ backgroundImage: 'url(/images/routes/route-bg.jpg)' }} />
      <div className="route-page__veil" />

      <div className="route-page__content">
        <Header />

        {/* 標題區域 */}
        <div className="w-full text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-soul-glow via-gothic-purple to-treasure-gold">
            🧭 心魂監控台
          </h1>
          <p className="text-xs sm:text-sm text-soul-glow/60">
            監控靈魂狀態，掌握迷霧動向
          </p>
        </div>

        {/* 海盜懸賞單卡片（頂部大卡片，參考附圖） */}
        <div className="w-full mb-4">
          <div 
            className="gothic-button p-5 rounded-lg relative overflow-hidden cursor-grab active:cursor-grabbing"
            onTouchStart={handleBountySwipeStart}
            onTouchEnd={handleBountySwipeEnd}
            onMouseDown={handleBountySwipeStart}
            onMouseUp={handleBountySwipeEnd}
          >
            {/* 捲軸裝飾 */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#f0d9b5]/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#f0d9b5]/20 to-transparent" />
            
            {/* 旗幟裝飾 */}
            <div className="absolute top-2 right-4">
              <svg width="40" height="40" viewBox="0 0 100 100" className="text-treasure-gold/30">
                <path d="M 20 20 L 60 20 L 50 40 L 20 40 Z" fill="currentColor" />
                <rect x="20" y="20" width="3" height="60" fill="currentColor" />
              </svg>
            </div>

            <div className="relative z-10">
              {/* 主要內容（懸賞金額） */}
              <div className={`transition-all duration-300 ${bountyIndex === 0 ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-serif text-treasure-gold">🏴‍☠️ 懸賞單</h2>
                  <span className="text-xs text-soul-glow/60">WANTED</span>
                </div>
                <div className="text-center mb-4">
                  <p className="text-xs text-soul-glow/70 mb-1">越適合出遊獎金越高</p>
                  <p className="text-3xl font-bold text-treasure-gold">
                    {bountyLoading ? (
                      <span className="tabular-nums">{bountyDisplayAmount.toLocaleString()}</span>
                    ) : (
                      <span className="tabular-nums">{bountyAmount ? bountyAmount.toLocaleString() : '50,000'}</span>
                    )}{' '}
                    <span className="text-lg">SoulCoins</span>
                  </p>
                  {bountyTotalScore !== null && !bountyLoading && (
                    <div className="mt-2 text-xs text-soul-glow/50">
                      <p>合適度: {Math.round(bountyTotalScore)}%</p>
                    </div>
                  )}
                </div>
                {session ? (
                  // 登入後顯示用戶頭像
                  <div className="flex items-center justify-center">
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        className="w-16 h-16 rounded-full object-cover border-2 border-treasure-gold/50 shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-treasure-gold/20 border-2 border-treasure-gold/50 flex items-center justify-center">
                        <span className="text-2xl text-treasure-gold">👤</span>
                      </div>
                    )}
                  </div>
                ) : (
                  // 未登入時顯示登入按鈕
                  <button
                    onClick={handleLoginClick}
                    className="w-full py-2 px-4 rounded-lg border border-treasure-gold/50 bg-[#2b1a10]/70 text-treasure-gold text-sm font-semibold hover:bg-treasure-gold/20 transition-colors"
                  >
                    登入以領取懸賞
                  </button>
                )}
              </div>

              {/* 詳細評分內容 */}
              <div className={`transition-all duration-300 ${bountyIndex === 1 ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-serif text-treasure-gold">⭐ 評分詳情</h2>
                  <span className="text-xs text-soul-glow/60">DETAILS</span>
                </div>
                <div className="space-y-3">
                  {bountyBreakdown ? (
                    <>
                      {/* 天氣因素 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-soul-glow">天氣因素</span>
                        {renderStars(scoreToStars(bountyBreakdown.weather?.score || 0))}
                      </div>
                      {/* 交通便利性 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-soul-glow">交通便利性</span>
                        {renderStars(scoreToStars(bountyBreakdown.transport?.score || 0))}
                      </div>
                      {/* 時間因素 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-soul-glow">時間因素</span>
                        {renderStars(scoreToStars(bountyBreakdown.time?.score || 0))}
                      </div>
                      {/* 周邊設施 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-soul-glow">周邊設施</span>
                        {renderStars(scoreToStars(bountyBreakdown.facility?.score || 0))}
                      </div>
                      {/* 人潮狀況 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-soul-glow">人潮狀況</span>
                        {renderStars(scoreToStars(bountyBreakdown.crowd?.score || 0))}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-soul-glow/60 text-center py-4">載入中...</p>
                  )}
                </div>
              </div>

              {/* 塔羅牌占卜內容 */}
              <div className={`transition-all duration-300 ${bountyIndex === 2 ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-serif text-treasure-gold">🔮 塔羅占卜</h2>
                  <span className="text-xs text-soul-glow/60">TAROT</span>
                </div>
                <div className="text-center space-y-4">
                  {selectedTarotCard ? (
                    <>
                      {/* 塔羅牌顯示 */}
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="text-6xl mb-3 animate-pulse">
                          {selectedTarotCard.emoji}
                        </div>
                        <h3 className="text-xl font-serif text-treasure-gold mb-2">
                          {selectedTarotCard.name}
                        </h3>
                      </div>
                      {/* 旅遊句子 */}
                      <div className="bg-[#2b1a10]/50 border border-treasure-gold/30 rounded-lg p-4">
                        <p className="text-sm text-soul-glow leading-relaxed italic">
                          "{selectedTarotCard.message}"
                        </p>
                      </div>
                      {/* 重新抽牌按鈕 */}
                      <button
                        onClick={selectRandomTarotCard}
                        className="w-full py-2 px-4 rounded-lg border border-treasure-gold/50 bg-[#2b1a10]/70 text-treasure-gold text-sm font-semibold hover:bg-treasure-gold/20 transition-colors"
                      >
                        重新抽牌 🔄
                      </button>
                    </>
                  ) : (
                    <div className="py-8">
                      <p className="text-xs text-soul-glow/60">點擊下方按鈕開始占卜</p>
                      <button
                        onClick={selectRandomTarotCard}
                        className="mt-4 w-full py-2 px-4 rounded-lg border border-treasure-gold/50 bg-[#2b1a10]/70 text-treasure-gold text-sm font-semibold hover:bg-treasure-gold/20 transition-colors"
                      >
                        抽取塔羅牌 🎴
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* 分頁指示器（三個小圓點） */}
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2].map((index) => (
                  <button
                    key={index}
                    onClick={() => handleBountyPageClick(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      bountyIndex === index
                        ? 'w-8 bg-treasure-gold'
                        : 'bg-treasure-gold/35'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 第一行：天氣 & 溫度（參考附圖） */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* 天氣卡片 */}
          <div className="gothic-button p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🌊</span>
              <h3 className="text-sm font-semibold text-soul-glow">天氣</h3>
            </div>
            <p className="text-xs text-soul-glow/60 mb-2">呈現方式: 航行中的小船</p>
            {loading ? (
              <p className="text-xs text-soul-glow/60">載入中...</p>
            ) : (
              <div className="relative w-20 h-20 mx-auto">
                {isSunny ? (
                  // 晴天：Q版小帆船光芒四射
                  <>
                    <div className="absolute inset-0 animate-pulse">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-treasure-gold/40 to-transparent blur-xl" />
                    </div>
                    <div className="relative z-10">
                      <svg width="80" height="80" viewBox="0 0 100 100" className="text-treasure-gold">
                        {/* 太陽 */}
                        <circle cx="50" cy="50" r="25" fill="currentColor" opacity="0.8" />
                        {/* 光芒 */}
                        {[...Array(8)].map((_, i) => {
                          const angle = (i * 45 * Math.PI) / 180;
                          const x1 = 50 + 25 * Math.cos(angle);
                          const y1 = 50 + 25 * Math.sin(angle);
                          const x2 = 50 + 35 * Math.cos(angle);
                          const y2 = 50 + 35 * Math.sin(angle);
                          return (
                            <line
                              key={i}
                              x1={x1}
                              y1={y1}
                              x2={x2}
                              y2={y2}
                              stroke="currentColor"
                              strokeWidth="2"
                              className="animate-pulse"
                              style={{ animationDelay: `${i * 0.1}s` }}
                            />
                          );
                        })}
                        {/* 小船 */}
                        <path
                          d="M 30 70 Q 50 60 70 70 L 65 80 L 35 80 Z"
                          fill="#654321"
                          opacity="0.7"
                          className="animate-bounce"
                          style={{ animationDuration: '3s' }}
                        />
                        <path d="M 50 70 L 50 50" stroke="#654321" strokeWidth="2" opacity="0.7" />
                        <path d="M 50 50 L 60 40" stroke="#654321" strokeWidth="2" opacity="0.7" />
                      </svg>
                    </div>
                  </>
                ) : (
                  // 雨天：Q版小船風雨飄搖
                  <>
                    <div className="absolute inset-0 animate-pulse">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/40 to-transparent blur-xl" />
                    </div>
                    <div className="relative z-10">
                      <svg width="80" height="80" viewBox="0 0 100 100" className="text-blue-400">
                        {/* 雲朵 */}
                        <ellipse cx="40" cy="30" rx="15" ry="10" fill="currentColor" opacity="0.6" />
                        <ellipse cx="60" cy="30" rx="15" ry="10" fill="currentColor" opacity="0.6" />
                        {/* 閃電 */}
                        <path
                          d="M 50 25 L 45 40 L 50 40 L 48 55"
                          stroke="yellow"
                          strokeWidth="2"
                          fill="yellow"
                          className="animate-pulse"
                        />
                        {/* 雨滴 */}
                        {[...Array(6)].map((_, i) => (
                          <line
                            key={i}
                            x1={30 + i * 10}
                            y1={45}
                            x2={30 + i * 10}
                            y2={50}
                            stroke="currentColor"
                            strokeWidth="1"
                            className="animate-bounce"
                            style={{ animationDelay: `${i * 0.1}s`, animationDuration: '0.5s' }}
                          />
                        ))}
                        {/* 小船 */}
                        <path
                          d="M 30 70 Q 50 60 70 70 L 65 80 L 35 80 Z"
                          fill="#654321"
                          opacity="0.7"
                          className="animate-shake"
                        />
                        <path d="M 50 70 L 50 50" stroke="#654321" strokeWidth="2" opacity="0.7" />
                        <path d="M 50 50 L 60 40" stroke="#654321" strokeWidth="2" opacity="0.7" />
                      </svg>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 溫度卡片 */}
          <div className="gothic-button p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🌡️</span>
              <h3 className="text-sm font-semibold text-soul-glow">溫度</h3>
            </div>
            <p className="text-xs text-soul-glow/60 mb-2">紫外線指數</p>
            {loading ? (
              <p className="text-xs text-soul-glow/60">載入中...</p>
            ) : weatherData ? (
              <div className="space-y-1">
                <p className="text-2xl font-bold text-treasure-gold">
                  {weatherData.temperature || '25'}°C
                </p>
                <p className="text-xs text-soul-glow/80">
                  UV: {isSunny ? '9 (陽光強烈)' : '4 (霧雨遮蔽)'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-soul-glow/60">無法載入</p>
            )}
          </div>
        </div>

        {/* 第二行：最近交通 & 最近景區人潮（參考附圖） */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* 最近交通卡片 */}
          <div className="gothic-button p-3 rounded-lg" style={{ minHeight: 'calc(100% * 0.8)' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🚂</span>
              <h3 className="text-sm font-semibold text-soul-glow">最近交通</h3>
            </div>
            {transportData ? (
              <div className="space-y-2">
                {/* 最近火車站 */}
                {transportData.train ? (
                  <div className="flex items-center justify-between p-2 rounded bg-soul-glow/5 border border-soul-glow/20">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚂</span>
                      <div className="text-xs">
                        <p className="text-soul-glow/90 font-medium truncate max-w-[120px]">{transportData.train.name || '火車站'}</p>
                        <p className="text-soul-glow/60">{transportData.train.distance ? `${transportData.train.distance} 公尺` : '距離未知'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded bg-soul-glow/5 border border-soul-glow/10">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚂</span>
                      <p className="text-xs text-soul-glow/50">查無資料</p>
                    </div>
                  </div>
                )}

                {/* 最近公車站 */}
                {transportData.bus ? (
                  <div className="flex items-center justify-between p-2 rounded bg-soul-glow/5 border border-soul-glow/20">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚌</span>
                      <div className="text-xs">
                        <p className="text-soul-glow/90 font-medium truncate max-w-[120px]">{transportData.bus.name || '公車站'}</p>
                        <p className="text-soul-glow/60">{transportData.bus.distance ? `${transportData.bus.distance} 公尺` : '距離未知'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded bg-soul-glow/5 border border-soul-glow/10">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚌</span>
                      <p className="text-xs text-soul-glow/50">查無資料</p>
                    </div>
                  </div>
                )}

                {/* 最近 YouBike 租借點 */}
                {transportData.youbike ? (
                  <div className="flex items-center justify-between p-2 rounded bg-soul-glow/5 border border-soul-glow/20">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚲</span>
                      <div className="text-xs">
                        <p className="text-soul-glow/90 font-medium truncate max-w-[120px]">{transportData.youbike.name || 'YouBike 站'}</p>
                        <p className="text-soul-glow/60">{transportData.youbike.distance ? `${transportData.youbike.distance} 公尺` : '距離未知'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded bg-soul-glow/5 border border-soul-glow/10">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚲</span>
                      <p className="text-xs text-soul-glow/50">查無資料</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2">
                  <div className="w-2 h-2 rounded-full bg-soul-glow/40 animate-pulse" />
                  <p className="text-xs text-soul-glow/60">載入中...</p>
                </div>
              </div>
            )}
          </div>

          {/* 最近景區人潮卡片 */}
          <div className="gothic-button p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🧭</span>
              <h3 className="text-sm font-semibold text-soul-glow">最近景區人潮</h3>
            </div>
            <p className="text-xs text-soul-glow/60 mb-2">敵軍標示</p>
            {crowdData === null ? (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-soul-glow/40"
                    />
                  ))}
                </div>
                <span className="text-xs text-soul-glow/60">載入中...</span>
              </div>
            ) : crowdData && typeof crowdData === 'object' ? (
              <div className="space-y-1">
                <div className="text-xs text-soul-glow/80 truncate mb-2">
                  {crowdData.name}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {crowdData.crowdLevel !== null && crowdData.crowdLevel !== undefined ? (
                      // 根據人潮等級顯示不同數量和顏色的圓點（0-4 級）
                      [...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i <= crowdData.crowdLevel
                              ? crowdData.crowdLevel <= 1
                                ? 'bg-soul-glow/80'
                                : crowdData.crowdLevel <= 2
                                ? 'bg-treasure-gold/80'
                                : crowdData.crowdLevel <= 3
                                ? 'bg-orange-500/80'
                                : 'bg-red-500/80'
                              : 'bg-soul-glow/20'
                          }`}
                        />
                      ))
                    ) : (
                      // 無法取得時顯示預設圓點
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-soul-glow/40" />
                        <div className="w-2 h-2 rounded-full bg-soul-glow/40" />
                        <div className="w-2 h-2 rounded-full bg-soul-glow/40" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-soul-glow/80">
                    {crowdData.crowdLevelText || '無法取得'}
                  </span>
                </div>
                {crowdData.distance && (
                  <div className="text-xs text-soul-glow/60">
                    距離 {crowdData.distance} 公尺
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-soul-glow/40"
                    />
                  ))}
                </div>
                <span className="text-xs text-soul-glow/60">取得失敗</span>
              </div>
            )}
          </div>
        </div>

        {/* 第三行：最近住宿 & 最近餐廳（參考附圖） */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {/* 最近住宿卡片 */}
          <div className="gothic-button p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🏨</span>
              <h3 className="text-sm font-semibold text-soul-glow">最近住宿</h3>
            </div>
            {recommendations?.lodging && recommendations.lodging.length > 0 ? (
              <div className="space-y-2 text-xs">
                {recommendations.lodging.slice(0, 3).map((place, index) => {
                  // 提取距離資訊
                  const distance = place.distance;
                  
                  // 判斷空房狀態顯示
                  let availabilityText = '無法取得剩餘空房';
                  let availabilityColor = 'text-soul-glow/50';
                  
                  if (place.hasRooms === true) {
                    if (place.availabilitySource === 'travelpayouts') {
                      availabilityText = '有剩餘空房';
                      availabilityColor = 'text-soul-glow/80';
                    } else {
                      availabilityText = '可能有空房';
                      availabilityColor = 'text-soul-glow/60';
                    }
                  } else if (place.hasRooms === false) {
                    availabilityText = '無剩餘空房';
                    availabilityColor = 'text-soul-glow/50';
                  }
                  
                  return (
                    <div key={index} className="space-y-1">
                      <div className="text-soul-glow/80 truncate font-medium">
                        {place.name}
                      </div>
                      <div className="space-y-0.5">
                        {distance && (
                          <div className="text-soul-glow/60">
                            距離 {distance} 公尺
                          </div>
                        )}
                        <div className={availabilityColor}>
                          剩餘空房: {availabilityText}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-soul-glow/60">載入中...</p>
            )}
          </div>

          {/* 最近餐廳卡片 */}
          <div className="gothic-button p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🍴</span>
              <h3 className="text-sm font-semibold text-soul-glow">最近餐廳</h3>
            </div>
            {recommendations?.restaurant && recommendations.restaurant.length > 0 ? (
              <div className="space-y-1 text-xs">
                {recommendations.restaurant.slice(0, 3).map((place, index) => {
                  // 提取距離資訊（優先使用 distance，否則從 vicinity 解析）
                  let distance = place.distance;
                  if (!distance && place.vicinity) {
                    const distanceMatch = place.vicinity.match(/(\d+)m/);
                    if (distanceMatch) {
                      distance = parseInt(distanceMatch[1]);
                    }
                  }
                  return (
                    <div key={index} className="text-soul-glow/80">
                      <span className="truncate">{place.name}</span>
                      {distance && (
                        <span className="text-soul-glow/60 ml-2"> {distance} 公尺</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-soul-glow/60">載入中...</p>
            )}
          </div>
        </div>

        {/* 底部導航欄 */}
        <footer className="route-footer">
          <button
            onClick={() => router.push('/routes')}
            className="route-footer__icon"
            aria-label="藏寶圖尋蹤"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="route-footer__label">藏寶圖尋蹤</span>
          </button>
          <button
            onClick={() => router.push('/footprint')}
            className="route-footer__icon"
            aria-label="足跡之光"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="route-footer__label">足跡之光</span>
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="route-footer__icon route-footer__icon--active"
            aria-label="心魂監控台"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            <span className="route-footer__label">心魂監控台</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

