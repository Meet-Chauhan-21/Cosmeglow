import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const AdminDashboard: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  // Protect Admin Route
  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error('Please login to access the admin portal.');
        navigate('/login');
      } else if (user.role !== 'admin') {
        toast.error('Access Denied. You do not have admin privileges.');
        navigate('/');
      }
    }
  }, [user, loading, navigate]);

  const handleAdminLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 p-8 shadow-md text-center space-y-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome, Admin!</h1>
          <p className="text-sm text-gray-500 font-medium">CosmeGlow Administration Dashboard</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/60 text-left space-y-2.5 text-xs text-gray-650">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-500">Name:</span>
            <span className="font-medium text-gray-900">{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-500">Email:</span>
            <span className="font-medium text-gray-900">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-500">Role:</span>
            <span className="font-medium text-red-600 font-mono uppercase bg-red-50 border border-red-150 px-2 py-0.5 rounded-md">
              {user.role}
            </span>
          </div>
        </div>

        <button
          onClick={handleAdminLogout}
          className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3 px-6 rounded-full cursor-pointer transition-colors text-sm shadow-xs"
        >
          Logout Admin
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
