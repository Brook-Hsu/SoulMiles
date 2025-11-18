'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from './Header';
import SoulIndicator from './SoulIndicator';
import LoadingAnimation from './LoadingAnimation';

const ROUTE_BG = '/images/routes/route-bg.jpg';
const HERO_IMAGE = '/images/routes/hero-oracle.jpg';

const heroSlides = [
  {
    id: 'destiny',
    title: '宿命的邂逅',
    mantra: 'The stars incline, they do not compel.',
    summary: '直覺抽籤，航向未知；跳過試煉直接鎖定隨機航線。',
    accent: 'from-[#3b1a10] via-[#1c0b06] to-[#080302]',
    art: '/images/routes/card-destiny.jpg',
    route: {
      pathname: '/treasure-map',
      query: {
        mode: 'random',
        result: '寶藏獵人',
        location: '迷霧孤島',
      },
    },
  },
  {
    id: 'guidance',
    title: '命運的指引',
    mantra: '指南星只為真正的追尋者閃耀。',
    summary: '完成 8 題靈魂試煉，神諭會親自為你指定航行路徑。',
    accent: 'from-[#2c1b4a] via-[#120826] to-[#050010]',
    art: '/images/routes/card-guidance.jpg',
    route: {
      pathname: '/soul-test',
      query: {
        mode: 'guide',
      },
    },
  },
  {
    id: 'pandora',
    title: '潘朵拉的魔盒',
    mantra: '當迷霧吞噬感官，只剩意志帶你抵達終點。',
    summary: 'Hard 模式即刻啟動，跳過問卷直接進入極限行程。',
    accent: 'from-[#3e1e0e] via-[#1f0b05] to-[#060201]',
    art: '/images/routes/card-pandora.jpg',
    route: {
      pathname: '/treasure-map',
      query: {
        mode: 'hard',
        result: '孤獨艦長',
        location: '潘朵拉暗礁',
      },
    },
  },
];

export default function TreasureRoutesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [soulLevel] = useState(74);
  const [activeIndex, setActiveIndex] = useState(1);
  const [touchStartX, setTouchStartX] = useState(null);

  const slidePositions = useMemo(() => {
    const len = heroSlides.length;
    return heroSlides.map((_, index) => {
      let position = index - activeIndex;
      if (position > len / 2) position -= len;
      if (position < -len / 2) position += len;
      return position;
    });
  }, [activeIndex]);

  const gotoSlide = (direction) => {
    setActiveIndex((prev) => {
      const nextIndex = (prev + direction + heroSlides.length) % heroSlides.length;
      return nextIndex;
    });
  };

  const handleSlideAction = (slide) => {
    const query = new URLSearchParams(slide.route.query).toString();
    router.push(`${slide.route.pathname}${query ? `?${query}` : ''}`);
  };

  const handleTouchStart = (event) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 40) {
      gotoSlide(delta > 0 ? -1 : 1);
    }
    setTouchStartX(null);
  };

  const handleLoadingComplete = () => setIsLoading(false);

  if (isLoading) {
    return <LoadingAnimation onComplete={handleLoadingComplete} />;
  }

  return (
    <div className="route-page text-[#f7e7c7]">
      <div
        className="route-page__bg"
        style={{
          backgroundImage: `url(${ROUTE_BG})`,
        }}
      />
      <div className="route-page__veil" />

      <div className="route-page__content">
        <Header />

        <section className="route-hero-panel">
          <div className="route-hero-text">
            <p className="route-pill route-pill--centered">"The stars incline, they do not compel."</p>
            <h1 className="route-title route-title--centered">藏寶圖尋蹤 · Arcane Route</h1>
          </div>
          <div className="route-hero-visual">
            <div className="route-hero-visual__inner">
              <img src={HERO_IMAGE} alt="占星師" className="route-hero-visual__image" />
              <div className="route-hero-visual__indicator">
                <SoulIndicator soulLevel={soulLevel} />
              </div>
            </div>
          </div>
        </section>

        <section
          className="route-carousel"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="route-carousel__dots">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setActiveIndex(index)}
                className={`route-dot ${activeIndex === index ? 'route-dot--active' : ''}`}
                aria-label={`slide-${index + 1}`}
              />
            ))}
          </div>
          <div className="route-carousel__frame" />
          <div className="route-carousel__track">
            {heroSlides.map((slide, index) => {
              const position = slidePositions[index];
              const isActive = position === 0;
              const translateX = position * 65;

              return (
                <div
                  key={slide.id}
                  className={`route-card-wrapper ${isActive ? 'route-card-wrapper--active' : ''}`}
                  style={{
                    transform: `translateX(calc(${translateX}% - 50%)) scale(${isActive ? 1 : 0.88})`,
                    opacity: isActive ? 1 : 0.15,
                  }}
                >
                  <div
                    className={`route-card bg-gradient-to-br ${slide.accent}`}
                    onClick={() => (isActive ? handleSlideAction(slide) : setActiveIndex(index))}
                  >
                    <img 
                      src={slide.art} 
                      alt={slide.title}
                      className="route-card__art"
                    />
                    {isActive && (
                      <>
                        <div className="route-card__body">
                          <p className="route-card__badge">SoulMiles</p>
                          <h3 className="route-card__title route-card__title--centered">{slide.title}</h3>
                          <p className="route-card__summary">{slide.mantra}</p>
                        </div>
                        <p className="route-card__description">
                          {slide.summary}
                        </p>
                        <div className="route-card__footer">
                          <button className="route-card__cta" onClick={() => handleSlideAction(slide)}>
                            啟動
                          </button>
                          <p className="route-card__pagination">
                            {index + 1} / {heroSlides.length}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="route-carousel__fade route-carousel__fade--left" />
          <div className="route-carousel__fade route-carousel__fade--right" />
        </section>

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
            onClick={() => router.push('/footprints')}
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
            onClick={() => router.push('/exchange')}
            className="route-footer__icon"
            aria-label="靈魂兌換所"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="route-footer__label">靈魂兌換所</span>
          </button>
        </footer>

      </div>
    </div>
  );
}

