# SoulMiles 🧭

**Q版暗黑哥德 x 迷霧尋寶** 主題的旅遊足跡應用（Mobile-First）

## 📋 專案簡介

SoulMiles 是一個以「迷霧尋寶」為核心概念的旅遊應用，結合中古世紀航海時代的尋寶圖風格與暗黑哥德美學，讓用戶在探索世界的過程中累積靈魂純淨度，體驗迷霧散去、秘境展現的沉浸式旅程。

## 🎨 設計主題

- **視覺風格**: Q版暗黑哥德 x 中古世紀航海尋寶圖
- **色彩方案**: 極深藍/紫黑色調、淡紫色靈魂光環、金色寶藏點綴
- **動畫效果**: 迷霧流動、靈魂脈動、羅盤浮動
- **設計原則**: Mobile-First 響應式設計

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 啟動開發伺服器

```bash
npm run dev
```

開啟瀏覽器訪問 [http://localhost:3000](http://localhost:3000)

### 建置生產版本

```bash
npm run build
npm start
```

## 📁 專案結構

```
SoulMiles/
├── app/
│   ├── globals.css          # 全域樣式和 Tailwind 設定
│   ├── layout.js            # 根佈局元件
│   └── page.js              # 主頁面入口
├── components/
│   ├── LandingPage.js       # 啟動頁面元件
│   └── SoulIndicator.js     # 靈魂純淨度指示器元件
├── package.json
├── tailwind.config.js       # Tailwind CSS 配置
└── next.config.js           # Next.js 配置
```

## 🎯 核心功能

### 1. 🧭 藏寶圖尋蹤（行程推薦）
- 航向迷霧，尋找潮酷路線
- 根據用戶喜好推薦旅遊路線

### 2. ⚓ 足跡之光（共享足跡）
- 足跡灑下，照亮秘境寶藏
- 用戶去過的地方迷霧散去，場景變明亮

### 3. 💎 靈魂兌換所（資訊彙整/兌換）
- 淨化污穢，兌換專屬榮光
- 整合旅遊資訊並提供兌換功能

## 🔮 靈魂系統

- **SoulIndicator**: 顯示用戶靈魂純淨度的視覺化元件
- **靈魂等級**: 0-100%，影響光環強度和迷霧透明度
- **動態效果**: 靈魂越強，光環越明亮，迷霧越淡

## 🛠️ 技術棧

- **框架**: Next.js 14 (App Router)
- **樣式**: Tailwind CSS 3
- **動畫**: CSS Keyframes + Tailwind Animation
- **語言**: JavaScript (React)

## 📝 開發筆記

- 所有元件使用 `'use client'` 標記，支援客戶端互動
- 樣式採用 Mobile-First 設計原則
- 動畫效果使用 CSS 動畫，確保效能流暢
- 顏色主題定義於 `tailwind.config.js` 中

## 🎨 自訂顏色

專案使用以下自訂顏色（定義於 `tailwind.config.js`）：

- `gothic-dark`: #0a0a1a - 深色背景
- `gothic-purple`: #6b46c1 - 哥德紫色
- `soul-glow`: #a78bfa - 靈魂光暈
- `treasure-gold`: #fbbf24 - 寶藏金色
- `mist-blue`: #1e3a8a - 迷霧藍色

## 📱 響應式設計

- **手機優先**: 所有設計從手機尺寸開始
- **平板適配**: 使用 `sm:` 斷點優化平板體驗
- **桌面適配**: 使用 `md:` 斷點支援桌面瀏覽

## 🔜 下一步開發

- [ ] 實作「共享足跡」頁面的迷霧散去機制
- [ ] 建立路由系統和頁面導航
- [ ] 整合地圖 API 顯示足跡
- [ ] 實作靈魂等級系統和計算邏輯
- [ ] 添加用戶認證和資料儲存
