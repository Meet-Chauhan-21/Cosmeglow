import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '../layout/Container';
import { SectionTitle } from '../layout/SectionTitle';
import { Button } from '../layout/Button';
import { useStore } from '../../context/StoreContext';
import type { Product } from '../../types';

export const FeaturedProducts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'bestsellers' | 'new'>('all');
  
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    setIsCartOpen,
    products,
  } = useStore();

  const handleToggleWishlist = (product: (typeof products)[number]) => {
    toggleWishlist(product);
    if (isInWishlist(product.id)) {
      toast.info('Removed from your wishlist.');
    } else {
      toast.success('Added to your wishlist!');
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, product.volume || '50ml');
    setIsCartOpen(true);
    toast.success(`${product.name} added to shopping bag.`);
  };

  const filteredProducts = products.filter((product) => {
    if (activeTab === 'bestsellers') return product.isBestSeller;
    if (activeTab === 'new') return product.isNew;
    return true;
  });

  const tabOptions = [
    { id: 'all', label: 'All Products' },
    { id: 'bestsellers', label: 'Bestsellers' },
    { id: 'new', label: 'New Additions' },
  ];

  return (
    <section id="shop" className="py-20 bg-white">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <SectionTitle
            badge="The Collection"
            title="Sartorial Organic Formulations"
            description="Clinically tested botanical formulations customized for skin rejuvenation."
            align="left"
            className="mb-0 md:mb-0"
          />

          {/* Filter Tabs */}
          <div className="flex space-x-2 mt-6 md:mt-0 overflow-x-auto pb-2 scrollbar-none">
            {tabOptions.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 rounded-full text-xs font-display font-medium tracking-wide transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-light-gray text-dark/70 hover:bg-gray-100 hover:text-dark'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <motion.div
          layout
          className="flex flex-wrap justify-center gap-x-6 gap-y-10"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, idx) => {
              const isWishlisted = isInWishlist(product.id);

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                  key={product.id}
                  className="group flex flex-col h-full bg-white relative w-full sm:w-[280px] md:w-[300px] lg:w-[230px] xl:w-[270px] max-w-[320px]"
                >
                  {/* Image Frame */}
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-light-gray mb-4 border border-border-gray/30">
                    
                    {/* Discount/New/Stock Badges */}
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 animate-fade-in-up">
                      {product.stock !== undefined && product.stock <= 0 && (
                        <span className="bg-rose-600 text-white text-[10px] font-display font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                          Out of Stock
                        </span>
                      )}
                      {product.discount && (
                        <span className="bg-primary text-white text-[10px] font-display font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                          -{product.discount}%
                        </span>
                      )}
                      {product.isNew && (
                        <span className="bg-secondary text-white text-[10px] font-display font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                          New
                        </span>
                      )}
                    </div>

                    {/* Wishlist Icon */}
                    <button
                      onClick={() => handleToggleWishlist(product)}
                      className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-dark hover:text-red-500 shadow-md flex items-center justify-center transition-all duration-300 focus:outline-none cursor-pointer"
                      aria-label="Add to Wishlist"
                    >
                      <Heart
                        size={16}
                        className="transition-transform duration-300 active:scale-125"
                        fill={isWishlisted ? '#EF4444' : 'none'}
                        color={isWishlisted ? '#EF4444' : 'currentColor'}
                      />
                    </button>

                    {/* Hover Image Switcher */}
                    <Link
                      to={`/product/${product.id}`}
                      className="block w-full h-full cursor-pointer"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover object-center absolute inset-0 transition-opacity duration-700 group-hover:opacity-0"
                      />
                      <img
                        src={product.hoverImage}
                        alt={`${product.name} alternate view`}
                        className="w-full h-full object-cover object-center absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                      />
                    </Link>

                    {/* Quick Add Overlay */}
                    <div className="absolute inset-x-0 bottom-4 px-4 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                      {product.stock !== undefined && product.stock <= 0 ? (
                        <button
                          type="button"
                          disabled
                          className="w-full bg-slate-200 text-slate-500 border border-slate-300 py-2.5 px-3 rounded-full text-xs font-semibold uppercase tracking-wider cursor-not-allowed select-none shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <ShoppingBag size={14} className="opacity-50" />
                          <span>Out of Stock</span>
                        </button>
                      ) : (
                        <Button
                          onClick={(e) => handleAddToCart(e, product)}
                          variant="primary"
                          size="sm"
                          className="w-full shadow-lg"
                          leftIcon={<ShoppingBag size={14} />}
                        >
                          Add to Bag
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-col flex-grow">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 font-display">
                      {product.category}
                    </span>
                    
                    <h3 className="font-display font-semibold text-sm sm:text-base text-dark hover:text-primary transition-colors mb-1.5">
                      <Link
                        to={`/product/${product.id}`}
                        className="cursor-pointer"
                      >
                        {product.name}
                      </Link>
                    </h3>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'}
                            className="stroke-1.5"
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-sans text-gray-500 font-medium pt-0.5">
                        {product.rating} ({product.reviewsCount})
                      </span>
                    </div>

                    {/* Price Tag */}
                    <div className="flex items-center gap-2 mt-auto">
                      <span className="font-display font-bold text-dark text-sm sm:text-base">
                        ₹{product.price.toFixed(2)}
                      </span>
                      {product.oldPrice && (
                        <span className="font-display font-medium text-rose-600 text-xs sm:text-sm line-through">
                          ₹{product.oldPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* View All CTA */}
        <div className="mt-12 text-center">
          <Button href="#shop" variant="outline" size="md" rightIcon={<ArrowRight size={16} />}>
            View Entire Apothecary
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default FeaturedProducts;
