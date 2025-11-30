'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from './Header';
import Modal from './Modal';

const MAP_IMAGES = [
  '/images/maps/gothic_map_01.jpg',
  '/images/maps/gothic_map_02.jpg',
  '/images/maps/gothic_map_03.jpg',
];

const defaultSummaries = {
  '聖殿淨化': '以靈魂脈動淨化古老神殿，暗號才會顯現。',
  '狂歡派對': '霓虹與鼓點同步，航線直接降臨派對之心。',
  '船難記': '沿著沉沒的航道尋找最後的求救訊號。',
  '寶藏獵人': '疾風般的節奏，逐一點亮所有藏寶標記。',
  '孤獨艦長': '全船只剩你一人，與星圖對話找到出口。',
};

// 縣市名稱對應（從 Google Maps 查詢參數提取）
const CITY_NAME_MAPPING = {
  'Taipei': 'Taipei',
  'Keelung': '基隆',
  'Yilan': '宜蘭',
  'Taichung': '台中',
  'Changhua': '彰化',
  'Yunlin': '雲林',
  'Kaohsiung': '高雄',
  'Tainan': '台南',
  'Pingtung': '屏東',
  'Hualien': '花蓮',
  'Taitung': '台東',
  'Green+Island': '台東', // 綠島屬於台東
};

// 預設行程（當 API 無法取得資料時使用）
const defaultItineraries = {
  north: [
    { title: '霧燈集結點', log: '在幽暗碼頭校準羅盤', link: 'https://maps.google.com/?q=Taipei', city: 'Taipei' },
    { title: '黑曜市集', log: '以星象換取神秘坐標', link: 'https://maps.google.com/?q=Keelung', city: 'Keelung' },
    { title: '極光懸崖', log: '完成儀式取得最終密令', link: 'https://maps.google.com/?q=Yilan', city: 'Yilan' },
  ],
  central: [
    { title: '迷霧中樞', log: '收集盟友情報', link: 'https://maps.google.com/?q=Taichung', city: 'Taichung' },
    { title: '聖殿遺跡', log: '破解地脈謎語', link: 'https://maps.google.com/?q=Changhua', city: 'Changhua' },
    { title: '靈魂熔爐', log: '鍛造下一段旅程', link: 'https://maps.google.com/?q=Yunlin', city: 'Yunlin' },
  ],
  south: [
    { title: '赤焰船塢', log: '啟動防護符文', link: 'https://maps.google.com/?q=Kaohsiung', city: 'Kaohsiung' },
    { title: '熔礦之眼', log: '利用熔岩熱能定位', link: 'https://maps.google.com/?q=Tainan', city: 'Tainan' },
    { title: '黑曜海峽', log: '與幽影締結契約', link: 'https://maps.google.com/?q=Pingtung', city: 'Pingtung' },
  ],
  east: [
    { title: '潮汐聖環', log: '在潮聲中聽取神諭', link: 'https://maps.google.com/?q=Hualien', city: 'Hualien' },
    { title: '月光航道', log: '借用月石折射下一站', link: 'https://maps.google.com/?q=Taitung', city: 'Taitung' },
    { title: '星落崖口', log: '完成最後的航海簽章', link: 'https://maps.google.com/?q=Green+Island', city: 'Taitung' },
  ],
};

