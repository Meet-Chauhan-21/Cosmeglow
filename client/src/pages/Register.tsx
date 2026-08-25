import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { User, Mail, Lock, ArrowRight, ShieldCheck, Phone, Eye, EyeOff } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Button from '../components/layout/Button';
import { validateEmailAddress } from '../util/emailValidation';

// Validation Schema using Yup
const registerSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Full Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .test('valid-domain', 'Temporary, disposable, or dummy email addresses are not permitted. Please use a valid email address.', (value) => {
      if (!value) return true;
      const res = validateEmailAddress(value);
      return res.valid;
    })
    .required('Email address is required'),
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number')
    .required('Phone number is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm Password is required'),
});

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, facebookLogin, facebookRegister, user, resendVerification } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email verification post-registration states
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // States for Facebook email linking
  const [showFbEmailForm, setShowFbEmailForm] = useState(false);
  const [fbUserData, setFbUserData] = useState<{ facebookId: string; name: string } | null>(null);
  const [fbEmail, setFbEmail] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);


  // Check for Facebook OAuth Redirect Code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      const doFbLogin = async () => {
        const res = await facebookLogin({ code });
        if (res && typeof res === 'object' && res.needsEmail) {
          setFbUserData({ facebookId: res.facebookId, name: res.name });
          setShowFbEmailForm(true);
        }
      };
      doFbLogin();
    }
  }, [facebookLogin]);

  const handleFbEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbEmail || !fbUserData) return;
    setFbSubmitting(true);
    const success = await facebookRegister(fbUserData.name, fbEmail, fbUserData.facebookId);
    setFbSubmitting(false);
    if (success) {
      navigate('/profile', { replace: true });
    }
  };

  // Rate-limiting countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const defaultPath = user.role === 'admin' ? '/admin' : '/profile';
      navigate(defaultPath, { replace: true });
    }
  }, [user, navigate]);

  const handleResend = async () => {
    if (cooldownSeconds > 0 || isResending || !registeredEmail) return;
    setIsResending(true);
    const res = await resendVerification(registeredEmail);
    setIsResending(false);
    if (res.success) {
      setCooldownSeconds(60);
    } else if (res.cooldownRemaining) {
      setCooldownSeconds(res.cooldownRemaining);
    }
  };

  // Formik configuration
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      const success = await register(values.name, values.email, values.password, values.phone);
      setIsSubmitting(false);
      if (success) {
        setRegisteredEmail(values.email);
        setIsRegistered(true);
      }
    },
  });

  return (
    <>
      <SEO
        title="Create Account — CosmeGlow Skincare"
        description="Join CosmeGlow Skincare to enjoy personalized skincare recommendations, track your orders, and receive exclusive botanical skincare offers."
      />

      <Navbar />

      <main className="pt-24 pb-20 min-h-screen bg-light-gray/30 flex items-center">
        <Container className="py-8">
          <div className="max-w-5xl mx-auto bg-white rounded-3xl overflow-hidden shadow-xl border border-border-gray/30 grid grid-cols-1 md:grid-cols-12 min-h-[640px]">
            
            {/* Left Column - Organic Brand Banner */}
            <div className="hidden md:block md:col-span-5 bg-primary relative p-8 text-white overflow-hidden">
              <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                <img
                  src="https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=800&auto=format&fit=crop"
                  alt="Premium dropper bottle"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary/80 to-transparent" />
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-secondary bg-white/10 px-2.5 py-1 rounded-full inline-block backdrop-blur-xs">
                    Pure & Clinical
                  </span>
                </div>
                
                <div className="space-y-4">
                  <h2 className="font-display font-bold text-2xl lg:text-3xl leading-tight">
                    Sartorial Botanical Apothecary
                  </h2>
                  <p className="text-xs text-white/80 leading-relaxed font-sans">
                    Begin your restoration journey. Become a Gold Circle member to earn points, secure free shipping, and custom formulate.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-secondary font-semibold font-display">
                  <ShieldCheck size={14} />
                  <span>Cruelty-Free & Dermatologist Approved</span>
                </div>
              </div>
            </div>

            {/* Right Column - Form Sheet */}
            <div className="col-span-1 md:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
              <div className="max-w-md w-full mx-auto space-y-6">
                {isRegistered ? (
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-2xl font-display font-bold text-dark tracking-tight">
                        Verify your Account
                      </h1>
                      <p className="text-xs text-gray-500 font-sans mt-1">
                        We sent a verification link to your email. Please verify to activate your profile.
                      </p>
                    </div>

                    <div className="p-5 bg-sky-50 border border-sky-100 rounded-2xl space-y-4 shadow-3xs">
                      <p className="text-xs font-sans text-sky-850 font-medium leading-relaxed">
                        Registration successful! A verification link has been sent to your email. Please check your inbox and verify your email to log in.
                      </p>
                      
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={cooldownSeconds > 0 || isResending}
                        className={`text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl border transition-all cursor-pointer focus:outline-none flex items-center justify-center gap-1.5 ${
                          cooldownSeconds > 0 || isResending
                            ? 'bg-gray-50 border-gray-250 text-gray-400 cursor-not-allowed'
                            : 'bg-white border-sky-200 text-sky-700 hover:bg-sky-50/70 active:scale-95'
                        }`}
                      >
                        {isResending ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-sky-300 border-t-sky-700 rounded-full animate-spin" />
                            <span>Resending...</span>
                          </>
                        ) : cooldownSeconds > 0 ? (
                          <span>Resend in {cooldownSeconds}s</span>
                        ) : (
                          <span>Resend Verification Link</span>
                        )}
                      </button>
                    </div>

                    <div className="pt-2 text-center">
                      <Link
                        to="/login"
                        className="text-xs font-bold text-primary hover:underline font-sans transition-colors"
                      >
                        Already verified? Proceed to Login
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    {showFbEmailForm ? (
                      <div className="space-y-4">
                        <div className="text-center pb-2">
                          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-250 rounded-full flex items-center justify-center mx-auto mb-3 shadow-3xs">
                            <ShieldCheck size={26} className="stroke-[1.5]" />
                          </div>
                          <h2 className="text-lg font-display font-extrabold text-slate-800 tracking-tight">Verify &amp; Secure Profile</h2>
                          <p className="text-[11.5px] text-gray-500 font-sans mt-1 max-w-xs mx-auto leading-relaxed">
                            Please enter your original email address. We will verify your account to ensure your security.
                          </p>
                        </div>

                        <form onSubmit={handleFbEmailSubmit} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-dark/70 font-display flex items-center gap-1.5">
                              <Mail size={13} className="text-gray-400" />
                              <span>Original Email Address</span>
                            </label>
                            <input
                              type="email"
                              required
                              value={fbEmail}
                              onChange={(e) => setFbEmail(e.target.value)}
                              placeholder="your.email@example.com"
                              className="w-full border px-4 py-3 text-sm rounded-xl text-dark focus:outline-none focus:border-primary font-sans bg-light-gray/20 transition-colors border-border-gray/80"
                            />
                          </div>

                          <Button
                            type="submit"
                            variant="primary"
                            className="w-full py-3.5 rounded-xl font-display font-semibold text-xs uppercase tracking-wider mt-4"
                            disabled={fbSubmitting}
                          >
                            {fbSubmitting ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Authorizing...</span>
                              </span>
                            ) : (
                              'Authorize Profile'
                            )}
                          </Button>

                          <button
                            type="button"
                            onClick={() => setShowFbEmailForm(false)}
                            className="w-full text-center text-xs text-gray-500 font-sans hover:underline pt-2 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </form>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h1 className="text-2xl font-display font-bold text-dark tracking-tight">
                            Create your Account
                          </h1>
                          <p className="text-xs text-gray-500 font-sans mt-1">
                            Fill in your details below to activate your premium botanical membership profile.
                          </p>
                        </div>

                        <form onSubmit={formik.handleSubmit} className="space-y-4">
                          {/* Name input */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-dark/70 font-display flex items-center gap-1.5">
                              <User size={13} className="text-gray-400" />
                              <span>Full Name</span>
                            </label>
                            <input
                              type="text"
                              name="name"
                              placeholder="Enter your full name"
                              value={formik.values.name}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className={`w-full border px-4 py-3 text-sm rounded-xl text-dark focus:outline-none focus:border-primary font-sans bg-light-gray/20 transition-colors ${
                                formik.touched.name && formik.errors.name
                                  ? 'border-red-500 focus:border-red-500'
                                  : 'border-border-gray/80'
                              }`}
                            />
                            {formik.touched.name && formik.errors.name && (
                              <div className="text-[10px] text-red-500 font-sans font-medium mt-1">
                                {formik.errors.name}
                              </div>
                            )}
                          </div>

                          {/* Email input */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-dark/70 font-display flex items-center gap-1.5">
                              <Mail size={13} className="text-gray-400" />
                              <span>Email Address</span>
                            </label>
                            <input
                              type="email"
                              name="email"
                              placeholder="name@example.com"
                              value={formik.values.email}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className={`w-full border px-4 py-3 text-sm rounded-xl text-dark focus:outline-none focus:border-primary font-sans bg-light-gray/20 transition-colors ${
                                formik.touched.email && formik.errors.email
                                  ? 'border-red-500 focus:border-red-500'
                                  : 'border-border-gray/80'
                              }`}
                            />
                            {formik.touched.email && formik.errors.email && (
                              <div className="text-[10px] text-red-500 font-sans font-medium mt-1">
                                {formik.errors.email}
                              </div>
                            )}
                          </div>

                          {/* Phone input */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-dark/70 font-display flex items-center gap-1.5">
                              <Phone size={13} className="text-gray-400" />
                              <span>Phone Number</span>
                            </label>
                            <input
                              type="text"
                              name="phone"
                              placeholder="Enter 10-digit mobile number"
                              value={formik.values.phone}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className={`w-full border px-4 py-3 text-sm rounded-xl text-dark focus:outline-none focus:border-primary font-sans bg-light-gray/20 transition-colors ${
                                formik.touched.phone && formik.errors.phone
                                  ? 'border-red-500 focus:border-red-500'
                                  : 'border-border-gray/80'
                              }`}
                            />
                            {formik.touched.phone && formik.errors.phone && (
                              <div className="text-[10px] text-red-500 font-sans font-medium mt-1">
                                {formik.errors.phone}
                              </div>
                            )}
                          </div>

                          {/* Password Fields Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Password input */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-dark/70 font-display flex items-center gap-1.5">
                                <Lock size={13} className="text-gray-400" />
                                <span>Password</span>
                              </label>
                              <div className="relative">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  name="password"
                                  placeholder="••••••••"
                                  value={formik.values.password}
                                  onChange={formik.handleChange}
                                  onBlur={formik.handleBlur}
                                  className={`w-full border pl-4 pr-10 py-3 text-sm rounded-xl text-dark focus:outline-none focus:border-primary font-sans bg-light-gray/20 transition-colors ${
                                    formik.touched.password && formik.errors.password
                                      ? 'border-red-500 focus:border-red-500'
                                      : 'border-border-gray/80'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark focus:outline-none cursor-pointer p-0.5"
                                >
                                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              </div>
                              {formik.touched.password && formik.errors.password && (
                                <div className="text-[10px] text-red-500 font-sans font-medium mt-1">
                                  {formik.errors.password}
                                </div>
                              )}
                            </div>

                            {/* Confirm Password input */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-dark/70 font-display flex items-center gap-1.5">
                                <Lock size={13} className="text-gray-400" />
                                <span>Confirm Password</span>
                              </label>
                              <div className="relative">
                                <input
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  name="confirmPassword"
                                  placeholder="••••••••"
                                  value={formik.values.confirmPassword}
                                  onChange={formik.handleChange}
                                  onBlur={formik.handleBlur}
                                  className={`w-full border pl-4 pr-10 py-3 text-sm rounded-xl text-dark focus:outline-none focus:border-primary font-sans bg-light-gray/20 transition-colors ${
                                    formik.touched.confirmPassword && formik.errors.confirmPassword
                                      ? 'border-red-500 focus:border-red-500'
                                      : 'border-border-gray/80'
                                  }`}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark focus:outline-none cursor-pointer p-0.5"
                                >
                                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                              </div>
                              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                                <div className="text-[10px] text-red-500 font-sans font-medium mt-1">
                                  {formik.errors.confirmPassword}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Submit Button */}
                          <Button
                            type="submit"
                            variant="primary"
                            className="w-full py-3.5 rounded-xl font-display font-semibold text-xs uppercase tracking-wider mt-4"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Creating Account...</span>
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-1.5">
                                <span>Register Now</span>
                                <ArrowRight size={14} />
                              </span>
                            )}
                          </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative flex items-center justify-center py-2 text-xs">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border-gray/50"></div>
                          </div>
                          <span className="relative px-3 bg-white text-gray-400 font-sans text-[10px] uppercase font-semibold">
                            Or continue with
                          </span>
                        </div>

                        {/* Social Sign-in Buttons */}
                        <SocialLoginButtons redirectPage="register" />

                        <p className="text-center text-xs text-gray-500 font-sans pt-2">
                          Already have an account?{' '}
                          <Link to="/login" className="font-semibold text-primary hover:underline">
                            Sign In
                          </Link>
                        </p>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
};

export default Register;
