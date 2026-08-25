import React, { useState, useEffect } from 'react';
import { Search, Trash2, Phone, RotateCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AdminLayout from '../../components/admin/AdminLayout';
import Card from '../../components/admin/Card';
import Button from '../../components/admin/Button';
import StatusBadge from '../../components/admin/StatusBadge';
import DataTable from '../../components/admin/DataTable';
import Pagination from '../../components/admin/Pagination';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(15);

  // Selection & Bulk Action States
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Delete Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  const { accessToken } = useAuth();

  const handleDeleteTrigger = (userId: string, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setDeleteModalOpen(true);
  };

  const confirmDeleteUser = async (userId: string, userName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        setUsers(prev => prev.filter(u => u._id !== userId));
        setSelectedUserIds(prev => prev.filter(id => id !== userId));
        toast.success(`User "${userName}" deleted successfully`);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const confirmBulkDeleteUsers = async () => {
    if (!accessToken || selectedUserIds.length === 0) return;
    setBulkDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ userIds: selectedUserIds })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || `Deleted ${selectedUserIds.length} users successfully`);
        setUsers(prev => prev.filter(u => !selectedUserIds.includes(u._id)));
        setSelectedUserIds([]);
      } else {
        toast.error(data.message || 'Failed to delete selected users');
      }
    } catch (error) {
      console.error('Error in bulk delete users:', error);
      toast.error('Failed to delete selected users');
    } finally {
      setBulkDeleting(false);
      setBulkDeleteModalOpen(false);
    }
  };

  const fetchUsers = async (showToast = false) => {
    if (!accessToken) return;
    if (showToast) setReloading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users?limit=10000`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        if (showToast) toast.success('Users reloaded successfully');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (showToast) toast.error('Failed to reload users');
    } finally {
      setLoading(false);
      setReloading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [accessToken]);

  const filteredUsers = users.filter((user) =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.includes(searchQuery)
  );

  // Clear selection on page/search change
  useEffect(() => {
    setSelectedUserIds([]);
  }, [currentPage, recordsPerPage, searchQuery]);

  // Pagination Calculations
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredUsers.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.max(Math.ceil(filteredUsers.length / recordsPerPage), 1);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const currentIds = currentRecords.filter(u => u.role !== 'admin').map(u => u._id);
      setSelectedUserIds(prev => Array.from(new Set([...prev, ...currentIds])));
    } else {
      const currentIds = new Set(currentRecords.map(u => u._id));
      setSelectedUserIds(prev => prev.filter(id => !currentIds.has(id)));
    }
  };

  const handleSelectRow = (key: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, key]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== key));
    }
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (item: any) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-extrabold uppercase text-base shadow-sm">
            {item.name ? item.name.charAt(0) : 'U'}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-xs sm:text-sm">{item.name}</p>
            <p className="text-xs text-slate-500 font-sans">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (item: any) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
            item.role === 'admin'
              ? 'bg-purple-100 text-purple-800 border-purple-300'
              : 'bg-blue-100 text-blue-800 border-blue-300'
          }`}
        >
          {item.role || 'user'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <StatusBadge status="active" />,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (item: any) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-150 font-sans shadow-3xs">
          <Phone size={12} className="text-emerald-500" />
          {item.phone || 'N/A'}
        </span>
      )
    },
    {
      key: 'orders',
      header: 'Orders',
      render: (item: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase font-sans">
          {item.orders !== undefined ? item.orders : '0'} Orders
        </span>
      )
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (item: any) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-750 border border-indigo-200">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (item: any) => (
        <div className="flex items-center justify-end gap-2">
          {item.role !== 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              className="!text-rose-600 hover:!text-rose-750 hover:!bg-rose-50"
              icon={Trash2}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTrigger(item._id, item.name);
              }}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 pt-2">
        {/* Colorful Metric Cards for Users */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-indigo-50/70 border border-indigo-200/80 p-4 rounded-2xl shadow-xs text-left hover:shadow-md transition-all">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 block">Total Registered</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-extrabold text-indigo-600 font-display">{users.length}</span>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">All Accounts</span>
            </div>
            <span className="text-[10px] font-medium text-indigo-500 mt-1 block">Includes Admins & Customers</span>
          </div>

          <div className="bg-purple-50/70 border border-purple-200/80 p-4 rounded-2xl shadow-xs text-left hover:shadow-md transition-all">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 block">Administrators</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-extrabold text-purple-600 font-display">
                {users.filter((u: any) => u.role?.toLowerCase() === 'admin').length}
              </span>
              <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200">Admin Role</span>
            </div>
            <span className="text-[10px] font-medium text-purple-500 mt-1 block">Full Management Access</span>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/80 p-4 rounded-2xl shadow-xs text-left hover:shadow-md transition-all">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block">Customer Accounts</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-extrabold text-blue-600 font-display">
                {users.filter((u: any) => u.role?.toLowerCase() !== 'admin').length}
              </span>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">Store Shoppers</span>
            </div>
            <span className="text-[10px] font-medium text-blue-500 mt-1 block">Registered Buyers</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl shadow-xs text-left hover:shadow-md transition-all">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">Verified Phone Contacts</span>
            <div className="flex items-baseline justify-between mt-1.5">
              <span className="text-2xl font-extrabold text-emerald-600 font-display">
                {users.filter((u: any) => u.phone).length}
              </span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">Verified</span>
            </div>
            <span className="text-[10px] font-medium text-emerald-500 mt-1 block">Phone Numbers Saved</span>
          </div>
        </div>

        <Card>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search users by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-11 pr-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-500 text-slate-800 placeholder-slate-400 text-sm h-10"
                />
              </div>

              <button
                onClick={() => fetchUsers(true)}
                disabled={reloading}
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer shadow-3xs flex items-center justify-center h-10 w-10 shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
                title="Reload Users"
              >
                <RotateCw size={18} className={reloading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Inline Bulk Actions for Users */}
            {selectedUserIds.length > 0 && (
              <div className="flex items-center gap-2 shrink-0 flex-nowrap ml-auto whitespace-nowrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200 shadow-3xs shrink-0 whitespace-nowrap">
                  <span>{selectedUserIds.length} Selected</span>
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds([])}
                    className="text-indigo-400 hover:text-indigo-700 ml-0.5 text-xs cursor-pointer font-bold"
                    title="Clear selection"
                  >
                    ✕
                  </button>
                </span>

                {/* Bulk Delete Button (Only Dustbin Icon) */}
                <button
                  type="button"
                  disabled={bulkDeleting}
                  onClick={() => setBulkDeleteModalOpen(true)}
                  className="h-10 w-10 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-xl flex items-center justify-center transition-all shadow-3xs cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Delete ${selectedUserIds.length} selected user(s)`}
                >
                  <Trash2 size={16} className="text-rose-600" />
                </button>
              </div>
            )}
          </div>

          <DataTable
            columns={columns}
            data={currentRecords}
            loading={loading}
            selectable={true}
            selectedKeys={selectedUserIds}
            onSelectAll={handleSelectAll}
            onSelectRow={handleSelectRow}
            keyExtractor={(item: any) => item._id}
            onRowClick={(item: any) => navigate(`/admin/users/${item._id}`)}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={filteredUsers.length}
            recordsPerPage={recordsPerPage}
            onPageChange={setCurrentPage}
            onRecordsPerPageChange={(limit) => {
              setRecordsPerPage(limit);
              setCurrentPage(1);
            }}
            indexOfFirstRecord={filteredUsers.length > 0 ? indexOfFirstRecord + 1 : 0}
            indexOfLastRecord={Math.min(indexOfLastRecord, filteredUsers.length)}
          />
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-gray-100">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to permanently delete user "{userToDelete?.name}"? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200 transition-colors cursor-pointer focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (userToDelete) {
                    await confirmDeleteUser(userToDelete.id, userToDelete.name);
                  }
                  setDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-750 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer focus:outline-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Users Confirmation Modal */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-gray-100">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900">Delete Selected Users</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-rose-600">{selectedUserIds.length} selected user(s)</strong>? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={bulkDeleting}
                onClick={() => setBulkDeleteModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200 transition-colors cursor-pointer focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bulkDeleting}
                onClick={confirmBulkDeleteUsers}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer focus:outline-none"
              >
                {bulkDeleting ? 'Deleting...' : `Delete (${selectedUserIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default UsersList;

