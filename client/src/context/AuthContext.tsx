import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../config';
import type { Address, OrderItem, Order, User } from '../types';

const API_BASE = `${API_BASE_URL}/users`;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<boolean | { notVerified: boolean; email: string }>;
  register: (name: string, email: string, password: string, phone: string) => Promise<boolean>; // phone is now required
  googleLogin: (credentialOrToken: string, isAccessToken?: boolean) => Promise<boolean>;
  facebookLogin: (payload: { code?: string; accessToken?: string }) => Promise<boolean | { needsEmail: boolean; facebookId: string; name: string }>;
  facebookRegister: (name: string, email: string, facebookId: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => Promise<boolean>; // backend integrated
  addAddress: (address: Omit<Address, '_id'>) => Promise<boolean>;
  updateAddress: (addressId: string, address: Omit<Address, '_id'>) => Promise<boolean>;
  deleteAddress: (addressId: string) => Promise<boolean>;
  placeOrder: (payload: {
    items: OrderItem[];
    shippingAddress: Omit<Address, '_id'>;
    paymentMethod: 'card' | 'cod' | 'razorpay' | string;
    paymentDetails?: {
      cardName?: string;
      cardLast4?: string;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    };
    totals: { subtotal: number; shipping: number; tax: number; total: number };
  }) => Promise<{ order: Order } | null>;
  fetchOrders: (
    page?: number,
    limit?: number
  ) => Promise<{ orders: Order[]; total: number; page: number; limit: number } | null>;
  resendVerification: (email: string) => Promise<{ success: boolean; message?: string; cooldownRemaining?: number }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch user profile using an access token
  const fetchUserProfile = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  // Perform silent token refresh on app mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await fetch(`${API_BASE}/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // vital to send/receive httpOnly cookies
        });

        if (response.ok) {
          const data = await response.json();
          setAccessToken(data.accessToken);
          const profile = await fetchUserProfile(data.accessToken);
          if (profile) {
            setUser(profile);
          }
        }
      } catch (error) {
        console.error('Failed to initialize session refresh:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean | { notVerified: boolean; email: string }> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.notVerified) {
          toast.warning(data.message || 'Email not verified.');
          setLoading(false);
          return { notVerified: true, email: data.email };
        }
        toast.error(data.message || 'Login failed. Please check credentials.');
        setLoading(false);
        return false;
      }

      setAccessToken(data.accessToken);
      const sessionUser = data.user;

      setUser(sessionUser);
      toast.success(`Welcome back, ${sessionUser.name}!`);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Server error during login.');
      setLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, phone: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Registration failed.');
        setLoading(false);
        return false;
      }

      if (data.unverified) {
        toast.info(data.message || 'Verification email sent! Please check your inbox.');
        setLoading(false);
        return true;
      }

      setAccessToken(data.accessToken);
      const sessionUser = data.user;

      setUser(sessionUser);
      toast.success(`Account created successfully! Welcome to CosmeGlow, ${name}.`);
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Server error during registration.');
      setLoading(false);
      return false;
    }
  };

  const googleLogin = async (credentialOrToken: string, isAccessToken: boolean = false): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isAccessToken ? { accessToken: credentialOrToken } : { credential: credentialOrToken }
        ),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        // Display backend validation message directly to the user
        toast.error(data.message || 'Google Sign-In failed.');
        setLoading(false);
        return false;
      }

      setAccessToken(data.accessToken);

      // Fetch the authenticated user using existing profile endpoint after successful Google login
      const profile = await fetchUserProfile(data.accessToken);
      if (profile) {
        setUser(profile);
        toast.success(`Welcome back, ${profile.name}!`);
        setLoading(false);
        return true;
      } else {
        toast.error('Failed to retrieve user profile.');
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Server error during Google login.');
      setLoading(false);
      return false;
    }
  };

  const facebookLogin = useCallback(async (payload: { code?: string; accessToken?: string }): Promise<any> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          redirectUri: `${window.location.origin}/login`
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (data.needsEmail) {
        setLoading(false);
        return { needsEmail: true, facebookId: data.facebookId, name: data.name };
      }

      if (!response.ok) {
        toast.error(data.message || 'Facebook Sign-In failed.');
        setLoading(false);
        return false;
      }

      setAccessToken(data.accessToken);

      const profile = await fetchUserProfile(data.accessToken);
      if (profile) {
        setUser(profile);
        toast.success(`Welcome back, ${profile.name}!`);
        setLoading(false);
        return true;
      } else {
        toast.error('Failed to retrieve user profile.');
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      toast.error('Server error during Facebook login.');
      setLoading(false);
      return false;
    }
  }, []);

  const facebookRegister = useCallback(async (name: string, email: string, facebookId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/facebook-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, facebookId }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Facebook registration failed.');
        setLoading(false);
        return false;
      }

      setAccessToken(data.accessToken);
      if (data.user) {
        setUser(data.user);
      }
      toast.success(data.message || 'Facebook Sign-In successful!');
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Facebook register error:', error);
      toast.error('Server error during registration.');
      setLoading(false);
      return false;
    }
  }, []);

  const verifyEmail = async (token: string): Promise<{ success: boolean; message: string }> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setAccessToken(data.accessToken);
        setUser(data.user);
        setLoading(false);
        return { success: true, message: data.message || 'Email verified successfully!' };
      } else {
        setLoading(false);
        return { success: false, message: data.message || 'Verification failed.' };
      }
    } catch (error) {
      console.error('Verify email context error:', error);
      setLoading(false);
      return { success: false, message: 'Server error. Verification failed.' };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      toast.info('You have logged out of your account.');
    }
  };

  // PUT /api/users/profile
  const updateUser = async (updatedData: Partial<User>): Promise<boolean> => {
    if (!accessToken) {
      toast.error('Session expired. Please log in again.');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: updatedData.name,
          email: updatedData.email,
          phone: updatedData.phone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to update profile settings.');
        return false;
      }

      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Update profile fetch error:', error);
      toast.error('Network error. Failed to update profile.');
      return false;
    }
  };

  // POST /api/users/addresses
  const addAddress = async (address: Omit<Address, '_id'>): Promise<boolean> => {
    if (!accessToken) {
      toast.error('Session expired. Please log in.');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/addresses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(address)
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to add address.');
        return false;
      }

      if (user) {
        setUser({ ...user, addresses: data.addresses });
      }
      toast.success('Address added successfully!');
      return true;
    } catch (error) {
      console.error('Add address error:', error);
      toast.error('Failed to add address.');
      return false;
    }
  };

  // PUT /api/users/addresses/:addressId
  const updateAddress = async (addressId: string, address: Omit<Address, '_id'>): Promise<boolean> => {
    if (!accessToken) {
      toast.error('Session expired. Please log in.');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(address)
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to update address.');
        return false;
      }

      if (user) {
        setUser({ ...user, addresses: data.addresses });
      }
      toast.success('Address updated successfully!');
      return true;
    } catch (error) {
      console.error('Update address error:', error);
      toast.error('Failed to update address.');
      return false;
    }
  };

  // DELETE /api/users/addresses/:addressId
  const deleteAddress = async (addressId: string): Promise<boolean> => {
    if (!accessToken) {
      toast.error('Session expired. Please log in.');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to delete address.');
        return false;
      }

      if (user) {
        setUser({ ...user, addresses: data.addresses });
      }
      toast.success('Address deleted successfully!');
      return true;
    } catch (error) {
      console.error('Delete address error:', error);
      toast.error('Failed to delete address.');
      return false;
    }
  };

  const placeOrder = async (payload: {
    items: OrderItem[];
    shippingAddress: Omit<Address, '_id'>;
    paymentMethod: 'card' | 'cod' | 'razorpay' | string;
    paymentDetails?: {
      cardName?: string;
      cardLast4?: string;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    };
    totals: { subtotal: number; shipping: number; tax: number; total: number };
  }): Promise<{ order: Order } | null> => {
    if (!accessToken) {
      toast.error('Session expired. Please log in.');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: payload.items,
          shippingAddress: payload.shippingAddress,
          paymentMethod: payload.paymentMethod,
          paymentDetails: payload.paymentDetails,
          totals: payload.totals
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to place order.');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Place order error:', error);
      toast.error('Network error. Failed to place order.');
      return null;
    }
  };

  const fetchOrders = async (
    page: number = 1,
    limit: number = 3
  ): Promise<{ orders: Order[]; total: number; page: number; limit: number } | null> => {
    if (!accessToken) {
      toast.error('Session expired. Please log in.');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/orders?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to fetch orders.');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('Network error. Failed to fetch orders.');
      return null;
    }
  };

  const resendVerification = async (
    email: string
  ): Promise<{ success: boolean; message?: string; cooldownRemaining?: number }> => {
    try {
      const response = await fetch(`${API_BASE}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Verification link resent successfully!');
        return { success: true, message: data.message };
      } else {
        toast.error(data.message || 'Failed to resend verification.');
        return {
          success: false,
          message: data.message,
          cooldownRemaining: data.cooldownRemaining
        };
      }
    } catch (error) {
      console.error('Resend verification fetch error:', error);
      toast.error('Network error. Failed to resend verification.');
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Password reset link sent to your email.');
        return { success: true, message: data.message };
      } else {
        toast.error(data.message || 'Failed to request password reset.');
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Network error. Failed to process password reset request.');
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Password reset successful!');
        return { success: true, message: data.message };
      } else {
        toast.error(data.message || 'Failed to reset password.');
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Network error. Failed to reset password.');
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        accessToken,
        login,
        register,
        googleLogin,
        facebookLogin,
        facebookRegister,
        verifyEmail,
        logout,
        updateUser,
        addAddress,
        updateAddress,
        deleteAddress,
        placeOrder,
        fetchOrders,
        resendVerification,
        forgotPassword,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
