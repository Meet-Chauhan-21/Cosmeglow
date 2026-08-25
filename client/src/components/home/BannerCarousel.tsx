import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../context/StoreContext';

export const BannerCarousel: React.FC = () => {
  const { settings } = useStore();
  const banners = settings.banners || [];
  
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 2000); // Auto-scroll every 2 seconds
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
      <div className="relative overflow-hidden w-full h-44 sm:h-64 md:h-80 lg:h-96 xl:h-[420px] rounded-2xl sm:rounded-3xl shadow-sm border border-border-gray/30 bg-slate-50">
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={banners[index]}
            alt={`Promotional Banner ${index + 1}`}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full h-full object-cover select-none"
            onError={(e) => {
              (e.target as any).src = 'https://placehold.co/1200x400?text=CosmeGlow+Skincare+Promo+Banner';
            }}
          />
        </AnimatePresence>

        {/* Indicators / Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === index ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerCarousel;
