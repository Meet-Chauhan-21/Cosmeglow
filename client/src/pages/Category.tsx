import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO, { ensureAbsoluteUrl } from '../components/common/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Heart,
  ShoppingBag,
  SlidersHorizontal,
  X,
  ChevronRight,
  Home as HomeIcon,
  Search,
  Filter,
  ChevronDown,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Button from '../components/layout/Button';
import WhatsAppButton from '../components/layout/WhatsAppButton';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types';

// Custom Professional Select Component for Sorting
interface SortDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; label: string }[];
}

const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = options.find((o) => o.id === value) || options[0];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-border-gray/50 hover:border-primary rounded-xl py-2.5 px-3.5 flex items-center justify-between text-xs text-dark font-sans transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20"
      >
        <span className="font-semibold text-dark/80">{currentOption.label}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 z-30 mt-1 w-full bg-white border border-border-gray/30 rounded-xl shadow-lg py-1.5 max-h-60 overflow-y-auto divide-y divide-gray-50"
          >
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 text-xs font-sans transition-colors flex items-center justify-between cursor-pointer ${value === option.id ? 'text-primary font-semibold bg-primary/[0.03]' : 'text-dark/70 hover:bg-light-gray/40 hover:text-dark'
                  }`}
              >
                <span>{option.label}</span>
                {value === option.id && <Check size={12} className="text-primary" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Category: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const {
    products,
    categories,
    productsLoading,
    categoriesLoading,
    addToCart,
    toggleWishlist,
    isInWishlist,
    setIsCartOpen,
  } = useStore();

  // Mobile filters drawer open state
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [maxPriceLimit, setMaxPriceLimit] = useState(5000);
  const [minPriceLimit, setMinPriceLimit] = useState(0);

  // Badge Filter States
  const [filterBestseller, setFilterBestseller] = useState(false);
  const [filterNew, setFilterNew] = useState(false);
  const [filterSale, setFilterSale] = useState(false);
  const [filterInStock, setFilterInStock] = useState(false);

  // Find active category
  const activeCategory = useMemo(() => {
    return categories.find((c) => c.slug === slug);
  }, [categories, slug]);

  // Products belonging to the active category
  const categoryProducts = useMemo(() => {
    if (!activeCategory) return [];
    return products.filter((p) => {
      const matchId = p.categoryId === activeCategory.id || p.categoryId === activeCategory._id;
      const matchName = p.category.toLowerCase() === activeCategory.name.toLowerCase();
      return matchId || matchName;
    });
  }, [products, activeCategory]);

  // Determine price limits dynamically based on category products
  useEffect(() => {
    if (categoryProducts.length > 0) {
      const prices = categoryProducts.map((p) => p.price);
      const min = Math.floor(Math.min(...prices));
      const max = Math.ceil(Math.max(...prices));
      setMinPriceLimit(min);
      setMaxPriceLimit(max);
      setPriceRange([min, max]);
    }
  }, [categoryProducts]);

  // Wishlist handler
  const handleToggleWishlist = (product: Product) => {
    const isCurrentlyWishlisted = isInWishlist(product.id);
    toggleWishlist(product);
    if (isCurrentlyWishlisted) {
      toast.info('Removed from your wishlist.');
    } else {
      toast.success('Added to your wishlist!');
    }
  };

  // Add to Cart handler
  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, product.volume || '50ml');
    setIsCartOpen(true);
    toast.success(`${product.name} added to shopping bag.`);
  };

  // Apply filters, search and sorting
  const filteredProducts = useMemo(() => {
    let result = [...categoryProducts];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Price filter
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Bestseller filter
    if (filterBestseller) {
      result = result.filter((p) => p.isBestSeller);
    }

    // New filter
    if (filterNew) {
      result = result.filter((p) => p.isNew || p.isNewArrival);
    }

    // Sale filter
    if (filterSale) {
      result = result.filter((p) => p.discount && p.discount > 0);
    }

    // In Stock filter
    if (filterInStock) {
      result = result.filter((p) => p.stock === undefined || p.stock > 0);
    }

    // Sorting
    if (sortOption === 'price-low-high') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-high-low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === 'newest') {
      result.sort(
        (a, b) =>
          new Date(b.createdAt || '').getTime() -
          new Date(a.createdAt || '').getTime()
      );
    }

    return result;
  }, [
    categoryProducts,
    searchQuery,
    priceRange,
    filterBestseller,
    filterNew,
    filterSale,
    filterInStock,
    sortOption,
  ]);

  const clearFilters = () => {
    setSearchQuery('');
    setSortOption('featured');
    setPriceRange([minPriceLimit, maxPriceLimit]);
    setFilterBestseller(false);
    setFilterNew(false);
    setFilterSale(false);
    setFilterInStock(false);
    toast.info('All filters have been cleared.');
  };

  const isAnyFilterActive =
    searchQuery !== '' ||
    sortOption !== 'featured' ||
    priceRange[0] !== minPriceLimit ||
    priceRange[1] !== maxPriceLimit ||
    filterBestseller ||
    filterNew ||
    filterSale ||
    filterInStock;

  const sortOptions = [
    { id: 'featured', label: 'Featured' },
    { id: 'price-low-high', label: 'Price: Low to High' },
    { id: 'price-high-low', label: 'Price: High to Low' },
    { id: 'rating', label: 'Customer Rating' },
    { id: 'newest', label: 'New Arrivals' },
  ];

  if (productsLoading || categoriesLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-display text-gray-500 font-medium">Loading collection...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!activeCategory) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
          <div className="text-center space-y-6 max-w-md">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-dark">Category Not Found</h2>
            <p className="text-gray-500 text-sm font-sans leading-relaxed">
              We couldn't find the skincare collection you were looking for. It may have been archived or renamed.
            </p>
            <Link to="/" className="inline-block">
              <Button variant="primary" size="md">
                Back to Homepage
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const categoryImageUrl = ensureAbsoluteUrl(activeCategory.image);

  const categoryBreadcrumb = {
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
        name: activeCategory.name,
        item: typeof window !== 'undefined' ? window.location.href : `https://www.cosmeglow.com/category/${activeCategory.slug}`
      }
    ]
  };

  return (
    <>
      <SEO
        title={`${activeCategory.name} — Organic Botanical Skincare`}
        description={(activeCategory as any).description || `Explore our range of luxury organic formulations specifically curated for ${activeCategory.name}. Experience biological cellular skin restoration with CosmeGlow.`}
        keywords={`cosmeglow ${activeCategory.name}, organic ${activeCategory.name}, botanical skincare India, buy ${activeCategory.name} online`}
        ogImage={categoryImageUrl}
        jsonLd={categoryBreadcrumb}
      />

      <Navbar />

      <main className="min-h-screen bg-white pb-24 pt-16">
        {/* Banner Header */}
        <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden bg-dark flex items-center">
          <div className="absolute inset-0">
            <img
              src={activeCategory.image}
              alt={activeCategory.altText || activeCategory.name}
              className="w-full h-full object-cover object-center opacity-40 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          </div>

          <Container className="relative z-10 text-white">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs text-white/70 mb-4 font-sans font-medium tracking-wide">
              <Link to="/" className="hover:text-white flex items-center gap-1 transition-colors">
                <HomeIcon size={12} />
                <span>Home</span>
              </Link>
              <ChevronRight size={10} />
              <span className="hover:text-white transition-colors">Collections</span>
              <ChevronRight size={10} />
              <span className="text-secondary font-semibold">{activeCategory.name}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight drop-shadow-md">
              {activeCategory.name}
            </h1>
            <p className="text-white/80 text-xs sm:text-sm md:text-base font-sans mt-3 max-w-xl leading-relaxed">
              Targeted cellular botanical formulations to refine, restore, and replenish your skin barrier. Discover the power of organic restoration.
            </p>
          </Container>
        </div>

        {/* Content Section */}
        <Container className="mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Desktop Filters Sidebar (Col Span 3) */}
            <aside className="hidden lg:block lg:col-span-3 sticky top-24 bg-white border border-border-gray/30 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-border-gray/40 pb-4">
                <h3 className="font-display font-semibold text-dark text-base flex items-center gap-2">
                  <SlidersHorizontal size={16} className="text-primary" />
                  <span>Filters</span>
                </h3>
                {isAnyFilterActive && (
                  <button
                    onClick={clearFilters}
                    className="text-[11px] font-sans font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Search Inside Category */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-dark/70 uppercase tracking-wider">
                  Search Botanicals
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search in this collection..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-light-gray/40 border border-border-gray/50 rounded-xl py-2 px-3 pl-9 text-xs text-dark placeholder-gray-400 font-sans focus:outline-none focus:border-primary transition-colors"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Sorting */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-dark/70 uppercase tracking-wider">
                  Sort By
                </label>
                <SortDropdown
                  value={sortOption}
                  onChange={setSortOption}
                  options={sortOptions}
                />
              </div>

              {/* Price Range Filter */}
              {maxPriceLimit > minPriceLimit && (
                <div className="space-y-4 pt-4 border-t border-border-gray/30">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-dark/70 uppercase tracking-wider">
                      Price Range
                    </label>
                    <span className="text-[11px] font-sans text-primary font-bold">
                      ₹{priceRange[0]} - ₹{priceRange[1]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={minPriceLimit}
                    max={maxPriceLimit}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold font-sans">
                    <span>₹{minPriceLimit}</span>
                    <span>Max: ₹{maxPriceLimit}</span>
                  </div>
                </div>
              )}

              {/* Product Preferences / Badges */}
              <div className="space-y-3 pt-4 border-t border-border-gray/30">
                <label className="block text-xs font-bold text-dark/70 uppercase tracking-wider">
                  Product Badges
                </label>

                <label className="flex items-center gap-2.5 text-xs text-dark font-sans select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterBestseller}
                    onChange={(e) => setFilterBestseller(e.target.checked)}
                    className="rounded border-border-gray text-primary focus:ring-primary w-4.5 h-4.5 cursor-pointer accent-primary"
                  />
                  <span className="font-medium">Bestsellers</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-dark font-sans select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterNew}
                    onChange={(e) => setFilterNew(e.target.checked)}
                    className="rounded border-border-gray text-primary focus:ring-primary w-4.5 h-4.5 cursor-pointer accent-primary"
                  />
                  <span className="font-medium">New Arrivals</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-dark font-sans select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterSale}
                    onChange={(e) => setFilterSale(e.target.checked)}
                    className="rounded border-border-gray text-primary focus:ring-primary w-4.5 h-4.5 cursor-pointer accent-primary"
                  />
                  <span className="font-medium">Offers / Discounted</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-dark font-sans select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterInStock}
                    onChange={(e) => setFilterInStock(e.target.checked)}
                    className="rounded border-border-gray text-primary focus:ring-primary w-4.5 h-4.5 cursor-pointer accent-primary"
                  />
                  <span className="font-medium">In Stock Only</span>
                </label>
              </div>
            </aside>

            {/* Products Grid & Mobile Controls Column (Col Span 9) */}
            <div className="lg:col-span-9 space-y-6">

              {/* Toolbar - ENHANCED with Theme Color layout */}
              <div className="flex items-center justify-between bg-primary/[0.03] border border-border-gray/30 border-l-4 border-l-primary rounded-2xl py-3.5 px-5 shadow-xs">
                <span className="text-xs sm:text-sm font-sans text-gray-500 font-medium">
                  Showing <strong className="text-primary font-extrabold">{filteredProducts.length}</strong> of{' '}
                  <strong className="text-dark font-bold">{categoryProducts.length}</strong> premium botanicals
                </span>

                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 bg-white border border-primary/30 hover:border-primary text-primary text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Filter size={14} />
                  <span>Filters</span>
                  {isAnyFilterActive && (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
              </div>

              {/* Products list grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-light-gray/20 border border-dashed border-border-gray/45 rounded-3xl space-y-4">
                  <div className="w-14 h-14 bg-light-gray rounded-full flex items-center justify-center mx-auto text-gray-400">
                    <SlidersHorizontal size={24} />
                  </div>
                  <h3 className="font-display font-semibold text-dark text-base">No Botanicals Found</h3>
                  <p className="text-gray-500 text-xs max-w-xs mx-auto font-sans leading-relaxed">
                    Try broadening your price range, searching for simpler keywords, or disabling active filter tags.
                  </p>
                  {isAnyFilterActive && (
                    <Button onClick={clearFilters} variant="outline" size="sm" className="mt-2">
                      Clear Active Filters
                    </Button>
                  )}
                </div>
              ) : (
                <motion.div
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-8 justify-items-center"
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
                          transition={{ duration: 0.4, delay: idx * 0.04 }}
                          key={product.id}
                          className="group flex flex-col h-full bg-white relative w-full max-w-[280px]"
                        >
                          {/* Image Frame */}
                          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-light-gray mb-4 border border-border-gray/30">

                            {/* Badges */}
                            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                              {product.stock !== undefined && product.stock <= 0 ? (
                                <span className="bg-rose-600 text-white text-[9px] font-display font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                  Out of Stock
                                </span>
                              ) : null}
                              {product.discount && product.discount > 0 ? (
                                <span className="bg-primary text-white text-[9px] font-display font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                  -{product.discount}%
                                </span>
                              ) : null}
                              {product.isNew || product.isNewArrival ? (
                                <span className="bg-secondary text-white text-[9px] font-display font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                  New
                                </span>
                              ) : null}
                            </div>

                            {/* Wishlist Toggle Button */}
                            <button
                              onClick={() => handleToggleWishlist(product)}
                              className="absolute top-3 right-3 z-10 w-8.5 h-8.5 rounded-full bg-white/80 hover:bg-white text-dark hover:text-red-500 shadow-md flex items-center justify-center transition-all duration-350 focus:outline-none cursor-pointer"
                              aria-label="Add to Wishlist"
                            >
                              <Heart
                                size={14}
                                className="transition-transform duration-300 active:scale-125"
                                fill={isWishlisted ? '#EF4444' : 'none'}
                                color={isWishlisted ? '#EF4444' : 'currentColor'}
                              />
                            </button>

                            {/* Hover alternate images */}
                            <Link to={`/product/${product.id}`} className="block w-full h-full cursor-pointer">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover object-center absolute inset-0 transition-opacity duration-500 group-hover:opacity-0"
                              />
                              <img
                                src={product.hoverImage || product.image}
                                alt={`${product.name} alternate view`}
                                className="w-full h-full object-cover object-center absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                              />
                            </Link>

                            {/* Add to Bag Overlay */}
                            <div className="absolute inset-x-0 bottom-4 px-4 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                              {product.stock !== undefined && product.stock <= 0 ? (
                                <button
                                  type="button"
                                  disabled
                                  className="w-full bg-slate-200 text-slate-500 border border-slate-300 py-2 px-3 rounded-full text-xs font-semibold uppercase tracking-wider cursor-not-allowed select-none shadow-sm flex items-center justify-center gap-1.5"
                                >
                                  <ShoppingBag size={12} className="opacity-50" />
                                  <span>Out of Stock</span>
                                </button>
                              ) : (
                                <Button
                                  onClick={(e) => handleAddToCart(e, product)}
                                  variant="primary"
                                  size="sm"
                                  className="w-full shadow-lg text-[10px]"
                                  leftIcon={<ShoppingBag size={12} />}
                                >
                                  Add to Bag
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Info Column */}
                          <div className="flex flex-col flex-grow">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1 font-display">
                              {product.category}
                            </span>

                            <h3 className="font-display font-semibold text-xs sm:text-sm text-dark hover:text-primary transition-colors mb-1">
                              <Link to={`/product/${product.id}`} className="cursor-pointer line-clamp-1">
                                {product.name}
                              </Link>
                            </h3>

                            {/* Star Rating */}
                            <div className="flex items-center gap-1 mb-2">
                              <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={10}
                                    fill={i < Math.floor(product.rating) ? 'currentColor' : 'none'}
                                    className="stroke-1.5"
                                  />
                                ))}
                              </div>
                              <span className="text-[9px] font-sans text-gray-500 font-medium pt-0.5">
                                {product.rating} ({product.reviewsCount})
                              </span>
                            </div>

                            {/* Price details */}
                            <div className="flex items-center gap-2 mt-auto">
                              <span className="font-display font-bold text-dark text-xs sm:text-sm">
                                ₹{product.price.toFixed(2)}
                              </span>
                              {product.oldPrice ? (
                                <span className="font-display font-medium text-rose-600 text-[10px] sm:text-xs line-through">
                                  ₹{product.oldPrice.toFixed(2)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>

          </div>
        </Container>
      </main>

      <WhatsAppButton />
      <Footer />

      {/* Mobile Drawer (Filters Panel sliding from right) */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs lg:hidden"
              onClick={() => setIsMobileFiltersOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-[85%] sm:w-[380px] max-w-[380px] bg-white shadow-2xl flex flex-col h-full overflow-hidden lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-border-gray/50">
                <h3 className="font-display font-bold text-dark text-lg flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-primary" />
                  <span>Refine Collection</span>
                </h3>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-dark transition-colors cursor-pointer focus:outline-none"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Filters list */}
              <div className="flex-grow overflow-y-auto p-5 space-y-6">

                {/* Search */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-dark/70 uppercase tracking-wider">
                    Search Botanicals
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search in this collection..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-light-gray/40 border border-border-gray/50 rounded-xl py-2.5 px-3.5 pl-10 text-sm text-dark placeholder-gray-400 font-sans focus:outline-none focus:border-primary transition-colors"
                    />
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-dark/70 uppercase tracking-wider">
                    Sort By
                  </label>
                  <SortDropdown
                    value={sortOption}
                    onChange={setSortOption}
                    options={sortOptions}
                  />
                </div>

                {/* Price Slider */}
                {maxPriceLimit > minPriceLimit && (
                  <div className="space-y-4 pt-4 border-t border-border-gray/30">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-dark/70 uppercase tracking-wider">
                        Price Range
                      </label>
                      <span className="text-xs font-sans text-primary font-bold">
                        ₹{priceRange[0]} - ₹{priceRange[1]}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={minPriceLimit}
                      max={maxPriceLimit}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold font-sans">
                      <span>₹{minPriceLimit}</span>
                      <span>Max: ₹{maxPriceLimit}</span>
                    </div>
                  </div>
                )}

                {/* Badge tags */}
                <div className="space-y-4.5 pt-4 border-t border-border-gray/30">
                  <label className="block text-xs font-bold text-dark/70 uppercase tracking-wider">
                    Product Badges
                  </label>

                  <label className="flex items-center gap-3 text-sm text-dark font-sans select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterBestseller}
                      onChange={(e) => setFilterBestseller(e.target.checked)}
                      className="rounded border-border-gray text-primary focus:ring-primary w-5 h-5 cursor-pointer accent-primary"
                    />
                    <span className="font-medium">Bestsellers</span>
                  </label>

                  <label className="flex items-center gap-3 text-sm text-dark font-sans select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterNew}
                      onChange={(e) => setFilterNew(e.target.checked)}
                      className="rounded border-border-gray text-primary focus:ring-primary w-5 h-5 cursor-pointer accent-primary"
                    />
                    <span className="font-medium">New Arrivals</span>
                  </label>

                  <label className="flex items-center gap-3 text-sm text-dark font-sans select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterSale}
                      onChange={(e) => setFilterSale(e.target.checked)}
                      className="rounded border-border-gray text-primary focus:ring-primary w-5 h-5 cursor-pointer accent-primary"
                    />
                    <span className="font-medium">Offers / Discounted</span>
                  </label>

                  <label className="flex items-center gap-3 text-sm text-dark font-sans select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterInStock}
                      onChange={(e) => setFilterInStock(e.target.checked)}
                      className="rounded border-border-gray text-primary focus:ring-primary w-5 h-5 cursor-pointer accent-primary"
                    />
                    <span className="font-medium">In Stock Only</span>
                  </label>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-5 border-t border-border-gray/50 flex items-center gap-3">
                <Button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  variant="primary"
                  className="flex-grow"
                >
                  Apply Filters
                </Button>
                {isAnyFilterActive && (
                  <Button
                    onClick={() => {
                      clearFilters();
                      setIsMobileFiltersOpen(false);
                    }}
                    variant="outline"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Category;
