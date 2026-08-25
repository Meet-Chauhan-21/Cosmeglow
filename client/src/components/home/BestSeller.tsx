import React from 'react';
import { motion } from 'framer-motion';
import { Star, Check, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '../layout/Container';
import { Button } from '../layout/Button';
import { fallbackProducts } from '../../services/products';
import { useStore } from '../../context/StoreContext';

export const BestSeller: React.FC = () => {
  const { products, settings, addToCart, setIsCartOpen } = useStore();
  const catalog = products.length > 0 ? products : fallbackProducts;

  const defaultBestSeller = {
    id: 'mock-spotlight',
    name: settings.homepageImages?.spotlightName || 'Restorative Peptide Serum',
    description: settings.homepageImages?.spotlightDescription || 'A concentrated multi-peptide serum designed to target visible signs of aging, restore firmness, and deeply hydrate the skin.',
    rating: 4.9,
    reviewsCount: 148,
    price: settings.homepageImages?.spotlightPrice !== undefined ? settings.homepageImages.spotlightPrice : 85.00,
    oldPrice: settings.homepageImages?.spotlightOldPrice !== undefined ? settings.homepageImages.spotlightOldPrice : 110.00,
    ingredients: ['Copper Tripeptide-1', 'Hyaluronic Acid Matrix', 'Organic Centella Asiatica'],
    benefits: ['Plumps fine lines & wrinkles', 'Improves skin elasticity & firmness', 'Boosts natural collagen production'],
  };

  const activeBestseller = catalog.find((p) => p.isBestSeller) || catalog[0];

  const bestseller = {
    ...defaultBestSeller,
    id: activeBestseller?.id || defaultBestSeller.id,
    name: settings.homepageImages?.spotlightName || activeBestseller?.name || defaultBestSeller.name,
    description: settings.homepageImages?.spotlightDescription || activeBestseller?.description || defaultBestSeller.description,
    price: settings.homepageImages?.spotlightPrice !== undefined ? settings.homepageImages.spotlightPrice : (activeBestseller?.price || defaultBestSeller.price),
    oldPrice: settings.homepageImages?.spotlightOldPrice !== undefined ? settings.homepageImages.spotlightOldPrice : (activeBestseller?.oldPrice || defaultBestSeller.oldPrice),
    ingredients: activeBestseller?.ingredients?.length ? activeBestseller.ingredients : defaultBestSeller.ingredients,
    benefits: activeBestseller?.benefits?.length ? activeBestseller.benefits : defaultBestSeller.benefits,
    volume: activeBestseller?.volume || '50ml',
    image: settings.homepageImages?.spotlight || activeBestseller?.image || '',
    hoverImage: activeBestseller?.hoverImage || '',
    category: activeBestseller?.category || 'Skincare',
    rating: activeBestseller?.rating || 4.9,
    reviewsCount: activeBestseller?.reviewsCount || 148,
    stock: activeBestseller?.stock,
  };

  const handleAddToCart = () => {
    addToCart(bestseller as any, 1, bestseller.volume || '50ml');
    setIsCartOpen(true);
    toast.success(`${bestseller.name} added to shopping bag.`);
  };

  return (
    <section className="py-20 bg-light-gray relative overflow-hidden">
      {/* Background shape */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-125 h-125 rounded-full bg-primary/3 blur-[80px] -z-10" />

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Flagship Image close-up */}
          <div className="lg:col-span-6 relative">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-square sm:aspect-4/3 lg:aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
            >
              <img
                src={settings.homepageImages?.spotlight || "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop"}
                alt={bestseller?.name || "Peptide Serum Application"}
                className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-1000"
              />
            </motion.div>
            
            {/* Absolute badge */}
            <div className="absolute -bottom-6 -right-6 glassmorphism p-5 rounded-2xl border border-white/80 shadow-lg hidden sm:block max-w-50">
              <span className="text-2xl font-display font-bold text-primary block">96%</span>
              <span className="text-xs text-gray-600 font-sans leading-tight block mt-1">
                of buyers reported visible firming & hydration in 7 days.
              </span>
            </div>
          </div>

          {/* Details Content */}
          <div className="lg:col-span-6 space-y-6 lg:pl-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-2"
            >
              <span className="text-xs font-bold font-display uppercase tracking-widest text-secondary">
                Spotlight Formulation
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-dark tracking-tight">
                {bestseller.name}
              </h2>
              
              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" className="stroke-1" />
                  ))}
                </div>
                <span className="text-xs font-medium text-gray-500 font-sans">
                  {bestseller.rating} based on {bestseller.reviewsCount} verified reviews
                </span>
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-gray-600 font-sans leading-relaxed text-base"
            >
              {bestseller.description} Recalibrate your skin’s vitality. This formulation stimulates natural elastin production, repairs fine cellular structures, and reinforces deep dermal hydration.
            </motion.p>

            {/* Benefits Checkmarks */}
            <motion.ul
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {bestseller.benefits?.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-dark font-sans font-medium">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={2.5} />
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </motion.ul>

            {/* Active Ingredients Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="space-y-2.5 pt-4 border-t border-border-gray/60"
            >
              <h4 className="text-xs font-semibold uppercase tracking-wider text-dark/80 font-display">
                Key Actives:
              </h4>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-purple-700 bg-purple-100/40 backdrop-blur-md border border-purple-200/50 px-3 py-1.5 rounded-full font-sans font-bold shadow-3xs select-none">
                  ✨ Bio-Active Botanical Infusion
                </span>
                <span className="text-xs text-emerald-700 bg-emerald-100/40 backdrop-blur-md border border-emerald-200/50 px-3 py-1.5 rounded-full font-sans font-bold shadow-3xs select-none">
                  🌿 100% Natural Adaptogens
                </span>
                {bestseller.ingredients?.map((ing) => (
                  <span
                    key={ing}
                    className="text-xs text-primary bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-full font-sans font-medium"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Buy Action */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-5 pt-4"
            >
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block font-display">
                  Special Offer Price
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-bold text-dark">
                    ₹{bestseller.price.toFixed(2)}
                  </span>
                  {bestseller.oldPrice && (
                    <span className="text-sm font-medium text-rose-600 line-through">
                      ₹{bestseller.oldPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              
              {bestseller.stock !== undefined && bestseller.stock <= 0 ? (
                <button
                  type="button"
                  disabled
                  className="bg-slate-200 text-slate-500 border border-slate-300 py-3.5 px-6 rounded-full text-xs font-bold uppercase tracking-wider cursor-not-allowed select-none shadow-sm flex items-center gap-2"
                >
                  <ShoppingBag size={16} className="opacity-50" />
                  <span>Out of Stock</span>
                </button>
              ) : (
                <Button
                  onClick={handleAddToCart}
                  variant="primary"
                  size="md"
                  leftIcon={<ShoppingBag size={16} />}
                >
                  Add to Bag
                </Button>
              )}
            </motion.div>

          </div>

        </div>
      </Container>

      {/* Tilted Infinite Moving Company Marquee Strip */}
      <div className="w-full overflow-hidden bg-primary py-4.5 mt-16 mb-6 rotate-[1.5deg] scale-[1.05] border-y border-secondary/35 shadow-xl select-none relative z-10">
        <div className="flex whitespace-nowrap overflow-hidden">
          <div className="animate-marquee flex gap-16 text-white font-display font-medium text-xs sm:text-sm tracking-widest uppercase items-center">
            <span className="font-bold text-accent-sage">CosmeGlow</span>
            <span>•</span>
            <span>Biological Cellular Restoration</span>
            <span>•</span>
            <span className="font-bold text-accent-sage">CosmeGlow</span>
            <span>•</span>
            <span>100% Organic Active Botanicals</span>
            <span>•</span>
            <span className="font-bold text-accent-sage">CosmeGlow</span>
            <span>•</span>
            <span>Cruelty-Free & Dermatologist Approved</span>
            <span>•</span>
            <span className="font-bold text-accent-sage">CosmeGlow</span>
            <span>•</span>
            <span>Handcrafted Luxury Apothecary</span>
            <span>•</span>
          </div>
          {/* Duplicate for infinite loop alignment */}
          <div className="animate-marquee flex gap-16 text-white font-display font-medium text-xs sm:text-sm tracking-widest uppercase items-center" aria-hidden="true">
            <span className="font-bold text-accent-sage">CosmeGlow</span>
            <span>•</span>
            <span>Biological Cellular Restoration</span>
            <span>•</span>
            <span className="font-bold text-accent-sage">CosmeGlow</span>
            <span>•</span>
            <span>100% Organic Active Botanicals</span>
            <span>•</span>
            <span className="font-bold text-accent-sage">CosmeGlow</span>
            <span>•</span>
            <span>Cruelty-Free & Dermatologist Approved</span>
            <span>•</span>
            <span className="font-bold text-accent-sage">CosmeGlow</span>
            <span>•</span>
            <span>Handcrafted Luxury Apothecary</span>
            <span>•</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BestSeller;
