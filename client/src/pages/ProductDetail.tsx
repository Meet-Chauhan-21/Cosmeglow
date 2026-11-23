import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import SEO, { ensureAbsoluteUrl } from '../components/common/SEO';
import { Star, Heart, ShoppingBag, Plus, Minus, ArrowLeft, Zap } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Button from '../components/layout/Button';
import WhatsAppButton from '../components/layout/WhatsAppButton';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { VideoPlayer } from '../util/video.util';
import { fetchPublicProductById } from '../services/products';
import { trackViewContent } from '../util/metaPixel';
import type { Product } from '../types';

const renderVideoPlayer = (url: string) => {
  if (!url) return null;
  return (
    <VideoPlayer
      url={url}
      className="w-full h-full aspect-video border-0 object-contain"
      autoPlay={true}
      muted={true}
      controls={true}
      title="Product Video"
    />
  );
};

interface Review {
  _id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
}

interface ReviewsData {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingCounts: { 1: number; 2: number; 3: number; 4: number; 5: number };
}

interface DescriptionBannerItemProps {
  url: string;
  alt: string;
}

const DescriptionBannerItem: React.FC<DescriptionBannerItemProps> = ({ url, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // If the image is already cached by browser memory
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [url]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-slate-100 border border-border-gray/30">
      {/* Skeleton placeholder shown while banner is downloading */}
      {!loaded && (
        <div className="w-full aspect-[21/9] sm:aspect-[3/1] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse flex items-center justify-center">
          <div className="w-7 h-7 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      )}
      <img
        ref={imgRef}
        src={url}
        alt={alt}
        className={`w-full h-auto object-cover object-center transition-opacity duration-300 ${
          loaded ? 'opacity-100 block' : 'opacity-0 h-0 overflow-hidden'
        }`}
        loading="eager"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </div>
  );
};

// Remount the page whenever the product id changes so no state (fetched
// product, reviews, selected image/size) from the previous product leaks
// into the first render of the newly selected one.
export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <ProductDetailContent key={id} />;
};

const ProductDetailContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, addToCart, updateCartQuantity, toggleWishlist, isInWishlist, setIsCartOpen, products, productsLoading } = useStore();
  const { accessToken } = useAuth();

  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'direction' | 'ingredients' | 'additional'>('desc');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
  const [productFetchLoading, setProductFetchLoading] = useState(false);

  // Reviews state
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, title: '', content: '' });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const storeProduct = products.find((p) => p.id === id);
  const product = fetchedProduct || storeProduct;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      if (!storeProduct) setProductFetchLoading(true);
      try {
        const latest = await fetchPublicProductById(id);
        if (!cancelled && latest) setFetchedProduct(latest);
      } catch {
        if (!cancelled) setFetchedProduct(null);
      } finally {
        if (!cancelled) setProductFetchLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, storeProduct]);

  // Scroll to top on load or product change
  useEffect(() => {
    window.scrollTo(0, 0);
    if (product) {
      setSelectedSize(product.volume || '50ml');
      setQuantity(1);
      setActiveTab('desc');
      setSelectedImageIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, product?.id]);

  // Meta Pixel: ViewContent once the product details are loaded (once per visit)
  useEffect(() => {
    if (product) trackViewContent(product, location.key);
  }, [product, location.key]);

  // Fetch reviews
  useEffect(() => {
    if (!id) return;
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/products/${id}/reviews`);
        if (!res.ok) throw new Error('Failed to fetch reviews');
        const data = await res.json();
        setReviewsData(data);
      } catch {
        setReviewsData({ reviews: [], averageRating: 0, totalReviews: 0, ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      toast.error('Please log in to submit a review.');
      return;
    }
    if (!newReview.title.trim() || !newReview.content.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/products/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newReview),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to submit review');
      }
      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      setNewReview({ rating: 5, title: '', content: '' });
      // Re-fetch reviews
      const updated = await fetch(`${API_BASE_URL}/products/${id}/reviews`);
      if (updated.ok) setReviewsData(await updated.json());
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if ((productsLoading && !product) || productFetchLoading) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-20 min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Container>
            <h2 className="text-2xl font-display font-semibold text-dark mb-4">Apothecary Formulation Not Found</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              The product you are trying to view does not exist in our botanical collection or has been retired.
            </p>
            <Button onClick={() => navigate('/')} variant="primary">
              Return to Catalog
            </Button>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  const isWishlisted = isInWishlist(product.id);

  // Compute price
  const getPrice = () => {
    return product.price;
  };

  const handleAddToCart = () => {
    const customProduct = { ...product, price: getPrice() };
    addToCart(customProduct, quantity, selectedSize);
    setIsCartOpen(true);
    toast.success(`${product.name} (${selectedSize}) added to bag.`);
  };

  const handleBuyNow = () => {
    if (!product || (product.stock !== undefined && product.stock <= 0)) return;
    const customProduct = { ...product, price: getPrice() };
    addToCart(customProduct, quantity, selectedSize);
    navigate('/checkout');
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    if (isWishlisted) {
      toast.info('Removed from your wishlist.');
    } else {
      toast.success('Added to your wishlist!');
    }
  };

  const galleryImages = [
    product.image,
    product.hoverImage,
    ...(product.images || []),
  ].filter((image, index, list) => Boolean(image) && list.indexOf(image) === index);

  const mediaItems = [
    ...galleryImages.map((url) => ({ type: 'image', url })),
    ...(product.video ? [{ type: 'video', url: product.video }] : []),
  ];

  // Find similar products in the same category, excluding active product
  const similarProducts = products.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  // Fallback: If no similar products in same category, show other bestsellers
  const backupSimilar = products.filter((p) => p.id !== product.id).slice(0, 4);
  const displaySimilar = similarProducts.length > 0 ? similarProducts : backupSimilar;

  const productImageUrl = ensureAbsoluteUrl(product.image);
  const mediaImageUrls = mediaItems.map((item) => ensureAbsoluteUrl(item.url));
  const productImages = mediaImageUrls.length > 0 ? mediaImageUrls : [productImageUrl];

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: productImages,
    description: product.description,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: 'CosmeGlow'
    },
    offers: {
      '@type': 'Offer',
      url: typeof window !== 'undefined' ? window.location.href : `https://www.cosmeglow.com/product/${product.id}`,
      priceCurrency: 'INR',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: (product.stock === undefined || product.stock > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    },
    ...((reviewsData?.totalReviews || product.reviewsCount)
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: reviewsData?.averageRating || product.rating || 0,
            reviewCount: reviewsData?.totalReviews || product.reviewsCount || 0
          }
        }
      : {})
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.cosmeglow.com'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category || 'Skincare',
        item: `https://www.cosmeglow.com/category/${(product.category || 'all').toLowerCase().replace(/\s+/g, '-')}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: typeof window !== 'undefined' ? window.location.href : `https://www.cosmeglow.com/product/${product.id}`
      }
    ]
  };

  // Helper: render star icons
  const renderStars = (rating: number, size = 16) =>
    [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={size}
        fill={i < Math.floor(rating) ? 'currentColor' : i < rating ? 'currentColor' : 'none'}
        className="text-yellow-400 stroke-1.5"
        style={i < Math.floor(rating) ? {} : i < rating ? { opacity: 0.5 } : {}}
      />
    ));

  return (
    <>
      <SEO
        title={`${product.name} — Organic Botanical Skincare`}
        description={product.description ? (product.description.length > 155 ? `${product.description.slice(0, 155)}...` : product.description) : `Buy ${product.name} online at CosmeGlow Skincare.`}
        keywords={`cosmeglow ${product.name}, ${product.category || 'botanical skincare'}, buy ${product.name} online, organic face serum, organic skincare India`}
        ogImage={productImageUrl}
        ogType="product"
        jsonLd={[productSchema, breadcrumbSchema]}
      />

      <Navbar />

      <main className="py-6 sm:py-8 pb-20 bg-white">
        <Container>
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-gray-500 hover:text-primary mb-8 transition-colors uppercase tracking-wider focus:outline-none cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          {/* Product presentation sheet */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16 items-start">
            
            {/* Left Column: Image showcase with secondary angles (proper size) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-[440px] aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-border-gray/30 shadow-xs flex items-center justify-center group">
                {product.discount && (
                  <span className="absolute top-4 left-4 bg-primary text-white text-[10px] font-display font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                    Save {product.discount}%
                  </span>
                )}
                {mediaItems[selectedImageIndex]?.type === 'video' ? (
                  <div className="w-full h-full bg-black flex items-center justify-center relative">
                    {renderVideoPlayer(mediaItems[selectedImageIndex].url)}
                  </div>
                ) : (
                  <img
                    src={mediaItems[selectedImageIndex]?.url || product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                  />
                )}
              </div>
              
              {/* Product close-ups thumbnails */}
              <div className="flex items-center gap-2.5 overflow-x-auto w-full max-w-[440px] mt-3.5 pb-2 no-scrollbar">
                {mediaItems.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-light-gray border shadow-xs cursor-pointer transition-opacity shrink-0 relative ${selectedImageIndex === index ? 'border-primary ring-2 ring-primary/20 opacity-100' : 'border-border-gray/25 opacity-75 hover:opacity-100'}`}
                    aria-label={`View product media ${index + 1}`}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white relative">
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white drop-shadow-xs">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a.75.75 0 01-.014 1.258l-5.587 3.725A.75.75 0 019.5 15.382V7.915a.75.75 0 011.173-.623l5.6 3.724z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-[7px] font-bold uppercase tracking-widest mt-5 text-white/90">Video</span>
                      </div>
                    ) : (
                      <img src={item.url} alt={`${product.name} view ${index + 1}`} className="w-full h-full object-cover object-center" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Spec description and actions sheet */}
            <div className="lg:col-span-7 flex flex-col justify-between py-1">
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <span className="text-xs text-primary font-bold font-display uppercase tracking-widest block mb-1">
                    {product.category}
                  </span>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-dark tracking-tight leading-snug">
                    {product.name}
                  </h1>

                  {/* Rating summary */}
                  <div className="flex items-center gap-2 mt-2.5">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'}
                          className="stroke-1.5"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-sans text-gray-500 font-medium">
                      {product.rating} ({product.reviewsCount} verified reviews)
                    </span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="flex flex-wrap items-baseline gap-2 sm:gap-2.5">
                  <span className="text-2xl sm:text-3xl font-display font-bold text-dark">
                    ₹{getPrice().toFixed(2)}
                  </span>
                  {product.oldPrice && (
                    <span className="text-base sm:text-lg text-red-500 font-medium line-through font-display">
                      ₹{product.oldPrice.toFixed(2)}
                    </span>
                  )}
                  {product.oldPrice && product.discount && (
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 sm:px-2.5 py-0.5 rounded-full whitespace-nowrap">
                      Save ₹{(product.oldPrice - product.price).toFixed(0)} ({product.discount}% OFF)
                    </span>
                  )}
                </div>

                {/* "Why you'll love it?" Box - ONLY SHOWN IF SPECIFIED */}
                {Array.isArray(product.whyLoveIt) && product.whyLoveIt.length > 0 && (
                  <div className="relative mt-6 rounded-2xl border border-primary/30 p-4 sm:p-5 pt-6 bg-primary/[0.02]">
                    <div className="absolute -top-3.5 left-4">
                      <span className="bg-primary text-white text-xs font-bold px-3.5 py-1 rounded-full shadow-xs tracking-wide">
                        Why you’ll love it?
                      </span>
                    </div>

                    <ul className="space-y-2 text-xs sm:text-sm text-dark/85 font-sans">
                      {product.whyLoveIt.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="text-primary font-bold text-sm leading-none mt-0.5">✓</span>
                          <span className="leading-snug">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Select Quantity & Action Buttons */}
                <div className="space-y-3 pt-5 border-t border-border-gray/30">
                  <span className="block text-xs font-bold uppercase tracking-wider text-dark/70 font-sans">
                    Select Quantity
                  </span>

                  {/* Mobile Layout (< sm): Separate rows as requested for mobile */}
                  <div className="space-y-3 sm:hidden">
                    {/* Row 1: Quantity counter + Wishlist */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-border-gray/70 rounded-xl bg-light-gray overflow-hidden">
                        <button
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={!product.stock || product.stock <= 0}
                          className="px-3.5 py-2.5 hover:text-primary hover:bg-primary/10 text-dark/70 transition-colors cursor-pointer disabled:opacity-40 focus:outline-none"
                        >
                          <Minus size={13} strokeWidth={2.5} />
                        </button>
                        <span className="px-3 text-sm font-bold text-dark font-sans">{quantity}</span>
                        <button
                          onClick={() => setQuantity((q) => Math.min(product.stock ?? 99, q + 1))}
                          disabled={!product.stock || product.stock <= 0 || (product.stock !== undefined && quantity >= product.stock)}
                          className="px-3.5 py-2.5 hover:text-primary hover:bg-primary/10 text-dark/70 transition-colors cursor-pointer disabled:opacity-40 focus:outline-none"
                        >
                          <Plus size={13} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Wishlist CTA */}
                      <button
                        onClick={handleToggleWishlist}
                        className={`p-3 border rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isWishlisted
                            ? 'border-red-500 text-red-500 bg-red-50/20'
                            : 'border-border-gray text-dark hover:border-primary hover:text-primary'
                        }`}
                        aria-label="Wishlist toggle"
                      >
                        <Heart size={18} fill={isWishlisted ? '#EF4444' : 'none'} />
                      </button>
                    </div>

                    {/* Row 2: Buy Now button (full width) */}
                    <button
                      onClick={handleBuyNow}
                      disabled={!product.stock || product.stock <= 0}
                      className={`w-full py-3 px-4 rounded-xl font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all ${
                        !product.stock || product.stock <= 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white cursor-pointer shadow-sm'
                      }`}
                    >
                      <Zap size={14} fill="currentColor" />
                      <span>BUY NOW</span>
                    </button>

                    {/* Row 3: Add to Bag button (full width) */}
                    <button
                      onClick={handleAddToCart}
                      disabled={!product.stock || product.stock <= 0}
                      className={`w-full py-3 px-4 rounded-xl font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all ${
                        !product.stock || product.stock <= 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-black hover:bg-neutral-800 active:scale-98 text-white cursor-pointer shadow-sm'
                      }`}
                    >
                      <ShoppingBag size={14} />
                      <span>{!product.stock || product.stock <= 0 ? 'Out of Stock' : 'Add to Bag'}</span>
                    </button>
                  </div>

                  {/* Desktop Layout (sm and up): Restored to original single row */}
                  <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-wrap">
                    {/* Quantity counter pill */}
                    <div className="flex items-center border border-border-gray/70 rounded-xl bg-light-gray overflow-hidden">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={!product.stock || product.stock <= 0}
                        className="px-3.5 py-2.5 hover:text-primary hover:bg-primary/10 text-dark/70 transition-colors cursor-pointer disabled:opacity-40 focus:outline-none"
                      >
                        <Minus size={13} strokeWidth={2.5} />
                      </button>
                      <span className="px-3 text-sm font-bold text-dark font-sans">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(product.stock ?? 99, q + 1))}
                        disabled={!product.stock || product.stock <= 0 || (product.stock !== undefined && quantity >= product.stock)}
                        className="px-3.5 py-2.5 hover:text-primary hover:bg-primary/10 text-dark/70 transition-colors cursor-pointer disabled:opacity-40 focus:outline-none"
                      >
                        <Plus size={13} strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Buy Now CTA */}
                    <button
                      onClick={handleBuyNow}
                      disabled={!product.stock || product.stock <= 0}
                      className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all ${
                        !product.stock || product.stock <= 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white cursor-pointer shadow-sm'
                      }`}
                    >
                      <Zap size={14} fill="currentColor" />
                      <span>BUY NOW</span>
                    </button>

                    {/* Add to Bag CTA */}
                    <button
                      onClick={handleAddToCart}
                      disabled={!product.stock || product.stock <= 0}
                      className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all ${
                        !product.stock || product.stock <= 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-black hover:bg-neutral-800 active:scale-98 text-white cursor-pointer shadow-sm'
                      }`}
                    >
                      <ShoppingBag size={14} />
                      <span>{!product.stock || product.stock <= 0 ? 'Out of Stock' : 'Add to Bag'}</span>
                    </button>

                    {/* Wishlist CTA */}
                    <button
                      onClick={handleToggleWishlist}
                      className={`p-3 border rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        isWishlisted
                          ? 'border-red-500 text-red-500 bg-red-50/20'
                          : 'border-border-gray text-dark hover:border-primary hover:text-primary'
                      }`}
                      aria-label="Wishlist toggle"
                    >
                      <Heart size={18} fill={isWishlisted ? '#EF4444' : 'none'} />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Specification Tabs Section — Direct on page full width */}
          <div className="mt-12 w-full space-y-6">
            <div className="border-b border-border-gray/50 flex space-x-6 sm:space-x-8 text-sm sm:text-base font-display font-semibold overflow-x-auto pb-px no-scrollbar">
              <button
                onClick={() => setActiveTab('desc')}
                className={`pb-3 transition-all relative cursor-pointer whitespace-nowrap ${
                  activeTab === 'desc' ? 'text-primary' : 'text-gray-400 hover:text-dark'
                }`}
              >
                Description
                {activeTab === 'desc' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
              {Boolean(product.directionOfUse && product.directionOfUse.trim()) && (
                <button
                  onClick={() => setActiveTab('direction')}
                  className={`pb-3 transition-all relative cursor-pointer whitespace-nowrap ${
                    activeTab === 'direction' ? 'text-primary' : 'text-gray-400 hover:text-dark'
                  }`}
                >
                  Direction of Use
                  {activeTab === 'direction' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              )}
              {Boolean(Array.isArray(product.ingredients) && product.ingredients.length > 0) && (
                <button
                  onClick={() => setActiveTab('ingredients')}
                  className={`pb-3 transition-all relative cursor-pointer whitespace-nowrap ${
                    activeTab === 'ingredients' ? 'text-primary' : 'text-gray-400 hover:text-dark'
                  }`}
                >
                  Ingredients
                  {activeTab === 'ingredients' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              )}
              {Boolean(product.additionalInfo && product.additionalInfo.trim()) && (
                <button
                  onClick={() => setActiveTab('additional')}
                  className={`pb-3 transition-all relative cursor-pointer whitespace-nowrap ${
                    activeTab === 'additional' ? 'text-primary' : 'text-gray-400 hover:text-dark'
                  }`}
                >
                  Additional Information
                  {activeTab === 'additional' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              )}
            </div>

            <div className="pt-2 text-sm sm:text-base text-gray-700 font-sans leading-relaxed">
              {activeTab === 'desc' && (
                <div className="space-y-6">
                  {/* Multi-banner promo images for product description from admin side with skeleton loader */}
                  {product.descriptionBanners && product.descriptionBanners.length > 0 && (
                    <div className="space-y-4">
                      {product.descriptionBanners.map((bannerUrl, bIdx) => (
                        <DescriptionBannerItem
                          key={`${bannerUrl}-${bIdx}`}
                          url={bannerUrl}
                          alt={`${product.name} Banner ${bIdx + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Text description after banner images */}
                  <div className="prose max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                    {product.description}
                  </div>
                </div>
              )}

              {activeTab === 'direction' && product.directionOfUse && (
                <div className="prose max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                  {product.directionOfUse}
                </div>
              )}

              {activeTab === 'ingredients' && Array.isArray(product.ingredients) && product.ingredients.length > 0 && (
                <div className="prose max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                  {product.ingredients.join(', ')}
                </div>
              )}

              {activeTab === 'additional' && product.additionalInfo && (
                <div className="prose max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                  {product.additionalInfo}
                </div>
              )}
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="mt-16 border-t border-border-gray/60 pt-12">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-dark text-center mb-8">Customer Reviews</h2>

            {reviewsLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Summary Row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 max-w-4xl mx-auto mb-10 p-6 bg-light-gray/50 rounded-2xl border border-border-gray/30">
                  {/* Left: Overall rating */}
                  <div className="flex flex-col items-center text-center min-w-[120px]">
                    <span className="text-5xl font-display font-bold text-dark">
                      {reviewsData?.averageRating ? reviewsData.averageRating.toFixed(1) : '0.0'}
                    </span>
                    <div className="flex gap-0.5 mt-2">
                      {renderStars(reviewsData?.averageRating || 0, 20)}
                    </div>
                    <span className="text-xs text-gray-500 font-sans mt-1.5">
                      out of 5
                    </span>
                    <span className="text-xs text-gray-400 font-sans mt-0.5">
                      Based on {reviewsData?.totalReviews || 0} review{reviewsData?.totalReviews !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Center: Rating bars */}
                  <div className="flex-1 w-full space-y-2 max-w-xs md:max-w-sm mx-auto">
                    {([5, 4, 3, 2, 1] as const).map((star) => {
                      const count = reviewsData?.ratingCounts?.[star] || 0;
                      const total = reviewsData?.totalReviews || 0;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs font-sans">
                          <span className="w-4 text-right text-gray-600 font-semibold">{star}</span>
                          <Star size={11} fill="currentColor" className="text-yellow-400 flex-shrink-0" />
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-gray-400 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right: Write a review button */}
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => {
                        if (!accessToken) {
                          toast.error('Please log in to write a review.');
                          return;
                        }
                        setShowReviewForm((v) => !v);
                      }}
                      className="px-6 py-3 bg-primary hover:bg-primary-light text-white font-display font-semibold text-sm rounded-full transition-all shadow-md hover:shadow-lg cursor-pointer whitespace-nowrap"
                    >
                      {showReviewForm ? 'Cancel' : 'Write a Review'}
                    </button>
                    {!accessToken && (
                      <span className="text-xs text-gray-400 font-sans">Login required</span>
                    )}
                  </div>
                </div>

                {/* Inline Review Form */}
                {showReviewForm && (
                  <form
                    onSubmit={handleSubmitReview}
                    className="max-w-2xl mx-auto mb-10 bg-white border border-border-gray/40 rounded-2xl p-6 sm:p-8 space-y-5 shadow-sm"
                  >
                    <h3 className="font-display font-semibold text-lg text-dark">Share Your Experience</h3>

                    {/* Star rating input */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 font-display">
                        Your Rating
                      </label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReview((r) => ({ ...r, rating: star }))}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="focus:outline-none cursor-pointer transition-transform hover:scale-110"
                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          >
                            <Star
                              size={28}
                              fill={(hoverRating || newReview.rating) >= star ? 'currentColor' : 'none'}
                              className="text-yellow-400 stroke-1.5"
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title input */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-display">
                        Review Title
                      </label>
                      <input
                        type="text"
                        value={newReview.title}
                        onChange={(e) => setNewReview((r) => ({ ...r, title: e.target.value }))}
                        placeholder="Summarize your experience..."
                        maxLength={100}
                        className="w-full border border-border-gray/60 rounded-xl px-4 py-2.5 text-sm font-sans text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                      />
                    </div>

                    {/* Content textarea */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 font-display">
                        Your Review
                      </label>
                      <textarea
                        value={newReview.content}
                        onChange={(e) => setNewReview((r) => ({ ...r, content: e.target.value }))}
                        placeholder="Tell others what you think about this product..."
                        rows={4}
                        maxLength={1000}
                        className="w-full border border-border-gray/60 rounded-xl px-4 py-2.5 text-sm font-sans text-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="px-8 py-3 bg-primary hover:bg-primary-light text-white font-display font-semibold text-sm rounded-full transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                )}

                {/* Reviews list */}
                {!reviewsData || reviewsData.reviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 font-sans">
                    <Star size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No reviews yet. Be the first to review this product!</p>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-6">
                    {reviewsData.reviews.map((review) => (
                      <div key={review._id} className="border border-slate-200/90 rounded-2xl p-5 sm:p-6 bg-white shadow-2xs hover:shadow-xs transition-shadow">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex gap-0.5 mb-1">
                              {renderStars(review.rating, 14)}
                            </div>
                            <p className="font-display font-semibold text-dark text-sm">{review.title}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-semibold text-dark/80 font-sans">{review.userName}</p>
                            <p className="text-xs text-gray-400 font-sans mt-0.5">
                              {new Date(review.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 font-sans leading-relaxed">{review.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Similar Products Recommendation row — hidden when there is no other product */}
          {displaySimilar.length > 0 && (
          <div className="border-t border-border-gray/60 pt-16 mt-16">
            <div className="mb-8">
              <h3 className="font-display font-semibold text-2xl text-dark tracking-tight">
                Recommended For You
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm font-sans mt-1">
                Formulations that complement your active skincare regimen.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {displaySimilar.map((item) => {
                const itemWishlisted = isInWishlist(item.id);
                const cartItem = cart.find((c) => c.product.id === item.id);
                const currentQty = cartItem ? cartItem.quantity : 0;

                return (
                  <div
                    key={item.id}
                    className="group flex flex-col h-full bg-white relative w-full max-w-[280px] rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
                  >
                    {/* Image Frame */}
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-50">
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                        {item.stock !== undefined && item.stock <= 0 ? (
                          <span className="bg-rose-600 text-white text-[9px] font-display font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            Out of Stock
                          </span>
                        ) : null}
                        {item.isBestSeller ? (
                          <span className="bg-black text-white text-[9px] font-display font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            Bestseller
                          </span>
                        ) : null}
                        {item.discount && item.discount > 0 ? (
                          <span className="bg-primary text-white text-[9px] font-display font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            -{item.discount}%
                          </span>
                        ) : null}
                        {item.isNew || item.isNewArrival ? (
                          <span className="bg-primary-light text-white text-[9px] font-display font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            New
                          </span>
                        ) : null}
                      </div>

                      {/* Wishlist Toggle Button */}
                      <button
                        onClick={() => {
                          toggleWishlist(item);
                          toast.success(
                            itemWishlisted ? 'Removed from wishlist' : 'Added to wishlist!'
                          );
                        }}
                        className="absolute top-3 right-3 z-10 w-8.5 h-8.5 rounded-full bg-white/85 hover:bg-white text-dark hover:text-red-500 shadow-sm flex items-center justify-center transition-colors focus:outline-none cursor-pointer"
                        aria-label="Add to Wishlist"
                      >
                        <Heart
                          size={14}
                          fill={itemWishlisted ? '#EF4444' : 'none'}
                          color={itemWishlisted ? '#EF4444' : 'currentColor'}
                        />
                      </button>

                      {/* Product Image */}
                      <Link
                        to={`/product/${item.id}`}
                        className="block w-full h-full cursor-pointer overflow-hidden"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover object-center absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105"
                          loading="lazy"
                        />
                      </Link>
                    </div>

                    {/* Card Details */}
                    <div className="flex flex-col flex-grow p-2.5 sm:p-4">
                      <h3 className="font-display font-bold text-xs sm:text-sm text-dark hover:text-primary transition-colors mb-0.5 sm:mb-1">
                        <Link
                          to={`/product/${item.id}`}
                          className="cursor-pointer line-clamp-1"
                        >
                          {item.name}
                        </Link>
                      </h3>

                      <p className="text-[10px] sm:text-[11px] text-gray-500 line-clamp-1 mb-1.5 sm:mb-2 font-sans">
                        {item.description}
                      </p>

                      {/* Star Rating */}
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                        <div className="flex text-yellow-400">
                          <Star size={11} fill="currentColor" className="stroke-1" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-sans text-dark font-bold">
                          {item.rating > 0 ? item.rating.toFixed(1) : '5.0'}
                        </span>
                        <span className="text-[10px] sm:text-xs font-sans text-gray-400 font-medium">
                          ({item.reviewsCount || 0} reviews)
                        </span>
                      </div>

                      {/* Price & ADD Button */}
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 gap-1">
                        <div className="flex flex-col min-w-0">
                          <span className="font-display font-bold text-dark text-xs sm:text-base leading-tight">
                            ₹{Math.round(item.price)}
                          </span>
                          {item.oldPrice && item.oldPrice > item.price ? (
                            <span className="font-display font-medium text-red-500 text-[9px] sm:text-xs line-through leading-tight">
                              ₹{Math.round(item.oldPrice)}
                            </span>
                          ) : null}
                        </div>

                        {currentQty === 0 ? (
                          <button
                            type="button"
                            disabled={item.stock !== undefined && item.stock <= 0}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addToCart(item, 1, item.volume || '50ml');
                              setIsCartOpen(true);
                              toast.success(`${item.name} added to cart!`);
                            }}
                            className="bg-black hover:bg-neutral-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-[10px] sm:text-xs uppercase px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 flex items-center justify-center select-none shrink-0"
                          >
                            + ADD
                          </button>
                        ) : (
                          <div
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="bg-black text-white font-bold text-[11px] sm:text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 sm:gap-2.5 select-none shrink-0"
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                updateCartQuantity(item.id, cartItem?.selectedSize || item.volume || '50ml', currentQty - 1);
                              }}
                              className="hover:text-primary-light hover:bg-white/10 rounded font-bold px-1 sm:px-1.5 py-0.5 text-xs sm:text-sm leading-none transition-colors cursor-pointer focus:outline-none focus:ring-0 active:scale-95"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="font-sans font-bold text-[11px] sm:text-xs min-w-[12px] sm:min-w-[14px] text-center">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                updateCartQuantity(item.id, cartItem?.selectedSize || item.volume || '50ml', currentQty + 1);
                              }}
                              className="hover:text-primary-light hover:bg-white/10 rounded font-bold px-1 sm:px-1.5 py-0.5 text-xs sm:text-sm leading-none transition-colors cursor-pointer focus:outline-none focus:ring-0 active:scale-95"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}

        </Container>
      </main>

      <WhatsAppButton />
      <Footer />
    </>
  );
};

export default ProductDetail;
