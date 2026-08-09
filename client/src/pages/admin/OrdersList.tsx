import React, { useState, useEffect } from 'react';
import { Search, Trash2, RotateCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AdminLayout from '../../components/admin/AdminLayout';
import Card from '../../components/admin/Card';
import Button from '../../components/admin/Button';
import DataTable from '../../components/admin/DataTable';
import Pagination from '../../components/admin/Pagination';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import Select from '../../components/admin/Select';

const OrderStatusSelect: React.FC<{
  orderId: string;
  orderNumber: string;
  initialStatus: string;
  accessToken: string | null;
  onStatusUpdated: (newStatus: string) => void;
}> = ({ orderId, orderNumber, initialStatus, accessToken, onStatusUpdated }) => {
  const [status, setStatus] = useState(initialStatus);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  const handleStatusChange = async (newStatus: string) => {
    if (!accessToken) return;
    setUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setStatus(newStatus);
        onStatusUpdated(newStatus);
        toast.success(`Order ${orderNumber} status updated to ${newStatus}`);
      } else {
        toast.error('Failed to update order status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };



  const statusColorClass = status === 'Pending'
    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/50'
    : status === 'Confirmed'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50'
      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/50';

  return (
    <div className="w-32 text-left" onClick={(e) => e.stopPropagation()}>
      <Select
        value={status}
        disabled={updating}
        onChange={handleStatusChange}
        hClass="h-8 px-2.5"
        buttonClassName={`border ${statusColorClass}`}
        options={['Pending', 'Confirmed', 'Cancelled'].map((opt) => ({
          value: opt,
          label: opt,
        }))}
      />
    </div>
  );
};

const OrderDeliveryCell: React.FC<{
  order: any;
  accessToken: string | null;
  onOrderUpdated: (updatedOrder: any) => void;
}> = ({ order, accessToken, onOrderUpdated }) => {
  const [loading, setLoading] = useState(false);

  const handleCreateShipment = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click navigation
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${order._id}/create-shipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(`Shiprocket shipment created for order ${order.orderNumber}`);
        onOrderUpdated(data.order);
      } else {
        toast.error(data.message || 'Failed to create shipment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during shipment creation');
    } finally {
      setLoading(false);
    }
  };

  if (!order.shipmentCreated) {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Button
          type="button"
          size="sm"
          disabled={loading}
          onClick={handleCreateShipment}
          className="text-[10px] py-1.5 px-3.5 bg-black hover:bg-white text-white hover:text-black border border-black font-semibold rounded-xl transition-all duration-300 flex items-center justify-center shadow-3xs hover:shadow-md hover:scale-105"
        >
          <span className="relative z-10">{loading ? 'Creating...' : 'Create Shipment'}</span>
        </Button>
      </div>
    );
  }

  const deliveryStatusLower = String(order.deliveryStatus || '').toLowerCase();
  const isDraft = !order.deliveryStatus || deliveryStatusLower === 'draft' || deliveryStatusLower === 'created';

  return (
    <div className="flex flex-col gap-1 text-[11px] text-slate-500 font-sans" onClick={(e) => e.stopPropagation()}>
      <span className={`font-bold px-2 py-0.5 rounded-lg text-[9px] uppercase w-max tracking-wider border ${
        deliveryStatusLower.includes('deliver')
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : deliveryStatusLower.includes('cancel')
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : isDraft
          ? 'bg-slate-100 text-slate-700 border-slate-200'
          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
      }`}>
        {isDraft ? 'Shipment Draft' : order.deliveryStatus}
      </span>
      {order.courierName && (
        <span className="text-[10px] text-slate-600 font-medium">
          Courier: <span className="font-bold text-slate-800">{order.courierName}</span>
        </span>
      )}
      {order.awbCode && (
        <span className="font-mono text-[9px] text-slate-400">AWB: {order.awbCode}</span>
      )}
    </div>
  );
};

