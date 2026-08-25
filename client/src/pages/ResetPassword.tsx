import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Button from '../components/layout/Button';

const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirming your password is required'),
});

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values) => {
      if (!token) return;
      setIsSubmitting(true);
      const res = await resetPassword(token, values.password);
      setIsSubmitting(false);

      if (res.success) {
        setIsSuccess(true);
      }
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <Helmet>
        <title>Reset Password — CosmeGlow</title>
        <meta name="description" content="Set a new password for your CosmeGlow account." />
      </Helmet>

      <Navbar />

      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <Container className="max-w-md w-full">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl shadow-gray-100/50 backdrop-blur-md">
            
            {/* Logo / Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                <ShieldCheck size={28} />
              </div>
              <h1 className="text-2xl font-bold font-serif text-gray-900 tracking-tight">
                Reset Your Password
              </h1>
              <p className="text-sm text-gray-500 mt-2">
                Please enter a new password for your CosmeGlow account below.
              </p>
            </div>

            {!token && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3 text-amber-800 text-sm">
                <AlertCircle size={20} className="shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Invalid or missing reset token.</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Please make sure you opened the exact link from your verification email.
                  </p>
                  <Link to="/login" className="inline-block mt-3 font-semibold text-primary underline text-xs">
                    Return to Login
                  </Link>
                </div>
              </div>
            )}

            {isSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Password Reset Successful!</h2>
                <p className="text-sm text-gray-600">
                  Your password has been updated. You can now log in using your new credentials.
                </p>
                <div className="pt-4">
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full justify-center text-sm py-3"
                  >
                    Go to Login Page <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              token && (
                <form onSubmit={formik.handleSubmit} className="space-y-5">
                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="••••••••"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full pl-10 pr-10 py-3 bg-gray-50 border rounded-xl text-sm transition focus:outline-none focus:ring-2 ${
                          formik.touched.password && formik.errors.password
                            ? 'border-red-500 focus:ring-red-200'
                            : 'border-gray-200 focus:border-primary focus:ring-primary/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {formik.touched.password && formik.errors.password && (
                      <p className="text-xs text-red-500 mt-1">{formik.errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={formik.values.confirmPassword}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full pl-10 pr-10 py-3 bg-gray-50 border rounded-xl text-sm transition focus:outline-none focus:ring-2 ${
                          formik.touched.confirmPassword && formik.errors.confirmPassword
                            ? 'border-red-500 focus:ring-red-200'
                            : 'border-gray-200 focus:border-primary focus:ring-primary/20'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">{formik.errors.confirmPassword}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full justify-center text-sm py-3 mt-2"
                  >
                    {isSubmitting ? 'Updating Password...' : 'Save New Password'}
                  </Button>

                  <div className="text-center pt-2">
                    <Link to="/login" className="text-xs text-gray-500 hover:text-primary transition font-medium">
                      Back to Sign In
                    </Link>
                  </div>
                </form>
              )
            )}

          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPassword;
