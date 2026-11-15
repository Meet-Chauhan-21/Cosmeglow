import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ShoppingBag, Zap, ShieldCheck, Truck, Plus, Minus, Banknote } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../context/StoreContext';
import { fallbackProducts } from '../../services/products';
import { ProductBlockSkeleton } from '../common/Skeletons';

export const ProductBlock: React.FC = () => {
  const navigate = useNavigate();
  const { products, productsLoading, settings, addToCart, setIsCartOpen } = useStore();

  const catalog = products.length > 0 ? products : fallbackProducts;

  // Prioritize explicitly selected product from admin settings, or active bestseller
  const selectedProductId = settings.homepageImages?.spotlightProductId;
  const featuredProduct = 
    (selectedProductId ? catalog.find((p) => String(p.id) === String(selectedProductId) || String(p._id) === String(selectedProductId)) : null) ||
    catalog.find((p) => p.isBestSeller) || 
    catalog[0] || 
    fallbackProducts[0];

  const productName = featuredProduct?.name || settings.homepageImages?.spotlightName || 'Restorative Peptide Serum';
  const productDesc = featuredProduct?.description || settings.homepageImages?.spotlightDescription || 'A concentrated botanical peptide complex engineered to target visible fine lines and deeply hydrate the skin.';
  const productPrice = featuredProduct?.price !== undefined ? featuredProduct.price : (settings.homepageImages?.spotlightPrice !== undefined ? settings.homepageImages.spotlightPrice : 85.00);
  const productOldPrice = featuredProduct?.oldPrice !== undefined ? featuredProduct.oldPrice : settings.homepageImages?.spotlightOldPrice;

  // Real product gallery images strictly belonging to featuredProduct (No logo mixing)
  const rawGallery = featuredProduct
    ? [
        featuredProduct.image,
        ...(featuredProduct.images || []),
        featuredProduct.hoverImage
      ].filter(Boolean) as string[]
    : [
        settings.homepageImages?.spotlight
      ].filter(Boolean) as string[];

  const productGallery = Array.from(new Set(rawGallery));

  const initialImage = productGallery[0] || featuredProduct?.image || settings.homepageImages?.spotlight || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop';
  const [activeImage, setActiveImage] = useState<string>(initialImage);
  const productVolume = featuredProduct?.volume || 'Standard';
  const [quantity, setQuantity] = useState<number>(1);

  // Sync image if featured product updates
  React.useEffect(() => {
    if (initialImage) setActiveImage(initialImage);
  }, [featuredProduct?.id, initialImage]);

  // Render skeleton after all hooks have been invoked
  if (productsLoading && products.length === 0) {
    return <ProductBlockSkeleton />;
  }

  const discountPercent = productOldPrice && productOldPrice > productPrice
    ? Math.round(((productOldPrice - productPrice) / productOldPrice) * 100)
    : 20;

  const handleAddToCart = () => {
    addToCart(featuredProduct, quantity, productVolume);
    setIsCartOpen(true);
    toast.success(`${productName} added to your shopping bag.`);
  };

  const handleBuyNow = () => {
    addToCart(featuredProduct, quantity, productVolume);
    navigate('/checkout');
  };

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-white border-b border-border-gray/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Minimal 2-Column Layout (No heavy outer rectangular card box) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* Left Column: Product Photo & Thumbnails */}
          <div className="md:col-span-6 flex flex-col items-center">
            <div className="relative w-full max-w-[440px] aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-border-gray/50 shadow-xs flex items-center justify-center group">
              {/* Product Badges */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                <span className="bg-primary text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs">
                  ★ Best Seller
                </span>
                {discountPercent > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] sm:text-xs font-bold uppercase px-2.5 py-1 rounded-full shadow-xs">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Main Product Image */}
              <img
                src={activeImage}
                alt={productName}
                className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                loading="eager"
              />
            </div>

            {/* Gallery Thumbnails (Shows all images, no 4-image cutoff) */}
            {productGallery.length > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3 max-w-[440px]">
                {productGallery.map((imgUrl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activeImage === imgUrl ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-border-gray/60 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Clean, Minimal Details (No clutter/excess text) */}
          <div className="md:col-span-6 space-y-4 text-left">
            
            {/* Category */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary font-display block">
                {featuredProduct?.category || 'Facial Serums & Elixirs'}
              </span>
            </div>

            {/* Rating & Reviews on new line */}
            <div className="flex items-center gap-1.5 text-xs text-amber-500">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    fill={i < Math.round(featuredProduct?.rating || 4.9) ? 'currentColor' : 'none'}
                    className={i < Math.round(featuredProduct?.rating || 4.9) ? 'text-amber-400' : 'text-gray-300'}
                  />
                ))}
              </div>
              <span className="font-bold text-dark font-display">{featuredProduct?.rating || 4.9}</span>
              <span className="text-gray-400 font-sans">({featuredProduct?.reviewsCount || 148} reviews)</span>
            </div>

            {/* Product Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-dark tracking-tight leading-tight">
              {productName}
            </h2>

            {/* Price Block */}
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 pt-0.5">
              <span className="text-3xl sm:text-4xl font-display font-bold text-dark">
                ₹{productPrice.toFixed(2)}
              </span>
              {productOldPrice && productOldPrice > productPrice && (
                <span className="text-base sm:text-xl text-red-500 line-through font-display font-medium">
                  ₹{productOldPrice.toFixed(2)}
                </span>
              )}
              {discountPercent > 0 && productOldPrice && productOldPrice > productPrice && (
                <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 sm:px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  Save ₹{(productOldPrice - productPrice).toFixed(0)} ({discountPercent}% OFF)
                </span>
              )}
            </div>

            {/* Crisp 1-Line Description */}
            <p className="text-xs sm:text-sm text-gray-600 font-sans leading-relaxed line-clamp-2">
              {productDesc}
            </p>

            {/* Net Quantity (from admin) & Quantity Selectors */}
            <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6">
              {/* Product Net Quantity / Volume configured from Admin */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-gray-500 font-display uppercase tracking-wider block">
                  Net Quantity / Volume
                </span>
                <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-bold font-display select-none">
                  <span>{productVolume}</span>
                </div>
              </div>

              {/* Quantity Counter */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-gray-500 font-display uppercase tracking-wider block">
                  Quantity
                </span>
                <div className="inline-flex items-center border border-border-gray/80 bg-white rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-2.5 py-1.5 text-gray-600 hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold font-display text-dark min-w-[28px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-2.5 py-1.5 text-gray-600 hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons: BUY NOW (prominent emerald) + ADD TO BAG */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              {/* Buy Now Button (Instant checkout) */}
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white py-3.5 px-6 rounded-full font-display font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
              >
                <Zap size={15} fill="currentColor" />
                <span>BUY NOW</span>
              </button>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full sm:flex-1 bg-dark hover:bg-black active:scale-[0.99] text-white py-3.5 px-6 rounded-full font-display font-bold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
              >
                <ShoppingBag size={15} />
                <span>ADD TO BAG</span>
              </button>
            </div>

            {/* Trust Line */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] font-sans">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Truck size={14} className="text-primary" />
                Free Express Delivery
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Banknote size={14} className="text-primary" />
                Cash on Delivery
              </span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <ShieldCheck size={14} className="text-primary" />
                100% Authentic
              </span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default ProductBlock;
