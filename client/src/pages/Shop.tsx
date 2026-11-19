import React, { useState, useEffect, useMemo, useRef } from 'react';
import BannerSlider, { type BannerSlide } from '../components/common/BannerSlider';
import { Link, useSearchParams } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Heart,
  SlidersHorizontal,
  X,
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

      {isOpen && (
        <div className="absolute left-0 right-0 z-30 mt-1 w-full bg-white border border-border-gray/30 rounded-xl shadow-lg py-1.5 max-h-60 overflow-y-auto divide-y divide-gray-50">
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
        </div>
      )}
    </div>
  );
};

export const Shop: React.FC = () => {
  const {
    products,
    categories,
    settings,
    productsLoading,
    refreshCategories,
    cart,
    addToCart,
    updateCartQuantity,
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

  // Category filter state: array of selected category ids
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const activeCategories = useMemo(() => categories.filter((c) => c.isActive), [categories]);

  useEffect(() => {
    if (categories.length === 0) {
      refreshCategories();
    }
  }, [categories.length, refreshCategories]);

  // Synchronize category query param with selectedCategories
  useEffect(() => {
    if (categoryParam && categories.length > 0) {
      const matched = categories.find(
        (c) =>
          c.isActive &&
          (c.slug?.toLowerCase() === categoryParam.toLowerCase() ||
          c.name.toLowerCase() === categoryParam.toLowerCase())
      );
      if (matched) {
        const catId = matched.id || (matched as any)._id;
        setSelectedCategories([catId]);
      }
    }
  }, [categoryParam, categories]);

  const handleCategoryCardClick = (catId: string, slug?: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories([]);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('category');
        return next;
      });
    } else {
      setSelectedCategories([catId]);
      if (slug) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('category', slug);
          return next;
        });
      }
    }
  };

  // Determine price limits dynamically from all products
  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map((p) => p.price);
      const min = Math.floor(Math.min(...prices));
      const max = Math.ceil(Math.max(...prices));
      setMinPriceLimit(min);
      setMaxPriceLimit(max);
      setPriceRange([min, max]);
    }
  }, [products]);

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

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) => {
      const isSelected = prev.includes(catId);
      const next = isSelected ? prev.filter((id) => id !== catId) : [...prev, catId];
      if (next.length === 1) {
        const cat = categories.find((c) => (c.id || (c as any)._id) === next[0]);
        if (cat?.slug) {
          setSearchParams((sp) => {
            const n = new URLSearchParams(sp);
            n.set('category', cat.slug);
            return n;
          });
        }
      } else {
        setSearchParams((sp) => {
          const n = new URLSearchParams(sp);
          n.delete('category');
          return n;
        });
      }
      return next;
    });
  };

  // Apply filters, search and sorting across ALL products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((p) => {
        const matchById = selectedCategories.includes(p.categoryId as string);
        const matchByCat = categories.some(
          (c) =>
            selectedCategories.includes((c.id || c._id || '') as string) &&
            (p.category.toLowerCase() === c.name.toLowerCase() ||
              p.categoryId === c.id ||
              p.categoryId === c._id)
        );
        return matchById || matchByCat;
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
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
    products,
    categories,
    selectedCategories,
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
    setSelectedCategories([]);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('category');
      return next;
    });
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
    filterInStock ||
    selectedCategories.length > 0;

  const sortOptions = [
    { id: 'featured', label: 'Featured' },
    { id: 'price-low-high', label: 'Price: Low to High' },
    { id: 'price-high-low', label: 'Price: High to Low' },
    { id: 'rating', label: 'Customer Rating' },
    { id: 'newest', label: 'New Arrivals' },
  ];

  // Auto-scrolling shop banners managed from admin
  const shopBannersList = useMemo(() => {
    if (settings.shopBanners && settings.shopBanners.length > 0) {
      return settings.shopBanners.filter(Boolean);
    }
    if (settings.shopBanner) {
      return [settings.shopBanner];
    }
    return [];
  }, [settings.shopBanners, settings.shopBanner]);

  const shopSlides: BannerSlide[] = useMemo(
    () =>
      shopBannersList.map((bannerUrl, idx) => ({
        key: `${idx}-${bannerUrl}`,
        content: (
          <img
            src={bannerUrl}
            alt={`Shop Banner ${idx + 1}`}
            className="w-full h-full object-cover object-center pointer-events-none"
            loading="eager"
            decoding="async"
            draggable={false}
            fetchPriority={idx === 0 ? 'high' : 'auto'}
          />
        )
      })),
    [shopBannersList]
  );

  const shopBannerSection = shopSlides.length > 0 && (
    <BannerSlider
      slides={shopSlides}
      heightClassName="h-36 sm:h-56 md:h-72 lg:h-80"
      autoplayMs={3000}
      pauseOnHover={false}
      showArrows={false}
      ariaLabel="Shop banners"
    />
  );

  if (productsLoading && products.length === 0) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-white pb-24 pt-0">
          {shopBannerSection}
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm font-display text-gray-500 font-medium">Loading products...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEO
        title="Shop All Products — CosmeGlow Organic Botanical Skincare"
        description="Browse the full CosmeGlow collection. Luxury organic botanical skincare — serums, creams, cleansers and more. Filter by category, price, and product type."
        keywords="cosmeglow shop, buy skincare online, organic skincare India, botanical serum, face cream, all products"
      />

      <Navbar />

      <main className="min-h-screen bg-white pb-24 pt-0">
        {shopBannerSection}

        {/* Content Section */}
        <Container className="mt-8 sm:mt-12">
          {/* Shop by Category Cards - ONLY SHOWN IF ADMIN HAS ACTIVE CATEGORIES */}
          {activeCategories.length > 0 && (
            <div className="mb-8 sm:mb-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-bold text-lg sm:text-xl text-dark tracking-tight">
                    Shop by Category
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm font-sans mt-0.5">
                    Select a category to explore specialized formulations
                  </p>
                </div>
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedCategories([]);
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        next.delete('category');
                        return next;
                      });
                    }}
                    className="text-xs font-sans font-semibold text-primary hover:underline cursor-pointer"
                  >
                    View All Categories
                  </button>
                )}
              </div>

              {/* Category Cards Carousel / Row */}
              <div className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
                {/* All Products Card */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategories([]);
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.delete('category');
                      return next;
                    });
                  }}
                  className={`group relative flex-shrink-0 block overflow-hidden rounded-2xl w-[130px] sm:w-[150px] aspect-[4/3] bg-dark transition-all duration-300 hover:-translate-y-1.5 cursor-pointer text-left ${
                    selectedCategories.length === 0
                      ? 'ring-2 ring-primary ring-offset-2 shadow-md -translate-y-1'
                      : 'border border-border-gray/40 hover:shadow-md'
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-br from-dark via-dark/85 to-primary/80 flex flex-col justify-end p-3.5 text-white">
                    <span className="text-[9px] text-white/90 font-bold uppercase tracking-wider block mb-0.5">
                      {products.length} Products
                    </span>
                    <span className="font-display font-semibold text-sm drop-shadow-sm">
                      All Products
                    </span>
                  </div>
                  {selectedCategories.length === 0 && (
                    <div className="absolute top-2.5 right-2.5 bg-primary text-white p-1 rounded-full shadow-xs">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </button>

                {/* Individual Category Cards */}
                {activeCategories.map((cat) => {
                  const catId = cat.id || (cat as any)._id;
                  const isSelected = selectedCategories.includes(catId);

                  return (
                    <button
                      key={catId}
                      type="button"
                      onClick={() => handleCategoryCardClick(catId, cat.slug)}
                      className={`group relative flex-shrink-0 block overflow-hidden rounded-2xl w-[130px] sm:w-[150px] aspect-[4/3] bg-dark transition-all duration-300 hover:-translate-y-1.5 cursor-pointer text-left ${
                        isSelected
                          ? 'ring-2 ring-primary ring-offset-2 shadow-md -translate-y-1'
                          : 'shadow-xs hover:shadow-md'
                      }`}
                    >
                      {/* Image */}
                      <img
                        src={cat.image}
                        alt={cat.altText || cat.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-75"
                        loading="lazy"
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/30 to-transparent" />
                      {/* Content */}
                      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 flex flex-col justify-end text-white">
                        <span className="text-[9px] text-white/90 font-bold font-display uppercase tracking-wider block mb-0.5 drop-shadow-sm">
                          {cat.count} {cat.count === 1 ? 'Item' : 'Items'}
                        </span>
                        <h3 className="font-display font-semibold text-xs sm:text-sm tracking-tight drop-shadow-md leading-tight line-clamp-1">
                          {cat.name}
                        </h3>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 bg-primary text-white p-1 rounded-full shadow-xs">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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

              {/* Search */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-dark/70 uppercase tracking-wider">
                  Search Products
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
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

              {/* Product Badges */}
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

              {/* Filter by Category */}
              {activeCategories.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border-gray/30">
                  <label className="block text-xs font-bold text-dark/70 uppercase tracking-wider">
                    Filter by Category
                  </label>
                  {activeCategories.map((cat) => {
                    const catId = (cat.id || cat._id || '') as string;
                    return (
                      <label
                        key={catId}
                        className="flex items-center gap-2.5 text-xs text-dark font-sans select-none cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(catId)}
                          onChange={() => toggleCategory(catId)}
                          className="rounded border-border-gray text-primary focus:ring-primary w-4.5 h-4.5 cursor-pointer accent-primary"
                        />
                        <span className="font-medium">{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </aside>

            {/* Products Grid & Mobile Controls Column (Col Span 9) */}
            <div className="lg:col-span-9 space-y-6">

              {/* Toolbar */}
              <div className="flex items-center justify-between bg-primary/[0.03] border border-border-gray/30 border-l-4 border-l-primary rounded-2xl py-3.5 px-5 shadow-xs">
                <span className="text-xs sm:text-sm font-sans text-gray-500 font-medium">
                  Showing <strong className="text-primary font-extrabold">{filteredProducts.length}</strong> of{' '}
                  <strong className="text-dark font-bold">{products.length}</strong> products
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
                  <h3 className="font-display font-semibold text-dark text-base">No Products Found</h3>
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
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-x-5 sm:gap-y-8 justify-items-center">
                  {filteredProducts.map((product) => {
                    const isWishlisted = isInWishlist(product.id);
                    const cartItem = cart.find((item) => item.product.id === product.id);
                    const currentQty = cartItem ? cartItem.quantity : 0;

                    return (
                      <div
                        key={product.id}
                        className="group flex flex-col h-full bg-white relative w-full max-w-[280px] rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1.5 overflow-hidden"
                      >
                        {/* Image Frame - no border on image itself, full card has border */}
                        <div className="relative aspect-square w-full overflow-hidden bg-slate-50">

                          {/* Badges */}
                          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                            {product.stock !== undefined && product.stock <= 0 ? (
                              <span className="bg-rose-600 text-white text-[9px] font-display font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                Out of Stock
                              </span>
                            ) : null}
                            {product.isBestSeller ? (
                              <span className="bg-black text-white text-[9px] font-display font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                Bestseller
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
                            className="absolute top-3 right-3 z-10 w-8.5 h-8.5 rounded-full bg-white/85 hover:bg-white text-dark hover:text-red-500 shadow-sm flex items-center justify-center transition-colors focus:outline-none cursor-pointer"
                            aria-label="Add to Wishlist"
                          >
                            <Heart
                              size={14}
                              fill={isWishlisted ? '#EF4444' : 'none'}
                              color={isWishlisted ? '#EF4444' : 'currentColor'}
                            />
                          </button>

                          {/* Product Image with smooth zoom on hover */}
                          <Link to={`/product/${product.id}`} className="block w-full h-full cursor-pointer overflow-hidden">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover object-center absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105"
                              loading="lazy"
                            />
                          </Link>
                        </div>

                        {/* Card Details / Info */}
                        <div className="flex flex-col flex-grow p-2.5 sm:p-4">
                          <h3 className="font-display font-bold text-xs sm:text-sm text-dark hover:text-primary transition-colors mb-0.5 sm:mb-1">
                            <Link to={`/product/${product.id}`} className="cursor-pointer line-clamp-1">
                              {product.name}
                            </Link>
                          </h3>

                          <p className="text-[10px] sm:text-[11px] text-gray-500 line-clamp-1 mb-1.5 sm:mb-2 font-sans">
                            {product.description}
                          </p>

                          {/* Star Rating & Reviews Count */}
                          <div className="flex items-center gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                            <div className="flex text-yellow-400">
                              <Star size={11} fill="currentColor" className="stroke-1" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-sans text-dark font-bold">
                              {product.rating > 0 ? product.rating.toFixed(1) : '0.0'}
                            </span>
                            <span className="text-[10px] sm:text-xs font-sans text-gray-400 font-medium">
                              ({product.reviewsCount || 0} reviews)
                            </span>
                          </div>

                          {/* Bottom Row: Price & + ADD / Quantity Button */}
                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 gap-1">
                            <div className="flex flex-col min-w-0">
                              <span className="font-display font-bold text-dark text-xs sm:text-base leading-tight">
                                ₹{Math.round(product.price)}
                              </span>
                              {product.oldPrice && product.oldPrice > product.price ? (
                                <span className="font-display font-medium text-red-500 text-[9px] sm:text-xs line-through leading-tight">
                                  ₹{Math.round(product.oldPrice)}
                                </span>
                              ) : null}
                            </div>

                            {/* + ADD or - 1 + Pill Button */}
                            {currentQty === 0 ? (
                              <button
                                type="button"
                                disabled={product.stock !== undefined && product.stock <= 0}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addToCart(product, 1, product.volume || '50ml');
                                  setIsCartOpen(true);
                                  toast.success(`${product.name} added to cart!`);
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
                                    updateCartQuantity(product.id, cartItem?.selectedSize || product.volume || '50ml', currentQty - 1);
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
                                    updateCartQuantity(product.id, cartItem?.selectedSize || product.volume || '50ml', currentQty + 1);
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
                  <span>Refine Products</span>
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
                    Search Products
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products..."
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

                {/* Category Filter (mobile) */}
                {activeCategories.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-border-gray/30">
                    <label className="block text-xs font-bold text-dark/70 uppercase tracking-wider">
                      Filter by Category
                    </label>
                    {activeCategories.map((cat) => {
                      const catId = (cat.id || cat._id || '') as string;
                      return (
                        <label
                          key={catId}
                          className="flex items-center gap-3 text-sm text-dark font-sans select-none cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(catId)}
                            onChange={() => toggleCategory(catId)}
                            className="rounded border-border-gray text-primary focus:ring-primary w-5 h-5 cursor-pointer accent-primary"
                          />
                          <span className="font-medium">{cat.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

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

export default Shop;
