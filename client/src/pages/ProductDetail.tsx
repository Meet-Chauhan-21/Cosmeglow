import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SEO, { ensureAbsoluteUrl } from '../components/common/SEO';
import { Star, Heart, ShoppingBag, Plus, Minus, Check, ArrowLeft, ShieldCheck, Sparkles, Truck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Button from '../components/layout/Button';
import WhatsAppButton from '../components/layout/WhatsAppButton';
import { useStore } from '../context/StoreContext';
const renderVideoPlayer = (url: string) => {
  if (!url) return null;

  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return (
      <iframe
        className="w-full h-full aspect-video border-0"
        src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&rel=0`}
        title="Product Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    return (
      <iframe
        className="w-full h-full aspect-video border-0"
        src={`https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1`}
        title="Product Video"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video
      src={url}
      className="w-full h-full object-contain"
      controls
      autoPlay
      muted
      playsInline
      preload="metadata"
    />
  );
};

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist, setIsCartOpen, products, productsLoading } = useStore();

  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'ingredients' | 'benefits' | 'shipping'>('desc');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Find the product
  const product = products.find((p) => p.id === id);

  // Scroll to top on load or product change
  useEffect(() => {
    window.scrollTo(0, 0);
    if (product) {
      setSelectedSize(product.volume || '50ml');
      setQuantity(1);
      setActiveTab('desc');
      setSelectedImageIndex(0);
    }
  }, [id, product]);

  if (productsLoading) {
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
      name: 'TREEBORN'
    },
    offers: {
      '@type': 'Offer',
      url: typeof window !== 'undefined' ? window.location.href : `https://www.treeborn.shop/product/${product.id}`,
      priceCurrency: 'INR',
      price: product.price,
      itemCondition: 'https://schema.org/NewCondition',
      availability: (product.stock === undefined || product.stock > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    },
    ...(product.rating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewsCount || 12
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
        item: 'https://www.treeborn.shop'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.category || 'Skincare',
        item: `https://www.treeborn.shop/category/${(product.category || 'all').toLowerCase().replace(/\s+/g, '-')}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: typeof window !== 'undefined' ? window.location.href : `https://www.treeborn.shop/product/${product.id}`
      }
    ]
  };

  return (
    <>
      <SEO
        title={`${product.name} — Organic Botanical Skincare`}
        description={product.description ? (product.description.length > 155 ? `${product.description.slice(0, 155)}...` : product.description) : `Buy ${product.name} online at TREEBORN Skincare.`}
        keywords={`treeborn ${product.name}, ${product.category || 'botanical skincare'}, buy ${product.name} online, organic face serum, organic skincare India`}
        ogImage={productImageUrl}
        ogType="product"
        jsonLd={[productSchema, breadcrumbSchema]}
      />

      <Navbar />

      <main className="pt-28 pb-20 bg-white">
        <Container>
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-display font-semibold text-gray-500 hover:text-primary mb-8 transition-colors uppercase tracking-wider focus:outline-none"
          >
            <ArrowLeft size={14} />
            <span>Back to Botanical collection</span>
          </Link>

          {/* Product presentation sheet */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-20">
            
            {/* Left Column: Image showcase with secondary angles */}
            <div className="lg:col-span-6 space-y-4">
              <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-light-gray border border-border-gray/30 shadow-sm relative group">
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
                    className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-1000"
                  />
                )}
              </div>
              
              {/* Product close-ups thumbnails for premium feel */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3.5">
                {mediaItems.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-2xl overflow-hidden bg-light-gray border shadow-xs cursor-pointer transition-opacity relative ${selectedImageIndex === index ? 'border-primary opacity-100' : 'border-border-gray/25 opacity-80 hover:opacity-100'}`}
                    aria-label={`View product media ${index + 1}`}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white relative">
                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white drop-shadow-xs">
                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a.75.75 0 01-.014 1.258l-5.587 3.725A.75.75 0 019.5 15.382V7.915a.75.75 0 011.173-.623l5.6 3.724z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-[8px] font-bold uppercase tracking-widest mt-7 text-white/90">Video</span>
                      </div>
                    ) : (
                      <img src={item.url} alt={`${product.name} view ${index + 1}`} className="w-full h-full object-cover object-center" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Spec description and actions sheet */}
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div className="space-y-6">
                <div>
                  <span className="text-xs text-secondary font-bold font-display uppercase tracking-widest block mb-1.5">
                    {product.category}
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-display font-bold text-dark tracking-tight leading-snug">
                    {product.name}
                  </h1>

                  {/* Rating summary */}
                  <div className="flex items-center gap-2 mt-3">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
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
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-display font-bold text-dark">
                    ₹{getPrice().toFixed(2)}
                  </span>
                  {product.oldPrice && (
                    <span className="text-lg text-rose-600 font-medium line-through font-display">
                      ₹{product.oldPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-sans">
                  {product.description}
                </p>

                {/* Volume & Stock Status Display */}
                <div className="pt-2 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 font-display uppercase tracking-wider">
                      Volume:
                    </span>
                    <span className="px-3.5 py-1 bg-slate-100 border border-slate-200/50 rounded-full text-xs font-semibold text-slate-700 font-sans">
                      {product.volume || '50ml'}
                    </span>
                  </div>

                  {product.stock !== undefined && (
                    <span className={`px-3.5 py-1 rounded-full text-xs font-bold font-sans uppercase tracking-wider border ${
                      product.stock <= 0
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : product.stock <= 10
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {product.stock <= 0
                        ? 'Out of Stock'
                        : product.stock <= 10
                          ? `Only ${product.stock} left in stock`
                          : 'In Stock'}
                    </span>
                  )}
                </div>

                {/* Premium Trust Indicators */}
                <div className="grid grid-cols-3 gap-2.5 pt-4 text-[10px] sm:text-xs text-gray-600 font-sans border-t border-border-gray/40">
                  <div className="flex items-center gap-2 font-medium">
                    <ShieldCheck size={16} className="text-primary flex-shrink-0" />
                    <span>Dermatologist Tested</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles size={16} className="text-primary flex-shrink-0" />
                    <span>100% Bio-Organic</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <Truck size={16} className="text-primary flex-shrink-0" />
                    <span>Climate Neutral Ship</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 sm:gap-4 pt-6 border-t border-border-gray/40">
                  {/* Quantity counters */}
                  <div className="flex items-center border border-border-gray/60 rounded-full bg-light-gray overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={!product.stock || product.stock <= 0}
                      className="p-3.5 hover:bg-gray-200 text-dark/70 transition-colors focus:outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Minus size={13} strokeWidth={2.5} />
                    </button>
                    <span className="px-4 text-sm font-semibold text-dark font-sans">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock ?? 99, q + 1))}
                      disabled={!product.stock || product.stock <= 0 || (product.stock !== undefined && quantity >= product.stock)}
                      className="p-3.5 hover:bg-gray-200 text-dark/70 transition-colors focus:outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Add to Bag CTA */}
                  <button
                    onClick={handleAddToCart}
                    disabled={!product.stock || product.stock <= 0}
                    className={`flex-grow py-4 px-3 sm:px-6 rounded-full font-display font-semibold text-[10px] sm:text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 whitespace-nowrap ${
                      !product.stock || product.stock <= 0
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                        : 'bg-primary hover:bg-primary-light active:scale-[0.99] text-white cursor-pointer shadow-md'
                    }`}
                  >
                    <ShoppingBag size={14} />
                    <span>{!product.stock || product.stock <= 0 ? 'Out of Stock' : 'Add to Bag'}</span>
                  </button>

                  {/* Wishlist CTA */}
                  <button
                    onClick={handleToggleWishlist}
                    className={`p-4 border rounded-full flex items-center justify-center transition-all cursor-pointer focus:outline-none ${
                      isWishlisted
                        ? 'border-red-500 text-red-500 bg-red-50/20'
                        : 'border-border-gray text-dark hover:border-primary hover:text-primary'
                    }`}
                    aria-label="Wishlist toggle"
                  >
                    <Heart size={18} fill={isWishlisted ? '#EF4444' : 'none'} />
                  </button>
                </div>

                {/* Professional Colorful Feature Highlights */}
                <div className="pt-5 pb-5 mt-5 mb-2 border-y border-border-gray/30 space-y-4">
                  <div className="flex items-center gap-4">
                    <CheckCircle2 size={25} className="text-emerald-500 shrink-0 stroke-[2.2]" />
                    <span className="text-sm sm:text-[15px] font-sans text-slate-700 leading-snug">
                      <strong className="font-semibold text-slate-900">Fresh Botanical Formulations</strong> &bull; 100% natural active extracts
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <Sparkles size={25} className="text-amber-500 shrink-0 stroke-[2.2]" />
                    <span className="text-sm sm:text-[15px] font-sans text-slate-700 leading-snug">
                      <strong className="font-semibold text-slate-900">Cruelty-Free &amp; Toxin-Free</strong> &bull; Free from parabens, sulfates &amp; artificial dyes
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <ShieldCheck size={25} className="text-indigo-600 shrink-0 stroke-[2.2]" />
                    <span className="text-sm sm:text-[15px] font-sans text-slate-700 leading-snug">
                      <strong className="font-semibold text-slate-900">Fast Express Dispatch</strong> &bull; Safe &amp; secure delivery across India
                    </span>
                  </div>
                </div>
              </div>

              {/* Specification Tab System */}
              <div className="mt-2 bg-light-gray/60 border border-border-gray/30 rounded-2xl p-6 space-y-4">
                <div className="border-b border-border-gray/50 flex space-x-5 text-xs font-display font-semibold">
                  <button
                    onClick={() => setActiveTab('desc')}
                    className={`pb-2.5 transition-all relative cursor-pointer ${
                      activeTab === 'desc' ? 'text-primary' : 'text-gray-400 hover:text-dark'
                    }`}
                  >
                    Details
                    {activeTab === 'desc' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('ingredients')}
                    className={`pb-2.5 transition-all relative cursor-pointer ${
                      activeTab === 'ingredients' ? 'text-primary' : 'text-gray-400 hover:text-dark'
                    }`}
                  >
                    Active Ingredients
                    {activeTab === 'ingredients' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('benefits')}
                    className={`pb-2.5 transition-all relative cursor-pointer ${
                      activeTab === 'benefits' ? 'text-primary' : 'text-gray-400 hover:text-dark'
                    }`}
                  >
                    Benefits
                    {activeTab === 'benefits' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('shipping')}
                    className={`pb-2.5 transition-all relative cursor-pointer ${
                      activeTab === 'shipping' ? 'text-primary' : 'text-gray-400 hover:text-dark'
                    }`}
                  >
                    Delivery
                    {activeTab === 'shipping' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                </div>

                <div className="text-xs sm:text-sm text-gray-600 font-sans leading-relaxed min-h-[90px] pt-1">
                  {activeTab === 'desc' && <p>{product.description}</p>}
                  {activeTab === 'ingredients' && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {product.ingredients?.map((ing) => (
                        <li key={ing} className="flex items-center gap-2 font-medium text-dark/90">
                          <Check size={13} className="text-secondary" />
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {activeTab === 'benefits' && (
                    <ul className="space-y-1.5">
                      {product.benefits?.map((ben) => (
                        <li key={ben} className="flex items-start gap-2">
                          <Check size={13} className="text-secondary mt-0.5" />
                          <span>{ben}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {activeTab === 'shipping' && (
                    <p>
                      Your order will be packed in 100% recyclable, glass-first bottles and carbon-neutral outer packaging. Express shipping takes 2-4 business days. Complimentry delivery applies on all bags exceeding ₹75.
                    </p>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Similar Products Recommendation row */}
          <div className="border-t border-border-gray/60 pt-16 mt-16">
            <div className="mb-8">
              <h3 className="font-display font-semibold text-2xl text-dark tracking-tight">
                Recommended For You
              </h3>
              <p className="text-gray-500 text-xs sm:text-sm font-sans mt-1">
                Formulations that complement your active skincare regimen.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displaySimilar.map((item) => {
                const itemWishlisted = isInWishlist(item.id);
                return (
                  <div
                    key={item.id}
                    className="group flex flex-col h-full bg-white relative text-left"
                  >
                    {/* Image Frame */}
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-light-gray mb-4 border border-border-gray/30">
                      
                      {/* Discount/New Badges */}
                      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 animate-fade-in-up">
                        {item.discount && (
                          <span className="bg-primary text-white text-[10px] font-display font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            -{item.discount}%
                          </span>
                        )}
                        {item.isNew && (
                          <span className="bg-secondary text-white text-[10px] font-display font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                            New
                          </span>
                        )}
                      </div>

                      {/* Wishlist Icon */}
                      <button
                        onClick={() => {
                          toggleWishlist(item);
                          toast.success(
                            itemWishlisted ? 'Removed from wishlist' : 'Added to wishlist!'
                          );
                        }}
                        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-dark hover:text-red-500 shadow-md flex items-center justify-center transition-all duration-300 focus:outline-none cursor-pointer"
                        aria-label="Add to Wishlist"
                      >
                        <Heart
                          size={16}
                          className="transition-transform duration-300 active:scale-125"
                          fill={itemWishlisted ? '#EF4444' : 'none'}
                          color={itemWishlisted ? '#EF4444' : 'currentColor'}
                        />
                      </button>

                      {/* Hover Image Switcher */}
                      <Link
                        to={`/product/${item.id}`}
                        className="block w-full h-full cursor-pointer"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover object-center absolute inset-0 transition-opacity duration-700 group-hover:opacity-0"
                        />
                        <img
                          src={item.hoverImage}
                          alt={`${item.name} alternate view`}
                          className="w-full h-full object-cover object-center absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                        />
                      </Link>

                      {/* Quick Add Overlay */}
                      <div className="absolute inset-x-0 bottom-4 px-4 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addToCart(item, 1, item.volume || '50ml');
                            setIsCartOpen(true);
                            toast.success(`${item.name} added to bag.`);
                          }}
                          variant="primary"
                          size="sm"
                          className="w-full shadow-lg"
                          leftIcon={<ShoppingBag size={14} />}
                        >
                          Add to Bag
                        </Button>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex flex-col flex-grow">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 font-display">
                        {item.category}
                      </span>
                      
                      <h4 className="font-display font-semibold text-sm sm:text-base text-dark hover:text-primary transition-colors mb-1.5">
                        <Link
                          to={`/product/${item.id}`}
                          className="cursor-pointer"
                        >
                          {item.name}
                        </Link>
                      </h4>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              fill={i < Math.floor(item.rating) ? 'currentColor' : 'none'}
                              className="stroke-1.5"
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-sans text-gray-500 font-medium pt-0.5">
                          {item.rating} ({item.reviewsCount})
                        </span>
                      </div>

                      {/* Price Tag */}
                      <div className="flex items-center gap-2 mt-auto">
                        <span className="font-display font-bold text-dark text-sm sm:text-base">
                          ₹{item.price.toFixed(2)}
                        </span>
                        {item.oldPrice && (
                          <span className="font-display font-medium text-rose-600 text-xs sm:text-sm line-through">
                            ₹{item.oldPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </Container>
      </main>

      <WhatsAppButton />
      <Footer />
    </>
  );
};

export default ProductDetail;
