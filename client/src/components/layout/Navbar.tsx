import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react';
import { Container } from './Container';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import type { Product } from '../../types';
import logoImg from '../../images/logo.png';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [activeSectionHash, setActiveSectionHash] = useState<string>('');

  const { cart, wishlist, setIsCartOpen, setIsWishlistOpen, products } = useStore();
  const { user } = useAuth();

  const wishlistCount = wishlist.length;
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const accountHref = user ? '/profile' : '/login';
  const isAccountActive = location.pathname === accountHref;
  const isCheckoutActive = location.pathname === '/checkout';

  const isNavLinkActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' && !activeSectionHash;
    }
    if (path.startsWith('/#')) {
      const expectedHash = `#${path.slice(2)}`;
      return location.pathname === '/' && activeSectionHash === expectedHash;
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    path: string,
    closeMobileMenu: boolean = false
  ) => {
    if (closeMobileMenu) setIsMobileMenuOpen(false);

    if (path === '/') {
      if (location.pathname === '/') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        window.history.replaceState(null, '', '/');
        setActiveSectionHash('');
      }
      return;
    }

    if (!path.startsWith('/#')) {
      return;
    }

    e.preventDefault();
    const targetHash = `#${path.slice(2)}`;
    const targetId = targetHash.replace('#', '');

    if (location.pathname === '/') {
      const section = document.getElementById(targetId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', targetHash);
      }
      return;
    }

    navigate(`/${targetHash}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
    } else {
      const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(val.toLowerCase()) ||
        p.category.toLowerCase().includes(val.toLowerCase())
      );
      setSearchResults(filtered);
    }
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSectionHash('');
      return;
    }

    const sectionHashes = ['#shop', '#categories', '#about', '#contact'];
    const sectionIds = sectionHashes.map((hash) => hash.replace('#', ''));

    const updateActiveSection = () => {
      // At very top, keep Home active.
      if (window.scrollY < 120) {
        setActiveSectionHash('');
        return;
      }

      const navOffset = 140;
      let currentHash = '';

      for (const sectionId of sectionIds) {
        const section = document.getElementById(sectionId);
        if (!section) continue;
        const rect = section.getBoundingClientRect();
        if (rect.top <= navOffset && rect.bottom > navOffset) {
          currentHash = `#${sectionId}`;
          break;
        }
      }

      if (!currentHash) {
        // Fallback: use last section passed while scrolling down.
        for (const sectionId of sectionIds) {
          const section = document.getElementById(sectionId);
          if (!section) continue;
          const sectionTop = section.getBoundingClientRect().top;
          if (sectionTop <= navOffset) {
            currentHash = `#${sectionId}`;
          }
        }
      }

      setActiveSectionHash(currentHash);
    };

    // Sync initial state with URL hash (if present), then start scroll tracking.
    setActiveSectionHash(location.hash || '');
    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
    };
  }, [location.pathname, location.hash]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/#shop' },
    { name: 'Categories', path: '/#categories' },
    { name: 'About', path: '/#about' },
    { name: 'Contact', path: '/#contact' },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ name: 'Admin Panel', path: '/admin' });
  }

  return (
    <>
      {/* Header: lower z-index (z-40) so the drawer overlay (z-50) sits on top */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/95 border-b border-border-gray/60 py-3 shadow-sm backdrop-blur-md'
            : 'bg-transparent py-5'
        }`}
      >
        <Container className="flex items-center justify-between">
          {/* Logo Frame with Spacer to prevent layout shift */}
          <Link
            to="/"
            className="font-display font-medium text-primary flex items-center focus:outline-none relative z-50 h-8 w-36 sm:w-40 lg:w-56 xl:w-64"
          >
            <div className={`transition-all duration-500 flex items-center gap-1 whitespace-nowrap ${
              isScrolled
                ? 'absolute left-0 top-1/2 -translate-y-1/2 scale-100'
                : 'absolute left-0 top-1/2 -translate-y-1/2 scale-115 sm:scale-120 lg:scale-125 origin-left'
            }`}>
              <img 
                src={logoImg} 
                alt="CosmeGlow logo" 
                className={`transition-all duration-500 object-contain ${
                  isScrolled ? 'h-8 w-auto mt-0.5' : 'h-11 w-auto mt-1.5'
                }`} 
              />
              <span className={`text-primary transition-all duration-500 font-bold tracking-normal ${
                isScrolled ? 'text-sm' : 'text-sm sm:text-base'
              }`}>
                CosmeGlow
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={(e) => handleNavClick(e, link.path)}
                className={`font-display text-sm font-medium tracking-wide transition-colors relative py-1 group ${
                  isNavLinkActive(link.path) ? 'text-primary' : 'text-dark/80 hover:text-primary'
                }`}
              >
                {link.name}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${
                    isNavLinkActive(link.path) ? 'w-full' : 'w-0'
                  } group-hover:w-full`}
                />
              </Link>
            ))}
          </nav>

          {/* Desktop Icons */}
          <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-dark hover:text-primary transition-colors cursor-pointer focus:outline-none"
              aria-label="Search Products"
            >
              <Search size={20} strokeWidth={2} />
            </button>
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="text-dark hover:text-primary transition-colors relative cursor-pointer focus:outline-none"
              aria-label="Wishlist"
            >
              <Heart size={20} strokeWidth={2} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-secondary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-sans font-medium">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className={`${
                isCheckoutActive ? 'text-primary' : 'text-dark'
              } hover:text-primary transition-colors relative cursor-pointer focus:outline-none`}
              aria-label="Cart"
            >
              <ShoppingBag size={20} strokeWidth={2} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-sans font-medium">
                  {cartCount}
                </span>
              )}
            </button>
            <Link
              to={user ? "/profile" : "/login"}
              className={`${
                isAccountActive ? 'text-primary' : 'text-dark'
              } hover:text-primary transition-colors flex items-center relative group`}
              aria-label="Profile"
            >
              {user ? (
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                  {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                </div>
              ) : (
                <User size={20} strokeWidth={2} />
              )}
              <span className="absolute top-8 right-0 bg-dark text-white text-[9px] px-2 py-0.5 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {user ? `Signed in as ${user.name}` : 'Sign In'}
              </span>
            </Link>
          </div>

          {/* Mobile Menu & Cart Buttons */}
          <div className="flex lg:hidden items-center space-x-3.5">
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="text-dark hover:text-primary transition-colors relative cursor-pointer focus:outline-none"
              aria-label="Wishlist"
            >
              <Heart size={20} strokeWidth={2} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-secondary text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-sans font-medium">
                  {wishlistCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className={`${
                isCheckoutActive ? 'text-primary' : 'text-dark'
              } hover:text-primary transition-colors relative cursor-pointer focus:outline-none`}
              aria-label="Cart"
            >
              <ShoppingBag size={20} strokeWidth={2} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-sans font-medium">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-dark hover:text-primary transition-colors cursor-pointer focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </Container>
      </header>

      {/* Mobile Sidebar Navigation: higher z-index (z-50) and blur overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute right-0 top-0 bottom-0 w-[80%] max-w-[320px] bg-white p-6 shadow-2xl flex flex-col z-55"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border-gray pb-4 mb-6">
                <span className="font-display text-xl font-bold tracking-widest text-primary flex items-center gap-1.5">
                  <img src={logoImg} alt="CosmeGlow logo" className="h-6 w-auto object-contain" />
                  <span>CosmeGlow</span>
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-dark hover:text-primary focus:outline-none cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col space-y-4 flex-grow">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={(e) => handleNavClick(e, link.path, true)}
                    className={`font-display text-base font-medium transition-colors py-1 border-b border-gray-50 ${
                      isNavLinkActive(link.path) ? 'text-primary' : 'text-dark hover:text-primary'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>

              <div className="border-t border-border-gray pt-6 mt-auto">
                <div className="flex items-center justify-around text-dark">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsSearchOpen(true);
                    }}
                    className="flex flex-col items-center gap-1 hover:text-primary cursor-pointer"
                  >
                    <Search size={20} />
                    <span className="text-[10px] font-medium tracking-wide">Search</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsWishlistOpen(true);
                    }}
                    className="flex flex-col items-center gap-1 hover:text-primary cursor-pointer"
                  >
                    <Heart size={20} />
                    <span className="text-[10px] font-medium tracking-wide">Wishlist</span>
                  </button>
                  <Link
                    to={user ? "/profile" : "/login"}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex flex-col items-center gap-1 hover:text-primary ${
                      isAccountActive ? 'text-primary' : 'text-dark'
                    }`}
                  >
                    {user ? (
                      <div className="w-5.5 h-5.5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[9px]">
                        {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                      </div>
                    ) : (
                      <User size={20} />
                    )}
                    <span className="text-[10px] font-medium tracking-wide">
                      {user ? 'Account' : 'Profile'}
                    </span>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Slide-down Search Bar Panel */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-x-0 top-0 z-50 bg-white/95 border-b border-border-gray shadow-lg p-6 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <div className="w-full max-w-2xl flex items-center gap-3">
              <Search className="text-gray-400" size={22} />
              <input
                type="text"
                placeholder="Search premium skincare products..."
                autoFocus
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-transparent border-none text-dark font-sans text-lg focus:outline-none placeholder-gray-400"
              />
              <button
                onClick={closeSearch}
                className="p-1 rounded-full hover:bg-gray-100 text-dark transition-colors focus:outline-none cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>

            {/* Live Search Autocomplete Dropdown */}
            {searchQuery && (
              <div className="w-full max-w-2xl mt-4 max-h-[300px] overflow-y-auto bg-white border border-border-gray/50 rounded-2xl shadow-xl divide-y divide-border-gray/35">
                {searchResults.length > 0 ? (
                  searchResults.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      onClick={closeSearch}
                      className="flex items-center gap-4 p-3.5 hover:bg-light-gray/40 transition-colors"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-xl object-cover border border-border-gray/25"
                      />
                      <div className="flex-grow text-left">
                        <h4 className="font-display font-semibold text-sm text-dark leading-tight">{product.name}</h4>
                        <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block mt-0.5">{product.category}</span>
                      </div>
                      <span className="font-display font-bold text-dark text-sm">₹{product.price.toFixed(2)}</span>
                    </Link>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-gray-500 font-sans">
                    No botanicals match your search query. Try searching for "Serum" or "Cream".
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
