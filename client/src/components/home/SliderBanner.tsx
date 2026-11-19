import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import BannerSlider, { type BannerSlide } from '../common/BannerSlider';

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

const HEIGHT_CLASSES = 'h-[180px] xs:h-[220px] sm:h-[340px] md:h-[420px] lg:h-[480px]';

export const SliderBanner: React.FC = () => {
  const { settings, settingsLoaded } = useStore();
  const bannersKey = (settings.banners || []).filter(Boolean).join('|');

  const slides: BannerSlide[] = useMemo(() => {
    const customBanners = bannersKey ? bannersKey.split('|') : [];
    if (customBanners.length > 0) {
      return customBanners.map((url, idx) => ({
        key: `${idx}-${url}`,
        content: (
          <img
            src={url}
            alt={`Promotion Banner ${idx + 1}`}
            className="w-full h-full object-cover object-center pointer-events-none"
            loading="eager"
            decoding="async"
            draggable={false}
            fetchPriority={idx === 0 ? 'high' : 'auto'}
          />
        )
      }));
    }
    return DEFAULT_SLIDES.map((slide, idx) => ({
      key: slide.id,
      content: (
        <>
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover object-center pointer-events-none"
            loading="eager"
            decoding="async"
            draggable={false}
            fetchPriority={idx === 0 ? 'high' : 'auto'}
          />
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
        </>
      )
    }));
  }, [bannersKey]);

  // First visit (nothing cached yet): show a neutral placeholder instead of
  // flashing the default slides and then swapping to the admin banners.
  if (!settingsLoaded && !bannersKey) {
    return <div className={`w-full bg-slate-100 animate-pulse ${HEIGHT_CLASSES}`} aria-hidden="true" />;
  }

  return (
    <BannerSlider
      slides={slides}
      heightClassName={HEIGHT_CLASSES}
      autoplayMs={5000}
      pauseOnHover
      ariaLabel="Promotional Carousel"
    />
  );
};

export default SliderBanner;
