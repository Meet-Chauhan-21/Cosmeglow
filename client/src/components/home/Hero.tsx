import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, ShieldCheck } from 'lucide-react';
import { Button } from '../layout/Button';
import { Container } from '../layout/Container';
import { useStore } from '../../context/StoreContext';
import { fallbackProducts } from '../../services/products';

export const Hero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { addToCart, setIsCartOpen, products } = useStore();

  const catalog = products.length > 0 ? products : fallbackProducts;

  const defaultProduct = {
    id: '',
    name: 'Restorative Peptide Serum',
    description: 'A concentrated multi-peptide serum designed to target visible signs of aging, restore firmness, and deeply hydrate the skin.',
    price: 85.00,
    rating: 4.9,
    reviewsCount: 148,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=600&auto=format&fit=crop'
  };

  const heroProducts = [
    {
      product: catalog[0] || defaultProduct,
      tagline: 'Dermatologist Approved Active formulas',
      titleHighlight: 'Botanicals',
      titleText1: 'Scientific',
      titleText2: 'for Radiant Skin.',
      bgGlow: 'bg-primary/5',
    },
    {
      product: catalog[1] || catalog[0] || defaultProduct,
      tagline: 'Ceramide-Infused Skin Defense',
      titleHighlight: 'Barrier',
      titleText1: 'Deep Cellular',
      titleText2: 'Renewal Therapy.',
      bgGlow: 'bg-secondary/5',
    },
    {
      product: catalog[2] || catalog[0] || defaultProduct,
      tagline: 'Cold-Pressed Botanical Elixir',
      titleHighlight: 'Radiance',
      titleText1: 'Pure Recovery',
      titleText2: 'Organic Oils.',
      bgGlow: 'bg-amber-500/5',
    },
  ];

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    resetTimeout();
    timeoutRef.current = setTimeout(
      () =>
        setCurrentSlide((prevSlide) =>
          prevSlide === heroProducts.length - 1 ? 0 : prevSlide + 1
        ),
      6000
    );

    return () => {
      resetTimeout();
    };
  }, [currentSlide]);

  const activeSlide = heroProducts[currentSlide];

  const handleQuickAdd = () => {
    addToCart(activeSlide.product, 1);
    setIsCartOpen(true);
  };

  return (
    <section className="relative min-h-[550px] sm:min-h-[600px] md:min-h-[650px] lg:min-h-[750px] xl:min-h-screen pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-20 flex items-center overflow-hidden bg-gradient-to-tr from-light-gray via-white to-accent-sage/20">
      {/* Background Ambient Glows */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`glow-${currentSlide}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className={`absolute top-0 right-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full ${activeSlide.bgGlow} blur-[100px] -z-10 translate-x-1/4 -translate-y-1/4`}
        />
      </AnimatePresence>

      <Container className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Text Content */}
          <div className="lg:col-span-6 space-y-6 md:space-y-8 z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${currentSlide}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6 md:space-y-8"
              >
                {/* Tagline */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-primary font-sans text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck size={14} />
                  <span>{activeSlide.tagline}</span>
                </div>

                {/* Heading */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-dark tracking-tight leading-[1.1]">
                  {activeSlide.titleText1} <br className="hidden sm:inline" />
                  <span className="text-primary italic font-light">{activeSlide.titleHighlight}</span>{' '}
                  <br className="sm:hidden" />
                  {activeSlide.titleText2}
                </h1>

                {/* Description */}
                <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-xl font-sans leading-relaxed">
                  {activeSlide.product.description}
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-4">
                  {activeSlide.product.stock !== undefined && activeSlide.product.stock <= 0 ? (
                    <button
                      type="button"
                      disabled
                      className="bg-slate-200 text-slate-500 border border-slate-300 py-3.5 px-7 rounded-full font-semibold text-sm cursor-not-allowed select-none shadow-sm flex items-center gap-2"
                    >
                      <span>Out of Stock</span>
                    </button>
                  ) : (
                    <Button
                      onClick={handleQuickAdd}
                      variant="primary"
                      size="lg"
                      rightIcon={<ArrowRight size={18} />}
                    >
                      Quick Add to Bag
                    </Button>
                  )}
                  <Button
                    href={`/product/${activeSlide.product.id}`}
                    variant="outline"
                    size="lg"
                  >
                    View Ingredients
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Quick indicators/dots & trust metrics */}
            <div className="pt-6 border-t border-border-gray/80 flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
              
              {/* Slider Dots */}
              <div className="flex items-center space-x-2.5">
                {heroProducts.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      currentSlide === idx ? 'w-8 bg-primary' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Stat */}
              <div className="flex items-center gap-6 text-xs text-gray-500 font-sans">
                <div>
                  <span className="block text-base font-bold text-dark font-display">99.8%</span>
                  <span>Natural Source</span>
                </div>
                <div className="w-px h-6 bg-border-gray" />
                <div>
                  <span className="block text-base font-bold text-dark font-display">4.9 ★</span>
                  <span>Review Rating</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Images Group (rotating, floating, sync description card) */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end relative">
            <div className="relative w-[90%] sm:w-full max-w-[400px] lg:max-w-[430px] aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5]">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={`image-container-${currentSlide}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    y: [0, -10, 0] // floating animation inside the active frame
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    scale: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.5 },
                    y: { 
                      duration: 6, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }
                  }}
                  className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white"
                >
                  <img
                    src={activeSlide.product.image}
                    alt={activeSlide.product.name}
                    className="w-full h-full object-cover object-center"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Floating Product Details Card (syncs with slide change) */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`floating-card-${currentSlide}`}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="absolute bottom-8 -left-4 sm:-left-10 glassmorphism p-4 sm:p-5 rounded-xl shadow-lg border border-white/60 w-[200px] sm:w-[230px]"
                >
                  <span className="text-[10px] text-secondary font-bold font-display uppercase tracking-widest block mb-1">
                    Spotlight Product
                  </span>
                  <h3 className="font-display font-semibold text-xs sm:text-sm text-dark truncate mb-1">
                    {activeSlide.product.name}
                  </h3>
                  
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill="currentColor" />
                      ))}
                    </div>
                    <span className="text-[9px] text-gray-500 font-sans">({activeSlide.product.reviewsCount})</span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className="font-display font-bold text-dark text-sm sm:text-base">
                      ₹{activeSlide.product.price.toFixed(2)}
                    </span>
                    {activeSlide.product.discount && (
                      <span className="text-[9px] text-white bg-primary px-1.5 py-0.5 rounded-full font-sans font-medium">
                        -{activeSlide.product.discount}% OFF
                      </span>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Floating Badge (Organic/Vegan badge, rotating slowly) */}
              <div className="absolute -top-5 -right-5 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary flex items-center justify-center text-white shadow-lg border-4 border-white z-10 select-none">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="text-center font-display text-[9px] sm:text-[10px] tracking-widest font-semibold p-2"
                >
                  NATURAL<br />•<br />VEGAN
                </motion.div>
              </div>

              {/* Background abstract element to add depth */}
              <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-secondary/10 rounded-2xl -z-10 rotate-12" />
            </div>
          </div>
          
        </div>
      </Container>
    </section>
  );
};

export default Hero;
