import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { User as UserIcon, ShoppingBag, MapPin, LogOut, Download, Mail, Phone, Plus, Trash2, Edit, CheckCircle, Shield, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useStore } from '../context/StoreContext';
import { toast } from 'sonner';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import type { Address, Order } from '../types';
import { SearchableDropdown } from '../components/layout/SearchableDropdown';
import { locationData } from '../data/locationData';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import WhatsAppButton from '../components/layout/WhatsAppButton';

// Validation Schemas
const profileSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Full Name is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email address is required'),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, 'Contact phone number must be exactly 10 digits')
    .required('Contact Phone is required'),
});

const addressSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Recipient Name is required'),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
    .required('Recipient Contact Phone is required'),
  street: Yup.string()
    .min(5, 'Street address is too short')
    .required('Street Address is required'),
  country: Yup.string()
    .required('Country is required'),
  state: Yup.string()
    .required('State is required'),
  district: Yup.string()
    .required('District is required'),
  zip: Yup.string()
    .matches(/^[0-9]{6}$/, 'ZIP code must be exactly 6 digits')
    .required('ZIP / Postal Code is required'),
  isDefault: Yup.boolean(),
});

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = (tabParam === 'orders' || tabParam === 'addresses') ? tabParam : 'profile';
  const { user, loading, logout, updateUser, addAddress, updateAddress, deleteAddress, fetchOrders } = useAuth();
  const { settings } = useStore();
  const [activeTabState, setActiveTabState] = useState<'profile' | 'orders' | 'addresses'>(initialTab);

  // Password update state in profile
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdatePasswordInProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    const success = await updateUser({
      name: profileFormik.values.name,
      email: profileFormik.values.email,
      phone: profileFormik.values.phone,
      password: newPassword
    });
    setIsUpdatingPassword(false);

    if (success) {
      toast.success('Your password has been updated successfully!');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordChange(false);
    }
  };

  useEffect(() => {
    if (tabParam && (tabParam === 'profile' || tabParam === 'orders' || tabParam === 'addresses')) {
      setActiveTabState(tabParam);
    }
  }, [tabParam]);

  const activeTab = activeTabState;
  const setActiveTab = (tab: 'profile' | 'orders' | 'addresses') => {
    setActiveTabState(tab);
    setSearchParams({ tab }, { replace: true });
  };
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const handleDownloadInvoice = (order: Order) => {
    try {
      const doc = new jsPDF();
      const primaryColor = settings?.themeColor || '#581C87';
      const hexToRgb = (hex: string) => {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 88, g: 28, b: 135 };
      };
      
      const rgb = hexToRgb(primaryColor);

      const generatePdf = (img?: HTMLImageElement) => {
        if (img) {
          doc.addImage(img, 'JPEG', 14, 12, 12, 12);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(22);
          doc.setTextColor(rgb.r, rgb.g, rgb.b);
          doc.text(settings?.shopName || 'TREEBORN', 29, 20);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text('Premium Botanical Skincare', 29, 25);
        } else {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(22);
          doc.setTextColor(rgb.r, rgb.g, rgb.b);
          doc.text(settings?.shopName || 'TREEBORN', 14, 20);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text('Premium Botanical Skincare', 14, 25);
        }

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(14, 30, 196, 30);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text('Seller Details:', 14, 38);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);

        // Word wrap seller address dynamically to prevent overlap
        const addressText = `Address: ${settings?.address || 'India'}`;
        const splitAddress = doc.splitTextToSize(addressText, 95);

        doc.text(`Shop: ${settings?.shopName || 'TREEBORN Skincare'}`, 14, 44);
        doc.text(`GST: ${settings?.gstNumber || '24AAAAA0000A1Z5'}`, 14, 49);
        doc.text(`Email: ${settings?.email || 'support@treeborn.com'}`, 14, 54);
        doc.text(splitAddress, 14, 59);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Invoice Details:', 120, 38);
        
        const paymentMethodLabel =
          order.payment?.method === 'razorpay'
            ? 'Razorpay Online Payment'
            : order.payment?.method === 'card'
            ? 'Online Card'
            : 'Cash on Delivery (COD)';

        const transactionIdLabel =
          order.payment?.transactionId ||
          order.payment?.razorpayPaymentId ||
          'N/A';

        const paidDateLabel = order.payment?.paidAt
          ? new Date(order.payment.paidAt).toLocaleDateString()
          : order.createdAt
          ? new Date(order.createdAt).toLocaleDateString()
          : 'N/A';

        doc.setFont('helvetica', 'normal');
        doc.text([
          `Invoice No: INV-${order.orderNumber}`,
          `Order Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}`,
          `Payment Method: ${paymentMethodLabel}`,
          `Payment Status: ${(order.payment?.status || 'PENDING').toUpperCase()}`,
          `Transaction ID: ${transactionIdLabel}`,
          `Paid Date: ${paidDateLabel}`,
          `Currency: ${order.payment?.currency || 'INR'}`,
          `Amount Paid: INR ${(order.totals?.total || 0).toFixed(2)}`
        ], 120, 44);
        
        // Compute startY dynamically based on wrapped address length
        const addressLinesCount = splitAddress.length || 1;
        const startY = Math.max(72, 59 + (addressLinesCount * 4.5) + 6);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text('Bill To / Ship To:', 14, startY);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        const addr = order.shippingAddress;
        doc.text([
          `Recipient: ${addr?.name || user?.name || 'Customer'}`,
          `Phone: ${addr?.phone || 'N/A'}`,
          `Address: ${addr?.street || ''}, ${addr?.district || ''}, ${addr?.state || ''}, ${addr?.country || ''} - ${addr?.zip || ''}`
        ], 14, startY + 6);
        
        let tableY = startY + 28;
        doc.setFillColor(rgb.r, rgb.g, rgb.b);
        doc.rect(14, tableY, 182, 8, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text('Product Details', 18, tableY + 5.5);
        doc.text('Size', 110, tableY + 5.5);
        doc.text('Qty', 135, tableY + 5.5);
        doc.text('Price', 155, tableY + 5.5);
        doc.text('Total', 178, tableY + 5.5);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        
        order.items.forEach((item, index) => {
          const itemY = tableY + 8 + (index * 9);
          if (index % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(14, itemY, 182, 9, 'F');
          }
          
          doc.text(item.name || 'N/A', 18, itemY + 6);
          doc.text(item.selectedSize || '50ml', 110, itemY + 6);
          doc.text(String(item.quantity), 135, itemY + 6);
          doc.text(`INR ${item.price.toFixed(2)}`, 155, itemY + 6);
          doc.text(`INR ${(item.price * item.quantity).toFixed(2)}`, 178, itemY + 6);
        });
        
        const itemsCount = order.items.length;
        let summaryY = tableY + 12 + (itemsCount * 9);
        
        doc.setDrawColor(241, 245, 249);
        doc.line(14, summaryY, 196, summaryY);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        
        doc.text('Subtotal:', 140, summaryY + 8);
        doc.text(`INR ${order.totals.subtotal.toFixed(2)}`, 178, summaryY + 8);
        
        doc.text('Shipping:', 140, summaryY + 14);
        doc.text(`INR ${order.totals.shipping.toFixed(2)}`, 178, summaryY + 14);
        
        doc.text('Tax (GST):', 140, summaryY + 20);
        doc.text(`INR ${order.totals.tax.toFixed(2)}`, 178, summaryY + 20);
        
        doc.setDrawColor(rgb.r, rgb.g, rgb.b);
        doc.line(135, summaryY + 24, 196, summaryY + 24);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rgb.r, rgb.g, rgb.b);
        doc.text('Grand Total:', 140, summaryY + 30);
        doc.text(`INR ${order.totals.total.toFixed(2)}`, 178, summaryY + 30);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(rgb.r, rgb.g, rgb.b);
        doc.text('Thank you for choosing Tree Born!', 14, summaryY + 45);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('This is a computer generated invoice and does not require physical signature.', 14, summaryY + 50);
        
        doc.save(`Invoice_${order.orderNumber}.pdf`);
        toast.success('Invoice downloaded successfully.');
      };

      if (settings?.logo) {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          generatePdf(img);
        };
        img.onerror = () => {
          console.warn('Failed to load store logo, downloading invoice without logo.');
          generatePdf();
        };
        img.src = settings.logo;
      } else {
        generatePdf();
      }
    } catch (pdfError) {
      console.error('Invoice PDF Generation Error:', pdfError);
      toast.error('Failed to generate PDF invoice.');
    }
  };

  const [orderPage, setOrderPage] = useState(1);
  const ordersPerPage = 3;
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Address edit state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Dynamic initials calculation (no avatar field)
  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : 'U';

  // Protect route & synchronize profile formik state
  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to access your profile panel.');
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Formik for Profile Info
  const profileFormik = useFormik({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
    enableReinitialize: true,
    validationSchema: profileSchema,
    onSubmit: async (values) => {
      const success = await updateUser({
        name: values.name,
        email: values.email,
        phone: values.phone,
      });

      if (success) {
        toast.success('Profile settings updated successfully!');
      }
    },
  });

  // Formik for Address
  const addressFormik = useFormik({
    initialValues: {
      name: '',
      phone: '',
      street: '',
      country: 'India',
      state: '',
      district: '',
      zip: '',
      isDefault: false,
    },
    validationSchema: addressSchema,
    onSubmit: async (values) => {
      let success = false;
      const payload = {
        name: values.name,
        phone: values.phone,
        street: values.street,
        country: values.country,
        state: values.state,
        district: values.district,
        zip: values.zip,
        isDefault: values.isDefault,
      };

      if (editingAddressId) {
        success = await updateAddress(editingAddressId, payload);
      } else {
        success = await addAddress(payload);
      }

      if (success) {
        setIsEditingAddress(false);
        setEditingAddressId(null);
        addressFormik.resetForm();
        toast.success(editingAddressId ? 'Address updated!' : 'Address added!');
      }
    },
  });

  // Fetch real orders when the user opens "Order History"
  useEffect(() => {
    if (activeTab !== 'orders' || !user) return;

    let cancelled = false;

    const run = async () => {
      setOrdersLoading(true);
      const data = await fetchOrders(orderPage, ordersPerPage);
      if (cancelled) return;

      if (!data) {
        setOrders([]);
        setOrdersTotal(0);
        setOrdersLoading(false);
        return;
      }

      setOrders(data.orders);
      setOrdersTotal(data.total);
      setOrdersLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [activeTab, orderPage, ordersPerPage, user, fetchOrders]);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-light-gray flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalPages = ordersTotal > 0 ? Math.ceil(ordersTotal / ordersPerPage) : 0;

  const formatOrderDate = (isoDate?: string) => {
    if (!isoDate) return '';
    return new Date(isoDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });
  };

  // Address Dropdown Select Cascades
  const countryOptions = locationData.map((c) => c.name);
  const selectedCountryObj = locationData.find((c) => c.name === addressFormik.values.country);
  const stateOptions = selectedCountryObj ? selectedCountryObj.states.map((s) => s.name) : [];
  const selectedStateObj = selectedCountryObj?.states.find((s) => s.name === addressFormik.values.state);
  const districtOptions = selectedStateObj ? selectedStateObj.districts : [];

  const handleCountryChange = (val: string) => {
    addressFormik.setFieldValue('country', val);
    addressFormik.setFieldValue('state', '');
    addressFormik.setFieldValue('district', '');
  };

  const handleStateChange = (val: string) => {
    addressFormik.setFieldValue('state', val);
    addressFormik.setFieldValue('district', '');
  };

  const handleDistrictChange = (val: string) => {
    addressFormik.setFieldValue('district', val);
  };

  const handleEditAddress = (addr: Address) => {
    if (!addr._id) return;
    setEditingAddressId(addr._id);
    addressFormik.setValues({
      name: addr.name,
      phone: addr.phone,
      street: addr.street,
      country: addr.country,
      state: addr.state,
      district: addr.district,
      zip: addr.zip,
      isDefault: addr.isDefault || false,
    });
    setIsEditingAddress(true);
  };

  const handleDeleteAddress = async (addrId: string | undefined) => {
    if (!addrId) return;
    if (window.confirm('Are you sure you want to delete this address?')) {
      const success = await deleteAddress(addrId);
      if (success) {
        toast.success('Address deleted successfully.');
      }
    }
  };

  return (
    <>
      <SEO
        title="My Profile — TREEBORN Skincare"
        description="Manage your TREEBORN account details, shipping addresses, and review order history."
      />

      <Navbar />

      <main className="pt-24 pb-20 min-h-screen bg-light-gray/30">
        {/* Luxury Premium Header Profile Card Banner */}
        <div className="bg-gradient-to-r from-primary-dark via-primary to-coffee-dark py-14 text-white border-b border-white/10 shadow-lg relative overflow-hidden rounded-b-[2.5rem]">
          {/* Ambient glow backdrops */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-light/25 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-light-blue/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

          <Container className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5 flex-col md:flex-row text-center md:text-left">
                {/* Dynamically generated initials bubble */}
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-primary-light to-primary border-2 border-light-blue-dark/50 flex items-center justify-center text-white font-display font-bold text-2xl sm:text-3xl shadow-xl backdrop-blur-md flex-shrink-0 relative">
                  {initials}
                  <span className="absolute bottom-0 right-0 w-5.5 h-5.5 bg-secondary border-2 border-primary-dark rounded-full flex items-center justify-center shadow-xs" title="Premium Tree Born Circle Member">
                    <CheckCircle size={11} className="text-white" />
                  </span>
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white flex items-center justify-center md:justify-start gap-2">
                    <span>{user.name}</span>
                    {user.role === 'admin' && (
                      <span className="bg-secondary/20 text-[#22C55E] border border-secondary/30 px-2 py-0.5 rounded-full text-[9px] font-sans font-bold uppercase tracking-wider">
                        Admin
                      </span>
                    )}
                  </h1>
                  <p className="text-xs text-white/80 font-sans tracking-wide">
                    {user.email} &bull; Tree Born Circle Member
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleLogout}
                  className="bg-transparent border border-white/20 hover:border-white hover:bg-white/10 text-white text-xs font-semibold px-5 py-2.5 rounded-full tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 focus:outline-none"
                >
                  <LogOut size={13} />
                  <span>Log Out</span>
                </button>
                {user.role === 'admin' && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="bg-secondary hover:bg-secondary/90 text-white text-xs font-bold px-5 py-2.5 rounded-full tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 focus:outline-none shadow-sm"
                  >
                    <Shield size={13} />
                    <span>Admin Panel</span>
                  </button>
                )}
              </div>
            </div>
          </Container>
        </div>

        {/* Workspace content grid */}
        <Container className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Sidebar Navigation */}
            <div className="lg:col-span-3 bg-white rounded-3xl border border-border-gray/30 p-5 shadow-sm space-y-4">
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-primary/50 block px-2">
                My Dashboard
              </span>
              <nav className="flex flex-col gap-1.5 text-xs font-display font-semibold uppercase tracking-wider">
                <button
                  onClick={() => { setActiveTab('profile'); setIsEditingAddress(false); }}
                  className={`flex items-center gap-3 px-4.5 py-3.5 rounded-2xl text-left cursor-pointer transition-all duration-300 ${
                    activeTab === 'profile'
                      ? 'bg-primary/10 text-primary border border-primary/15 font-bold shadow-3xs'
                      : 'text-slate-655 hover:bg-slate-50/70 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <UserIcon size={14} className={activeTab === 'profile' ? 'text-primary' : 'text-slate-400'} />
                  <span>Profile Settings</span>
                </button>

                <button
                  onClick={() => { setActiveTab('orders'); setIsEditingAddress(false); setOrderPage(1); }}
                  className={`flex items-center gap-3 px-4.5 py-3.5 rounded-2xl text-left cursor-pointer transition-all duration-300 ${
                    activeTab === 'orders'
                      ? 'bg-primary/10 text-primary border border-primary/15 font-bold shadow-3xs'
                      : 'text-slate-655 hover:bg-slate-50/70 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <ShoppingBag size={14} className={activeTab === 'orders' ? 'text-primary' : 'text-slate-400'} />
                  <span>Order History</span>
                </button>

                <button
                  onClick={() => { setActiveTab('addresses'); }}
                  className={`flex items-center gap-3 px-4.5 py-3.5 rounded-2xl text-left cursor-pointer transition-all duration-300 ${
                    activeTab === 'addresses'
                      ? 'bg-primary/10 text-primary border border-primary/15 font-bold shadow-3xs'
                      : 'text-slate-655 hover:bg-slate-50/70 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  <MapPin size={14} className={activeTab === 'addresses' ? 'text-primary' : 'text-slate-400'} />
                  <span>Saved Addresses</span>
                </button>
              </nav>
            </div>

            {/* Main Panel Content */}
            <div className="lg:col-span-9 bg-white rounded-3xl border border-border-gray/30 p-6 sm:p-8 shadow-sm min-h-[480px]">
              
              {/* Tab 1: Profile Details */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="border-b border-border-gray/40 pb-4">
                    <h2 className="text-lg font-display font-semibold text-dark">Profile Settings</h2>
                    <p className="text-xs text-gray-500 mt-1 font-sans">
                      Keep your core account metrics updated to ensure swift delivery notifications and custom formulations.
                    </p>
                  </div>

                  <form onSubmit={profileFormik.handleSubmit} className="space-y-5 max-w-2xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-dark/70 font-display flex items-center gap-1.5">
                          <UserIcon size={12} className="text-gray-400" />
                          <span>Full Name</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={profileFormik.values.name}
                          onChange={profileFormik.handleChange}
                          onBlur={profileFormik.handleBlur}
                          className={`w-full border px-4 py-3 text-sm rounded-xl text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-sans bg-light-gray/10 transition-colors ${
                            profileFormik.touched.name && profileFormik.errors.name
                              ? 'border-red-500 focus:border-red-550'
                              : 'border-border-gray/80'
                          }`}
                        />
                        {profileFormik.touched.name && profileFormik.errors.name && (
                          <div className="text-[10px] text-red-500 font-sans font-medium mt-1">
                            {profileFormik.errors.name}
                          </div>
                        )}
                      </div>
                      
                      {/* Phone */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-dark/70 font-display flex items-center gap-1.5">
                          <Phone size={12} className="text-gray-400" />
                          <span>Contact Phone</span>
                        </label>
                        <input
                          type="text"
                          name="phone"
                          value={profileFormik.values.phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 10) {
                              profileFormik.setFieldValue('phone', val);
                            }
                          }}
                          maxLength={10}
                          onBlur={profileFormik.handleBlur}
                          className={`w-full border px-4 py-3 text-sm rounded-xl text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-sans bg-light-gray/10 transition-colors ${
                            profileFormik.touched.phone && profileFormik.errors.phone
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-border-gray/80'
                          }`}
                        />
                        {profileFormik.touched.phone && profileFormik.errors.phone && (
                          <div className="text-[10px] text-red-500 font-sans font-medium mt-1">
                            {profileFormik.errors.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5 max-w-sm">
                      <label className="text-xs font-semibold text-dark/70 font-display flex items-center gap-1.5">
                        <Mail size={12} className="text-gray-400" />
                        <span>Email Address</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={profileFormik.values.email}
                        onChange={profileFormik.handleChange}
                        onBlur={profileFormik.handleBlur}
                        className={`w-full border px-4 py-3 text-sm rounded-xl text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-sans bg-light-gray/10 transition-colors ${
                          profileFormik.touched.email && profileFormik.errors.email
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-border-gray/80'
                        }`}
                      />
                      {profileFormik.touched.email && profileFormik.errors.email && (
                        <div className="text-[10px] text-red-500 font-sans font-medium mt-1">
                          {profileFormik.errors.email}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-primary/10 mt-6">
                      <button
                        type="submit"
                        disabled={profileFormik.isSubmitting}
                        className="bg-primary hover:bg-primary-light text-white text-xs font-bold px-6 py-3.5 rounded-full tracking-wider uppercase shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer w-full sm:w-auto focus:outline-none"
                      >
                        {profileFormik.isSubmitting ? 'Saving...' : 'Save Settings'}
                      </button>
                    </div>
                  </form>

                  {/* Password & Security Section */}
                  <div className="pt-8 border-t border-border-gray/50 mt-8 max-w-2xl space-y-4">
                    <div>
                      <h3 className="text-sm font-bold font-display text-dark flex items-center gap-2">
                        <Shield size={16} className="text-primary" />
                        <span>Password &amp; Security</span>
                      </h3>
                      <p className="text-xs text-gray-500 font-sans mt-0.5">
                        Update your password to keep your account secure.
                      </p>
                    </div>

                    {/* Direct Password Change */}
                    <div className="bg-light-gray/20 border border-border-gray/50 rounded-2xl p-4">
                      {!showPasswordChange ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-dark/80">
                            Want to change your account password?
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPasswordChange(true)}
                            className="text-xs font-bold text-primary hover:underline cursor-pointer"
                          >
                            Change Password
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleUpdatePasswordInProfile} className="space-y-4">
                          <div className="flex items-center justify-between border-b border-border-gray/40 pb-2">
                            <h4 className="text-xs font-bold text-dark uppercase tracking-wider">
                              Set New Password
                            </h4>
                            <button
                              type="button"
                              onClick={() => setShowPasswordChange(false)}
                              className="text-[11px] text-gray-400 hover:text-dark cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-gray-600">New Password</label>
                              <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full border border-border-gray/80 px-3.5 py-2.5 text-xs rounded-xl focus:outline-none focus:border-primary bg-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[11px] font-semibold text-gray-600">Confirm New Password</label>
                              <input
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full border border-border-gray/80 px-3.5 py-2.5 text-xs rounded-xl focus:outline-none focus:border-primary bg-white"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={isUpdatingPassword}
                            className="bg-dark hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
                          >
                            {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Orders */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="border-b border-border-gray/40 pb-4">
                    <h2 className="text-lg font-display font-semibold text-dark">Order History</h2>
                    <p className="text-xs text-gray-500 mt-1 font-sans">
                      {ordersLoading
                        ? 'Loading your order history...'
                        : `Track active deliveries and review previous botanical purchases. Showing ${orders.length} of ${ordersTotal} orders.`}
                    </p>
                  </div>

                  <div className="space-y-5">
                    {ordersLoading ? (
                      <div className="py-12 flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="py-12 text-center space-y-2">
                        <ShoppingBag size={22} className="text-gray-300 mx-auto" />
                        <h4 className="font-display font-semibold text-sm text-dark">No orders yet</h4>
                        <p className="text-xs text-gray-500 font-sans">Place your first order to see it here.</p>
                      </div>
                    ) : (
                      orders.map((order) => {
                        const orderId = order._id || order.orderNumber;
                        const isExpanded = expandedOrderId === orderId;
                        const currentStatus = order.status;
                        const isCancelled = currentStatus === 'Cancelled';
                        const isRTO = order.deliveryStatus?.toLowerCase().includes('rto');
                        
                        let steps = ['Order Placed', 'Processing', 'In Transit', 'Delivered'];
                        if (isCancelled) {
                          steps = ['Order Placed', 'Cancelled'];
                        } else if (isRTO) {
                          steps = ['Order Placed', 'In Transit', 'Returned'];
                        }

                        const getActiveIndex = (ord: any) => {
                          if (isCancelled) return 1;
                          const orderStatus = String(ord.status || '').toLowerCase();
                          const deliveryStatus = String(ord.deliveryStatus || '').toLowerCase();
                          
                          if (orderStatus === 'delivered' || deliveryStatus.includes('delivered')) return 3;
                          if (deliveryStatus.includes('out for delivery') || deliveryStatus.includes('out_for_delivery') || deliveryStatus.includes('transit') || deliveryStatus.includes('shipped') || orderStatus === 'shipped') return 2;
                          if (ord.shipmentCreated || ord.awbCode || ord.pickupScheduled || orderStatus === 'confirmed' || orderStatus === 'processing') return 1;
                          return 0;
                        };
                        
                        const activeIndex = getActiveIndex(order);

                        return (
                          <div
                            key={order.orderNumber}
                            className="border border-border-gray/40 rounded-2xl overflow-hidden bg-white transition-all duration-200"
                          >
                            {/* Collapsible Order Header bar */}
                            <div 
                              onClick={() => setExpandedOrderId(isExpanded ? null : orderId)}
                              className="bg-slate-50/80 hover:bg-slate-100/70 p-4 sm:px-6 flex flex-wrap justify-between items-center gap-3 cursor-pointer transition-colors"
                            >
                              <div className="flex flex-wrap gap-4 sm:gap-8 text-xs text-gray-500 font-sans">
                                <div>
                                  <span className="block text-[10px] font-medium uppercase tracking-wider text-gray-400">Order Placed</span>
                                  <span className="font-semibold text-dark mt-0.5 block">{formatOrderDate(order.createdAt)}</span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-medium uppercase tracking-wider text-gray-400">Order ID</span>
                                  <span className="font-semibold text-dark mt-0.5 block">{order.orderNumber}</span>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-medium uppercase tracking-wider text-gray-400">Grand Total</span>
                                  <span className="font-bold text-primary mt-0.5 block">₹{order.totals.total.toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9.5px] font-sans font-bold uppercase tracking-wider ${
                                  currentStatus === 'Pending'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : currentStatus === 'Confirmed'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {currentStatus}
                                </span>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadInvoice(order);
                                  }}
                                  className="text-gray-400 hover:text-primary transition-colors p-1 flex items-center justify-center cursor-pointer focus:outline-none"
                                  title="Download Invoice PDF"
                                >
                                  <Download size={15} />
                                </button>

                                {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                              </div>
                            </div>

                            {/* Collapsible Content */}
                            {isExpanded && (
                              <div className="p-5 sm:p-6 space-y-6 border-t border-border-gray/20 bg-white">
                                {/* Professional Clean Stepper */}
                                <div className="space-y-4">
                                  <div className="flex flex-wrap justify-between items-center gap-2">
                                    <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">
                                      Delivery Status
                                    </h4>
                                    
                                    {order.shipmentCreated && (
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-sans">
                                        {order.courierName && (
                                          <div>
                                            <span className="text-gray-400 font-medium">Courier:</span> <span className="font-semibold text-dark">{order.courierName}</span>
                                          </div>
                                        )}
                                        {order.trackingNumber && (
                                          <div>
                                            <span className="text-gray-400 font-medium">AWB:</span> <span className="font-mono font-semibold text-dark">{order.trackingNumber}</span>
                                          </div>
                                        )}
                                        {order.deliveryStatus && (
                                          <div>
                                            <span className="text-gray-400 font-medium">Status:</span> <span className="font-semibold text-primary">{order.deliveryStatus}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {isCancelled ? (
                                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center gap-3 text-rose-800 font-sans text-xs">
                                      <AlertTriangle size={18} className="text-rose-500 shrink-0" />
                                      <div>
                                        <p className="font-bold">Order Cancelled</p>
                                        <p className="mt-0.5 text-rose-600/80">This order has been cancelled. Any captured payment will be refunded to your account.</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {/* Mobile Vertical Status Stepper (Amazon & Flipkart Style) */}
                                      <div className="sm:hidden space-y-4 py-3 px-4 bg-slate-50/70 rounded-2xl border border-slate-100 font-sans">
                                        {steps.map((step, idx) => {
                                          const isActive = idx <= activeIndex;
                                          const isCurrent = idx === activeIndex;
                                          const isLast = idx === steps.length - 1;

                                          return (
                                            <div key={step} className="flex items-start gap-3.5 relative">
                                              {/* Connecting vertical line */}
                                              {!isLast && (
                                                <div
                                                  className={`absolute left-[13px] top-[26px] bottom-[-16px] w-[2px] rounded-full transition-colors ${
                                                    idx < activeIndex ? 'bg-primary' : 'bg-slate-200'
                                                  }`}
                                                />
                                              )}

                                              {/* Circle Icon */}
                                              <div
                                                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all ${
                                                  isActive
                                                    ? 'bg-primary border-primary text-white shadow-xs'
                                                    : 'bg-white border-slate-300 text-slate-400'
                                                }`}
                                              >
                                                {isActive ? <CheckCircle size={13} className="text-white" /> : <div className="w-2 h-2 bg-slate-300 rounded-full" />}
                                              </div>

                                              {/* Step Title & Subtitle */}
                                              <div className="pt-0.5 min-w-0 flex-1">
                                                <p
                                                  className={`text-xs font-bold uppercase tracking-wider ${
                                                    isCurrent
                                                      ? 'text-primary font-extrabold'
                                                      : isActive
                                                        ? 'text-slate-900'
                                                        : 'text-slate-400'
                                                  }`}
                                                >
                                                  {step}
                                                </p>
                                                {isCurrent && (
                                                  <p className="text-[10px] font-semibold text-emerald-600 mt-0.5 font-sans">
                                                    {step === 'Delivered'
                                                      ? 'Package Delivered Successfully'
                                                      : step === 'In Transit'
                                                        ? 'Package is on the way'
                                                        : step === 'Processing'
                                                          ? 'Order being packed & processed'
                                                          : 'Order placed & confirmed'}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Desktop Horizontal Stepper Bar */}
                                      <div className="hidden sm:block py-4 px-2 bg-slate-50/60 rounded-2xl border border-slate-100">
                                        <div className="relative flex items-center justify-between w-full max-w-2xl mx-auto px-6 z-0">
                                          {/* Progress Bar line background */}
                                          <div className="absolute left-8 right-8 top-[16px] -translate-y-1/2 h-1 bg-slate-200 z-0 rounded-full" />
                                          <div
                                            className="absolute left-8 top-[16px] -translate-y-1/2 h-1 bg-primary transition-all duration-500 z-0 rounded-full"
                                            style={{ width: `${(activeIndex / (steps.length - 1)) * 90}%` }}
                                          />

                                          {steps.map((step, idx) => {
                                            const isActive = idx <= activeIndex;
                                            const isCurrent = idx === activeIndex;
                                            return (
                                              <div key={step} className="flex flex-col items-center relative z-10 min-w-0 px-2">
                                                <div
                                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                                    isActive
                                                      ? 'bg-primary border-primary text-white scale-105 shadow-sm'
                                                      : 'bg-white border-slate-300 text-slate-400'
                                                  }`}
                                                >
                                                  {isActive ? <CheckCircle size={14} className="text-white" /> : <div className="w-2 h-2 bg-slate-300 rounded-full" />}
                                                </div>
                                                <span
                                                  className={`text-[10px] font-bold uppercase tracking-wider mt-2.5 font-sans text-center leading-tight ${
                                                    isCurrent
                                                      ? 'text-primary font-extrabold'
                                                      : isActive
                                                        ? 'text-slate-800'
                                                        : 'text-slate-400'
                                                  }`}
                                                >
                                                  {step}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </>
                                  )}

                                  {order.trackingUrl && (
                                    <div className="flex justify-start">
                                      <a
                                        href={order.trackingUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold px-4 py-2 rounded-full transition duration-200 focus:outline-none"
                                      >
                                        Track Shipment Live
                                      </a>
                                    </div>
                                  )}
                                </div>

                                {/* Order Items & Shipping Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                  {/* Left: Items Summary */}
                                  <div className="space-y-3">
                                    <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">
                                      Order Items ({order.items?.length || 0})
                                    </h4>
                                    <div className="divide-y divide-gray-100">
                                      {order.items.map((item, idx) => (
                                        <div
                                          key={`${item.productId}-${idx}`}
                                          className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs font-sans"
                                        >
                                          <div>
                                            <h5 className="font-semibold text-dark leading-tight">{item.name}</h5>
                                            <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
                                              <span>Size: {item.selectedSize || '50ml'}</span>
                                              <span>&bull;</span>
                                              <span>Qty: {item.quantity}</span>
                                            </div>
                                          </div>
                                          <span className="font-bold text-primary whitespace-nowrap ml-4">₹{item.price.toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Right: Shipping Address & Summary totals */}
                                  <div className="space-y-5">
                                    {/* Shipping Address */}
                                    <div className="space-y-2">
                                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">
                                        Shipping Address
                                      </h4>
                                      <div className="text-xs text-gray-600 font-sans leading-relaxed">
                                        <p className="font-semibold text-dark">{order.shippingAddress?.name || user.name}</p>
                                        <p className="text-gray-400 text-[11px]">{order.shippingAddress?.phone || user.phone}</p>
                                        <p className="mt-1 text-gray-550">
                                          {order.shippingAddress?.street}, {order.shippingAddress?.district}, {order.shippingAddress?.state}, {order.shippingAddress?.country} - {order.shippingAddress?.zip}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Financial Totals Breakdown */}
                                    <div className="space-y-2 pt-2 border-t border-gray-100">
                                      <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-gray-400">
                                        Payment Breakdown
                                      </h4>
                                      <div className="space-y-1.5 text-xs text-gray-650 font-sans">
                                        <div className="flex justify-between">
                                          <span>Payment Method</span>
                                          <span className="font-semibold uppercase text-dark">
                                            {order.payment?.method === 'razorpay' ? 'Razorpay Online' : order.payment?.method === 'card' ? 'Online Card' : 'Cash on Delivery (COD)'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Payment Status</span>
                                          <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                                            order.payment?.status === 'Paid' || order.payment?.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                          }`}>{order.payment?.status || 'Pending'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Subtotal</span>
                                          <span>₹{order.totals.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Shipping Fee</span>
                                          <span>₹{order.totals.shipping.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-100">
                                          <span className="text-dark">Total Amount</span>
                                          <span className="text-primary">₹{order.totals.total.toFixed(2)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Download Invoice Button inside details */}
                                <div className="flex justify-end pt-3 border-t border-border-gray/20">
                                  <button
                                    onClick={() => handleDownloadInvoice(order)}
                                    className="bg-primary hover:bg-primary-light text-white text-xs font-bold px-5 py-2.5 rounded-full flex items-center gap-2 cursor-pointer shadow-3xs transition-all active:scale-[0.98]"
                                  >
                                    <Download size={14} />
                                    <span>Download PDF Invoice</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center pt-4 border-t border-border-gray/30 font-display text-xs font-semibold text-dark/70">
                        <button
                          disabled={orderPage === 1}
                          onClick={() => setOrderPage(orderPage - 1)}
                          className={`px-4 py-2 border border-border-gray/50 rounded-xl cursor-pointer transition-colors ${
                            orderPage === 1
                              ? 'opacity-40 cursor-not-allowed bg-gray-55'
                              : 'hover:bg-light-gray/30'
                          }`}
                        >
                          Previous
                        </button>
                        <span>
                          Page {orderPage} of {totalPages}
                        </span>
                        <button
                          disabled={orderPage === totalPages}
                          onClick={() => setOrderPage(orderPage + 1)}
                          className={`px-4 py-2 border border-border-gray/50 rounded-xl cursor-pointer transition-colors ${
                            orderPage === totalPages
                              ? 'opacity-40 cursor-not-allowed bg-gray-55'
                              : 'hover:bg-light-gray/30'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Addresses */}
              {activeTab === 'addresses' && (
                <div className="space-y-6">
                  <div className="border-b border-border-gray/40 pb-4 flex justify-between items-center gap-4">
                    <div>
                      <h2 className="text-lg font-display font-semibold text-dark">Saved Addresses</h2>
                      <p className="text-xs text-gray-500 mt-1 font-sans">
                        Add or modify your shipping locations to speed up standard checkouts.
                      </p>
                    </div>
                    {!isEditingAddress && (
                      <button
                        onClick={() => {
                          setEditingAddressId(null);
                          addressFormik.resetForm();
                          setIsEditingAddress(true);
                        }}
                        className="bg-primary hover:bg-primary-light text-white text-xs font-semibold px-4 py-2.5 rounded-full flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors focus:outline-none"
                      >
                        <Plus size={14} />
                        <span>Add Address</span>
                      </button>
                    )}
                  </div>

                  {/* Add / Edit Address Form using Formik & Yup validations */}
                  {isEditingAddress ? (
                    <form onSubmit={addressFormik.handleSubmit} className="bg-light-gray/15 border border-border-gray/40 rounded-3xl p-5 sm:p-6 space-y-4">
                      <h3 className="font-display font-bold text-sm text-primary border-b border-border-gray/30 pb-2">
                        {editingAddressId ? 'Edit Address Detail' : 'Register New Address'}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Recipient Name */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-dark/70 font-display">Recipient Name *</label>
                          <input
                            type="text"
                            name="name"
                            placeholder="Enter recipient full name"
                            value={addressFormik.values.name}
                            onChange={addressFormik.handleChange}
                            onBlur={addressFormik.handleBlur}
                            className={`w-full border px-4 py-2.5 text-xs rounded-xl text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-sans bg-white transition-colors ${
                              addressFormik.touched.name && addressFormik.errors.name
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-border-gray/80'
                            }`}
                          />
                          {addressFormik.touched.name && addressFormik.errors.name && (
                            <div className="text-[9px] text-red-500 font-sans font-medium mt-0.5">
                              {addressFormik.errors.name}
                            </div>
                          )}
                        </div>

                        {/* Recipient Contact Phone */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-dark/70 font-display">Recipient Contact Phone *</label>
                          <input
                            type="text"
                            name="phone"
                            placeholder="Enter 10-digit mobile number"
                            value={addressFormik.values.phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val.length <= 10) {
                                addressFormik.setFieldValue('phone', val);
                              }
                            }}
                            onBlur={addressFormik.handleBlur}
                            maxLength={10}
                            className={`w-full border px-4 py-2.5 text-xs rounded-xl text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-sans bg-white transition-colors ${
                              addressFormik.touched.phone && addressFormik.errors.phone
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-border-gray/80'
                            }`}
                          />
                          {addressFormik.touched.phone && addressFormik.errors.phone && (
                            <div className="text-[9px] text-red-500 font-sans font-medium mt-0.5">
                              {addressFormik.errors.phone}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Street Address */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-dark/70 font-display">Street Address (House No, Building, Area) *</label>
                        <input
                          type="text"
                          name="street"
                          placeholder="Enter house/flat no., street, area"
                          value={addressFormik.values.street}
                          onChange={addressFormik.handleChange}
                          onBlur={addressFormik.handleBlur}
                          className={`w-full border px-4 py-2.5 text-xs rounded-xl text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-sans bg-white transition-colors ${
                            addressFormik.touched.street && addressFormik.errors.street
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-border-gray/80'
                          }`}
                        />
                        {addressFormik.touched.street && addressFormik.errors.street && (
                          <div className="text-[9px] text-red-500 font-sans font-medium mt-0.5">
                            {addressFormik.errors.street}
                          </div>
                        )}
                      </div>

                      {/* Dynamic Cascading Dropdowns matching Government Sites */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SearchableDropdown
                          label="Country"
                          required
                          options={countryOptions}
                          value={addressFormik.values.country}
                          onChange={handleCountryChange}
                        />

                        <SearchableDropdown
                          label="State"
                          required
                          options={stateOptions}
                          value={addressFormik.values.state}
                          onChange={handleStateChange}
                          placeholder={addressFormik.values.country ? "Select State" : "Choose Country first"}
                          disabled={!addressFormik.values.country}
                        />

                        <SearchableDropdown
                          label="District"
                          required
                          options={districtOptions}
                          value={addressFormik.values.district}
                          onChange={handleDistrictChange}
                          placeholder={addressFormik.values.state ? "Select District" : "Choose State first"}
                          disabled={!addressFormik.values.state}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {addressFormik.touched.country && addressFormik.errors.country && (
                          <div className="text-[9px] text-red-500 font-sans font-medium">{addressFormik.errors.country}</div>
                        )}
                        {addressFormik.touched.state && addressFormik.errors.state && (
                          <div className="text-[9px] text-red-500 font-sans font-medium">{addressFormik.errors.state}</div>
                        )}
                        {addressFormik.touched.district && addressFormik.errors.district && (
                          <div className="text-[9px] text-red-500 font-sans font-medium">{addressFormik.errors.district}</div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* ZIP */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-dark/70 font-display">ZIP / Postal Code *</label>
                          <input
                            type="text"
                            name="zip"
                            placeholder="Enter 6-digit pincode"
                            value={addressFormik.values.zip}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val.length <= 6) {
                                addressFormik.setFieldValue('zip', val);
                              }
                            }}
                            onBlur={addressFormik.handleBlur}
                            maxLength={6}
                            className={`w-full border px-4 py-2.5 text-xs rounded-xl text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-sans bg-white transition-colors ${
                              addressFormik.touched.zip && addressFormik.errors.zip
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-border-gray/80'
                            }`}
                          />
                          {addressFormik.touched.zip && addressFormik.errors.zip && (
                            <div className="text-[9px] text-red-500 font-sans font-medium mt-0.5">
                              {addressFormik.errors.zip}
                            </div>
                          )}
                        </div>

                        {/* Set as Default */}
                        <div className="flex items-center gap-2 pt-6 font-display text-xs font-semibold text-dark/80">
                          <input
                            type="checkbox"
                            id="isDefault"
                            name="isDefault"
                            checked={addressFormik.values.isDefault}
                            onChange={addressFormik.handleChange}
                            className="rounded border-border-gray text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor="isDefault" className="cursor-pointer">
                            Set as primary billing/shipping address
                          </label>
                        </div>
                      </div>

                      <div className="pt-4 flex gap-3 text-xs font-semibold">
                        <button
                          type="submit"
                          className="bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-full cursor-pointer transition-colors focus:outline-none"
                        >
                          {editingAddressId ? 'Update Address' : 'Register Address'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setIsEditingAddress(false); setEditingAddressId(null); addressFormik.resetForm(); }}
                          className="bg-transparent border border-border-gray hover:bg-primary/5 hover:text-primary px-5 py-2.5 rounded-full cursor-pointer transition-colors focus:outline-none"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {user.addresses && user.addresses.length > 0 ? (
                        user.addresses.map((addr) => (
                          <div
                            key={addr._id}
                            className={`border rounded-2xl p-4 sm:p-5 relative space-y-3 transition-all hover:shadow-xs ${
                              addr.isDefault
                                ? 'border-primary bg-primary/2'
                                : 'border-border-gray/40'
                            }`}
                          >
                            {addr.isDefault && (
                              <span className="absolute top-4 right-4 bg-primary text-white px-2 py-0.5 rounded-full text-[8px] font-sans font-bold uppercase tracking-wider">
                                Primary
                              </span>
                            )}
                            
                            <div className="space-y-1 text-xs">
                              <h4 className="font-display font-bold text-dark">{addr.name}</h4>
                              <p className="text-gray-500 font-sans">{addr.phone}</p>
                              <p className="text-gray-600 font-sans mt-2 pr-10 leading-relaxed">
                                {addr.street}, {addr.district}, {addr.state}, {addr.country} - {addr.zip}
                              </p>
                            </div>

                            <div className="pt-3 border-t border-border-gray/30 flex gap-4 text-[10px] font-display font-bold uppercase tracking-wider">
                              <button
                                onClick={() => handleEditAddress(addr)}
                                className="text-primary hover:text-primary-light flex items-center gap-1 cursor-pointer transition-colors focus:outline-none"
                              >
                                <Edit size={12} />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr._id)}
                                className="text-red-500 hover:text-red-655 flex items-center gap-1 cursor-pointer transition-colors focus:outline-none"
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 py-12 text-center space-y-2 border border-dashed border-border-gray/40 rounded-3xl">
                          <MapPin size={22} className="text-gray-300 mx-auto" />
                          <h4 className="font-display font-semibold text-sm text-dark">No saved addresses</h4>
                          <p className="text-xs text-gray-500 font-sans">Register shipping destinations above to speed up checkout.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </Container>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-gray-150 animate-scale-in">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Log Out</h3>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                Are you sure you want to log out of your Tree Born account?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200 transition cursor-pointer focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer focus:outline-none"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <WhatsAppButton />
      <Footer />
    </>
  );
};

export default Profile;
