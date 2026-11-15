import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Trash2, Edit, AlertCircle, ShoppingBag, Eye, Plus, Search} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '../../components/admin/AdminLayout';
import Card from '../../components/admin/Card';
import Button from '../../components/admin/Button';
import DataTable from '../../components/admin/DataTable';
import StatusBadge from '../../components/admin/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { API_BASE_URL } from '../../config';

const CategoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { categories, refreshCategories } = useStore();

  const [category, setCategory] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (categories.length === 0) {
      refreshCategories();
    }
  }, [categories.length, refreshCategories]);

  useEffect(() => {
    if (categories.length > 0 && id) {
      const found = categories.find((c) => (c._id || c.id) === id);
      if (found) {
        setCategory(found);
      }
    }
  }, [categories, id]);

  const handleToggleActive = async () => {
    if (!category) return;
    const newStatus = !category.isActive;
    const catId = category.id || category._id;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${catId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (response.ok) {
        setCategory((prev: any) => ({ ...prev, isActive: newStatus }));
        toast.success(
          newStatus
            ? `Category "${category.name}" is now visible on user side (Shop page).`
            : `Category "${category.name}" is now hidden from user side.`
        );
        await refreshCategories();
      } else {
        toast.error('Failed to update category status.');
      }
    } catch (error) {
      console.error('Error toggling category status:', error);
      toast.error('Failed to update category status.');
    }
  };

  const fetchCategoryProducts = async () => {
    if (!accessToken || !id) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/products?category=${id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        toast.error('Failed to load products for this category.');
      }
    } catch (error) {
      console.error('Error fetching category products:', error);
      toast.error('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryProducts();
  }, [accessToken, id]);

  const handleDeleteProduct = async (prodId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/products/${prodId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        toast.success('Product deleted successfully');
        setProducts((prev) => prev.filter((p) => p._id !== prodId));
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (item: any) => (
        <div className="flex items-center gap-4">
          <img
            src={item.image}
            alt={item.name}
            className="w-12 h-12 rounded-xl object-cover bg-gray-50 border border-gray-100 flex-shrink-0"
          />
          <div>
            <span className="font-semibold text-slate-800 text-sm block leading-tight">{item.name}</span>
            <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">{item.sku}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (item: any) => (
        <div className="font-semibold text-slate-800 text-sm">
          ₹{item.price.toFixed(2)}
          {item.oldPrice && (
            <span className="text-xs text-rose-600 line-through font-normal ml-2 block">
              ₹{item.oldPrice.toFixed(2)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (item: any) => {
        const isOutOfStock = (item.stock || 0) <= 0;
        const isLowStock = (item.stock || 0) > 0 && (item.stock || 0) <= 10;
        return (
          <div>
            <span className={`text-sm font-semibold ${isOutOfStock ? 'text-red-655' : 'text-slate-700'}`}>
              {item.stock} units
            </span>
            {isOutOfStock && <span className="text-[10px] text-red-500 font-medium block mt-0.5">Out of Stock</span>}
            {isLowStock && <span className="text-[10px] text-amber-500 font-medium block mt-0.5">Low Stock</span>}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (item: any) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => navigate(`/admin/products/${item._id}`)}
            className="p-2 border border-gray-200 text-slate-500 hover:text-slate-800 rounded-xl transition cursor-pointer"
            title="View Product"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => navigate(`/admin/products/${item._id}/edit`)}
            className="p-2 border border-gray-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/20 rounded-xl transition cursor-pointer"
            title="Edit Product"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => {
              setProductToDelete(item._id);
              setDeleteModalOpen(true);
            }}
            className="p-2 border border-gray-200 text-slate-500 hover:text-red-655 hover:border-red-100 hover:bg-red-50/20 rounded-xl transition cursor-pointer"
            title="Delete Product"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  if (!category && categories.length > 0 && !loading) {
    return (
      <AdminLayout title="Category Not Found">
        <Card className="p-8 text-center space-y-4">
          <AlertCircle className="mx-auto text-red-500" size={48} />
          <h2 className="text-xl font-bold text-gray-900">Category Not Found</h2>
          <p className="text-gray-500">The category you are trying to view does not exist or has been deleted.</p>
          <Button icon={ArrowLeft} onClick={() => navigate('/admin/categories')}>
            Back to Categories
          </Button>
        </Card>
      </AdminLayout>
    );
  }

  // Filter products by local search query
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Statistics calculation
  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const outOfStockCount = products.filter((p) => (p.stock || 0) <= 0).length;
  const lowStockCount = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 10).length;

  return (
    <AdminLayout title={category ? `${category.name} Collection` : 'Category Detail'}>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Navigation Action Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs">
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('/admin/categories')} className="text-gray-650 hover:text-dark">
            Back to Collections
          </Button>
          {category && (
            <Button
              type="button"
              icon={Plus}
              onClick={() => navigate('/admin/products/create', { state: { defaultCategory: category.id || category._id } })}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-650/10 text-xs py-2.5 px-4"
            >
              Add Product to Collection
            </Button>
          )}
        </div>

        {/* Category Editorial Hero Banner Card */}
        {category && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-3xs relative overflow-hidden">
            {/* Visual background gradient badge */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full blur-3xl -z-10" />
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group shrink-0">
                <img
                  src={category.image}
                  alt={category.altText || category.name}
                  className="w-36 h-24 md:w-48 md:h-32 rounded-2xl object-cover bg-gray-50 border shadow-xs transition-transform duration-500 group-hover:scale-103"
                />
              </div>
              <div className="space-y-2 text-center md:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900">{category.name}</h2>
                  <span className={`px-3 py-0.5 text-[9px] font-bold uppercase rounded-full tracking-widest ${
                    category.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {category.isActive ? 'Visible on Shop' : 'Hidden from Shop'}
                  </span>
                </div>
                
                <p className="text-xs font-mono text-slate-455">
                  Route slug: <span className="text-slate-600">/collections/{category.slug}</span> | Order key: <span className="font-semibold text-slate-600">{category.sortOrder}</span>
                </p>
                {category.altText && (
                  <p className="text-xs text-slate-500 italic pl-3 border-l-2 border-slate-200">
                    Alt SEO: "{category.altText}"
                  </p>
                )}
              </div>

              {/* Show on User Side Toggle Switch Card */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/90 rounded-2xl px-4 py-3 shrink-0 shadow-2xs">
                <div className="text-left">
                  <span className="text-xs font-bold text-slate-800 block">Show on User Side</span>
                  <span className={`text-[10px] font-semibold block mt-0.5 ${category.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {category.isActive ? '● Visible on Shop' : '○ Hidden from Shop'}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={category.isActive}
                  onClick={handleToggleActive}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    category.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  title={category.isActive ? 'Click to hide from user side' : 'Click to show on user side'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      category.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-100/85 rounded-2xl p-4 shadow-3xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none">Products Linked</span>
            <span className="text-xl font-bold text-slate-800 font-display mt-2 block leading-none">{products.length} Items</span>
          </div>
          
          <div className="bg-white border border-slate-100/85 rounded-2xl p-4 shadow-3xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none">Total Stock</span>
            <span className="text-xl font-bold text-indigo-650 font-display mt-2 block leading-none">{totalStock} Units</span>
          </div>

          <div className="bg-white border border-slate-100/85 rounded-2xl p-4 shadow-3xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none">Low Stock Warning</span>
            <span className={`text-xl font-bold font-display mt-2 block leading-none ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
              {lowStockCount} Products
            </span>
          </div>

          <div className="bg-white border border-slate-100/85 rounded-2xl p-4 shadow-3xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-none">Out of Stock</span>
            <span className={`text-xl font-bold font-display mt-2 block leading-none ${outOfStockCount > 0 ? 'text-red-650 font-extrabold' : 'text-slate-700'}`}>
              {outOfStockCount} Products
            </span>
          </div>
        </div>

        {/* Linked Products Table Card */}
        <Card title="Linked Products Inventory" icon={Package}>
          <div className="space-y-4">
            
            {/* Search toolbar inside card */}
            {products.length > 0 && (
              <div className="flex justify-between items-center gap-4">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products in collection..."
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-255/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-xs"
                  />
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-indigo-150 border-t-indigo-650 rounded-full animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-500 font-sans space-y-3">
                <ShoppingBag className="mx-auto text-slate-300" size={40} />
                <p className="text-sm font-semibold">No products found matching your search.</p>
                {products.length === 0 && (
                  <Button icon={Plus} onClick={() => navigate('/admin/products/create', { state: { defaultCategory: id } })} className="mx-auto text-xs py-2 px-4">
                    Create First Product
                  </Button>
                )}
              </div>
            ) : (
              <DataTable columns={columns} data={filteredProducts} />
            )}
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-gray-150 animate-scale-in">
            <div className="w-12 h-12 bg-red-50 text-red-650 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Trash2 size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Delete Product</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to permanently delete this product? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setProductToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200 transition cursor-pointer focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (productToDelete) {
                    await handleDeleteProduct(productToDelete);
                  }
                  setDeleteModalOpen(false);
                  setProductToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer focus:outline-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CategoryDetail;
