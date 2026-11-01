import React, { useEffect, useState } from 'react';
import { ArrowLeft, Mail, Phone, CalendarDays, ShoppingBag, UserRound, MapPin } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import Card from '../../components/admin/Card';
import Button from '../../components/admin/Button';
import StatusBadge from '../../components/admin/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

const UserView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    if (!id || !accessToken) return;

    const loadUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [id, accessToken]);

  if (loading) {
    return (
      <AdminLayout title="User View">
        <div className="flex items-center justify-center min-h-100">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="User View">
        <Card>
          <div className="text-center py-10 space-y-4">
            <p className="text-gray-500">User not found.</p>
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/users')}>
              Back to Users
            </Button>
          </div>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User View">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Button type="button" variant="ghost" icon={ArrowLeft} onClick={() => navigate('/admin/users')}>
            Back
          </Button>
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              icon={Mail}
              onClick={() => navigate(`/admin/send-email?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-2 shadow-xs"
            >
              Send Email
            </Button>
            <StatusBadge status={user.role === 'admin' ? 'active' : 'pending'} label={user.role === 'admin' ? 'Admin' : 'User'} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-650 text-white rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-md uppercase">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900">{user.name}</h1>
                <p className="text-xs text-gray-550 font-sans mt-0.5">Customer profile and historical details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 font-sans text-xs font-semibold shadow-3xs text-indigo-800">
                <Mail size={16} className="text-indigo-500" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 font-sans text-xs font-semibold shadow-3xs text-emerald-800">
                <Phone size={16} className="text-emerald-500" />
                <span>{user.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 font-sans text-xs font-semibold shadow-3xs text-purple-800">
                <CalendarDays size={16} className="text-purple-500" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 font-sans text-xs font-semibold shadow-3xs text-amber-800">
                <ShoppingBag size={16} className="text-amber-500" />
                <span>{user.orders || 0} orders placed</span>
              </div>
            </div>

            {user.recentOrders?.length > 0 && (
              <div className="mt-8 space-y-4">
                <h2 className="text-md font-bold text-gray-900 flex items-center gap-2"><UserRound size={17} className="text-indigo-600" /> Recent Activity & Orders</h2>
                <div className="grid grid-cols-1 gap-3">
                  {user.recentOrders.map((order: any) => (
                    <div key={order._id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/60 border border-slate-100/80 hover:bg-slate-100 hover:border-slate-200 transition duration-150">
                      <div className="space-y-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-3xs">
                          {order.orderNumber}
                        </span>
                        <p className="text-xs text-gray-500 font-sans pl-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/admin/orders/${order._id}`)}>
                        View Order Details
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card title="Quick Stats">
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-between"><span>Role</span><span className="font-semibold text-gray-900">{user.role}</span></div>
                <div className="flex items-center justify-between"><span>Orders</span><span className="font-semibold text-gray-900">{user.orders || 0}</span></div>
                <div className="flex items-center justify-between"><span>Phone</span><span className="font-semibold text-gray-900">{user.phone}</span></div>
              </div>
            </Card>

            <Card title="Saved Addresses" icon={MapPin}>
              {user.addresses && user.addresses.length > 0 ? (
                <div className="space-y-4">
                  {user.addresses.map((addr: any, index: number) => (
                    <div key={addr._id || index} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs text-slate-650 space-y-1 relative">
                      {addr.isDefault && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold uppercase tracking-wider text-[8px] border border-emerald-100">
                          Default
                        </span>
                      )}
                      <p className="font-bold text-slate-800 text-sm pr-12">{addr.name}</p>
                      <p className="font-medium">{addr.phone}</p>
                      <p className="leading-relaxed">{addr.street}</p>
                      <p className="font-medium text-slate-700">
                        {addr.district}, {addr.state} - {addr.zip}
                      </p>
                      <p className="text-slate-400 font-semibold uppercase tracking-wider text-[8px]">{addr.country}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4 font-sans">No saved addresses found.</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserView;