const OrdersList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Server-side total stats
  const [totalRecords, setTotalRecords] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(15);

  // Delete States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteTrigger = (orderId: string, orderNumber: string) => {
    setItemToDelete({ id: orderId, name: orderNumber });
    setDeleteModalOpen(true);
  };

  const { accessToken } = useAuth();
  const [reloading, setReloading] = useState(false);

  const fetchOrders = async (showToast = false) => {
    if (!accessToken) return;
    if (showToast) setReloading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: recordsPerPage.toString(),
        search: searchQuery,
        status: statusFilter,
        date: dateFilter
      });
      const response = await fetch(`${API_BASE_URL}/admin/orders?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setTotalRecords(data.total || 0);
        if (data.confirmedCount !== undefined) setConfirmedCount(data.confirmedCount);
        if (data.pendingCount !== undefined) setPendingCount(data.pendingCount);
        if (data.totalRevenue !== undefined) setTotalRevenue(data.totalRevenue);
        if (showToast) toast.success('Orders reloaded successfully');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (showToast) toast.error('Failed to reload orders');
    } finally {
      setLoading(false);
      setReloading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [accessToken, currentPage, recordsPerPage, searchQuery, statusFilter, dateFilter]);

  // Selection & Bulk Actions States
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Clear selections when filters or pagination changes
  useEffect(() => {
    setSelectedOrderIds([]);
  }, [currentPage, recordsPerPage, searchQuery, statusFilter, dateFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentPageIds = orders.map((o) => o._id);
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    } else {
      const currentPageIds = new Set(orders.map((o) => o._id));
      setSelectedOrderIds((prev) => prev.filter((id) => !currentPageIds.has(id)));
    }
  };

  const handleSelectRow = (key: string, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds((prev) => [...prev, key]);
    } else {
      setSelectedOrderIds((prev) => prev.filter((id) => id !== key));
    }
  };

  const handleClearSelection = () => {
    setSelectedOrderIds([]);
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (!accessToken || selectedOrderIds.length === 0 || !newStatus) return;
    setBulkUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/bulk-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ orderIds: selectedOrderIds, status: newStatus }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || `Updated status to ${newStatus} for selected orders`);
        const updatedIds = [...selectedOrderIds];
        setOrders((prev) =>
          prev.map((o) => (updatedIds.includes(o._id) ? { ...o, status: newStatus } : o))
        );
        setSelectedOrderIds([]);
        await fetchOrders();
      } else {
        toast.error(data.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error performing bulk status update');
    } finally {
      setBulkUpdating(false);
    }
  };

  const confirmBulkDeleteOrders = async () => {
    if (!accessToken || selectedOrderIds.length === 0) return;
    setBulkUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ orderIds: selectedOrderIds }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || `Deleted ${selectedOrderIds.length} orders`);
        setSelectedOrderIds([]);
        await fetchOrders();
      } else {
        toast.error(data.message || 'Failed to delete selected orders');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error performing bulk delete');
    } finally {
      setBulkUpdating(false);
      setBulkDeleteModalOpen(false);
    }
  };

  const confirmDeleteOrder = async () => {
    if (!itemToDelete || !accessToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${itemToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        toast.success(`Order ${itemToDelete.name} deleted successfully`);
        setSelectedOrderIds((prev) => prev.filter((id) => id !== itemToDelete.id));
        await fetchOrders();
      } else {
        const data = await response.json().catch(() => ({}));
        toast.error(data.message || `Failed to delete order ${itemToDelete.name}`);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(`Failed to delete order ${itemToDelete.name}`);
    } finally {
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  // Pagination Calculations (server paginated)
  const totalPages = Math.max(Math.ceil(totalRecords / recordsPerPage), 1);
  const indexOfFirstRecord = totalRecords > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0;
  const indexOfLastRecord = Math.min(currentPage * recordsPerPage, totalRecords);

  const columns = [
    { key: 'orderNumber', header: 'Order Number', render: (item: any) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-3xs">
        {item.orderNumber}
      </span>
    ) },
    {
      key: 'customer',
      header: 'Customer',
      render: (item: any) => item.user?.name || 'N/A'
    },
    {
      key: 'date',
      header: 'Date',
      render: (item: any) => (
        <span className="text-purple-900 font-extrabold font-sans text-xs">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'total',
      header: 'Total',
      render: (item: any) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-750 border border-purple-100 shadow-3xs">
          ₹{item.totals.total.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => (
        <OrderStatusSelect
          orderId={item._id}
          orderNumber={item.orderNumber}
          initialStatus={item.status}
          accessToken={accessToken}
          onStatusUpdated={(newStatus) => {
            setOrders((prev) =>
              prev.map((o) => (o._id === item._id ? { ...o, status: newStatus } : o))
            );
          }}
        />
      ),
    },
    {
      key: 'delivery',
      header: 'Delivery / Shipment',
      render: (item: any) => (
        <OrderDeliveryCell
          order={item}
          accessToken={accessToken}
          onOrderUpdated={(updatedOrder) => {
            setOrders((prev) =>
              prev.map((o) => (o._id === item._id ? updatedOrder : o))
            );
          }}
        />
      )
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (item: any) => {
        const pStatus = (item.payment?.status || 'pending').toLowerCase();
        const isPaid = pStatus === 'paid';
        const isPending = pStatus === 'pending';
        const isRefunded = pStatus === 'refunded';

        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
              isPaid
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : isPending
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : isRefunded
                ? 'bg-violet-100 text-violet-800 border-violet-300'
                : 'bg-rose-100 text-rose-800 border-rose-300'
            }`}
          >
            {item.payment?.status || 'Pending'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (item: any) => (
        <Button
          variant="ghost"
          size="sm"
          icon={Trash2}
          className="!text-rose-600 hover:!text-rose-750 hover:!bg-rose-50"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteTrigger(item._id, item.orderNumber);
          }}
        />
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 pt-2">
        {/* Colorful Metric Cards for Orders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-indigo-50/70 border border-indigo-200/80 p-4 rounded-2xl shadow-xs text-left hover:shadow-md transition-all">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 block">Total Orders</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-extrabold text-indigo-600 font-display">{totalRecords}</span>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">Orders</span>
            </div>
            <span className="text-[10px] font-medium text-indigo-500 mt-1 block">Customer Purchases</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl shadow-xs text-left hover:shadow-md transition-all">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">Confirmed Orders</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-extrabold text-emerald-600 font-display">
                {confirmedCount}
              </span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">Confirmed</span>
            </div>
            <span className="text-[10px] font-medium text-emerald-500 mt-1 block">Successfully Confirmed</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl shadow-xs text-left hover:shadow-md transition-all">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">Pending Orders</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-extrabold text-amber-600 font-display">
                {pendingCount}
              </span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded border border-amber-200">Pending</span>
            </div>
            <span className="text-[10px] font-medium text-amber-500 mt-1 block">Action Required</span>
          </div>

          <div className="bg-purple-50/70 border border-purple-200/80 p-4 rounded-2xl shadow-xs text-left hover:shadow-md transition-all">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 block">Order Revenue Total</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-xl font-extrabold text-purple-600 font-display truncate">
                ₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200 ml-1">Gross</span>
            </div>
            <span className="text-[10px] font-medium text-purple-500 mt-1 block">Total Sales Revenue</span>
          </div>
        </div>

        <Card>
          <div className="flex flex-col md:flex-row md:items-center justify-start gap-4 mb-6">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-500 placeholder-slate-400 text-sm h-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              hClass="h-10"
              className="w-full md:w-48 text-left"
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
            <div className="relative w-full md:w-48">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-500 text-sm h-10 text-slate-705 font-sans cursor-pointer"
              />
              {dateFilter && (
                <button
                  onClick={() => {
                    setDateFilter('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 text-xs font-semibold px-1"
                  title="Clear Date"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => fetchOrders(true)}
              disabled={reloading}
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer shadow-3xs flex items-center justify-center h-10 w-10 shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
              title="Reload Orders"
            >
              <RotateCw size={18} className={reloading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Bulk Action Bar */}
          {selectedOrderIds.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 transition-all duration-300">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center px-3 py-1 text-xs font-bold bg-indigo-600 text-white rounded-xl border border-indigo-500">
                  {selectedOrderIds.length} Order{selectedOrderIds.length > 1 ? 's' : ''} Selected
                </span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs text-slate-300 hover:text-white underline underline-offset-2 transition-colors cursor-pointer font-medium"
                >
                  Clear Selection
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Bulk Status Select */}
                <div className="w-48 text-left">
                  <Select
                    value=""
                    placeholder="Change Status"
                    disabled={bulkUpdating}
                    onChange={(val) => handleBulkStatusChange(val)}
                    hClass="h-9 px-3"
                    buttonClassName="bg-slate-800 text-white border-slate-700 hover:bg-slate-750"
                    options={[
                      { value: 'Pending', label: 'Mark as Pending' },
                      { value: 'Confirmed', label: 'Mark as Confirmed' },
                      { value: 'Cancelled', label: 'Mark as Cancelled' },
                    ]}
                  />
                </div>

                {/* Bulk Delete Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={bulkUpdating}
                  onClick={() => setBulkDeleteModalOpen(true)}
                  className="!bg-rose-600 hover:!bg-rose-700 text-white border-none h-9 px-3.5 rounded-xl font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete Selected ({selectedOrderIds.length})</span>
                </Button>
              </div>
            </div>
          )}

          <DataTable
            columns={columns}
            data={orders}
            loading={loading}
            selectable={true}
            selectedKeys={selectedOrderIds}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            keyExtractor={(item: any) => item._id}
            onRowClick={(item: any) => navigate(`/admin/orders/${item._id}`)}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            recordsPerPage={recordsPerPage}
            onPageChange={setCurrentPage}
            onRecordsPerPageChange={(limit) => {
              setRecordsPerPage(limit);
              setCurrentPage(1);
            }}
            indexOfFirstRecord={indexOfFirstRecord}
            indexOfLastRecord={indexOfLastRecord}
          />
        </Card>
      </div>

      {/* Delete Single Order Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-gray-100">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Delete Order</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete order <span className="font-semibold text-gray-800">{itemToDelete?.name}</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setItemToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-red-600 hover:!bg-red-750 text-white border-transparent"
                onClick={confirmDeleteOrder}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Orders Confirmation Modal */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-gray-100">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Delete Selected Orders</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <span className="font-bold text-rose-600">{selectedOrderIds.length} selected order{selectedOrderIds.length > 1 ? 's' : ''}</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                disabled={bulkUpdating}
                onClick={() => setBulkDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={bulkUpdating}
                className="flex-1 !bg-rose-600 hover:!bg-rose-700 text-white border-transparent"
                onClick={confirmBulkDeleteOrders}
              >
                {bulkUpdating ? 'Deleting...' : `Delete ${selectedOrderIds.length} Orders`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default OrdersList;
