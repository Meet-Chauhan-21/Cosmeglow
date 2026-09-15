import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, Category, AppSettings, CartItem } from '../types';
import { fallbackProducts, fetchPublicProducts } from '../services/products';
import { API_BASE_URL } from '../config';
import { toast } from 'sonner';

interface StoreContextType {
  cart: CartItem[];
  wishlist: Product[];
  products: Product[];
  productsLoading: boolean;
  categories: Category[];
  categoriesLoading: boolean;
  activeProduct: Product | null;
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  settings: AppSettings;
  addToCart: (product: Product, quantity: number, size?: string) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateCartQuantity: (productId: string, size: string, quantity: number) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearCart: () => void;
  setActiveProduct: (product: Product | null) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsWishlistOpen: (open: boolean) => void;
  updateLocalSettings: (newSettings: AppSettings) => void;
  refreshCategories: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cosmeglow_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [productsLoading, setProductsLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('cosmeglow_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeProduct, setActiveProductState] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('cosmeglow_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.logo && parsed.logo.includes('719242758050')) {
          parsed.logo = '/logo.png';
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved settings', e);
    }
    return {
      email: 'dabhisanjay901@gmail.com',
      whatsappNumber: '9023374410',
      themeColor: '#581C87',
      enableCreditCard: true,
      enablePaypal: true,
      enableCOD: true,
      shopName: 'CosmeGlow Skincare',
      address: '10, GURUKRUPA SOCIETY, NEAR ARCHANA SOCIETY, DABHOLI ROAD, KATARGAM SURAT GUJARAT 395004 India',
      gstNumber: '24AAAAA0000A1Z5',
      logo: '/logo.png',
      enableTax: false,
      taxPercentage: 8,
      taxName: 'GST',
      enableDeliveryCharge: false,
      deliveryCharge: 40,
      enableFreeDeliveryThreshold: false,
      freeDeliveryThreshold: 500,
      banners: [
        'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=1200&auto=format&fit=crop'
      ],
      homepageImages: {
        spotlight: 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop',
        spotlightName: 'Restorative Peptide Serum',
        spotlightDescription: 'A concentrated multi-peptide serum designed to target visible signs of aging, restore firmness, and deeply hydrate the skin.',
        spotlightPrice: 85,
        spotlightOldPrice: 110,
        about: {
          main: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
          secondary: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=600&auto=format&fit=crop'
        }
      }
    };
  });

  const updateLocalSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    applyThemeColor(newSettings.themeColor);
    try {
      localStorage.setItem('cosmeglow_settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error(e);
    }
  };

  const applyThemeColor = (color: string) => {
    if (!color) return;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', color);
    
    const lighten = adjustBrightness(color, 0.25);
    const darken = adjustBrightness(color, -0.3);
    root.style.setProperty('--color-primary-light', lighten);
    root.style.setProperty('--color-primary-dark', darken);
  };

  const adjustBrightness = (hex: string, percent: number) => {
    try {
      let R = parseInt(hex.substring(1, 3), 16);
      let G = parseInt(hex.substring(3, 5), 16);
      let B = parseInt(hex.substring(5, 7), 16);

      R = Math.max(0, Math.min(255, Math.round(R * (1 + percent))));
      G = Math.max(0, Math.min(255, Math.round(G * (1 + percent))));
      B = Math.max(0, Math.min(255, Math.round(B * (1 + percent))));

      const rHex = R.toString(16).padStart(2, '0');
      const gHex = G.toString(16).padStart(2, '0');
      const bHex = B.toString(16).padStart(2, '0');

      return `#${rHex}${gHex}${bHex}`;
    } catch {
      return hex;
    }
  };

  const refreshCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error refreshing categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
          applyThemeColor(data.themeColor);
          try {
            localStorage.setItem('cosmeglow_settings', JSON.stringify(data));
          } catch (e) {
            console.error(e);
          }
        }
      } catch (err) {
        console.error('Error fetching global settings:', err);
      }
    };
    fetchSettings();
    refreshCategories();
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('cosmeglow_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('cosmeglow_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      try {
        const apiProducts = await fetchPublicProducts();
        if (!cancelled) {
          setProducts(apiProducts);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        if (!cancelled) {
          setProductsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const addToCart = (product: Product, quantity: number, size?: string) => {
    if (product.stock !== undefined && product.stock <= 0) {
      toast.error(`"${product.name}" is currently out of stock.`);
      return;
    }

    const finalSize = size || product.volume || '50ml';
    const maxStock = product.stock ?? Infinity;

    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === finalSize
      );

      if (existingIdx > -1) {
        const existingQty = prevCart[existingIdx].quantity;
        const newQty = existingQty + quantity;
        if (newQty > maxStock) {
          toast.error(`Only ${maxStock} units of "${product.name}" are available in stock.`);
          return prevCart.map((item, idx) =>
            idx === existingIdx
              ? { ...item, quantity: maxStock }
              : item
          );
        }
        return prevCart.map((item, idx) =>
          idx === existingIdx
            ? { ...item, quantity: newQty }
            : item
        );
      }

      const initialQty = Math.min(quantity, maxStock);
      if (quantity > maxStock) {
        toast.error(`Only ${maxStock} units of "${product.name}" are available in stock.`);
      }
      return [...prevCart, { product, quantity: initialQty, selectedSize: finalSize }];
    });
  };

  const removeFromCart = (productId: string, size: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.product.id === productId && item.selectedSize === size))
    );
  };

  const updateCartQuantity = (productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId && item.selectedSize === size) {
          const maxStock = item.product.stock ?? Infinity;
          if (quantity > maxStock) {
            toast.error(`Only ${maxStock} units available in stock.`);
            return { ...item, quantity: maxStock };
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const toggleWishlist = (product: Product) => {
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.some((item) => item.id === product.id);
      if (exists) {
        return prevWishlist.filter((item) => item.id !== product.id);
      }
      return [...prevWishlist, product];
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some((item) => item.id === productId);
  };

  const clearCart = () => {
    setCart([]);
  };

  const setActiveProduct = (product: Product | null) => {
    setActiveProductState(product);
  };

  return (
    <StoreContext.Provider
      value={{
        cart,
        wishlist,
        products,
        productsLoading,
        categories,
        categoriesLoading,
        activeProduct,
        isCartOpen,
        isWishlistOpen,
        settings,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        toggleWishlist,
        isInWishlist,
        clearCart,
        setActiveProduct,
        setIsCartOpen,
        setIsWishlistOpen,
        updateLocalSettings,
        refreshCategories,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
