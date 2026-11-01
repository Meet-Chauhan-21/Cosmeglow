import React, { useState, useEffect } from 'react';
import { ArrowLeft, X, Video, ExternalLink } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import AdminLayout from '../../components/admin/AdminLayout';
import Card from '../../components/admin/Card';
import Button from '../../components/admin/Button';
import { useAuth } from '../../context/AuthContext';
import { fetchPublicProductById } from '../../services/products';
import { API_BASE_URL } from '../../config';
import Select from '../../components/admin/Select';
import { useStore } from '../../context/StoreContext';
import { getPublicIdFromUrl, deleteCloudinaryAsset } from '../../services/cloudinary';
import { VideoPlayer, parseVideoUrl } from '../../util/video.util';

const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(isEdit);

  interface GalleryImage {
    public_id: string;
    url: string;
  }

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const validationSchema = Yup.object({
    name: Yup.string().required('Product name is required'),
    description: Yup.string().required('Description is required'),
    category: Yup.string().required('Category is required'),
    price: Yup.number()
      .typeError('Price must be a number')
      .positive('Price must be positive')
      .required('Price is required'),
    oldPrice: Yup.number()
      .typeError('Compare price must be a number')
      .positive('Compare price must be positive')
      .nullable(),
    discount: Yup.number()
      .typeError('Discount must be a number')
      .min(0, 'Discount cannot be negative')
      .max(100, 'Discount cannot exceed 100')
      .nullable(),
    stock: Yup.number()
      .typeError('Stock must be an integer')
      .integer('Stock must be an integer')
      .min(0, 'Stock cannot be negative')
      .required('Stock quantity is required'),
    sku: Yup.string().required('SKU is required'),
    status: Yup.string().required('Status is required'),
    image: Yup.string().required('Product main image is required'),
    hoverImage: Yup.string().nullable(),
    rating: Yup.number().typeError('Rating must be a number').min(0, 'Min rating is 0').max(5, 'Max rating is 5').nullable(),
    reviewsCount: Yup.number().typeError('Reviews count must be an integer').integer('Must be an integer').min(0).nullable(),
    ingredientsText: Yup.string().nullable(),
    benefitsText: Yup.string().nullable(),
    volume: Yup.string().required('Product volume is required'),
    video: Yup.string().nullable(),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      category: '',
      price: '',
      oldPrice: '',
      discount: '',
      stock: '',
      sku: '',
      status: 'active',
      isBestSeller: false,
      isNewArrival: false,
      image: '',
      hoverImage: '',
      rating: '',
      reviewsCount: '',
      ingredientsText: '',
      benefitsText: '',
      volume: '50ml',
      video: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      const parseList = (val: string) =>
        val
          .split(/\n|,/)
          .map((item) => item.trim())
          .filter(Boolean);

      try {
        const url = isEdit
          ? `${API_BASE_URL}/admin/products/${id}`
          : `${API_BASE_URL}/admin/products`;

        const response = await fetch(url, {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            ...values,
            price: parseFloat(values.price),
            oldPrice: values.oldPrice ? parseFloat(values.oldPrice) : null,
            discount: values.discount ? parseInt(values.discount, 10) : 0,
            stock: parseInt(values.stock),
            rating: values.rating ? parseFloat(values.rating) : 0,
            reviewsCount: values.reviewsCount ? parseInt(values.reviewsCount, 10) : 0,
            images: galleryImages.filter(img => img.url),
            ingredients: parseList(values.ingredientsText),
            benefits: parseList(values.benefitsText),
            hoverImage: values.hoverImage || values.image,
          })
        });

        if (response.ok) {
          toast.success(isEdit ? 'Product updated successfully' : 'Product created successfully');
          navigate('/admin/products');
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to save product');
        }
      } catch (error) {
        console.error('Error saving product:', error);
        toast.error('Failed to save product');
      }
    }
  });

  const handleImageUpload = async (file: File, field: 'image' | 'hoverImage' | number) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPG, JPEG, PNG, and WEBP are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB.');
      return;
    }

    const uploadKey = typeof field === 'number' ? `gallery-${field}` : field;
    setUploadingField(uploadKey);

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
        const publicId = data.public_id;

        if (field === 'image') {
          const oldUrl = formik.values.image;
          const oldPublicId = getPublicIdFromUrl(oldUrl);
          if (oldPublicId && accessToken) {
            await deleteCloudinaryAsset(oldPublicId, accessToken);
          }
          formik.setFieldValue('image', uploadedUrl);
          toast.success('Product image uploaded successfully');
        } else if (field === 'hoverImage') {
          const oldUrl = formik.values.hoverImage;
          const oldPublicId = getPublicIdFromUrl(oldUrl);
          if (oldPublicId && accessToken) {
            await deleteCloudinaryAsset(oldPublicId, accessToken);
          }
          formik.setFieldValue('hoverImage', uploadedUrl);
          toast.success('Hover image uploaded successfully');
        } else if (typeof field === 'number') {
          const oldImg = galleryImages[field];
          if (oldImg) {
            const oldPublicId = oldImg.public_id || getPublicIdFromUrl(oldImg.url);
            if (oldPublicId && accessToken) {
              await deleteCloudinaryAsset(oldPublicId, accessToken);
            }
          }
          setGalleryImages(prev => {
            const updated = [...prev];
            updated[field] = { public_id: publicId, url: uploadedUrl };
            return updated;
          });
          toast.success(`Gallery image #${field + 1} uploaded successfully`);
        }
      } else {
        const errData = await response.json();
        toast.error(errData.message || 'Image upload failed');
      }
    } catch (error) {
      console.error('Image Upload Error:', error);
      toast.error('Image upload failed');
    } finally {
      setUploadingField(null);
    }
  };

  const handleAddMoreImage = () => {
    setGalleryImages(prev => [...prev, { public_id: '', url: '' }]);
  };

  const handleRemoveGalleryImage = async (index: number) => {
    const img = galleryImages[index];
    const publicId = img.public_id || getPublicIdFromUrl(img.url);
    if (publicId && accessToken) {
      await deleteCloudinaryAsset(publicId, accessToken);
    }
    setGalleryImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearImage = async (field: 'image' | 'hoverImage') => {
    const url = formik.values[field];
    const publicId = getPublicIdFromUrl(url);
    if (publicId && accessToken) {
      await deleteCloudinaryAsset(publicId, accessToken);
    }
    formik.setFieldValue(field, '');
    toast.info(`${field === 'image' ? 'Product' : 'Hover'} image cleared.`);
  };

  const handleVideoUpload = async (file: File) => {
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid video format. Only MP4, WebM, OGG, and MOV are supported.');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      toast.error('Video file size must be less than 30MB.');
      return;
    }

    setUploadingField('video');
    const uploadFormData = new FormData();
    uploadFormData.append('video', file);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/upload-video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: uploadFormData
      });

      if (response.ok) {
        const data = await response.json();
        const oldUrl = formik.values.video;
        const oldPublicId = getPublicIdFromUrl(oldUrl);
        if (oldPublicId && accessToken) {
          await deleteCloudinaryAsset(oldPublicId, accessToken, 'video');
        }
        formik.setFieldValue('video', data.url);
        toast.success('Video uploaded successfully');
      } else {
        const errData = await response.json();
        toast.error(errData.message || 'Video upload failed');
      }
    } catch (error) {
      console.error('Video Upload Error:', error);
      toast.error('Video upload failed');
    } finally {
      setUploadingField(null);
    }
  };

  const renderVideoPreview = (url: string) => {
    return (
      <VideoPlayer
        url={url}
        className="w-full h-full border-0 object-contain bg-black"
        autoPlay={false}
        muted={true}
        controls={true}
        title="Product Video Preview"
      />
    );
  };

  useEffect(() => {
    if (isEdit && id && accessToken) {
      const fetchProduct = async () => {
        try {
          const product = await fetchPublicProductById(id);
          if (product) {
            formik.setValues({
              name: product.name,
              description: product.description,
              category: product.categoryId || product.category,
              price: product.price.toString(),
              oldPrice: product.oldPrice?.toString() || '',
              discount: product.discount?.toString() || '',
              stock: product.stock !== undefined && product.stock !== null ? product.stock.toString() : '0',
              sku: product.sku || '',
              status: product.status || 'active',
              isBestSeller: Boolean(product.isBestSeller),
              isNewArrival: Boolean(product.isNewArrival ?? product.isNew),
              image: product.image,
              hoverImage: product.hoverImage || '',
              rating: product.rating.toString(),
              reviewsCount: product.reviewsCount.toString(),
              ingredientsText: product.ingredients?.join('\n') || '',
              benefitsText: product.benefits?.join('\n') || '',
              volume: product.volume || '50ml',
              video: product.video || '',
            });

            const formattedImages = (product.images || []).map((img: any) => {
              if (typeof img === 'string') {
                return { public_id: '', url: img };
              }
              return { public_id: img.public_id || '', url: img.url || '' };
            });
            setGalleryImages(formattedImages);
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    }
  }, [isEdit, id, accessToken]);

  const { categories } = useStore();
  const activeCategories = categories.filter((c) => c.isActive);

  if (loading) {
    return (
      <AdminLayout title="Edit Product">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEdit ? 'Edit Product' : 'Create Product'}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" icon={ArrowLeft} onClick={() => navigate('/admin/products')}>
            Back
          </Button>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card title="Product Details">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${formik.touched.name && formik.errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                        }`}
                      placeholder="Enter product name"
                    />
                    {formik.touched.name && formik.errors.name && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{formik.errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[150px] resize-none ${formik.touched.description && formik.errors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                        }`}
                      placeholder="Enter product description"
                    />
                    {formik.touched.description && formik.errors.description && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{formik.errors.description}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Hover Image</label>
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-2.5 text-center hover:border-indigo-500/50 transition-colors relative bg-gray-50/20 overflow-hidden h-[120px] flex flex-col items-center justify-center">
                        {formik.values.hoverImage ? (
                          <div className="relative w-full h-full group flex items-center justify-center">
                            <img
                              src={formik.values.hoverImage}
                              alt="Hover Product"
                              className="max-h-full max-w-full object-contain rounded-xl bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleClearImage('hoverImage')}
                              className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md transition-colors cursor-pointer focus:outline-none z-20"
                              title="Clear Image"
                            >
                              <X size={10} />
                            </button>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                              <label className="text-white text-[9px] font-semibold cursor-pointer px-2.5 py-1.5 bg-black/60 rounded-full">
                                Change Image
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleImageUpload(e.target.files[0], 'hoverImage');
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full py-2">
                            <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center mb-1">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                              </svg>
                            </span>
                            <span className="text-[10px] font-semibold text-gray-650">Upload Hover Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleImageUpload(e.target.files[0], 'hoverImage');
                                }
                              }}
                            />
                          </label>
                        )}
                        {uploadingField === 'hoverImage' && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                            <div className="w-5 h-5 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Discount (%)</label>
                      <input
                        type="number"
                        name="discount"
                        min="0"
                        max="100"
                        value={formik.values.discount}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${formik.touched.discount && formik.errors.discount ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                          }`}
                        placeholder="15"
                      />
                      {formik.touched.discount && formik.errors.discount && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{formik.errors.discount}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                      <Select
                        value={formik.values.category}
                        onChange={(val) => formik.setFieldValue('category', val)}
                        error={Boolean(formik.touched.category && formik.errors.category)}
                        placeholder="Select category"
                        options={activeCategories.map(cat => ({ value: cat._id || cat.id, label: cat.name }))}
                      />
                      {formik.touched.category && formik.errors.category && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{formik.errors.category}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Volume</label>
                      <input
                        type="text"
                        name="volume"
                        value={formik.values.volume}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${formik.touched.volume && formik.errors.volume ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                          }`}
                        placeholder="e.g. 50ml, 100ml"
                      />
                      {formik.touched.volume && formik.errors.volume && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{formik.errors.volume}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">SKU</label>
                      <input
                        type="text"
                        name="sku"
                        value={formik.values.sku}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${formik.touched.sku && formik.errors.sku ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                          }`}
                        placeholder="SKU-001"
                      />
                      {formik.touched.sku && formik.errors.sku && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{formik.errors.sku}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                      <input
                        type="number"
                        name="rating"
                        step="0.1"
                        min="0"
                        max="5"
                        value={formik.values.rating}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${formik.touched.rating && formik.errors.rating ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                          }`}
                        placeholder="4.8"
                      />
                      {formik.touched.rating && formik.errors.rating && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{formik.errors.rating}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Reviews Count</label>
                      <input
                        type="number"
                        name="reviewsCount"
                        min="0"
                        value={formik.values.reviewsCount}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${formik.touched.reviewsCount && formik.errors.reviewsCount ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                          }`}
                        placeholder="120"
                      />
                      {formik.touched.reviewsCount && formik.errors.reviewsCount && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{formik.errors.reviewsCount}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Pricing & Inventory">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price (Rs)</label>
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      value={formik.values.price}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${formik.touched.price && formik.errors.price ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                        }`}
                      placeholder="85.00"
                    />
                    {formik.touched.price && formik.errors.price && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{formik.errors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Compare At Price (Rs)</label>
                    <input
                      type="number"
                      name="oldPrice"
                      step="0.01"
                      value={formik.values.oldPrice}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${formik.touched.oldPrice && formik.errors.oldPrice ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                        }`}
                      placeholder="110.00"
                    />
                    {formik.touched.oldPrice && formik.errors.oldPrice && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{formik.errors.oldPrice}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Quantity</label>
                    <input
                      type="number"
                      name="stock"
                      value={formik.values.stock}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${formik.touched.stock && formik.errors.stock ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                        }`}
                      placeholder="100"
                    />
                    {formik.touched.stock && formik.errors.stock && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{formik.errors.stock}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <Select
                      value={formik.values.status}
                      onChange={(val) => formik.setFieldValue('status', val)}
                      error={Boolean(formik.touched.status && formik.errors.status)}
                      options={[
                        { value: 'active', label: 'Visible (Active)' },
                        { value: 'inactive', label: 'Hidden (Inactive)' }
                      ]}
                    />
                    {formik.touched.status && formik.errors.status && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium pl-1">{formik.errors.status}</p>
                    )}
                  </div>
                </div>
              </Card>

              <Card title="Ingredients & Benefits">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ingredients</label>
                    <textarea
                      name="ingredientsText"
                      value={formik.values.ingredientsText}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[120px] resize-none"
                      placeholder="One ingredient per line"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Benefits</label>
                    <textarea
                      name="benefitsText"
                      value={formik.values.benefitsText}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[120px] resize-none"
                      placeholder="One benefit per line"
                    />
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card title="Product Image">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-indigo-500/50 transition-colors relative bg-gray-50/10 overflow-hidden min-h-[160px] flex flex-col items-center justify-center">
                    {formik.values.image ? (
                      <div className="relative w-full h-full group flex items-center justify-center">
                        <img
                          src={formik.values.image}
                          alt="Product"
                          className="max-h-40 max-w-full object-contain rounded-xl bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleClearImage('image')}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors cursor-pointer focus:outline-none z-20"
                          title="Clear Image"
                        >
                          <X size={12} />
                        </button>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                          <label className="text-white text-xs font-semibold cursor-pointer px-4 py-2 bg-black/60 rounded-full">
                            Change Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleImageUpload(e.target.files[0], 'image');
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer w-full py-6">
                        <span className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                          </svg>
                        </span>
                        <span className="text-xs font-semibold text-gray-700">Click to upload main image</span>
                        <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleImageUpload(e.target.files[0], 'image');
                            }
                          }}
                        />
                      </label>
                    )}
                    {uploadingField === 'image' && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                        <div className="w-6 h-6 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {formik.touched.image && formik.errors.image && (
                    <p className="text-red-500 text-xs mt-1 font-medium text-center">{formik.errors.image}</p>
                  )}
                </div>
              </Card>

              {/* Product Gallery Images Card */}
              <Card title="Product Gallery Images">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {galleryImages.map((galleryImg, index) => (
                      <div key={index} className="border border-gray-200 rounded-2xl p-3 text-center relative bg-gray-50/20 overflow-hidden h-[120px] flex flex-col items-center justify-center">
                        {galleryImg.url ? (
                          <div className="relative w-full h-full group flex items-center justify-center">
                            <img
                              src={galleryImg.url}
                              alt={`Gallery ${index + 1}`}
                              className="max-h-20 max-w-full object-contain rounded-xl bg-white"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryImage(index)}
                                className="text-white text-xs font-semibold bg-red-600 hover:bg-red-700 transition-colors px-3 py-1.5 rounded-full cursor-pointer focus:outline-none shadow-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                            <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center mb-1">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                              </svg>
                            </span>
                            <span className="text-[10px] font-semibold text-gray-700">Upload image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleImageUpload(e.target.files[0], index);
                                }
                              }}
                            />
                          </label>
                        )}
                        {uploadingField === `gallery-${index}` && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                            <div className="w-5 h-5 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddMoreImage}
                    className="w-full border border-gray-200 hover:border-indigo-500/50 text-gray-700 hover:text-indigo-650 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Add More Image</span>
                  </button>
                </div>
              </Card>

              <Card title="Product Video (Optional)">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-semibold text-gray-700">Video URL</label>
                      {formik.values.video && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-1">
                          {parseVideoUrl(formik.values.video)?.platformName || 'Video Linked'}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="video"
                      value={formik.values.video}
                      onChange={(e) => {
                        let val = e.target.value;
                        const iframeMatch = val.match(/src=["']([^"']+)["']/i);
                        if (iframeMatch && iframeMatch[1]) {
                          val = iframeMatch[1];
                        }
                        formik.setFieldValue('video', val);
                      }}
                      onBlur={formik.handleBlur}
                      className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm ${
                        formik.touched.video && formik.errors.video ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      placeholder="Paste YouTube, Vimeo, Google Drive, or direct video URL"
                    />
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      Supports YouTube (standard, shorts, live, embed), Vimeo, Google Drive, and MP4/WebM videos.
                    </p>
                  </div>

                  {formik.values.video ? (
                    <div className="space-y-2">
                      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
                        {renderVideoPreview(formik.values.video)}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-20">
                          <a
                            href={parseVideoUrl(formik.values.video)?.originalUrl || formik.values.video}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all text-xs"
                            title="Open Video in New Tab"
                          >
                            <ExternalLink size={14} />
                          </a>
                          <button
                            type="button"
                            onClick={async () => {
                              const url = formik.values.video;
                              const publicId = getPublicIdFromUrl(url);
                              if (publicId && accessToken) {
                                await deleteCloudinaryAsset(publicId, accessToken, 'video');
                              }
                              formik.setFieldValue('video', '');
                            }}
                            className="p-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md transition-colors cursor-pointer focus:outline-none"
                            title="Remove Video"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        ✓ Video is linked and will be previewed on the product storefront.
                      </p>
                    </div>
                  ) : null}

                  <div className="relative">
                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-gray-200"></div>
                      <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                        {formik.values.video ? 'Or Replace With Upload' : 'Or Upload Video'}
                      </span>
                      <div className="flex-grow border-t border-gray-200"></div>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:border-indigo-500/50 transition-colors relative bg-gray-50/10 overflow-hidden min-h-[100px] flex flex-col items-center justify-center">
                    <label className="flex flex-col items-center justify-center cursor-pointer w-full py-2">
                      <span className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-650 flex items-center justify-center mb-1.5">
                        <Video size={18} />
                      </span>
                      <span className="text-xs font-semibold text-gray-700">Click to upload product video file</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">MP4, WebM, MOV up to 30MB</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleVideoUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    {uploadingField === 'video' && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center z-10">
                        <div className="w-6 h-6 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card title="Product Options">
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isBestSeller"
                      checked={formik.values.isBestSeller}
                      onChange={formik.handleChange}
                      className="w-5 h-5 text-indigo-650 rounded focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">Mark as Best Seller</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isNewArrival"
                      checked={formik.values.isNewArrival}
                      onChange={formik.handleChange}
                      className="w-5 h-5 text-indigo-650 rounded focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-700">Mark as New</span>
                  </label>
                </div>
              </Card>

              <div className="flex gap-3">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => navigate('/admin/products')}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {isEdit ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default ProductForm;

