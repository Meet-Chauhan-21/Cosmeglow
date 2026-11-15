import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface DefaultBanner {
  id: string;
  image: string;
  badge: string;
  title: string;
  subtitle: string;
  buttonText: string;
  link: string;
  theme: string;
}

const DEFAULT_SLIDES: DefaultBanner[] = [
  {
    id: 'slide-1',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1600&auto=format&fit=crop',
    badge: 'NEW LAUNCH | 100% ORGANIC',
    title: 'Cellular Restoration & Botanical Glow',
    subtitle: 'Clinically proven bio-active botanical serums formulated for deep skin hydration & radiance.',
    buttonText: 'Shop New Arrivals',
    link: '#featured-products',
    theme: 'from-black/70 via-black/40 to-transparent'
  },
  {
    id: 'slide-2',
    image: 'https://images.unsplash.com/photo-1608248597359-2ff969c3a378?q=80&w=1600&auto=format&fit=crop',
    badge: 'FESTIVE SPECIAL | FLAT 20% OFF',
    title: 'Targeted Anti-Aging & Peptide Therapy',
    subtitle: 'Restore firmness and natural elasticity with our award-winning cold-pressed peptide solutions.',
    buttonText: 'Explore Serums',
    link: '#featured-products',
    theme: 'from-purple-950/75 via-purple-900/40 to-transparent'
  },
  {
    id: 'slide-3',
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=1600&auto=format&fit=crop',
    badge: 'DERMATOLOGIST APPROVED',
    title: 'Pure Plant Defense For Every Skin Type',
    subtitle: 'Cruelty-free, toxin-free restorative formulations handcrafted in small active batches.',
    buttonText: 'Browse Collections',
    link: '#categories',
    theme: 'from-emerald-950/75 via-emerald-900/40 to-transparent'
  }
];

export const SliderBanner: React.FC = () => {
  const { settings } = useStore();
  const customBanners = (settings.banners || []).filter(Boolean);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const totalSlides = customBanners.length > 0 ? customBanners.length : DEFAULT_SLIDES.length;

  // Preload all banner images so they stay cached in memory without flashing
  const [imagesLoaded, setImagesLoaded] = useState(false);
  useEffect(() => {
    if (customBanners.length === 0) {
      setImagesLoaded(true);
      return;
    }
    let loadedCount = 0;
    customBanners.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= customBanners.length) setImagesLoaded(true);
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount >= customBanners.length) setImagesLoaded(true);
      };
      // If already cached
      if (img.complete) {
        loadedCount++;
        if (loadedCount >= customBanners.length) setImagesLoaded(true);
      }
    });
    // Fallback timeout in case images take too long
    const timeout = setTimeout(() => setImagesLoaded(true), 3000);
    return () => clearTimeout(timeout);
  }, [customBanners]);

  // Auto-slide every 5 seconds, paused on mouse hover
  useEffect(() => {
    if (totalSlides <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5000);
    return () => clearInterval(interval);
  }, [totalSlides, isHovered]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <section 
      className="relative w-full bg-white overflow-hidden select-none group/banner"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Promotional Carousel"
    >
      {/* Loading skeleton while images preload */}
      {!imagesLoaded && customBanners.length > 0 && (
        <div className="absolute inset-0 z-30 bg-slate-100 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
        </div>
      )}

      {/* Banner Slides Container - exactly one banner visible at a time with smooth transition */}
      <div className="relative w-full h-[180px] xs:h-[220px] sm:h-[340px] md:h-[420px] lg:h-[480px] overflow-hidden bg-white select-none">
        {customBanners.length > 0 ? (
          // Admin Custom Uploaded Banners
          customBanners.map((bannerUrl, idx) => (
            <div
              key={bannerUrl || idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={bannerUrl}
                alt={`Promotion Banner ${idx + 1}`}
                className="w-full h-full object-cover object-center"
                loading={idx === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={idx === 0 ? 'high' : 'low'}
              />
            </div>
          ))
        ) : (
          // Rich Default E-Commerce Slides (No emojis)
          DEFAULT_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
              {/* E-Commerce Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.theme} flex items-center`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-white">
                  <div className="max-w-xl space-y-2 sm:space-y-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[10px] sm:text-xs font-semibold tracking-wider uppercase border border-white/30 text-white">
                      {slide.badge}
                    </span>
                    <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight tracking-tight text-white drop-shadow-sm">
                      {slide.title}
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-gray-200 line-clamp-2 sm:line-clamp-none font-sans leading-relaxed drop-shadow-xs max-w-lg">
                      {slide.subtitle}
                    </p>
                    <div className="pt-1 sm:pt-2">
                      <a
                        href={slide.link}
                        className="inline-flex items-center gap-2 bg-white text-dark hover:bg-primary hover:text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full font-display font-semibold text-xs sm:text-sm transition-colors shadow-md"
                      >
                        <span>{slide.buttonText}</span>
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Left Hover Zone: Revealed when pointer hovers near left side */}
      {totalSlides > 1 && (
        <div 
          className="absolute left-0 top-0 bottom-0 w-24 sm:w-36 z-20 flex items-center justify-start pl-3 sm:pl-6 group/left cursor-pointer"
          onClick={handlePrev}
          title="Previous slide"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous Slide"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-dark shadow-xl flex items-center justify-center transition-all duration-300 opacity-0 group-hover/left:opacity-100 -translate-x-3 group-hover/left:translate-x-0 cursor-pointer border border-border-gray/30 focus:outline-none"
          >
            <ChevronLeft size={22} className="stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Right Hover Zone: Revealed when pointer hovers near right side */}
      {totalSlides > 1 && (
        <div 
          className="absolute right-0 top-0 bottom-0 w-24 sm:w-36 z-20 flex items-center justify-end pr-3 sm:pr-6 group/right cursor-pointer"
          onClick={handleNext}
          title="Next slide"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next Slide"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-dark shadow-xl flex items-center justify-center transition-all duration-300 opacity-0 group-hover/right:opacity-100 translate-x-3 group-hover/right:translate-x-0 cursor-pointer border border-border-gray/30 focus:outline-none"
          >
            <ChevronRight size={22} className="stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Slide Indicators / Dots */}
      {totalSlides > 1 && (
        <div className="absolute bottom-3 sm:bottom-5 left-0 right-0 z-20 flex justify-center items-center gap-1.5 sm:gap-2">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to banner ${idx + 1}`}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex === idx
                  ? 'w-6 sm:w-8 h-2 sm:h-2.5 bg-white shadow-sm'
                  : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default SliderBanner;
