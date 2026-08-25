import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, User, Phone, CalendarDays, Package, Download } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import AdminLayout from '../../components/admin/AdminLayout';
import Card from '../../components/admin/Card';
import Button from '../../components/admin/Button';
import StatusBadge from '../../components/admin/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { jsPDF } from 'jspdf';
import { API_BASE_URL } from '../../config';
import Select from '../../components/admin/Select';

const statusOptions = ['Pending', 'Confirmed', 'Cancelled'];

const OrderView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { accessToken } = useAuth();
  const { settings } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [status, setStatus] = useState('Pending');

  // Shiprocket integration states
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [recommendedCourierId, setRecommendedCourierId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCouriers = async () => {
    if (!id || !accessToken) return;
    setLoadingCouriers(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/couriers`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCouriers(data.couriers || []);
        setRecommendedCourierId(data.recommendedCourierId || null);
      }
    } catch (error) {
      console.error('Error fetching couriers:', error);
    } finally {
      setLoadingCouriers(false);
    }
  };

  const handleShipmentAction = async (action: string, bodyData: any = {}) => {
    if (!id || !accessToken) return;
    setActionLoading(action);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();
      if (response.ok) {
        setOrder(data.order);
        toast.success(data.message || 'Action completed successfully');
      } else {
        toast.error(data.message || 'Action failed');
      }
    } catch (error: any) {
      console.error(`Error during ${action}:`, error);
      toast.error(error.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadInvoice = (orderData: any) => {
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
          doc.text(settings?.shopName || 'CosmeGlow', 29, 20);
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text('Premium Botanical Skincare', 29, 25);
        } else {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(22);
          doc.setTextColor(rgb.r, rgb.g, rgb.b);
          doc.text(settings?.shopName || 'CosmeGlow', 14, 20);
          
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

        doc.text(`Shop: ${settings?.shopName || 'CosmeGlow Skincare'}`, 14, 44);
        doc.text(`GST: ${settings?.gstNumber || '24AAAAA0000A1Z5'}`, 14, 49);
        doc.text(`Email: ${settings?.email || 'support@cosmeglow.com'}`, 14, 54);
        doc.text(splitAddress, 14, 59);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Invoice Details:', 120, 38);
        
        doc.setFont('helvetica', 'normal');
        doc.text([
          `Invoice No: INV-${orderData.orderNumber}`,
          `Order Date: ${orderData.createdAt ? new Date(orderData.createdAt).toLocaleDateString() : 'N/A'}`,
          `Payment Method: ${orderData.payment?.method === 'card' ? 'Online Card' : 'Cash on Delivery (COD)'}`,
          `Payment Status: ${orderData.payment?.status?.toUpperCase() || 'PENDING'}`
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
        const addr = orderData.shippingAddress;
        doc.text([
          `Recipient: ${addr?.name || orderData.user?.name || 'Customer'}`,
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
        
        orderData.items.forEach((item: any, index: number) => {
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
        
        const itemsCount = orderData.items.length;
        let summaryY = tableY + 12 + (itemsCount * 9);
        
        doc.setDrawColor(241, 245, 249);
        doc.line(14, summaryY, 196, summaryY);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        
        doc.text('Subtotal:', 140, summaryY + 8);
        doc.text(`INR ${orderData.totals.subtotal.toFixed(2)}`, 178, summaryY + 8);
        
        doc.text('Shipping:', 140, summaryY + 14);
        doc.text(`INR ${orderData.totals.shipping.toFixed(2)}`, 178, summaryY + 14);
        
        doc.text('Tax (GST):', 140, summaryY + 20);
        doc.text(`INR ${orderData.totals.tax.toFixed(2)}`, 178, summaryY + 20);
        
        doc.setDrawColor(rgb.r, rgb.g, rgb.b);
        doc.line(135, summaryY + 24, 196, summaryY + 24);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(rgb.r, rgb.g, rgb.b);
        doc.text('Grand Total:', 140, summaryY + 30);
        doc.text(`INR ${orderData.totals.total.toFixed(2)}`, 178, summaryY + 30);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(rgb.r, rgb.g, rgb.b);
        doc.text('Thank you for choosing CosmeGlow!', 14, summaryY + 45);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('This is a computer generated invoice and does not require physical signature.', 14, summaryY + 50);
        
        doc.save(`Invoice_${orderData.orderNumber}.pdf`);
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

  useEffect(() => {
    if (!id || !accessToken) return;

    const loadOrder = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/orders/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          setOrder(data.order);
          setStatus(data.order.status);
        }
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, accessToken]);

  useEffect(() => {
    if (order && order.shipmentCreated && !order.awbCode && couriers.length === 0 && !loadingCouriers) {
      fetchCouriers();
    }
  }, [order]);

  const handleStatusSave = async () => {
    if (!id || !accessToken) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        toast.success('Order status updated successfully');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error saving order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setSaving(false);
    }
  };

  const getAdminActiveIndex = (ord: any) => {
    const isCancelled = ord.status === 'Cancelled';
    const isRTO = ord.deliveryStatus?.toLowerCase().includes('rto');
    
    if (isCancelled) return 1;
    if (isRTO) {
      const dStatus = String(ord.deliveryStatus || '').toLowerCase();
      if (dStatus.includes('rto')) return 6;
      if (dStatus.includes('out for delivery') || dStatus.includes('out_for_delivery')) return 5;
      if (dStatus.includes('transit') || dStatus.includes('shipped')) return 4;
      if (ord.pickupScheduled) return 3;
      if (ord.awbCode) return 2;
      if (ord.shipmentCreated) return 1;
      return 0;
    }
    
    const orderStatus = String(ord.status || '').toLowerCase();
    const deliveryStatus = String(ord.deliveryStatus || '').toLowerCase();
    
    if (orderStatus === 'delivered' || deliveryStatus.includes('deliver')) return 6;
    if (deliveryStatus.includes('out for delivery') || deliveryStatus.includes('out_for_delivery')) return 5;
    if (deliveryStatus.includes('transit') || deliveryStatus.includes('shipped') || orderStatus === 'shipped') return 4;
    if (ord.pickupScheduled) return 3;
    if (ord.awbCode) return 2;
    if (ord.shipmentCreated) return 1;
    return 0;
  };

  if (loading) {
    return (
      <AdminLayout title="Order View">
        <div className="flex items-center justify-center min-h-100">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!order) {
    return (
      <AdminLayout title="Order View">
        <Card>
          <div className="text-center py-10 space-y-4">
            <p className="text-gray-500">Order not found.</p>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/orders')}>
              Back to Orders
            </Button>
          </div>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Order View">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button type="button" variant="ghost" icon={ArrowLeft} onClick={() => navigate('/admin/orders')}>
            Back
          </Button>
          <div className="flex items-center gap-3">
            {(() => {
              const statusColorClass = status === 'Pending'
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/50'
                : status === 'Confirmed'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50'
                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/50';
              return (
                <Select
                  value={status}
                  onChange={setStatus}
                  hClass="h-10"
                  className="w-48"
                  buttonClassName={`border ${statusColorClass}`}
                  options={statusOptions.map((option) => ({ value: option, label: option }))}
                />
              );
            })()}
            <Button
              type="button"
              icon={Save}
              onClick={handleStatusSave}
              disabled={saving}
              className="h-10 flex items-center justify-center shrink-0"
            >
              {saving ? 'Saving...' : 'Save Status'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              icon={Download}
              onClick={() => handleDownloadInvoice(order)}
              className="h-10 flex items-center justify-center shrink-0"
            >
              Invoice
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title={`Order ${order.orderNumber}`}>
              <div className="space-y-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={order.status} />
                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {order.payment?.status || 'pending'} payment
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 font-sans text-xs font-semibold shadow-3xs text-indigo-850">
                    <User size={16} className="text-indigo-500" />
                    <span>{order.user?.name || 'Customer'}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 font-sans text-xs font-semibold shadow-3xs text-emerald-800">
                    <Phone size={16} className="text-emerald-500" />
                    <span>{order.user?.phone || order.shippingAddress?.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 font-sans text-xs font-semibold shadow-3xs text-purple-800">
                    <CalendarDays size={16} className="text-purple-500" />
                    <span>Placed: {new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 font-sans text-xs font-semibold shadow-3xs text-amber-800">
                    <Package size={16} className="text-amber-500" />
                    <span>{order.items?.length || 0} unique items</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {order.items?.map((item: any) => (
                    <div key={`${item.productId}-${item.selectedSize}`} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/60 border border-slate-100/80 hover:bg-slate-100 hover:border-slate-200 transition duration-150">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 text-sm leading-snug">{item.name}</p>
                        <p className="text-xs text-gray-505 font-sans">Option: <span className="font-semibold text-slate-700">{item.selectedSize}</span> • Qty: <span className="font-semibold text-slate-700">{item.quantity}</span></p>
                      </div>
                      <p className="font-extrabold text-indigo-700 text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Shipping Address">
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="font-semibold text-gray-900">{order.shippingAddress?.name}</p>
                  <p>{order.shippingAddress?.phone}</p>
                  <p>{order.shippingAddress?.street}</p>
                  <p>{order.shippingAddress?.district}, {order.shippingAddress?.state}</p>
                  <p>{order.shippingAddress?.country} - {order.shippingAddress?.zip}</p>
                </div>
              </Card>

              <Card title="Payment & Transaction Details">
                <div className="space-y-2.5 text-xs text-gray-650">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Method:</span>
                    <span className="font-bold text-gray-900 uppercase">{order.payment?.method || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                      order.payment?.status === 'Paid' || order.payment?.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.payment?.status === 'Failed'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.payment?.status || 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Transaction ID:</span>
                    <span className="font-mono font-semibold text-gray-800 text-[11px] truncate max-w-[150px]">
                      {order.payment?.transactionId || order.payment?.razorpayPaymentId || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Paid Date:</span>
                    <span className="font-medium text-gray-700">
                      {order.payment?.paidAt ? new Date(order.payment.paidAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 font-semibold">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className="text-primary font-bold">{order.payment?.currency || 'INR'} ₹{(order.payment?.amount || order.totals?.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card title="Shiprocket Delivery">
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">Delivery Status:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-xs uppercase ${
                    order.deliveryStatus?.toLowerCase().includes('deliver')
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.deliveryStatus?.toLowerCase().includes('cancel')
                      ? 'bg-rose-100 text-rose-800'
                      : order.deliveryStatus
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.deliveryStatus || 'Not Created'}
                  </span>
                </div>

                {order.shipmentCreated && (
                  <div className="space-y-2 text-xs text-gray-650 border-b border-gray-100 pb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shipment ID:</span>
                      <span className="font-semibold text-gray-800">{order.shipmentId}</span>
                    </div>
                    {order.awbCode && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">AWB Code:</span>
                          <span className="font-mono font-semibold text-gray-800">{order.awbCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Courier:</span>
                          <span className="font-semibold text-gray-800">{order.courierName || 'Shiprocket'}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Manifest:</span>
                      <span className="font-semibold text-gray-800">{order.manifestGenerated ? 'Generated' : 'Pending'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pickup:</span>
                      <span className="font-semibold text-gray-800">{order.pickupScheduled ? 'Scheduled' : 'Pending'}</span>
                    </div>
                  </div>
                )}

                {/* Shipment Progress Timeline */}
                {order.shipmentCreated && (
                  <div className="border-b border-gray-100 pb-4">
                    <span className="font-semibold text-gray-700 text-xs block mb-3">Shipment Progress</span>
                    <div className="space-y-3.5 relative pl-4 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-200">
                      {(() => {
                        const isCancelled = order.status === 'Cancelled';
                        const isRTO = order.deliveryStatus?.toLowerCase().includes('rto');
                        let stepsList = [
                          'Placed',
                          'Shipment Created',
                          'AWB Generated',
                          'Pickup Scheduled',
                          'In Transit',
                          'Out For Delivery',
                          'Delivered'
                        ];
                        if (isCancelled) {
                          stepsList = ['Placed', 'Cancelled'];
                        } else if (isRTO) {
                          stepsList = [
                            'Placed',
                            'Shipment Created',
                            'AWB Generated',
                            'Pickup Scheduled',
                            'In Transit',
                            'Out For Delivery',
                            'RTO (Return to Origin)'
                          ];
                        }

                        const activeIdx = getAdminActiveIndex(order);

                        return stepsList.map((stepName, idx) => {
                          const isDone = idx <= activeIdx;
                          const isCurr = idx === activeIdx;
                          return (
                            <div key={stepName} className="flex items-center gap-2 text-xs relative">
                              <div className={`absolute -left-[14px] w-2.5 h-2.5 rounded-full border-2 transition-all ${
                                isDone 
                                  ? 'bg-primary border-primary ring-2 ring-primary/20' 
                                  : 'bg-white border-slate-300'
                              }`} />
                              <span className={`font-semibold ${
                                isCurr 
                                  ? 'text-primary font-bold' 
                                  : isDone ? 'text-slate-800' : 'text-slate-400'
                              }`}>
                                {stepName}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* Available Courier Selection */}
                {order.shipmentCreated && !order.awbCode && (
                  <div className="border-b border-gray-100 pb-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700 text-xs block">Available Couriers</span>
                      {couriers.length > 0 && (
                        <Button
                          type="button"
                          onClick={() => handleShipmentAction('generate-awb')}
                          disabled={actionLoading !== null}
                          variant="secondary"
                          className="text-[10px] py-1 px-2.5 h-auto font-bold flex items-center gap-1"
                        >
                          Auto Select Recommended
                        </Button>
                      )}
                    </div>

                    {loadingCouriers ? (
                      <div className="flex flex-col items-center justify-center py-4 space-y-2">
                        <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="text-[10px] text-gray-400 font-medium">Fetching courier rates...</span>
                      </div>
                    ) : couriers.length === 0 ? (
                      <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-[11px] text-gray-500 font-medium">No serviceable couriers found.</p>
                        <Button
                          type="button"
                          onClick={fetchCouriers}
                          variant="ghost"
                          className="text-[10px] text-primary mt-1 h-auto py-1 px-2"
                        >
                          Retry Fetching
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {couriers.map((courier: any) => {
                          const cid = courier.courier_id || courier.courier_company_id;
                          const isRecommended = recommendedCourierId && String(recommendedCourierId) === String(cid);
                          return (
                            <div
                              key={cid}
                              className={`p-3 rounded-xl border transition-all duration-200 transform cursor-pointer ${
                                isRecommended
                                  ? 'bg-purple-50/45 border-purple-200 hover:border-purple-400 hover:bg-purple-50 hover:shadow-xs hover:-translate-y-0.5'
                                  : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-slate-50/50 hover:shadow-xs hover:-translate-y-0.5'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-gray-800 text-xs">{courier.courier_name}</span>
                                    {isRecommended && (
                                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700 uppercase leading-none">
                                        Recommended
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 font-medium font-sans">
                                    <span>Est: {courier.etd || courier.estimated_delivery_days || 'N/A'}</span>
                                    {courier.rating !== undefined && (
                                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                        ★ {Number(courier.rating).toFixed(1)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-extrabold text-indigo-700 text-xs block">
                                    ₹{Number(courier.rate || courier.total_charges || 0).toFixed(2)}
                                  </span>
                                  <Button
                                    type="button"
                                    onClick={() => handleShipmentAction('generate-awb', { courierId: cid })}
                                    disabled={actionLoading !== null}
                                    className="text-[9px] py-1 px-2.5 h-auto mt-1 justify-center w-full"
                                  >
                                    Select
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2 pt-2">
                  {!order.shipmentCreated ? (
                    <Button
                      type="button"
                      onClick={() => handleShipmentAction('create-shipment')}
                      disabled={actionLoading === 'create-shipment'}
                      className="w-full text-xs py-2 justify-center"
                    >
                      {actionLoading === 'create-shipment' ? 'Creating...' : 'Create Shipment'}
                    </Button>
                  ) : (
                    <>
                      {order.awbCode && !order.pickupScheduled && (
                        <Button
                          type="button"
                          onClick={() => handleShipmentAction('schedule-pickup')}
                          disabled={actionLoading === 'schedule-pickup'}
                          className="w-full text-xs py-2 justify-center"
                        >
                          {actionLoading === 'schedule-pickup' ? 'Scheduling...' : 'Schedule Pickup'}
                        </Button>
                      )}

                      {order.awbCode && !order.labelUrl && (
                        <Button
                          type="button"
                          onClick={() => handleShipmentAction('generate-label')}
                          disabled={actionLoading === 'generate-label'}
                          variant="secondary"
                          className="w-full text-xs py-2 justify-center"
                        >
                          {actionLoading === 'generate-label' ? 'Generating...' : 'Generate Label'}
                        </Button>
                      )}

                      {order.awbCode && !order.manifestGenerated && (
                        <Button
                          type="button"
                          onClick={() => handleShipmentAction('generate-manifest')}
                          disabled={actionLoading === 'generate-manifest'}
                          variant="secondary"
                          className="w-full text-xs py-2 justify-center"
                        >
                          {actionLoading === 'generate-manifest' ? 'Generating...' : 'Generate Manifest'}
                        </Button>
                      )}

                      {order.labelUrl && (
                        <a
                          href={order.labelUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 w-full text-xs font-semibold py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl transition duration-200"
                        >
                          Print Shipping Label
                        </a>
                      )}

                      {order.invoiceUrl ? (
                        <a
                          href={order.invoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-2 w-full text-xs font-semibold py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition duration-200"
                        >
                          Print Shiprocket Invoice
                        </a>
                      ) : (
                        order.shipmentCreated && (
                          <Button
                            type="button"
                            onClick={() => handleShipmentAction('generate-invoice')}
                            disabled={actionLoading === 'generate-invoice'}
                            variant="secondary"
                            className="w-full text-xs py-2 justify-center"
                          >
                            {actionLoading === 'generate-invoice' ? 'Generating...' : 'Generate Invoice'}
                          </Button>
                        )
                      )}

                      {order.awbCode && (
                        <div className="flex gap-2">
                          {order.trackingUrl && (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 flex-1 text-xs font-semibold py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition duration-200"
                            >
                              Track Shipment
                            </a>
                          )}
                          <Button
                            type="button"
                            onClick={() => handleShipmentAction('refresh-status')}
                            disabled={actionLoading === 'refresh-status'}
                            variant="secondary"
                            className="flex-1 text-xs py-2 justify-center"
                          >
                            {actionLoading === 'refresh-status' ? 'Refreshing...' : 'Refresh Status'}
                          </Button>
                        </div>
                      )}

                      {order.shipmentCreated && (
                        <Button
                          type="button"
                          onClick={() => handleShipmentAction('cancel-shipment')}
                          disabled={actionLoading === 'cancel-shipment'}
                          variant="danger"
                          className="w-full text-xs py-2 justify-center"
                        >
                          {actionLoading === 'cancel-shipment' ? 'Cancelling...' : 'Cancel Shipment'}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>

            <Card title="Totals">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">₹{order.totals?.subtotal?.toFixed(2)}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Shipping</span><span className="font-semibold">₹{order.totals?.shipping?.toFixed(2)}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Tax</span><span className="font-semibold">₹{order.totals?.tax?.toFixed(2)}</span></div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-base"><span className="font-bold text-gray-900">Total</span><span className="font-bold text-primary">₹{order.totals?.total?.toFixed(2)}</span></div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderView;
