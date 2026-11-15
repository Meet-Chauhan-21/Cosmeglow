import React, { useEffect, useState } from 'react';
import { ArrowLeft, Edit, Package, Tag, Star, Percent, Sparkles, Layers, List, Compass, Info, Image as ImageIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Card from '../../components/admin/Card';
import Button from '../../components/admin/Button';
import StatusBadge from '../../components/admin/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { fetchPublicProductById } from '../../services/products';
import { VideoPlayer } from '../../util/video.util';

const ProductView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    if (!id || !accessToken) return;

    const loadProduct = async () => {
      try {
        const data = await fetchPublicProductById(id);
        setProduct(data);
        if (data) {
          setActiveImage(data.image || '');
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, accessToken]);

  if (loading) {
    return (
      <AdminLayout title="View Product">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-indigo-150 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout title="View Product">
        <Card>
          <div className="text-center py-10 space-y-4">
            <p className="text-gray-500">Product not found.</p>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/products')}>
              Back to Products
            </Button>
          </div>
        </Card>
      </AdminLayout>
    );
  }

  // Gather all unique images
  const allImages = [
    product.image,
    product.hoverImage,
    ...(product.images || []),
  ].filter((img, idx, self) => img && self.indexOf(img) === idx);

  // Stock status logic
  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { label: 'Out of Stock', color: 'text-red-600 bg-red-50 border-red-100', barColor: 'bg-red-500' };
    if (stock <= 10) return { label: 'Low Stock', color: 'text-amber-600 bg-amber-50 border-amber-100', barColor: 'bg-amber-500' };
    return { label: 'In Stock', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', barColor: 'bg-emerald-500' };
  };
  const stockStatus = getStockStatus(product.stock ?? 0);

  return (
    <AdminLayout title="View Product">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Navigation actions bar */}
        <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs">
          <Button type="button" variant="ghost" icon={ArrowLeft} onClick={() => navigate('/admin/products')} className="text-gray-600 hover:text-dark">
            Back to Catalog
          </Button>
          <Button type="button" icon={Edit} onClick={() => navigate(`/admin/products/${product.id}/edit`)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/10">
            Edit Product Details
          </Button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Image Gallery (Col span 5) */}
          <div className="lg:col-span-5 space-y-4">
            <Card title="Product Gallery" className="overflow-hidden">
              <div className="space-y-4">
                {/* Big Preview */}
                <div className="aspect-square bg-gray-50/50 border border-gray-100 rounded-2xl overflow-hidden flex items-center justify-center p-4 relative group transition-all duration-300">
                  {product.discount > 0 && (
                    <span className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                      Save {product.discount}%
                    </span>
                  )}
                  <img
                    src={activeImage || product.image}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain rounded-xl mix-blend-multiply transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as any).src = 'https://placehold.co/600x600?text=Product+Image';
                    }}
                  />
                </div>

                {/* Thumbnails list */}
                {allImages.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wider font-sans">
                      All Images ({allImages.length})
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {allImages.map((imgUrl, index) => {
                        const isMain = imgUrl === product.image;
                        const isHover = imgUrl === product.hoverImage && imgUrl !== product.image;
                        const isActive = activeImage === imgUrl;
                        return (
                          <button
                            key={imgUrl}
                            type="button"
                            onClick={() => setActiveImage(imgUrl)}
                            className={`relative aspect-square w-16 rounded-xl overflow-hidden bg-white border transition-all cursor-pointer ${
                              isActive
                                ? 'border-indigo-600 ring-2 ring-indigo-500/10 scale-95'
                                : 'border-gray-200 hover:border-gray-300 hover:scale-102'
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt={`Angle ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {isMain && (
                              <span className="absolute bottom-0 inset-x-0 text-[8px] font-bold text-center bg-indigo-600 text-white py-0.5 uppercase tracking-wide">
                                Main
                              </span>
                            )}
                            {isHover && !isMain && (
                              <span className="absolute bottom-0 inset-x-0 text-[8px] font-bold text-center bg-teal-600 text-white py-0.5 uppercase tracking-wide">
                                Hover
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {product.video && (
              <Card title="Product Video">
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-gray-150">
                  <VideoPlayer
                    url={product.video}
                    className="w-full h-full border-0 object-contain bg-black"
                    controls={true}
                    autoPlay={false}
                    muted={true}
                    title="Product Video"
                  />
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Detailed Product Information (Col span 7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Header info card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-3xs space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={product.status} />
                <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider font-sans ${stockStatus.color}`}>
                  {stockStatus.label}
                </span>
                {product.isBestSeller && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold uppercase tracking-wider font-sans flex items-center gap-1">
                    <Star size={10} className="fill-current" />
                    Best Seller
                  </span>
                )}
                {product.isNewArrival && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold uppercase tracking-wider font-sans flex items-center gap-1">
                    <Sparkles size={10} />
                    New Arrival
                  </span>
                )}
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-indigo-650 font-bold font-sans">{product.category}</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 font-display tracking-tight leading-snug">{product.name}</h1>
              </div>

              <div className="border-t border-gray-50 pt-4">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Description</h3>
                <p className="text-gray-655 leading-relaxed text-sm font-sans whitespace-pre-wrap">{product.description}</p>
              </div>
            </div>

            {/* Specs Grid card */}
            <Card title="Pricing & Inventory Specs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100/50">
                  <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider font-sans flex items-center gap-1"><Tag size={12} className="text-gray-400" /> Selling Price</p>
                  <p className="text-xl font-bold text-gray-950 mt-1">₹{Number(product.price).toFixed(2)}</p>
                </div>
                
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100/50">
                  <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider font-sans flex items-center gap-1"><Percent size={12} className="text-gray-400" /> Compare Price</p>
                  <p className="text-xl font-semibold text-rose-600 line-through mt-1">
                    {product.oldPrice ? `₹${Number(product.oldPrice).toFixed(2)}` : 'N/A'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100/50">
                  <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider font-sans flex items-center gap-1"><Percent size={12} className="text-gray-400" /> Discount</p>
                  <p className="text-xl font-bold text-gray-950 mt-1">{product.discount ?? 0}%</p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100/50">
                  <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider font-sans flex items-center gap-1"><Package size={12} className="text-gray-400" /> Stock Level</p>
                  <div className="mt-1.5 space-y-1">
                    <p className="text-base font-bold text-gray-950 leading-none">{product.stock ?? 0} units</p>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${stockStatus.barColor}`} 
                        style={{ width: `${Math.min(100, ((product.stock ?? 0) / 100) * 100)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Original Product Attributes & Why You'll Love It */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Product Attributes */}
              <Card title="Product Attributes" icon={List}>
                <div className="space-y-3.5 text-sm text-gray-600 font-sans">
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-400 font-medium">Category</span>
                    <span className="font-semibold text-primary">{product.category || 'Uncategorized'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-400 font-medium">SKU Reference</span>
                    <span className="font-semibold text-gray-800">{product.sku || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-400 font-medium">Net Volume</span>
                    <span className="font-semibold text-gray-800">{product.volume || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-gray-400 font-medium">Catalog Status</span>
                    <span className="font-semibold text-gray-800 capitalize">{product.status || 'Active'}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-400 font-medium">Customer Rating</span>
                    <span className="font-semibold text-gray-800 flex items-center gap-1">
                      <Star size={14} className="fill-amber-400 text-amber-400" /> 
                      {Number(product.rating || 0).toFixed(1)} / 5.0 ({product.reviewsCount ?? 0} reviews)
                    </span>
                  </div>
                </div>
              </Card>

              {/* Why You'll Love It (One point per line) */}
              <Card title="Why you’ll love it?" icon={Sparkles}>
                {Array.isArray(product.whyLoveIt) && product.whyLoveIt.length > 0 ? (
                  <ul className="space-y-2 text-sm text-gray-700 font-sans">
                    {product.whyLoveIt.map((point: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="text-primary font-bold text-sm leading-none mt-0.5">✓</span>
                        <span className="leading-snug">{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 italic font-sans">No points specified.</p>
                )}
              </Card>

            </div>

            {/* Direction of Use & Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Direction of Use Card */}
              <Card title="Direction of Use" icon={Compass}>
                {product.directionOfUse ? (
                  <p className="text-sm text-gray-700 font-sans whitespace-pre-line leading-relaxed">
                    {product.directionOfUse}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic font-sans">No direction of use specified.</p>
                )}
              </Card>

              {/* Additional Information Card */}
              <Card title="Additional Information" icon={Info}>
                {product.additionalInfo ? (
                  <p className="text-sm text-gray-700 font-sans whitespace-pre-line leading-relaxed">
                    {product.additionalInfo}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic font-sans">No additional information specified.</p>
                )}
              </Card>

            </div>

            {/* Ingredients & Promo Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Ingredients Card */}
              <Card title="Ingredients Formulation" icon={Layers}>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(product.ingredients) && product.ingredients.length > 0 ? (
                    product.ingredients.map((item: string) => (
                      <span key={item} className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold font-sans">
                        {item}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic font-sans">No ingredients specified.</p>
                  )}
                </div>
              </Card>

              {/* Description Promo Banners */}
              <Card title="Description Promo Banners" icon={ImageIcon}>
                {Array.isArray(product.descriptionBanners) && product.descriptionBanners.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2.5">
                    {product.descriptionBanners.map((bannerUrl: string, bIdx: number) => (
                      <div key={bIdx} className="aspect-video rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
                        <img src={bannerUrl} alt={`Banner ${bIdx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic font-sans">No promotional banners uploaded.</p>
                )}
              </Card>

            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductView;
