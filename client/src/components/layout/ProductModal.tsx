import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Heart, ShoppingBag, Plus, Minus, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { toast } from 'sonner';

export const ProductModal: React.FC = () => {
  const {
    activeProduct,
    setActiveProduct,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setIsCartOpen,
  } = useStore();

  const [selectedSize, setSelectedSize] = useState('50ml');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'benefits'>('desc');

  // Reset modal local state when active product changes
  useEffect(() => {
    if (activeProduct) {
      setSelectedSize(activeProduct.volume || '50ml');
      setQuantity(1);
      setActiveTab('desc');
    }
  }, [activeProduct]);

  if (!activeProduct) return null;

  const isWishlisted = isInWishlist(activeProduct.id);

  // Compute price based on size
  const getPrice = () => {
    return activeProduct.price;
  };

  const handleAddToCart = () => {
    const customProduct = { ...activeProduct, price: getPrice() };
    addToCart(customProduct, quantity, selectedSize);
    setActiveProduct(null);
    setIsCartOpen(true);
    toast.success(`${activeProduct.name} (${selectedSize}) added to bag.`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          onClick={() => setActiveProduct(null)}
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col md:flex-row h-auto max-h-[90vh] md:max-h-[640px] z-10"
        >
          {/* Close button */}
          <button
            onClick={() => setActiveProduct(null)}
            className="absolute top-4 right-4 z-25 p-2 rounded-full bg-white/80 md:bg-light-gray/60 hover:bg-gray-100 hover:text-red-500 text-dark transition-colors focus:outline-none cursor-pointer shadow-sm"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          {/* Left Column: Product Image */}
          <div className="w-full md:w-1/2 bg-light-gray relative aspect-square md:aspect-auto flex items-center justify-center overflow-hidden border-r border-border-gray/30">
            <img
              src={activeProduct.image}
              alt={activeProduct.name}
              className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
            />
            {activeProduct.discount && (
              <span className="absolute top-4 left-4 bg-primary text-white text-[10px] font-display font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Save {activeProduct.discount}%
              </span>
            )}
          </div>

          {/* Right Column: Details & Actions */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-5">
              {/* Product Meta */}
              <div>
                <span className="text-[10px] text-secondary font-bold uppercase tracking-widest font-display block mb-1">
                  {activeProduct.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-display font-semibold text-dark tracking-tight leading-snug">
                  {activeProduct.name}
                </h2>
                
                {/* Rating */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={13}
                        fill={i < Math.floor(activeProduct.rating) ? 'currentColor' : 'none'}
                        className="stroke-1.5"
                      />
                    ))}
                  </div>
                  <span className="text-xs font-sans text-gray-500 font-medium">
                    {activeProduct.rating} ({activeProduct.reviewsCount} reviews)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-display font-bold text-dark">
                  ₹{getPrice().toFixed(2)}
                </span>
                {activeProduct.oldPrice && (
                  <span className="text-base text-rose-600 font-medium line-through font-display">
                    ₹{activeProduct.oldPrice.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Specs Tabs */}
              <div className="border-b border-border-gray/50 flex space-x-5 text-xs font-display font-semibold">
                <button
                  onClick={() => setActiveTab('desc')}
                  className={`pb-2 transition-all relative cursor-pointer ${
                    activeTab === 'desc' ? 'text-primary' : 'text-gray-400 hover:text-dark'
                  }`}
                >
                  Description
                  {activeTab === 'desc' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('ingredients')}
                  className={`pb-2 transition-all relative cursor-pointer ${
                    activeTab === 'ingredients' ? 'text-primary' : 'text-gray-400 hover:text-dark'
                  }`}
                >
                  Key Ingredients
                  {activeTab === 'ingredients' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('benefits')}
                  className={`pb-2 transition-all relative cursor-pointer ${
                    activeTab === 'benefits' ? 'text-primary' : 'text-gray-400 hover:text-dark'
                  }`}
                >
                  Benefits
                  {activeTab === 'benefits' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              </div>

              {/* Tab Content Box */}
              <div className="text-xs sm:text-sm text-gray-600 font-sans leading-relaxed min-h-[90px]">
                {activeTab === 'desc' && <p>{activeProduct.description}</p>}
                {activeTab === 'ingredients' && (
                  <ul className="grid grid-cols-2 gap-2">
                    {activeProduct.ingredients?.map((ing) => (
                      <li key={ing} className="flex items-center gap-1.5 font-medium text-dark/95">
                        <Check size={12} className="text-secondary" />
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {activeTab === 'benefits' && (
                  <ul className="space-y-1.5">
                    {activeProduct.benefits?.map((ben) => (
                      <li key={ben} className="flex items-start gap-1.5">
                        <Check size={12} className="text-secondary mt-0.5" />
                        <span>{ben}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Size Selector */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-dark/80 font-display">Volume:</span>
                <div className="flex gap-2.5">
                  <span className="px-4 py-2 border border-primary bg-primary text-white rounded-full text-xs font-medium font-sans tracking-wide">
                    {activeProduct.volume || '50ml'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Form */}
            <div className="flex items-center gap-4 pt-6 border-t border-border-gray/50 mt-6">
              {/* Quantity Counter */}
              <div className="flex items-center border border-border-gray/60 rounded-full bg-light-gray overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={activeProduct.stock !== undefined && activeProduct.stock <= 0}
                  className="p-3 hover:bg-gray-200 text-dark/70 transition-colors focus:outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus size={13} strokeWidth={2.5} />
                </button>
                <span className="px-4 text-sm font-semibold text-dark font-sans">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  disabled={activeProduct.stock !== undefined && activeProduct.stock <= 0}
                  className="p-3 hover:bg-gray-200 text-dark/70 transition-colors focus:outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={13} strokeWidth={2.5} />
                </button>
              </div>

              {/* Add to Cart Button */}
              {activeProduct.stock !== undefined && activeProduct.stock <= 0 ? (
                <button
                  type="button"
                  disabled
                  className="flex-grow bg-slate-200 text-slate-500 border border-slate-300 py-3.5 px-6 rounded-full font-display font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-not-allowed select-none shadow-none"
                >
                  <ShoppingBag size={14} className="opacity-50" />
                  <span>Out of Stock</span>
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="flex-grow bg-primary hover:bg-primary-light active:scale-[0.99] text-white py-3.5 px-6 rounded-full font-display font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all duration-300"
                >
                  <ShoppingBag size={14} />
                  <span>Add to Bag</span>
                </button>
              )}

              {/* Wishlist Button */}
              <button
                onClick={() => {
                  toggleWishlist(activeProduct);
                  toast.success(
                    isWishlisted ? 'Removed from wishlist' : 'Added to wishlist!'
                  );
                }}
                className={`p-3.5 border rounded-full flex items-center justify-center transition-all cursor-pointer focus:outline-none ${
                  isWishlisted
                    ? 'border-red-500 text-red-500 bg-red-50/20'
                    : 'border-border-gray text-dark hover:border-primary hover:text-primary'
                }`}
                aria-label="Toggle Wishlist"
              >
                <Heart size={18} fill={isWishlisted ? '#EF4444' : 'none'} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProductModal;
