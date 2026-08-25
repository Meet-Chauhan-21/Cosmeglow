import React, { useState, useEffect } from 'react';
import { Save, Image, Upload, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '../../components/admin/AdminLayout';
import Card from '../../components/admin/Card';
import Button from '../../components/admin/Button';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { API_BASE_URL } from '../../config';
import { getPublicIdFromUrl, deleteCloudinaryAsset } from '../../services/cloudinary';

const HomepageImages: React.FC = () => {
  const { accessToken } = useAuth();
  const { settings, updateLocalSettings } = useStore();
  const [loading, setLoading] = useState(true);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  
  const [banners, setBanners] = useState<string[]>([]);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [removingBanner, setRemovingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeBannerPreviewIndex, setActiveBannerPreviewIndex] = useState(0);



  const [images, setImages] = useState({
    spotlight: '',
    aboutMain: '',
    aboutSecondary: '',
  });

  const [spotlightText, setSpotlightText] = useState({
    name: '',
    description: '',
    price: '',
    oldPrice: '',
  });

  useEffect(() => {
    const loadSettings = () => {
      if (settings) {
        setImages({
          spotlight: settings.homepageImages?.spotlight || 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop',
          aboutMain: settings.homepageImages?.about?.main || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
          aboutSecondary: settings.homepageImages?.about?.secondary || 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=600&auto=format&fit=crop',
        });
        setBanners(settings.banners || []);
        setSpotlightText({
          name: settings.homepageImages?.spotlightName || 'Restorative Peptide Serum',
          description: settings.homepageImages?.spotlightDescription || 'A concentrated multi-peptide serum designed to target visible signs of aging, restore firmness, and deeply hydrate the skin.',
          price: (settings.homepageImages?.spotlightPrice ?? 85).toString(),
          oldPrice: settings.homepageImages?.spotlightOldPrice === null
            ? ''
            : (settings.homepageImages?.spotlightOldPrice ?? 110).toString(),
        });
      }
      setLoading(false);
    };
    loadSettings();
  }, [settings]);

  const handleImageUpload = async (file: File, field: 'spotlight' | 'aboutMain' | 'aboutSecondary') => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, PNG, and WEBP image uploads are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Cover image must be less than 5MB.');
      return;
    }

    setUploadingField(field);
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    try {
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
        toast.success(`${field === 'spotlight' ? 'Spotlight' : 'About Section'} image uploaded successfully!`);
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

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB.');
      return;
    }

    setUploadingBanner(true);
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    try {
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
        toast.success(`Banner uploaded successfully!`);
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
      toast.error('Failed to remove banner from CDN.');
    } finally {
      setRemovingBanner(false);
    }
  };

  const handleSave = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      const payload = {
        ...settings,
        homepageImages: {
          spotlight: images.spotlight,
          spotlightName: spotlightText.name,
          spotlightDescription: spotlightText.description,
          spotlightPrice: parseFloat(spotlightText.price) || 0,
          spotlightOldPrice: spotlightText.oldPrice ? parseFloat(spotlightText.oldPrice) : null,
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
        updateLocalSettings(data.settings);
        toast.success('Homepage images updated successfully!');
      } else {
        toast.error('Failed to update homepage images.');
      }
    } catch (error) {
      console.error('Error updating homepage images:', error);
      toast.error('Failed to update homepage images.');
    } finally {
      setSaving(false);
    }
  };

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
    <AdminLayout title="Homepage Images">
      <div className="space-y-6">
        <div className="flex items-center justify-end border-b border-slate-100 pb-4">
          <Button icon={Save} size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </Button>
        </div>

        <div className="space-y-8">
          
          {/* Spotlight Formulation Image Card */}
          <Card title="Spotlight Formulation Settings" icon={Image}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start p-2">
              {/* Left Column - Image Preview */}
              <div className="lg:col-span-5 space-y-3">
                <div className="relative aspect-[4/3] bg-slate-50 border rounded-2xl overflow-hidden flex items-center justify-center border-slate-150 shadow-inner group">
                  <img
                    src={images.spotlight}
                    alt="Spotlight Preview"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                    onError={(e) => {
                      (e.target as any).src = 'https://placehold.co/800x600?text=Spotlight+Image';
                    }}
                  />
                  
                  {/* Floating Action Button inside Preview Card */}
                  <label className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-slate-800 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition hover:scale-102 select-none border border-slate-100/50">
                    <Upload size={13} className="text-slate-600" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'spotlight');
                      }}
                      className="hidden"
                    />
                  </label>

                  {uploadingField === 'spotlight' && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                      <RefreshCw size={24} className="animate-spin text-white" />
                      <span className="text-xs font-bold font-sans">Uploading Cover...</span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Active Formulation Preview</span>
                </div>
              </div>

              {/* Right Column - Controls & Texts */}
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-700 block">Spotlight Product Image</span>
                  <p className="text-[11px] text-gray-400 leading-normal font-sans">
                    This close-up asset displays inside the flagship product spotlight formulation block. Suggested 4:3 portrait aspect.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Image URL Path</label>
                  <input
                    type="text"
                    value={images.spotlight}
                    onChange={(e) => setImages({ ...images, spotlight: e.target.value })}
                    placeholder="Enter spotlight image URL..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-xs bg-slate-50/50"
                  />
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Spotlight Product Name</label>
                    <input
                      type="text"
                      value={spotlightText.name}
                      onChange={(e) => setSpotlightText({ ...spotlightText, name: e.target.value })}
                      placeholder="e.g. Restorative Peptide Serum"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-xs animate-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                    <textarea
                      value={spotlightText.description}
                      onChange={(e) => setSpotlightText({ ...spotlightText, description: e.target.value })}
                      placeholder="Enter product description..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-xs resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        value={spotlightText.price}
                        onChange={(e) => setSpotlightText({ ...spotlightText, price: e.target.value })}
                        placeholder="85.00"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Compare At Price (₹)</label>
                      <input
                        type="number"
                        value={spotlightText.oldPrice}
                        onChange={(e) => setSpotlightText({ ...spotlightText, oldPrice: e.target.value })}
                        placeholder="110.00"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* About Section Main Editorial Image Card */}
          <Card title="About Section — Main Editorial Image" icon={Image}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start p-2">
              {/* Left Column - Image Preview */}
              <div className="lg:col-span-5 space-y-3">
                <div className="relative aspect-[4/3] bg-slate-50 border rounded-2xl overflow-hidden flex items-center justify-center border-slate-150 shadow-inner group">
                  <img
                    src={images.aboutMain}
                    alt="About Main Preview"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                    onError={(e) => {
                      (e.target as any).src = 'https://placehold.co/800x600?text=About+Main+Image';
                    }}
                  />

                  {/* Floating Action Button inside Preview Card */}
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
                <div className="text-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Active Editorial Cover</span>
                </div>
              </div>

              {/* Right Column - Controls & Texts */}
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-700 block">Editorial Cover Image</span>
                  <p className="text-[11px] text-gray-400 leading-normal font-sans">
                    This represents the large portrait editorial cover image displayed inside the main "About CosmeGlow" storytelling segment on your homepage.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Image URL Path</label>
                  <input
                    type="text"
                    value={images.aboutMain}
                    onChange={(e) => setImages({ ...images, aboutMain: e.target.value })}
                    placeholder="Enter main about image URL..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-xs bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* About Section Secondary Overlapping Image Card */}
          <Card title="About Section — Secondary Overlapping Image" icon={Image}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start p-2">
              {/* Left Column - Image Preview */}
              <div className="lg:col-span-5 space-y-3">
                <div className="relative aspect-[4/3] bg-slate-50 border rounded-2xl overflow-hidden flex items-center justify-center border-slate-150 shadow-inner group">
                  <img
                    src={images.aboutSecondary}
                    alt="About Secondary Preview"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                    onError={(e) => {
                      (e.target as any).src = 'https://placehold.co/800x600?text=About+Secondary+Image';
                    }}
                  />

                  {/* Floating Action Button inside Preview Card */}
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
                <div className="text-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Active Overlapping Thumbnail</span>
                </div>
              </div>

              {/* Right Column - Controls & Texts */}
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-700 block">Overlapping Thumbnail Asset</span>
                  <p className="text-[11px] text-gray-400 leading-normal font-sans">
                    This represents the secondary overlapping overlay square image at the bottom left of the editorial About Block.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Image URL Path</label>
                  <input
                    type="text"
                    value={images.aboutSecondary}
                    onChange={(e) => setImages({ ...images, aboutSecondary: e.target.value })}
                    placeholder="Enter secondary about image URL..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-xs bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Homepage Scrolling Banners Card */}
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
                    <div className="absolute inset-0 bg-linear-to-t from-black/45 to-transparent pointer-events-none" />
                    
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
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-350 ${
                            idx === activeBannerPreviewIndex 
                              ? 'bg-emerald-450 w-3' 
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
                          {uploadingBanner ? 'Uploading Slide...' : 'Removing Slide...'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="text-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block font-sans">Slideshow Live Simulator</span>
                </div>
              </div>

              {/* Right Column - Controls & Upload List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-100 rounded-2xl flex-wrap gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-700 block">Slideshow Configurator</span>
                    <p className="text-[11px] text-gray-400 leading-normal font-sans">
                      Add banners displayed in the auto-playing hero banner section. Wide images (e.g. 1200x420) are recommended.
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
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {banners.map((url, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setActiveBannerPreviewIndex(idx)}
                        className={`flex items-center gap-3.5 p-3 border rounded-2xl transition-all duration-300 cursor-pointer ${
                          idx === activeBannerPreviewIndex 
                            ? 'border-emerald-500/30 bg-emerald-50/10' 
                            : 'border-gray-150 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                          idx === activeBannerPreviewIndex
                            ? 'bg-emerald-550 text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="w-16 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200/50">
                          <img src={url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <span className="text-xs font-bold text-gray-800 block truncate font-sans">Slideshow Banner #{idx + 1}</span>
                          <span className="text-[10px] text-gray-450 font-mono block mt-0.5 truncate">{url}</span>
                        </div>
                        <button
                          type="button"
                          disabled={removingBanner}
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid selecting index right before deletion
                            handleRemoveBanner(idx);
                          }}
                          className="px-3.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 font-semibold text-[10px] rounded-lg transition cursor-pointer focus:outline-none shrink-0"
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
        </div>

      </div>
    </AdminLayout>
  );
};

export default HomepageImages;
