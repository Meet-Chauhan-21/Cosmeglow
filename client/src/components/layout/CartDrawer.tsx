import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateCartQuantity,
    removeFromCart,
    settings,
  } = useStore();

  // Prevent background scrolling on mobile when cart drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const isShippingEnabled = settings.enableDeliveryCharge;
  const isFreeShippingEnabled = settings.enableFreeDeliveryThreshold;
  const freeShippingThreshold = settings.freeDeliveryThreshold || 0;
  
  const showFreeShippingProgress = isShippingEnabled && isFreeShippingEnabled && freeShippingThreshold > 0;
  const progressToFreeShipping = showFreeShippingProgress ? Math.min((subtotal / freeShippingThreshold) * 100, 100) : 0;
  const remainingForFreeShipping = showFreeShippingProgress ? (freeShippingThreshold - subtotal) : 0;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop Overlay - GPU friendly without heavy backdrop-blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setIsCartOpen(false)}
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
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border-gray/60 bg-white">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-primary" />
                <h2 className="font-display font-semibold text-base sm:text-lg text-dark">
                  Shopping Bag ({itemsCount})
                </h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-dark transition-colors cursor-pointer focus:outline-none active:scale-95"
                aria-label="Close Cart"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-grow overflow-y-auto p-5 sm:p-6 space-y-6 overscroll-contain">
              
              {/* Free Shipping Indicator */}
              {itemsCount > 0 && showFreeShippingProgress && (
                <div className="bg-accent-sage/65 border border-accent-sage-dark/30 rounded-xl p-4 space-y-2">
                  <div className="text-xs text-primary font-sans font-semibold">
                    {subtotal >= freeShippingThreshold ? (
                      <span>🎉 Congratulations! You qualify for FREE shipping.</span>
                    ) : (
                      <span>
                        Add{' '}
                        <strong className="font-display font-bold">
                          ₹{remainingForFreeShipping.toFixed(2)}
                        </strong>{' '}
                        more to qualify for FREE Shipping!
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-white/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${progressToFreeShipping}%` }}
                    />
                  </div>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="h-[60%] flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-light-gray flex items-center justify-center text-gray-400">
                    <ShoppingBag size={28} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-dark text-base">Your bag is empty</h3>
                    <p className="text-gray-500 text-xs mt-1 font-sans">
                      Start browsing our skincare collections to add products.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="bg-primary text-white hover:bg-primary-light transition-colors text-xs font-semibold px-6 py-2.5 rounded-full tracking-wider uppercase cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}`}
                    className="flex gap-4 border-b border-border-gray/30 pb-5 last:border-none"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-light-gray flex-shrink-0 border border-border-gray/20">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        loading="eager"
                        decoding="async"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    {/* Meta & Info */}
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="font-display font-semibold text-sm text-dark line-clamp-1">
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md transition-colors focus:outline-none cursor-pointer"
                            aria-label="Remove item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">
                          Size: {item.selectedSize}
                        </span>
                      </div>

                      {/* Quantity & Price */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-border-gray/60 rounded-lg overflow-hidden bg-light-gray">
                          <button
                            onClick={() =>
                              updateCartQuantity(item.product.id, item.selectedSize, item.quantity - 1)
                            }
                            className="p-1.5 hover:bg-gray-200 text-dark/70 transition-colors focus:outline-none cursor-pointer active:scale-90"
                          >
                            <Minus size={11} strokeWidth={2.5} />
                          </button>
                          <span className="px-2.5 text-xs font-semibold text-dark font-sans">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(item.product.id, item.selectedSize, item.quantity + 1)
                            }
                            className="p-1.5 hover:bg-gray-200 text-dark/70 transition-colors focus:outline-none cursor-pointer active:scale-90"
                          >
                            <Plus size={11} strokeWidth={2.5} />
                          </button>
                        </div>
                        
                        <span className="font-display font-bold text-dark text-sm">
                          ₹{(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary / Actions */}
            {cart.length > 0 && (
              <div className="border-t border-border-gray/60 p-5 sm:p-6 bg-light-gray/40 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500 font-sans">
                    <span>Shipping</span>
                    <span>{subtotal >= freeShippingThreshold ? 'FREE' : 'Calculated next'}</span>
                  </div>
                  <div className="flex justify-between text-base font-display font-bold text-dark">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-primary hover:bg-primary-light active:scale-[0.99] text-white py-3.5 rounded-full font-display font-semibold text-sm tracking-wider uppercase shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                >
                  <span>Proceed to Checkout</span>
                </button>
              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;

