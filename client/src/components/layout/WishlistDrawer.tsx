import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { toast } from 'sonner';

export const WishlistDrawer: React.FC = () => {
  const {
    wishlist,
    isWishlistOpen,
    setIsWishlistOpen,
    toggleWishlist,
    addToCart,
    setIsCartOpen,
  } = useStore();

  const handleMoveToCart = (product: any) => {
    addToCart(product, 1, product.volume || '50ml');
    setIsWishlistOpen(false);
    setIsCartOpen(true);
    toast.success(`${product.name} added to shopping bag!`);
  };

  return (
    <AnimatePresence>
      {isWishlistOpen && (
        <>
          {/* Backdrop Overlay - GPU friendly without heavy backdrop-blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setIsWishlistOpen(false)}
          />

          {/* Sliding Panel with GPU hardware acceleration */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            style={{ willChange: 'transform' }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[86%] max-w-[390px] sm:w-[420px] sm:max-w-none bg-white rounded-l-2xl sm:rounded-l-none shadow-2xl flex flex-col h-full overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border-gray/60">
              <div className="flex items-center gap-2">
                <Heart size={20} className="text-secondary" fill="currentColor" />
                <h2 className="font-display font-semibold text-lg text-dark">
                  Your Wishlist ({wishlist.length})
                </h2>
              </div>
              <button
                onClick={() => setIsWishlistOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-dark transition-colors cursor-pointer focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            {/* Wishlist Items List */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {wishlist.length === 0 ? (
                <div className="h-[60%] flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-light-gray flex items-center justify-center text-gray-400">
                    <Heart size={28} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-dark text-base">Your wishlist is empty</h3>
                    <p className="text-gray-500 text-xs mt-1 font-sans">
                      Start adding items you love to your wishlist.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsWishlistOpen(false)}
                    className="bg-primary text-white hover:bg-primary-light transition-colors text-xs font-semibold px-6 py-2.5 rounded-full tracking-wider uppercase cursor-pointer"
                  >
                    Browse Collection
                  </button>
                </div>
              ) : (
                wishlist.map((product) => (
                  <div
                    key={product.id}
                    className="flex gap-4 border-b border-border-gray/30 pb-5 last:border-none"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-light-gray flex-shrink-0 border border-border-gray/20">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    {/* Meta & Info */}
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                              {product.category}
                            </span>
                            <h4 className="font-display font-semibold text-sm text-dark line-clamp-1 mt-0.5">
                              {product.name}
                            </h4>
                          </div>
                          
                          <button
                            onClick={() => {
                              toggleWishlist(product);
                              toast.info('Removed from wishlist.');
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md transition-colors focus:outline-none cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        <div className="font-display font-bold text-dark text-sm mt-1.5">
                          ₹{product.price.toFixed(2)}
                        </div>
                      </div>

                      {/* Add to Bag Action */}
                      <div className="mt-2.5">
                        {product.stock !== undefined && product.stock <= 0 ? (
                          <button
                            type="button"
                            disabled
                            className="w-full bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed select-none"
                          >
                            <ShoppingBag size={12} className="opacity-40" />
                            <span>Out of Stock</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMoveToCart(product)}
                            className="w-full bg-primary/5 hover:bg-primary hover:text-white text-primary text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer"
                          >
                            <ShoppingBag size={12} />
                            <span>Add to Bag</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WishlistDrawer;
