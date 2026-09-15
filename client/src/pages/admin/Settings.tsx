import React, { useState, useEffect, useRef } from 'react';
import { Save, Palette, CreditCard, Upload, X, Percent } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '../../components/admin/AdminLayout';
import Card from '../../components/admin/Card';
import Button from '../../components/admin/Button';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { API_BASE_URL } from '../../config';
import { getPublicIdFromUrl, deleteCloudinaryAsset } from '../../services/cloudinary';

const Settings: React.FC = () => {
  const { accessToken } = useAuth();
  const { updateLocalSettings } = useStore();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const triggerColorPicker = () => {
    colorInputRef.current?.click();
  };

  const [formData, setFormData] = useState({
    email: '',
    whatsappNumber: '',
    themeColor: '#581C87',
    enableCreditCard: true,
    enableRazorpay: true,
    razorpayKeyId: 'rzp_test_TFHJjhLymJTyfs',
    enablePaypal: true,
    enableCOD: true,
    facebookAppId: '',
    shopName: '',
    address: '',
    gstNumber: '',
    logo: '',
    enableTax: false,
    taxPercentage: 8,
    taxName: 'GST',
    enableDeliveryCharge: false,
    deliveryCharge: 40,
    enableFreeDeliveryThreshold: false,
    freeDeliveryThreshold: 500,
  });

  const presetColors = [
    { name: 'Deep Purple', value: '#581C87' },
    { name: 'Green Success', value: '#16A34A' },
    { name: 'Coffee Brown', value: '#6F4E37' },
    { name: 'Sky Blue', value: '#0284C7' },
    { name: 'Amber Orange', value: '#D97706' },
    { name: 'Rose Red', value: '#E11D48' }
  ];

  const [recentColors, setRecentColors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recentColors');
      return saved ? JSON.parse(saved) : ['#581C87', '#16A34A', '#0284C7'];
    } catch {
      return ['#581C87', '#16A34A', '#0284C7'];
    }
  });

  const updateThemeColor = (color: string) => {
    setFormData(prev => ({ ...prev, themeColor: color }));
    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toLowerCase() !== color.toLowerCase());
      const updated = [color, ...filtered].slice(0, 6);
      localStorage.setItem('recentColors', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    const fetchSettings = async () => {
      if (!accessToken) return;
      try {
        const response = await fetch(`${API_BASE_URL}/admin/settings`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setFormData({
              email: data.settings.email || '',
              whatsappNumber: data.settings.whatsappNumber || '',
              themeColor: data.settings.themeColor || '#581C87',
              enableCreditCard: data.settings.enableCreditCard !== false,
              enableRazorpay: data.settings.enableRazorpay !== false,
              razorpayKeyId: data.settings.razorpayKeyId || 'rzp_test_TFHJjhLymJTyfs',
              enablePaypal: data.settings.enablePaypal !== false,
              enableCOD: data.settings.enableCOD !== false,
              facebookAppId: data.settings.facebookAppId || '',
              shopName: data.settings.shopName || 'CosmeGlow Skincare',
              address: data.settings.address || '',
              gstNumber: data.settings.gstNumber || '',
              logo: data.settings.logo || '',
              enableTax: data.settings.enableTax || false,
              taxPercentage: data.settings.taxPercentage ?? 8,
              taxName: data.settings.taxName || 'GST',
              enableDeliveryCharge: data.settings.enableDeliveryCharge || false,
              deliveryCharge: data.settings.deliveryCharge ?? 40,
              enableFreeDeliveryThreshold: data.settings.enableFreeDeliveryThreshold || false,
              freeDeliveryThreshold: data.settings.freeDeliveryThreshold ?? 500,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching admin settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [accessToken]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/avif'];
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      toast.error('Invalid file type. Only JPG, JPEG, PNG, WEBP, AVIF, and SVG images are supported.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB.');
      return;
    }

    setUploading(true);
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: uploadFormData
      });

      if (response.ok) {
        const data = await response.json();
        const uploadedUrl = data.url;

        // If there was an old logo, delete it from Cloudinary
        if (formData.logo && formData.logo !== uploadedUrl) {
          const oldPublicId = getPublicIdFromUrl(formData.logo);
          if (oldPublicId && accessToken) {
            deleteCloudinaryAsset(oldPublicId, accessToken).catch(err => console.warn('Old logo deletion ignored:', err));
          }
        }

        const updatedData = { ...formData, logo: uploadedUrl };
        setFormData(updatedData);

        // Auto-save the uploaded logo directly to store settings
        if (accessToken) {
          const saveRes = await fetch(`${API_BASE_URL}/admin/settings`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(updatedData)
          });
          if (saveRes.ok) {
            const savedJson = await saveRes.json();
            updateLocalSettings(savedJson.settings);
            toast.success('Logo uploaded and saved successfully!');
          } else {
            toast.success('Logo uploaded (click Save Settings to confirm)');
          }
        } else {
          toast.success('Logo uploaded successfully');
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        toast.error(errData.message || 'Failed to upload logo to Cloudinary');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error uploading logo');
    } finally {
      setUploading(false);
      // Reset input value so same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!formData.logo) return;
    
    const publicId = getPublicIdFromUrl(formData.logo);
    if (publicId && accessToken) {
      toast.loading('Deleting logo from Cloudinary...', { id: 'delete-logo' });
      const success = await deleteCloudinaryAsset(publicId, accessToken);
      if (success) {
        toast.success('Logo deleted from Cloudinary', { id: 'delete-logo' });
      } else {
        toast.error('Failed to delete logo from Cloudinary, cleared locally', { id: 'delete-logo' });
      }
    }
    
    const updatedData = { ...formData, logo: '' };
    setFormData(updatedData);

    // Auto-save cleared logo to database
    if (accessToken) {
      try {
        const saveRes = await fetch(`${API_BASE_URL}/admin/settings`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(updatedData)
        });
        if (saveRes.ok) {
          const savedJson = await saveRes.json();
          updateLocalSettings(savedJson.settings);
        }
      } catch (e) {
        console.error('Error saving cleared logo:', e);
      }
    }
  };

  const handleSave = async () => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        const data = await response.json();
        updateLocalSettings(data.settings);
        toast.success('Settings saved successfully');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Settings">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <div className="space-y-6 pb-10">
 
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <Card title="Store Settings & Contacts" icon={Palette}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Support Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-sm"
                      placeholder="support@cosmeglow.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp Number (Orders)</label>
                    <input
                      type="tel"
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-sm"
                      placeholder="9023374410"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Name</label>
                    <input
                      type="text"
                      value={formData.shopName}
                      onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-sm"
                      placeholder="CosmeGlow Skincare"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">GST Number</label>
                    <input
                      type="text"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-sm"
                      placeholder="24AAAAA0000A1Z5"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Store Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-sm min-h-[80px]"
                    placeholder="Store address..."
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 mt-4 items-center">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Store Logo</label>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors shadow-3xs text-slate-700 font-sans text-sm border-dashed">
                        <Upload size={16} className={uploading ? 'animate-spin' : ''} />
                        <span>{uploading ? 'Uploading...' : 'Upload Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                      
                      {formData.logo && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="flex items-center gap-1.5 px-4 py-3 border border-red-200 text-red-655 rounded-2xl hover:bg-red-50 transition-all font-sans text-sm cursor-pointer shadow-3xs focus:outline-none"
                        >
                          <X size={15} />
                          <span>Remove Logo</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Logo Preview</label>
                    <div className="h-14 w-36 border border-gray-200 rounded-2xl bg-slate-50/50 flex items-center justify-center overflow-hidden shadow-3xs p-1">
                      {formData.logo ? (
                        <img src={formData.logo} alt="Store Logo Preview" className="h-full w-auto object-contain" />
                      ) : (
                        <img src="/logo.png" alt="Official Logo" className="h-full w-auto object-contain opacity-80" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
 
            <Card title="Theme Customization" icon={Palette}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Select Preset Theme Accent Color</label>
                  
                  {/* Preset Colors Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {presetColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => updateThemeColor(color.value)}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-50/50 ${
                          formData.themeColor.toLowerCase() === color.value.toLowerCase()
                            ? 'border-indigo-500 ring-2 ring-indigo-500/10 bg-indigo-50/10'
                            : 'border-slate-200'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full shadow-inner border border-black/10"
                          style={{ backgroundColor: color.value }}
                        />
                        <span className="text-[10px] font-semibold text-slate-600 truncate max-w-full">
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
 
                  {/* Custom Color Selector & Selected Color Preview Box */}
                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <label className="block text-sm font-semibold text-slate-700">Custom Accent Color Selection</label>
                    <div className="flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
                      {/* Color Palette Selector box */}
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-250/60 shadow-3xs flex items-center justify-center cursor-pointer bg-white shrink-0">
                        <input
                          ref={colorInputRef}
                          type="color"
                          value={formData.themeColor}
                          onChange={(e) => updateThemeColor(e.target.value)}
                          className="absolute inset-0 w-full h-full scale-150 cursor-pointer border-none bg-transparent"
                        />
                      </div>
                      
                      {/* Small Preview Box of selected color */}
                      <div
                        className="w-10 h-10 rounded-lg border border-slate-300 shadow-inner transition-all duration-300 shrink-0"
                        style={{ backgroundColor: formData.themeColor }}
                        title="Selected Accent Preview"
                      />
 
                      <button
                        type="button"
                        onClick={triggerColorPicker}
                        className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-all font-sans text-xs font-semibold cursor-pointer shadow-3xs rounded-xl focus:outline-none"
                      >
                        <Palette size={14} className="text-slate-500" />
                        <span>Choose Color</span>
                      </button>
 
                      <div className="flex-1 min-w-[100px]">
                        <p className="text-xs font-bold text-slate-800">Hex Code</p>
                        <input
                          type="text"
                          value={formData.themeColor}
                          onChange={(e) => updateThemeColor(e.target.value)}
                          className="mt-1 font-mono text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 w-24 uppercase"
                        />
                      </div>
                    </div>
                  </div>
 
                  {/* Recent Colors list display */}
                  {recentColors.length > 0 && (
                    <div className="border-t border-slate-100 pt-5">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Recently Used Accents</p>
                      <div className="flex gap-2">
                        {recentColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => updateThemeColor(color)}
                            className={`w-7 h-7 rounded-lg border hover:scale-105 transition-all cursor-pointer shadow-3xs ${
                              formData.themeColor.toLowerCase() === color.toLowerCase()
                                ? 'border-indigo-600 ring-2 ring-indigo-500/10'
                                : 'border-slate-250/70'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6">
            <Card title="Active Payment Methods & Gateways" icon={CreditCard}>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer p-3.5 border border-gray-150 rounded-2xl hover:bg-gray-50/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.enableRazorpay}
                    onChange={(e) => setFormData({ ...formData, enableRazorpay: e.target.checked })}
                    className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-800 block">Razorpay Gateway (UPI, Cards, Netbanking)</span>
                    <span className="text-xs text-gray-500 block mt-0.5">Enable official Razorpay online payment checkout flow.</span>
                  </div>
                </label>
   
                {formData.enableRazorpay && (
                  <div className="p-3.5 bg-indigo-50/60 border border-indigo-150 rounded-2xl text-left flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0 animate-pulse" />
                    <p className="text-xs text-indigo-900 font-sans leading-relaxed">
                      <strong>Environment Security Enforced:</strong> Razorpay Credentials (Key ID & Secret Key) are safely loaded strictly from <code className="text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono text-[11px]">server/.env</code> and <code className="text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono text-[11px]">client/.env</code> files.
                    </p>
                  </div>
                )}
   
                <label className="flex items-center gap-3 cursor-pointer p-3.5 border border-gray-150 rounded-2xl hover:bg-gray-50/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.enableCOD}
                    onChange={(e) => setFormData({ ...formData, enableCOD: e.target.checked })}
                    className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-semibold text-gray-800 block">Cash on Delivery (COD)</span>
                    <span className="text-xs text-gray-500 block mt-0.5">Accept order placements with COD processing option.</span>
                  </div>
                </label>
              </div>
            </Card>

            <Card title="Tax & Delivery Settings" icon={Percent}>
              <div className="space-y-4">
                {/* Tax Settings */}
                <div className="border-b border-gray-100 pb-4">
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={formData.enableTax}
                      onChange={(e) => setFormData({ ...formData, enableTax: e.target.checked })}
                      className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-800 block">Enable Taxes / GST</span>
                      <span className="text-xs text-gray-500 block mt-0.5">Toggle to add tax to order totals.</span>
                    </div>
                  </label>
                  
                  {formData.enableTax && (
                    <div className="grid grid-cols-2 gap-4 pl-8">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Tax Label / Name</label>
                        <input
                          type="text"
                          value={formData.taxName}
                          onChange={(e) => setFormData({ ...formData, taxName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-xs"
                          placeholder="e.g. GST"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Tax Percentage (%)</label>
                        <input
                          type="number"
                          value={formData.taxPercentage}
                          onChange={(e) => setFormData({ ...formData, taxPercentage: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-xs"
                          placeholder="e.g. 18"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Delivery Settings */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={formData.enableDeliveryCharge}
                      onChange={(e) => setFormData({ ...formData, enableDeliveryCharge: e.target.checked })}
                      className="w-5 h-5 text-primary rounded focus:ring-primary cursor-pointer"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-800 block">Enable Delivery Charges</span>
                      <span className="text-xs text-gray-500 block mt-0.5">Charge standard shipping on orders.</span>
                    </div>
                  </label>
                  
                  {formData.enableDeliveryCharge && (
                    <div className="space-y-3 pl-8">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Standard Delivery Charge (₹)</label>
                        <input
                          type="number"
                          value={formData.deliveryCharge}
                          onChange={(e) => setFormData({ ...formData, deliveryCharge: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-xs"
                          placeholder="e.g. 40"
                        />
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer mt-2 mb-1">
                        <input
                          type="checkbox"
                          checked={formData.enableFreeDeliveryThreshold}
                          onChange={(e) => setFormData({ ...formData, enableFreeDeliveryThreshold: e.target.checked })}
                          className="w-4 h-4 text-primary rounded focus:ring-primary cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-gray-700">Offer Free Delivery above a threshold</span>
                      </label>

                      {formData.enableFreeDeliveryThreshold && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Free Delivery Threshold (₹)</label>
                          <input
                            type="number"
                            value={formData.freeDeliveryThreshold}
                            onChange={(e) => setFormData({ ...formData, freeDeliveryThreshold: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-xs"
                            placeholder="e.g. 500"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
 
        <div className="flex justify-end pt-4">
          <Button
            icon={Save}
            onClick={handleSave}
            className="py-3 px-6 text-sm rounded-xl font-bold shadow-md shadow-primary/10 hover:shadow-lg transition-all"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
