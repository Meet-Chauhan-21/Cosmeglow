import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Folder, AlertTriangle, Eye, EyeOff, Save, X, ArrowUp, ArrowDown, Upload, CheckCircle, Package, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '../../components/admin/AdminLayout';
import Card from '../../components/admin/Card';
import Button from '../../components/admin/Button';
import Select from '../../components/admin/Select';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { API_BASE_URL } from '../../config';
import { getPublicIdFromUrl, deleteCloudinaryAsset } from '../../services/cloudinary';

const CategoriesList: React.FC = () => {
  const { accessToken } = useAuth();
  const { categories, categoriesLoading, refreshCategories } = useStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'sortOrder' | 'name' | 'newest'>('sortOrder');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form Drawer States
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null); // null means adding
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    image: '',
    altText: '',
    isActive: true,
    sortOrder: 0,
  });

  // Delete Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    refreshCategories();
  }, []);

  const handleNameChange = (nameVal: string) => {
    const slugVal = nameVal
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    setFormData((prev) => ({
      ...prev,
      name: nameVal,
      slug: slugVal,
    }));
  };

  const handleAddTrigger = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      image: '',
      altText: '',
      isActive: true,
      sortOrder: 0,
    });
    setFormOpen(true);
  };

  const handleEditTrigger = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      image: category.image,
      altText: category.altText || '',
      isActive: category.isActive,
      sortOrder: category.sortOrder || 0,
    });
    setFormOpen(true);
  };

  const handleDeleteTrigger = (id: string) => {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, JPEG, PNG, and WEBP images are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Cover image must be less than 5MB.');
      return;
    }

    setUploading(true);
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
        setFormData((prev) => ({ ...prev, image: data.url }));
        toast.success('Category cover image uploaded successfully!');
      } else {
        const err = await response.json();
        toast.error(err.message || 'Image upload failed.');
      }
    } catch (error) {
      console.error('Image Upload Error:', error);
      toast.error('Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (category: any) => {
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
        toast.success(
          newStatus
            ? `Category "${category.name}" is now visible on user side (Shop page).`
            : `Category "${category.name}" is now hidden from user side.`
        );
        await refreshCategories();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Failed to toggle status.');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to toggle status.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.image) {
      toast.error('Name and Cover Image are required.');
      return;
    }

    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory
        ? `${API_BASE_URL}/admin/categories/${editingCategory.id || editingCategory._id}`
        : `${API_BASE_URL}/admin/categories`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingCategory ? 'Category updated successfully' : 'Category created successfully');
        setFormOpen(false);
        await refreshCategories();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${itemToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        toast.success('Category deleted successfully.');
        await refreshCategories();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Failed to delete category.');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category.');
    } finally {
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  // Filter & Sort dynamic logic
  const filteredCategories = categories.filter((cat) => {
    const query = searchQuery.toLowerCase();
    return (
      cat.name.toLowerCase().includes(query) ||
      cat.slug.toLowerCase().includes(query)
    );
  });

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'sortOrder') {
      comparison = (a.sortOrder || 0) - (b.sortOrder || 0);
    } else if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'newest') {
      comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <AdminLayout title="Categories">
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header Section with Stats Cards */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          {/* Upgraded Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 flex-1 max-w-4xl">
            <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl shadow-3xs text-left hover:shadow-xs transition-all flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block font-display">Total Categories</span>
                <span className="text-2xl font-extrabold text-slate-900 mt-1 block leading-none font-display">{categories.length}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                <Folder size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl shadow-3xs text-left hover:shadow-xs transition-all flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block font-display">Active Channels</span>
                <span className="text-2xl font-extrabold text-emerald-600 mt-1 block leading-none font-display">
                  {categories.filter(c => c.isActive).length}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={18} />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl shadow-3xs text-left hover:shadow-xs transition-all flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block font-display">Catalog Items</span>
                <span className="text-2xl font-extrabold text-amber-655 mt-1 block leading-none font-display">
                  {categories.reduce((acc, cat) => acc + (cat.count || 0), 0)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                <Package size={18} />
              </div>
            </div>
          </div>

          {/* Add Category Button on the right */}
          <Button icon={Plus} onClick={handleAddTrigger} className="self-start lg:self-auto py-2.5 px-5 text-xs font-extrabold bg-primary hover:bg-primary-light text-white shadow-md shadow-primary/10 h-11 shrink-0 cursor-pointer">
            Add Category
          </Button>
        </div>

        {/* Enhanced Toolbar Card */}
        <Card className="p-3 bg-white border border-slate-200/80 rounded-2xl saas-shadow">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              {/* Search Input Box */}
              <div className="relative w-full sm:max-w-xs flex items-center">
                <Search 
                  className="absolute left-4 text-slate-400 pointer-events-none" 
                  size={14} 
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search collections..."
                  className="w-full pl-11 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-primary font-sans text-xs bg-slate-50/20 transition-all focus:bg-white"
                />
              </div>

              {/* Sorting controls in a single row */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap font-display">Sort By</span>
                <Select
                  value={sortBy}
                  onChange={(val) => setSortBy(val as any)}
                  hClass="h-9"
                  className="w-36 text-xs"
                  options={[
                    { value: 'sortOrder', label: 'Sort Order' },
                    { value: 'name', label: 'Name' },
                    { value: 'newest', label: 'Date Created' }
                  ]}
                />

                <button
                  type="button"
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-2.5 hover:bg-slate-50 border border-slate-200 rounded-xl transition text-slate-600 hover:border-slate-300 cursor-pointer flex items-center justify-center h-9 w-9 focus:outline-none"
                  title={`Sort Direction: ${sortDirection}`}
                >
                  {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                </button>
              </div>
            </div>

            {/* View Mode Toggle Buttons */}
            <div className="flex items-center gap-1 border border-slate-200 bg-slate-50/80 p-1 rounded-xl flex-shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-600 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-indigo-600 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="List View"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </Card>

        {/* Category List Loader / View Render */}
        {categoriesLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="w-10 h-10 border-4 border-slate-105 border-t-primary rounded-full animate-spin" />
          </div>
        ) : sortedCategories.length === 0 ? (
          <Card className="p-12 text-center text-gray-500 font-sans border border-slate-200/80 rounded-2xl">
            <Folder className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="text-sm font-semibold">No categories found matching your query.</p>
            <p className="text-xs text-slate-400 mt-1">Try refining your search terms or create a new category.</p>
          </Card>
        ) : viewMode === 'grid' ? (
          /* Premium Interactive Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedCategories.map((category) => {
              return (
                <div
                  key={category.id || category._id}
                  className={`relative group bg-white border border-slate-200/85 rounded-3xl overflow-hidden shadow-3xs hover:shadow-md transition-all duration-300 flex flex-col justify-between hover:border-slate-300 ${
                    !category.isActive ? 'opacity-85' : ''
                  }`}
                >
                  {/* Image & Visibility overlay (Clicking navigates to detail page) */}
                  <div
                    onClick={() => navigate(`/admin/categories/${category.id || category._id}`)}
                    className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={category.image}
                      alt={category.altText || category.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                    />
                    
                    {/* Visual Accents & Status Badges */}
                    {!category.isActive ? (
                      <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-xs flex items-center justify-center">
                        <span className="px-3 py-1 bg-rose-600/95 backdrop-blur-xs text-white font-bold text-[9px] rounded-full uppercase tracking-widest shadow-sm flex items-center gap-1">
                          <EyeOff size={10} /> Hidden on User Side
                        </span>
                      </div>
                    ) : (
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-0.5 bg-emerald-600/90 backdrop-blur-xs text-white font-bold text-[9px] rounded-full uppercase tracking-widest shadow-sm flex items-center gap-1">
                          <Eye size={10} /> Visible on Shop
                        </span>
                      </div>
                    )}
                    
                    {category.sortOrder !== undefined && (
                      <div className="absolute top-3 right-3 bg-slate-950/75 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
                        Order: {category.sortOrder}
                      </div>
                    )}
                  </div>

                  {/* Body Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-3 text-left">
                    <div 
                      onClick={() => navigate(`/admin/categories/${category.id || category._id}`)}
                      className="space-y-1 cursor-pointer"
                    >
                      <h3 className="font-display font-bold text-base text-slate-900 line-clamp-1 group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase tracking-wide">
                        <span>Slug:</span>
                        <span className="font-semibold text-slate-500">/collections/{category.slug}</span>
                      </div>
                      {category.altText && (
                        <p className="text-[10px] text-slate-400 italic mt-1 line-clamp-1 pl-2 border-l border-slate-200">
                          "{category.altText}"
                        </p>
                      )}
                    </div>

                    {/* Dedicated Toggle: Show on User Side */}
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 mt-1">
                      <div className="flex flex-col text-left">
                        <span className="text-[11px] font-bold text-slate-700">
                          Show on User Side
                        </span>
                        <span className={`text-[10px] font-semibold ${category.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {category.isActive ? '● Visible on Shop' : '○ Hidden from Shop'}
                        </span>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={category.isActive}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(category);
                        }}
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

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      {/* Products Counter badge */}
                      <span className="text-[10px] font-bold font-sans text-primary bg-primary/5 border border-primary/10 px-3 py-1 rounded-full flex items-center gap-1 shadow-3xs">
                        <Package size={11} className="text-primary" />
                        {category.count || 0} {category.count === 1 ? 'Product' : 'Products'}
                      </span>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditTrigger(category)}
                          className="p-1.5 border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/20 hover:bg-primary/5 rounded-lg transition cursor-pointer focus:outline-none"
                          title="Edit Details"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTrigger(category.id || category._id || '')}
                          className="p-1.5 border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50/20 rounded-lg transition cursor-pointer focus:outline-none"
                          title="Delete Category"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Premium Shopify-Style Table List View */
          <Card className="overflow-x-auto border border-slate-200/80 rounded-2xl saas-shadow bg-white p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">
                  <th className="py-4 px-6">Collection</th>
                  <th className="py-4 px-6">Slug Path</th>
                  <th className="py-4 px-6 text-center">Display Order</th>
                  <th className="py-4 px-6 text-center">Linked Products</th>
                  <th className="py-4 px-6 text-center">Show on User Side</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedCategories.map((category) => (
                  <tr 
                    key={category.id || category._id}
                    className="hover:bg-slate-50/40 transition-colors group text-xs text-slate-600"
                  >
                    {/* Collection Info (Image + Title) */}
                    <td className="py-3.5 px-6 font-semibold">
                      <div className="flex items-center gap-3">
                        <img 
                          src={category.image} 
                          alt={category.name} 
                          className="w-10 h-7.5 rounded-lg object-cover bg-slate-100 border border-slate-200/60 flex-shrink-0"
                        />
                        <button
                          onClick={() => navigate(`/admin/categories/${category.id || category._id}`)}
                          className="font-bold text-slate-800 hover:text-primary transition-colors text-left font-display text-sm cursor-pointer focus:outline-none"
                        >
                          {category.name}
                        </button>
                      </div>
                    </td>
                    
                    {/* Slug Path */}
                    <td className="py-3.5 px-6">
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded">
                        /collections/{category.slug}
                      </span>
                    </td>
                    
                    {/* Display Order */}
                    <td className="py-3.5 px-6 text-center font-bold text-slate-700">
                      {category.sortOrder !== undefined ? category.sortOrder : '-'}
                    </td>
                    
                    {/* Linked Products Count */}
                    <td className="py-3.5 px-6 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-2.5 py-0.5 rounded-full">
                        <Package size={10} />
                        {category.count || 0}
                      </span>
                    </td>
                    
                    {/* Status Toggle Switch */}
                    <td className="py-3.5 px-6 text-center">
                      <div className="inline-flex items-center justify-center gap-2.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={category.isActive}
                          onClick={() => handleToggleActive(category)}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            category.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={category.isActive ? 'Click to hide from user side' : 'Click to show on user side'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              category.isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          category.isActive ? 'text-emerald-700' : 'text-slate-400'
                        }`}>
                          {category.isActive ? 'Visible' : 'Hidden'}
                        </span>
                      </div>
                    </td>
                    
                    {/* Actions */}
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/categories/${category.id || category._id}`)}
                          className="p-1.5 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition cursor-pointer focus:outline-none"
                          title="View Details"
                        >
                          <Folder size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditTrigger(category)}
                          className="p-1.5 border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/20 hover:bg-primary/5 rounded-lg transition cursor-pointer focus:outline-none"
                          title="Edit Details"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTrigger(category.id || category._id || '')}
                          className="p-1.5 border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50/20 rounded-lg transition cursor-pointer focus:outline-none"
                          title="Delete Category"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* Modal Form Drawer (Slides in from the right) */}
        {formOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex justify-end">
            {/* Click backdrop to close */}
            <div className="absolute inset-0 -z-10 cursor-default" onClick={() => setFormOpen(false)} />
            
            <div 
              className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200/80 overflow-y-auto"
              style={{ animation: 'slideInRight 0.25s ease-out' }}
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/40 flex-shrink-0">
                <h3 className="text-base font-bold text-slate-900 font-display">
                  {editingCategory ? 'Edit Collection Details' : 'Create New Collection'}
                </h3>
                <button
                  onClick={() => setFormOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-700 cursor-pointer focus:outline-none"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-5 text-left">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 font-display">Category Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Lip Balms"
                      required
                      className="w-full px-4 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary font-sans text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-455 uppercase tracking-wider mb-2 font-display">Image Alt Text (SEO)</label>
                    <input
                      type="text"
                      value={formData.altText}
                      onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                      placeholder="Provide a description of the cover image..."
                      className="w-full px-4 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary font-sans text-xs"
                    />
                  </div>

                  {/* Dropzone Cover Image Upload */}
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 font-display">Cover Image Selection</label>
                    <div className="border border-dashed border-slate-250 rounded-2xl p-4.5 text-center hover:border-primary/50 transition-colors relative bg-slate-50/30 overflow-hidden min-h-[170px] flex flex-col items-center justify-center group">
                      {formData.image ? (
                        <div className="relative w-full h-full group flex items-center justify-center">
                          <img
                            src={formData.image}
                            alt="Category Cover"
                            className="max-h-36 max-w-full object-contain rounded-xl bg-white shadow-3xs border border-slate-100"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const publicId = getPublicIdFromUrl(formData.image);
                              if (publicId && accessToken) {
                                await deleteCloudinaryAsset(publicId, accessToken);
                              }
                              setFormData(prev => ({ ...prev, image: '' }));
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors cursor-pointer focus:outline-none z-20"
                            title="Clear Image"
                          >
                            <X size={12} />
                          </button>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                            <label className="text-white text-[10px] font-bold cursor-pointer px-3.5 py-1.5 bg-black/60 rounded-full uppercase tracking-wider">
                              Change Image
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleImageUpload(e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer w-full py-5">
                          <span className="w-9 h-9 rounded-full bg-primary/5 text-primary flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105">
                            <Upload size={16} />
                          </span>
                          <span className="text-xs font-semibold text-slate-700">Click to upload cover image</span>
                          <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleImageUpload(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                          <div className="w-6 h-6 border-2 border-slate-100 border-t-primary rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-2 font-display">Sort Display Order</label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
                      placeholder="e.g. 5"
                      min={0}
                      className="w-full px-4 py-2.5 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary font-sans text-xs"
                    />
                  </div>

                  {/* Show Category on User Side Toggle */}
                  <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <span className="text-xs font-bold text-slate-800 block font-display">
                          Show Category on User Side (Shop Page)
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-1 leading-normal">
                          Turn this ON to display this category on the Shop page cards and filter sidebar. Turn OFF to hide it from users.
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={formData.isActive}
                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          formData.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            formData.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span className={`text-[10px] font-semibold ${formData.isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {formData.isActive ? 'Currently: Will show on user side (Visible)' : 'Currently: Will NOT show on user side (Hidden)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-5 border-t border-slate-100 mt-auto flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer focus:outline-none"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    icon={Save}
                    className="flex-1 justify-center py-2.5 text-xs font-bold shadow-xs shadow-primary/5 cursor-pointer"
                  >
                    {editingCategory ? 'Save Changes' : 'Create Category'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-55 p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-gray-200 animate-scale-in">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle size={24} />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">Delete Category</h3>
                <p className="text-xs text-gray-500 leading-relaxed font-sans">
                  Are you sure you want to delete this category? Products linked to it won't be deleted, but they will lose their category tag.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setItemToDelete(null);
                  }}
                  className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200 transition cursor-pointer focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer focus:outline-none"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CategoriesList;