export default function TreasureMap() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get('mode') || 'random';
  const journeyType = searchParams.get('result') || (mode === 'hard' ? '孤獨艦長' : '寶藏獵人');
  const location = searchParams.get('location') || '迷霧群島';
  const summary =
    searchParams.get('summary') || defaultSummaries[journeyType] || '靈魂羅盤為你標記前方。';

  const [mapImage] = useState(
    MAP_IMAGES[Math.floor(Math.random() * MAP_IMAGES.length)]
  );
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [isNearDestination, setIsNearDestination] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [itineraries, setItineraries] = useState(defaultItineraries);
  const [loadingAttractions, setLoadingAttractions] = useState({});

  const regionKey = useMemo(() => {
    if (location.includes('北')) return 'north';
    if (location.includes('中') || location.includes('樞')) return 'central';
    if (location.includes('南') || location.includes('赤')) return 'south';
    if (location.includes('東') || location.includes('潮')) return 'east';
    return 'north';
  }, [location]);

  // 從 Google Maps 連結提取城市名稱
  const extractCityFromLink = (link) => {
    try {
      const url = new URL(link);
      const query = url.searchParams.get('q') || '';
      return CITY_NAME_MAPPING[query] || query;
    } catch {
      return null;
    }
  };

  // 從 API 取得景點資料
  const fetchAttractionForCity = async (cityName) => {
    if (!cityName) return null;
    
    // 避免重複請求
    if (loadingAttractions[cityName]) return null;
    
    setLoadingAttractions(prev => ({ ...prev, [cityName]: true }));
    
    try {
      const response = await fetch(`/api/tourist-attractions?city=${encodeURIComponent(cityName)}`);
      if (!response.ok) {
        throw new Error(`API 請求失敗: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.attraction) {
        const attraction = data.attraction;
        const googleMapLink = attraction.position?.lat && attraction.position?.lon
          ? `https://maps.google.com/?q=${attraction.position.lat},${attraction.position.lon}`
          : `https://maps.google.com/?q=${encodeURIComponent(attraction.name + ' ' + attraction.address)}`;
        
        return {
          title: attraction.name || '未知景點',
          log: attraction.description?.substring(0, 30) || attraction.address || '探索秘境',
          link: googleMapLink,
          city: cityName,
          address: attraction.address,
          picture: attraction.pictureUrl,
        };
      }
      return null;
    } catch (error) {
      console.error(`[TreasureMap] 取得 ${cityName} 景點失敗:`, error);
      return null;
    } finally {
      setLoadingAttractions(prev => {
        const next = { ...prev };
        delete next[cityName];
        return next;
      });
    }
  };

  // 當行程變化時，載入真實景點資料
  useEffect(() => {
    const loadAttractions = async () => {
      const defaultRoute = defaultItineraries[regionKey] || defaultItineraries.north;
      const updatedRoute = await Promise.all(
        defaultRoute.map(async (stop) => {
          const cityName = extractCityFromLink(stop.link);
          if (cityName) {
            const attraction = await fetchAttractionForCity(cityName);
            if (attraction) {
              return attraction;
            }
          }
          return stop;
        })
      );

      setItineraries(prev => ({
        ...prev,
        [regionKey]: updatedRoute,
      }));
    };

    loadAttractions();
  }, [regionKey]);

  const routePlan = itineraries[regionKey] || defaultItineraries[regionKey] || defaultItineraries.north;
  const currentStop = routePlan[currentStopIndex] || routePlan[0];
  const isMissionComplete = currentStopIndex >= routePlan.length - 1;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNearDestination(!isMissionComplete);
    }, 1800);
    return () => clearTimeout(timer);
  }, [currentStopIndex, isMissionComplete]);

  useEffect(() => {
    if (isMissionComplete) {
      setIsNearDestination(false);
    }
  }, [isMissionComplete]);

  const handleSail = () => {
    if (!isNearDestination || isMissionComplete) return;
    setCurrentStopIndex((prev) => Math.min(prev + 1, routePlan.length - 1));
    setIsNearDestination(false);
  };

  const handleReturn = () => {
    if (isMissionComplete) {
      setShowCompletion(true);
    }
  };

  const handleBackHome = () => {
    setShowCompletion(false);
    router.push('/');
  };

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden arcane-bg text-[#f1e3c3]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_-10%,rgba(149,121,80,0.2),transparent_60%)]" />
      <div className="relative z-10 flex h-full flex-col gap-4 px-4 py-4 sm:py-6">
        <Header />

        <section className="rounded-3xl border border-[#f0d9b5]/30 bg-[#1c1015]/85 p-4 shadow-2xl backdrop-blur">
          <p className="text-xs uppercase tracking-[0.5em] text-[#fbbf24]/80">Arcane Manifest</p>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-[#fde8b0]">Alea iacta est</h1>
            <span className="rounded-full border border-[#fbbf24]/40 px-3 py-1 text-[0.6rem] uppercase tracking-[0.4em] text-[#fbbf24]">
              {mode}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#f7e7c7]/70">{summary}</p>
        </section>

        <section className="flex-1 rounded-[2.5rem] border border-[#f0d9b5]/20 bg-[#120b0c]/80 p-4 shadow-inner backdrop-blur">
          <div className="flex h-full flex-col gap-4">
            <div className="relative flex-1 overflow-hidden rounded-3xl border border-[#f0d9b5]/20">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${mapImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f12]/40 to-[#090504]" />
              <div className="relative flex h-full flex-col justify-between p-4">
                <div>
                  <p className="text-[0.6rem] uppercase tracking-[0.5em] text-[#f7e7c7]/60">Route</p>
                  <h2 className="text-2xl font-bold text-[#fde8b0]">{journeyType}</h2>
                  <p className="text-sm text-[#fbbf24]">{location}</p>
                </div>
                <div className="rounded-2xl border border-[#fbbf24]/30 bg-[#1e1310]/80 p-3 text-xs text-[#f7e7c7]/80">
                  <p className="font-semibold text-[#fbbf24]">目前目標：{currentStop.title}</p>
                  <p className="text-[0.7rem]">{currentStop.log}</p>
                  <a
                    href={currentStop.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#fbbf24]/50 px-3 py-1 text-[0.65rem] text-[#fbbf24]"
                  >
                    前往 Google Map
                    <span>↗</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[0.65rem]">
              {routePlan.map((stop, index) => {
                const isActive = index === currentStopIndex;
                const isDone = index < currentStopIndex;
                return (
                  <div
                    key={stop.title}
                    className={`rounded-2xl border px-3 py-3 text-center ${
                      isActive
                        ? 'border-[#fbbf24] bg-[#fbbf24]/10 text-[#fbbf24]'
                        : isDone
                        ? 'border-[#78e08f]/40 bg-[#12301d] text-[#78e08f]'
                        : 'border-white/10 bg-white/5 text-[#f7e7c7]/60'
                    }`}
                  >
                    <p className="text-[0.65rem] font-semibold">{stop.title}</p>
                    <p className="mt-1 text-[0.55rem]">{stop.log}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSail}
                disabled={!isNearDestination || isMissionComplete}
                className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                  isNearDestination && !isMissionComplete
                    ? 'border-[#fbbf24] text-[#fbbf24]'
                    : 'border-white/20 text-white/30'
                }`}
              >
                揚帆啟航
              </button>
              <button
                onClick={handleReturn}
                disabled={!isMissionComplete}
                className={`flex-1 rounded-2xl bg-gradient-to-r px-4 py-3 text-sm font-semibold shadow-lg transition-all ${
                  isMissionComplete
                    ? 'from-[#fbbf24] to-[#ff7f36] text-[#26120d]'
                    : 'from-[#4b3727] to-[#2d1a14] text-white/30'
                }`}
              >
                永劫回歸
              </button>
            </div>
          </div>
        </section>
      </div>

      {showCompletion && (
        <Modal
          title="恭喜完成尋寶！"
          subtitle="永劫回歸成功，靈魂已被記錄在航海圖。"
          onClose={() => setShowCompletion(false)}
          primaryAction={
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowCompletion(false)}
                className="flex-1 rounded-xl border border-[#fbbf24]/40 px-4 py-2 text-sm text-[#fbbf24]"
              >
                留在此處
              </button>
              <button
                onClick={handleBackHome}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#ff9234] px-4 py-2 text-sm font-semibold text-[#2b1207]"
              >
                返回 Landing
              </button>
            </div>
          }
        >
          <p className="text-sm text-[#f7e7c7]/80">
            你的航程紀錄已經寫入秘銀航海圖，等待下一次的召喚。
          </p>
        </Modal>
      )}
    </div>
  );
}

