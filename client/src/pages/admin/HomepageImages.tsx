import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Image, 
  Upload, 
  RefreshCw, 
  Package, 
  CheckCircle2, 
  GripVertical, 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Check, 
  Sparkles,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '../../components/admin/AdminLayout';
import Card from '../../components/admin/Card';
import Button from '../../components/admin/Button';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { API_BASE_URL } from '../../config';
import { getPublicIdFromUrl, deleteCloudinaryAsset } from '../../services/cloudinary';

// Fast client-side image compressor: shrinks multi-megabyte banners down to ~200-300KB
const compressImage = (file: File, maxWidth = 1920, quality = 0.85): Promise<File> => {
  return new Promise((resolve) => {
    if (file.size < 350 * 1024 || !file.type.startsWith('image/')) {
      return resolve(file);
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              return resolve(file);
            }
            const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressed);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

const HomepageImages: React.FC = () => {
  const { accessToken } = useAuth();
  const { settings, updateLocalSettings, products } = useStore();
  const [loading, setLoading] = useState(true);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  
  const [banners, setBanners] = useState<string[]>([]);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [removingBanner, setRemovingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeBannerPreviewIndex, setActiveBannerPreviewIndex] = useState(0);

  // Drag & drop state for reordering banners
  const [draggedBannerIdx, setDraggedBannerIdx] = useState<number | null>(null);

  // Custom product dropdown state
  const [spotlightProductId, setSpotlightProductId] = useState<string>('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [images, setImages] = useState({
    aboutMain: '',
    aboutSecondary: '',
  });

  const [shopBanner, setShopBanner] = useState<string>('');
  const [shopBanners, setShopBanners] = useState<string[]>([]);
  const [activeShopBannerPreviewIndex, setActiveShopBannerPreviewIndex] = useState(0);
  const [uploadingShopBanner, setUploadingShopBanner] = useState(false);

  // Handle outside click for product dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const loadSettings = () => {
      if (settings) {
        setImages({
          aboutMain: settings.homepageImages?.about?.main || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
          aboutSecondary: settings.homepageImages?.about?.secondary || 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=600&auto=format&fit=crop',
        });
        setBanners(settings.banners || []);
        const sBanners = settings.shopBanners && settings.shopBanners.length > 0
          ? settings.shopBanners
          : (settings.shopBanner ? [settings.shopBanner] : []);
        setShopBanners(sBanners);
        setShopBanner(sBanners[0] || '');
        setSpotlightProductId(settings.homepageImages?.spotlightProductId || '');
      }
      setLoading(false);
    };
    loadSettings();
  }, [settings]);

  const handleImageUpload = async (file: File, field: 'aboutMain' | 'aboutSecondary') => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, PNG, and WEBP image uploads are supported.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image must be less than 8MB.');
      return;
    }

    setUploadingField(field);

    try {
      const optimizedFile = await compressImage(file, 1600, 0.85);
      const uploadFormData = new FormData();
      uploadFormData.append('image', optimizedFile);

      const response = await fetch(`${API_BASE_URL}/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        const oldUrl = images[field];
        const oldPublicId = getPublicIdFromUrl(oldUrl);
        if (oldPublicId && accessToken) {
          await deleteCloudinaryAsset(oldPublicId, accessToken);
        }
        setImages((prev) => ({ ...prev, [field]: data.url }));
        toast.success(`About Section image uploaded successfully!`);
      } else {
        const err = await response.json();
        toast.error(err.message || 'Image upload failed.');
      }
    } catch (error) {
      console.error('Image Upload Error:', error);
      toast.error('Image upload failed.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleBannerUpload = async (file: File) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, PNG, and WEBP image uploads are supported.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB.');
      return;
    }

    setUploadingBanner(true);

    try {
      // Fast client-side image compression: shrinks high-res photo to ~200-300KB for instant fast upload
      const optimizedFile = await compressImage(file, 1920, 0.85);
      const uploadFormData = new FormData();
      uploadFormData.append('image', optimizedFile);
      uploadFormData.append('folder', 'CosmeGlow/home-banners');

      const response = await fetch(`${API_BASE_URL}/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        setBanners((prev) => [...prev, data.url]);
        setActiveBannerPreviewIndex(banners.length);
        toast.success(`Banner uploaded and added to slides!`);
      } else {
        const err = await response.json();
        toast.error(err.message || 'Image upload failed.');
      }
    } catch (error) {
      console.error('Banner Upload Error:', error);
      toast.error('Banner upload failed.');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleRemoveBanner = async (index: number) => {
    setRemovingBanner(true);
    try {
      const url = banners[index];
      const publicId = getPublicIdFromUrl(url);
      if (publicId && accessToken) {
        await deleteCloudinaryAsset(publicId, accessToken);
      }
      setBanners((prev) => prev.filter((_, i) => i !== index));
      setActiveBannerPreviewIndex(0);
      toast.success('Banner removed. Save changes to apply.');
    } catch (error) {
      console.error('Error removing banner:', error);
      toast.error('Failed to remove banner.');
    } finally {
      setRemovingBanner(false);
    }
  };

  // Reordering banners (Up, Down, and Drag-and-Drop)
  const moveBanner = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= banners.length) return;
    setBanners((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
    setActiveBannerPreviewIndex(toIndex);
    toast.success(`Banner moved to position #${toIndex + 1}.`);
  };

  const handleDragStart = (index: number) => {
    setDraggedBannerIdx(index);
  };

  const handleDrop = (index: number) => {
    if (draggedBannerIdx !== null && draggedBannerIdx !== index) {
      moveBanner(draggedBannerIdx, index);
    }
    setDraggedBannerIdx(null);
  };

  const handleSave = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      const payload = {
        ...settings,
        shopBanner: shopBanners[0] || shopBanner || '',
        shopBanners: shopBanners,
        homepageImages: {
          ...settings.homepageImages,
          spotlightProductId: spotlightProductId,
          about: {
            main: images.aboutMain,
            secondary: images.aboutSecondary,
          },
        },
        banners: banners
      };

      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        updateLocalSettings({
          ...data.settings,
          shopBanners,
          shopBanner: shopBanners[0] || '',
          banners,
        });
        toast.success('Homepage settings updated successfully!');
      } else {
        toast.error('Failed to update homepage settings.');
      }
    } catch (error) {
      console.error('Error updating homepage settings:', error);
      toast.error('Failed to update homepage settings.');
    } finally {
      setSaving(false);
    }
  };

  // Find currently featured product (or automatic fallback)
  const currentlyFeaturedProduct = spotlightProductId
    ? products.find((p) => String(p.id) === String(spotlightProductId) || (p._id && String(p._id) === String(spotlightProductId)))
    : products.find((p) => p.isBestSeller) || products[0];

  // Filter products for the custom search dropdown
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()))
  );

  if (loading) {
    return (
      <AdminLayout title="Homepage Content">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Homepage Images & Content">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Homepage Layout & Media</h2>
            <p className="text-xs text-slate-400 mt-0.5">Configure the slider banner, spotlight product under banner, and about section visuals.</p>
          </div>
          <Button icon={Save} size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>

        <div className="space-y-8">
          
          {/* 1. FIRST SECTION: Auto-Scrolling Promo Banners Card */}
          <Card title="Auto-Scrolling Promo Banners" icon={Image}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start p-2">
              {/* Left Column - Live Slideshow Preview Simulation */}
              <div className="lg:col-span-5 space-y-3">
                {banners.length === 0 ? (
                  <div className="aspect-[4/3] bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center text-xs text-gray-400 shadow-inner font-sans">
                    No slideshow banners uploaded yet.
                  </div>
                ) : (
                  <div className="relative aspect-[4/3] bg-slate-50 border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
                    <img
                      src={banners[activeBannerPreviewIndex] || ''}
                      alt={`Live Slide Preview ${activeBannerPreviewIndex + 1}`}
                      className="w-full h-full object-cover transition-all duration-500 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />
                    
                    {/* Live Slide Number indicator */}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[9px] font-extrabold font-mono tracking-widest px-2.5 py-1 rounded-md shadow-xs">
                      SLIDE {activeBannerPreviewIndex + 1} / {banners.length}
                    </div>

                    {/* Dots indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {banners.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveBannerPreviewIndex(idx)}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            idx === activeBannerPreviewIndex 
                              ? 'bg-emerald-400 w-3' 
                              : 'bg-white/50 hover:bg-white'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Action Upload/Remove overlays */}
                    {(uploadingBanner || removingBanner) && (
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-20">
                        <RefreshCw size={24} className="animate-spin text-white" />
                        <span className="text-xs font-bold font-sans">
                          {uploadingBanner ? 'Optimizing & Uploading Fast...' : 'Removing Slide...'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="text-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Slideshow Live Simulator</span>
                </div>
              </div>

              {/* Right Column - Controls & Upload List with Drag and Drop Reordering */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-100 rounded-2xl flex-wrap gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-700 block">Slideshow Configurator & Order</span>
                    <p className="text-[11px] text-gray-400 leading-normal font-sans">
                      Add banners displayed in the auto-playing banner section. Drag the six-dot icon or use arrows to reorder slides.
                    </p>
                  </div>
                  <label className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition shrink-0 select-none">
                    {uploadingBanner ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Upload Slide</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingBanner || removingBanner}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleBannerUpload(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {banners.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-2xl p-6 text-center text-gray-400 text-xs font-sans">
                    No slides active. Upload an image above to start.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {banners.map((url, idx) => (
                      <div 
                        key={idx} 
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(idx)}
                        onClick={() => setActiveBannerPreviewIndex(idx)}
                        className={`flex items-center gap-3 p-3 border rounded-2xl transition-all duration-200 cursor-pointer ${
                          idx === activeBannerPreviewIndex 
                            ? 'border-emerald-500/40 bg-emerald-50/20 shadow-xs' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        } ${draggedBannerIdx === idx ? 'opacity-40 border-dashed border-primary' : ''}`}
                      >
                        {/* 1. Six-Dot Drag Reorder Handle */}
                        <div 
                          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
                          title="Drag to reorder slide position"
                        >
                          <GripVertical size={18} />
                        </div>

                        {/* 2. Up & Down Click Arrows for Fast Reordering */}
                        <div className="flex flex-col gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveBanner(idx, idx - 1)}
                            className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-slate-100 rounded transition-colors"
                            title="Move Up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === banners.length - 1}
                            onClick={() => moveBanner(idx, idx + 1)}
                            className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-slate-100 rounded transition-colors"
                            title="Move Down"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>

                        {/* Slide Number Badge */}
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                          idx === activeBannerPreviewIndex
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {idx + 1}
                        </div>

                        {/* Slide Thumbnail */}
                        <div className="w-16 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200/50">
                          <img src={url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>

                        {/* Slide Info */}
                        <div className="flex-grow min-w-0">
                          <span className="text-xs font-bold text-gray-800 block truncate font-sans">
                            Slideshow Banner #{idx + 1}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono block mt-0.5 truncate">{url}</span>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          disabled={removingBanner}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBanner(idx);
                          }}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-semibold text-[10px] rounded-lg transition cursor-pointer focus:outline-none shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* 1.5 SHOP PAGE BANNERS: Multi-banner auto-scroller for /shop */}
          <Card title="Shop Page Auto-Scrolling Banners" icon={Image}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start p-2">
              {/* Left Column - Preview */}
              <div className="lg:col-span-5 space-y-3">
                <div className="relative aspect-[16/7] bg-slate-50 border border-slate-150 rounded-2xl overflow-hidden flex items-center justify-center shadow-sm group">
                  {shopBanners.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Image size={32} className="opacity-30" />
                      <span className="text-xs font-sans">No shop banners uploaded yet.</span>
                    </div>
                  ) : (
                    <>
                      <img
                        src={shopBanners[activeShopBannerPreviewIndex] || ''}
                        alt="Shop Banner Preview"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                        onError={(e) => {
                          (e.target as any).src = 'https://placehold.co/1920x600?text=Shop+Banner';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 font-sans">
                        SLIDE {activeShopBannerPreviewIndex + 1} / {shopBanners.length}
                      </div>
                    </>
                  )}
                  {uploadingShopBanner && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-20">
                      <RefreshCw size={24} className="animate-spin text-white" />
                      <span className="text-xs font-bold font-sans">Optimizing & Uploading...</span>
                    </div>
                  )}
                </div>

                {/* Dot Indicators */}
                {shopBanners.length > 1 && (
                  <div className="flex justify-center items-center gap-1.5 py-1">
                    {shopBanners.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveShopBannerPreviewIndex(idx)}
                        className={`transition-all rounded-full ${
                          idx === activeShopBannerPreviewIndex
                            ? 'w-5 h-1.5 bg-primary'
                            : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
                <div className="text-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">
                    Live Shop Carousel Preview
                  </span>
                </div>
              </div>

              {/* Right Column - Controls & Slides List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1">
                  <span className="text-xs font-bold text-gray-700 block">Shop Page Banners</span>
                  <p className="text-[11px] text-gray-400 leading-normal font-sans">
                    These banners auto-scroll every 3 seconds on the <strong>/shop</strong> page. Upload wide landscape images (recommended: 1920×600px).
                  </p>
                </div>

                {/* Upload Button */}
                <div className="flex flex-wrap gap-3">
                  <label className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition shrink-0 select-none">
                    {uploadingShopBanner ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Add Shop Banner</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingShopBanner}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                        if (!allowedTypes.includes(file.type)) {
                          toast.error('Only JPG, JPEG, PNG, and WEBP uploads are supported.');
                          return;
                        }
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error('Image must be less than 10MB.');
                          return;
                        }
                        setUploadingShopBanner(true);
                        try {
                          const optimizedFile = await compressImage(file, 1920, 0.85);
                          const uploadFormData = new FormData();
                          uploadFormData.append('image', optimizedFile);
                          uploadFormData.append('folder', 'CosmeGlow/shop-banners');
                          const response = await fetch(`${API_BASE_URL}/admin/upload`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${accessToken}` },
                            body: uploadFormData,
                          });
                          if (response.ok) {
                            const data = await response.json();
                            setShopBanners((prev) => [...prev, data.url]);
                            setActiveShopBannerPreviewIndex(shopBanners.length);
                            toast.success('Shop banner added!');
                          } else {
                            const err = await response.json();
                            toast.error(err.message || 'Image upload failed.');
                          }
                        } catch (error) {
                          console.error('Shop Banner Upload Error:', error);
                          toast.error('Image upload failed.');
                        } finally {
                          setUploadingShopBanner(false);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Slides List */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-700 block">Uploaded Slides ({shopBanners.length})</span>
                  {shopBanners.length === 0 ? (
                    <div className="p-4 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
                      No banners uploaded.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {shopBanners.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => setActiveShopBannerPreviewIndex(idx)}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            idx === activeShopBannerPreviewIndex
                              ? 'border-primary bg-primary/5 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Shop Slide ${idx + 1}`}
                            className="w-14 h-9 object-cover rounded-lg shrink-0 border border-slate-100"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-800 block truncate">Slide {idx + 1}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{url}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (idx > 0) {
                                  const updated = [...shopBanners];
                                  const temp = updated[idx - 1];
                                  updated[idx - 1] = updated[idx];
                                  updated[idx] = temp;
                                  setShopBanners(updated);
                                  setActiveShopBannerPreviewIndex(idx - 1);
                                }
                              }}
                              disabled={idx === 0}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (idx < shopBanners.length - 1) {
                                  const updated = [...shopBanners];
                                  const temp = updated[idx + 1];
                                  updated[idx + 1] = updated[idx];
                                  updated[idx] = temp;
                                  setShopBanners(updated);
                                  setActiveShopBannerPreviewIndex(idx + 1);
                                }
                              }}
                              disabled={idx === shopBanners.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                const oldPublicId = getPublicIdFromUrl(url);
                                if (oldPublicId && accessToken) {
                                  await deleteCloudinaryAsset(oldPublicId, accessToken);
                                }
                                setShopBanners((prev) => prev.filter((_, i) => i !== idx));
                                setActiveShopBannerPreviewIndex(0);
                                toast.success('Slide removed. Save changes to apply.');
                              }}
                              className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* 2. SECOND SECTION: Proper Custom Product Dropdown (Under Banner) */}
          <Card title="Spotlight Flagship Product (Displayed Under Banner)" icon={Package}>
            <div className="p-2 space-y-5">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-xl">
                  <span className="text-xs font-bold text-slate-800 block">
                    Choose Product Displayed Below Banner
                  </span>
                  <p className="text-[11px] text-slate-500 leading-normal font-sans">
                    Select any product from your store. It will be featured on the homepage right under the slider banner with its real photos, pricing, volume, and Buy Now button.
                  </p>
                </div>

                {/* Custom Stylized Product Dropdown with Live Search & Thumbnails */}
                <div className="w-full md:w-96 shrink-0 relative" ref={dropdownRef}>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 font-sans">
                    Select Product:
                  </label>

                  {/* Dropdown Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setIsProductDropdownOpen((prev) => !prev)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-250 hover:border-primary/60 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-800 shadow-2xs transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {spotlightProductId ? (
                        currentlyFeaturedProduct ? (
                          <>
                            <img
                              src={currentlyFeaturedProduct.image}
                              alt={currentlyFeaturedProduct.name}
                              className="w-6 h-6 rounded-md object-cover border border-slate-200 shrink-0"
                            />
                            <span className="truncate font-bold text-slate-800">{currentlyFeaturedProduct.name}</span>
                            <span className="text-slate-400 font-normal shrink-0">₹{currentlyFeaturedProduct.price.toFixed(0)}</span>
                            {currentlyFeaturedProduct.isBestSeller && (
                              <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-bold shrink-0">★ Best Seller</span>
                            )}
                          </>
                        ) : (
                          <span>Selected Product</span>
                        )
                      ) : (
                        <div className="flex items-center gap-1.5 text-primary">
                          <Sparkles size={14} />
                          <span className="font-bold">Automatic (Latest Best Seller)</span>
                        </div>
                      )}
                    </div>
                    <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-200 ${isProductDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Popover Menu */}
                  {isProductDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 max-h-80 overflow-y-auto space-y-1">
                      {/* Search Filter Box */}
                      <div className="relative mb-2 px-1">
                        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search products by name..."
                          className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white font-sans"
                        />
                        {productSearch && (
                          <button
                            type="button"
                            onClick={() => setProductSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {/* Option 1: Automatic / Latest Best Seller */}
                      <div
                        onClick={() => {
                          setSpotlightProductId('');
                          setIsProductDropdownOpen(false);
                          setProductSearch('');
                        }}
                        className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                          !spotlightProductId ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Sparkles size={14} />
                          </div>
                          <div>
                            <span className="text-xs font-bold block">Automatic (Latest Best Seller)</span>
                            <span className="text-[10px] text-slate-400 font-sans block">Auto-selects the newest flagship best seller from store</span>
                          </div>
                        </div>
                        {!spotlightProductId && <Check size={16} className="text-primary shrink-0" />}
                      </div>

                      {/* Option 2: Products List */}
                      {filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 font-sans">
                          No products found matching "{productSearch}".
                        </div>
                      ) : (
                        filteredProducts.map((p) => {
                          const isSelected = String(spotlightProductId) === String(p.id) || (p._id && String(spotlightProductId) === String(p._id));
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSpotlightProductId(p.id);
                                setIsProductDropdownOpen(false);
                                setProductSearch('');
                              }}
                              className={`p-2 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                                isSelected ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                                />
                                <div className="truncate">
                                  <span className="text-xs font-bold block truncate">{p.name}</span>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-sans">
                                    <span>₹{p.price.toFixed(2)}</span>
                                    <span>•</span>
                                    <span>{p.category || 'Skincare'}</span>
                                    {p.isBestSeller && (
                                      <span className="text-amber-700 font-bold bg-amber-50 px-1 py-0.2 rounded text-[9px]">★ Best Seller</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {isSelected && <Check size={16} className="text-primary shrink-0 ml-2" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Product Preview Card */}
              {currentlyFeaturedProduct ? (
                <div className="border border-slate-200/80 bg-white rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-5 shadow-xs">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0">
                    <img
                      src={currentlyFeaturedProduct.image}
                      alt={currentlyFeaturedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-2 flex-grow text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {currentlyFeaturedProduct.category || 'Skincare'}
                      </span>
                      {currentlyFeaturedProduct.isBestSeller && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                          ★ Best Seller
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        Active on Homepage Under Banner
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-800 font-display">
                      {currentlyFeaturedProduct.name}
                    </h3>

                    <div className="flex items-baseline justify-center sm:justify-start gap-2.5">
                      <span className="text-base font-bold text-slate-900 font-display">
                        ₹{currentlyFeaturedProduct.price.toFixed(2)}
                      </span>
                      {currentlyFeaturedProduct.oldPrice && currentlyFeaturedProduct.oldPrice > currentlyFeaturedProduct.price && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{currentlyFeaturedProduct.oldPrice.toFixed(2)}
                        </span>
                      )}
                      {currentlyFeaturedProduct.volume && (
                        <span className="text-xs text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-md ml-2 font-display">
                          {currentlyFeaturedProduct.volume}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400 font-sans">
                  No products found in store catalog. Please add a product first.
                </div>
              )}
            </div>
          </Card>

          {/* 3. THIRD SECTION: About Section Combined Images (Side-by-Side in 1 Card) */}
          <Card title="About Us Section Images" icon={Image}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-2 items-start">
              
              {/* Left Column: Main Editorial Image */}
              <div className="space-y-4 border border-slate-100 bg-slate-50/40 p-4 rounded-2xl">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">1. Main Editorial Cover Image</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Large portrait editorial cover image displayed inside the About section.</p>
                </div>

                <div className="relative aspect-[4/3] bg-slate-50 border rounded-2xl overflow-hidden flex items-center justify-center border-slate-150 shadow-inner group">
                  <img
                    src={images.aboutMain}
                    alt="About Main Preview"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                    onError={(e) => {
                      (e.target as any).src = 'https://placehold.co/800x600?text=About+Main+Image';
                    }}
                  />

                  <label className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-slate-800 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition hover:scale-102 select-none border border-slate-100/50">
                    <Upload size={13} className="text-slate-600" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'aboutMain');
                      }}
                      className="hidden"
                    />
                  </label>

                  {uploadingField === 'aboutMain' && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                      <RefreshCw size={24} className="animate-spin text-white" />
                      <span className="text-xs font-bold font-sans">Uploading Cover...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">Image URL Path</label>
                  <input
                    type="text"
                    value={images.aboutMain}
                    onChange={(e) => setImages({ ...images, aboutMain: e.target.value })}
                    placeholder="Enter main about image URL..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-xs bg-white"
                  />
                </div>
              </div>

              {/* Right Column: Secondary Overlapping Image */}
              <div className="space-y-4 border border-slate-100 bg-slate-50/40 p-4 rounded-2xl">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">2. Secondary Overlapping Image</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-sans">Secondary overlapping overlay thumbnail at the bottom left of the About block.</p>
                </div>

                <div className="relative aspect-[4/3] bg-slate-50 border rounded-2xl overflow-hidden flex items-center justify-center border-slate-150 shadow-inner group">
                  <img
                    src={images.aboutSecondary}
                    alt="About Secondary Preview"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                    onError={(e) => {
                      (e.target as any).src = 'https://placehold.co/800x600?text=About+Secondary+Image';
                    }}
                  />

                  <label className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-slate-800 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition hover:scale-102 select-none border border-slate-100/50">
                    <Upload size={13} className="text-slate-600" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'aboutSecondary');
                      }}
                      className="hidden"
                    />
                  </label>

                  {uploadingField === 'aboutSecondary' && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                      <RefreshCw size={24} className="animate-spin text-white" />
                      <span className="text-xs font-bold font-sans">Uploading Cover...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">Image URL Path</label>
                  <input
                    type="text"
                    value={images.aboutSecondary}
                    onChange={(e) => setImages({ ...images, aboutSecondary: e.target.value })}
                    placeholder="Enter secondary about image URL..."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-xs bg-white"
                  />
                </div>
              </div>

            </div>
          </Card>

        </div>
      </div>
    </AdminLayout>
  );
};

export default HomepageImages;
