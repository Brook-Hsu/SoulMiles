'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

const pirateMissions = [
  '尋獲失落的航海日誌',
  '奪回被詛咒的星砂羅盤',
  '守護暗夜港的祕寶信標',
  '破解深淵旗幟的靈光密碼',
];

const transportPresets = [
  { type: '火車', status: '準點', detail: '北迴 12 分鐘後抵達' },
  { type: '巴士', status: '略擁擠', detail: '海霧線每 8 分鐘一班' },
  { type: '單車', status: '暢通', detail: '港灣步道風速 12km/h' },
  { type: '人潮', status: '中等', detail: '黑曜市集 65% 滿載' },
];

const recommendationPresets = {
  hotels: [
    { name: '黑曜潮旅', tag: '精品旅宿', distance: '450m' },
    { name: '月光船塢', tag: '復古青年館', distance: '780m' },
    { name: '星辰艙房', tag: '智能艙旅', distance: '1.2km' },
  ],
  foods: [
    { name: '迷霧酒桶館', tag: '海鮮餐酒', distance: '300m' },
    { name: '羅盤烘焙坊', tag: '手工吐司', distance: '520m' },
    { name: '旗幟茶館', tag: '台式創意', distance: '950m' },
  ],
};

const weatherSnapshots = [
  { condition: 'sunny', temp: 31, uv: 9, label: '晴朗冒險日' },
  { condition: 'rainy', temp: 26, uv: 4, label: '暴雨試煉日' },
];

export default function Dashboard() {
  const reward = useMemo(
    () =>
      new Intl.NumberFormat('en-US').format(
        Math.floor(Math.random() * (1000000 - 1000 + 1)) + 1000
      ),
    []
  );

  const mission = useMemo(
    () => pirateMissions[Math.floor(Math.random() * pirateMissions.length)],
    []
  );

  const [weather] = useState(
    weatherSnapshots[Math.floor(Math.random() * weatherSnapshots.length)]
  );

  const isSunny = weather.condition === 'sunny';

  return (
    <div className="dashboard-screen treasure-map-bg">
      <div className="dashboard-overlay" />
      <div className="dashboard-content">
        <header className="dashboard-top-bar">
          <Link href="/" className="soul-logo" aria-label="返回首頁">
            <div className="logo-medallion">
              <span className="logo-initial">S</span>
              <span className="logo-sparkle">✦</span>
            </div>
          </Link>
          <div className="top-bar-title">
            <p className="title-label">SoulMiles</p>
            <h1 className="title-main">暗黑航海儀表板</h1>
          </div>
          <button className="search-button" aria-label="全局搜尋">
            <span className="search-ship">🔍</span>
          </button>
        </header>

        <section className="dashboard-scroll-area">
          <Link href="/#login" className="wanted-card" aria-label="前往登入區塊">
            <div className="wanted-banner">
              <span>海盜懸賞單</span>
            </div>
            <div className="scroll-body">
              <p className="reward-label">懸賞金：</p>
              <p className="reward-value">{reward} SoulCoins</p>
              <p className="mission-line">
                您的懸賞目標：<strong>{mission}！</strong>
              </p>
              <p className="mission-note">點擊綁定 Google / FB（filess.io）</p>
            </div>
            <div className="scroll-flags">
              <span>☠︎</span>
              <span>⚑</span>
              <span>☠︎</span>
            </div>
          </Link>

          <article
            className={`weather-card ${isSunny ? 'sunny' : 'rainy'}`}
            aria-live="polite"
          >
            <div className="weather-frame">
              <div className="wheel-core">
                <span className="wheel-dot" />
                <span className="wheel-dot" />
                <span className="wheel-dot" />
                <span className="wheel-dot" />
              </div>
              <div className="weather-info">
                <p className="weather-label">臺灣氣象局</p>
                <h2>{weather.label}</h2>
                <div className="weather-metrics">
                  <div>
                    <p>溫度</p>
                    <strong>{weather.temp}°C</strong>
                  </div>
                  <div>
                    <p>紫外線</p>
                    <strong>UV {weather.uv}</strong>
                  </div>
                </div>
              </div>
              <div className="weather-scene">
                {isSunny ? (
                  <div className="sunny-scene">
                    <div className="sun-orb" />
                    <div className="sun-rays" />
                    <div className="calm-boat">
                      <div className="boat-sail" />
                      <div className="boat-hull" />
                    </div>
                    <div className="weather-wave" />
                  </div>
                ) : (
                  <div className="rainy-scene">
                    <div className="storm-cloud" />
                    <div className="storm-cloud small" />
                    <div className="storm-boat">
                      <div className="boat-sail torn" />
                      <div className="boat-hull storm" />
                    </div>
                    <div className="rain-lines" />
                    <div className="lightning-bolt" />
                    <div className="weather-wave choppy" />
                  </div>
                )}
              </div>
            </div>
          </article>

          <section className="transport-card">
            <header>
              <div className="card-icon">🛢️</div>
              <div>
                <p className="card-label">航線動態</p>
                <h2>交通 & 人潮偵測</h2>
              </div>
            </header>
            <ul>
              {transportPresets.map((item) => (
                <li key={item.type}>
                  <div>
                    <p className="item-type">{item.type}</p>
                    <p className="item-detail">{item.detail}</p>
                  </div>
                  <span className="item-status">{item.status}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="recommend-card">
            <header>
              <div className="card-icon">🔭</div>
              <div>
                <p className="card-label">附近推薦</p>
                <h2>住宿 · 美食信號</h2>
              </div>
            </header>
            <div className="recommend-lists">
              <div>
                <h3>旅館</h3>
                {recommendationPresets.hotels.map((hotel) => (
                  <div key={hotel.name} className="recommend-item">
                    <div>
                      <p className="item-name">{hotel.name}</p>
                      <p className="item-tag">{hotel.tag}</p>
                    </div>
                    <span>{hotel.distance}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3>餐飲</h3>
                {recommendationPresets.foods.map((food) => (
                  <div key={food.name} className="recommend-item">
                    <div>
                      <p className="item-name">{food.name}</p>
                      <p className="item-tag">{food.tag}</p>
                    </div>
                    <span>{food.distance}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>

        <nav className="dashboard-bottom-nav">
          <Link href="/" className="nav-item" aria-label="首頁">
            <div className="nav-icon">⛵</div>
            <p>首頁</p>
          </Link>
          <Link href="/" className="nav-item" aria-label="地圖/指南針">
            <div className="nav-icon">⚓</div>
            <p>羅盤</p>
          </Link>
          <Link href="/" className="nav-item" aria-label="獎勵收藏">
            <div className="nav-icon">🗝️</div>
            <p>寶庫</p>
          </Link>
        </nav>
      </div>
    </div>
  );
}



