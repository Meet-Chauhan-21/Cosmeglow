import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SEO from '../components/common/SEO';
import { Mail, Lock, Sparkles, Eye, EyeOff, ShieldCheck, Phone } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Button from '../components/layout/Button';
import { OtpInput } from '../components/common/OtpInput';
import { toast } from 'sonner';

import { validateEmailAddress } from '../util/emailValidation';

// Validation Schema using Yup
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .test('valid-domain', 'Temporary, disposable, or dummy email addresses are not permitted.', (value) => {
      if (!value) return true;
      const res = validateEmailAddress(value);
      return res.valid;
    })
    .required('Email address is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    login, 
    facebookLogin, 
    facebookRegister, 
    user, 
    resendVerification, 
    forgotPassword,
    sendPhoneOtp,
    verifyPhoneOtp,
    completePhoneOnboarding
  } = useAuth();
  
  const [loginMode, setLoginMode] = useState<'otp' | 'password'>('otp');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phone OTP States
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpName, setOtpName] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [simulatedOtpHint, setSimulatedOtpHint] = useState<string | null>(null);

  // OTP Countdown
  React.useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleSendPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = otpPhone.replace(/\D/g, '');
    if (clean.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!/^[6-9]/.test(clean)) {
      toast.error('Mobile number should start with 6, 7, 8, or 9.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await sendPhoneOtp(clean);
      setIsSendingOtp(false);
      if (res.success) {
        setOtpStep('otp');
        setOtpCooldown(30);
        if (res.debugOtp) {
          setSimulatedOtpHint(res.debugOtp);
        }
      }
    } catch (err) {
      setIsSendingOtp(false);
      toast.error('Failed to send OTP code.');
    }
  };

  const handleVerifyPhoneOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6) {
      toast.error('Please enter the 6-digit OTP code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await verifyPhoneOtp(otpPhone, cleanOtp);
      setIsVerifyingOtp(false);
      if (res.success) {
        if (res.isNewUser) {
          setOtpStep('name');
        } else {
          toast.success('Logged in successfully!');
        }
      }
    } catch (err) {
      setIsVerifyingOtp(false);
      toast.error('OTP verification failed.');
    }
  };

  const handleCompletePhoneOnboarding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpName.trim() || otpName.trim().length < 2) {
      toast.error('Please enter your full name (minimum 2 characters).');
      return;
    }

    setIsOnboarding(true);
    try {
      const res = await completePhoneOnboarding(otpPhone, otpName, otpEmail);
      setIsOnboarding(false);
      if (res.success) {
        toast.success(`Welcome to CosmeGlow, ${otpName}!`);
      }
    } catch (err) {
      setIsOnboarding(false);
      toast.error('Onboarding failed. Please try again.');
    }
  };

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');
  const [forgotErrorMessage, setForgotErrorMessage] = useState('');

  // States for verification notifications and resend cooldown
  const [infoMessage, setInfoMessage] = useState<string>(location.state?.message || '');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string>(location.state?.email || '');
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);

  // States for Facebook email linking
  const [showFbEmailForm, setShowFbEmailForm] = useState(false);
  const [fbUserData, setFbUserData] = useState<{ facebookId: string; name: string } | null>(null);
  const [fbEmail, setFbEmail] = useState('');
  const [fbSubmitting, setFbSubmitting] = useState(false);


  // Check for Facebook OAuth Redirect Code
  React.useEffect(() => {
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

  // Countdown timer for resend verification link
  React.useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      const defaultPath = user.role === 'admin' ? '/admin' : '/profile';
      const searchParams = new URLSearchParams(window.location.search);
      const redirectQuery = searchParams.get('redirect');
      
      let from = defaultPath;
      const stateFrom = (location.state as any)?.from;
      
      if (redirectQuery) {
        from = redirectQuery;
      } else if (typeof stateFrom === 'string') {
        from = stateFrom;
      } else if (stateFrom && typeof stateFrom === 'object' && stateFrom.pathname) {
        from = stateFrom.pathname + (stateFrom.search || '');
      }

      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleResend = async () => {
    if (cooldownSeconds > 0 || isResending || !unverifiedEmail) return;
    setIsResending(true);
    const res = await resendVerification(unverifiedEmail);
    setIsResending(false);
    if (res.success) {
      setInfoMessage('Verification email resent successfully! Please check your inbox.');
      setCooldownSeconds(60);
    } else if (res.cooldownRemaining) {
      setCooldownSeconds(res.cooldownRemaining);
      setInfoMessage(res.message || 'Please wait before requesting another email.');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotErrorMessage('Please enter your email address.');
      return;
    }

    const check = validateEmailAddress(forgotEmail);
    if (!check.valid) {
      setForgotErrorMessage(check.reason || 'Please enter a valid email address.');
      return;
    }

    setForgotSubmitting(true);
    setForgotErrorMessage('');
    setForgotSuccessMessage('');

    const res = await forgotPassword(forgotEmail);
    setForgotSubmitting(false);

    if (res.success) {
      setForgotSuccessMessage(res.message);
    } else {
      setForgotErrorMessage(res.message);
    }
  };

  // Formik configuration
  const formik = useFormik({
    initialValues: {
      email: location.state?.email || '',
      password: '',
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setInfoMessage('');
      const result = await login(values.email, values.password);
      setIsSubmitting(false);

      if (result && typeof result === 'object' && result.notVerified) {
        setUnverifiedEmail(result.email);
        setInfoMessage(
          'Your email address is not verified yet. Please check your inbox or click the button below to resend the verification email.'
        );
      }
    },
  });

  return (
    <>
      <SEO
        title="Account Login — CosmeGlow Skincare"
        description="Sign in to your CosmeGlow Skincare account to track orders, manage preferences, and view exclusive botanical offers."
      />

      <Navbar />

      <main className="py-6 sm:py-10 min-h-[calc(100vh-4.5rem)] bg-light-gray/30 flex items-center">
        <Container className="py-8">
          <div className="max-w-5xl mx-auto bg-white rounded-3xl overflow-hidden shadow-xl border border-border-gray/30 grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
            
            {/* Left Column - Organic Brand Banner */}
            <div className="hidden md:block md:col-span-5 bg-primary relative p-8 text-white overflow-hidden">
              <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                <img
                  src="https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop"
                  alt="Organic plant ingredients"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary/80 to-transparent" />
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/90 bg-white/10 px-2.5 py-1 rounded-full inline-block backdrop-blur-xs">
                    Natural Actives
                  </span>
                </div>
                
                <div className="space-y-4">
                  <h2 className="font-display font-bold text-2xl lg:text-3xl leading-tight">
                    Biological Cellular Restoration
                  </h2>
                  <p className="text-xs text-white/80 leading-relaxed font-sans">
                    Unlock your skin's biological potential with our premium, organic, cruelty-free apothecary formulas.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-white/90 font-semibold font-display">
                  <Sparkles size={14} />
                  <span>CosmeGlow Gold Circle Benefits</span>
                </div>
              </div>
            </div>

            {/* Right Column - Form Sheet */}
            <div className="col-span-1 md:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
              <div className="max-w-md w-full mx-auto space-y-6">
                {!showFbEmailForm && (
                  <div>
                    <h1 className="text-2xl font-display font-bold text-dark tracking-tight">
                      Welcome to CosmeGlow
                    </h1>
                    <p className="text-xs text-gray-500 font-sans mt-1">
                      Please enter your credentials or sign in with Google to manage your botanicals order.
                    </p>
                  </div>
                )}

                {infoMessage && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
                    <p className="text-xs font-sans text-primary font-medium leading-relaxed">
                      {infoMessage}
                    </p>
                    {unverifiedEmail && (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={cooldownSeconds > 0 || isResending}
                        className={`text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg border transition-all cursor-pointer focus:outline-none flex items-center justify-center gap-1.5 ${
                          cooldownSeconds > 0 || isResending
                            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white border-primary/20 text-primary hover:bg-primary/[0.03] active:scale-95'
                        }`}
                      >
                        {isResending ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <span>Resending...</span>
                          </>
                        ) : cooldownSeconds > 0 ? (
                          <span>Resend in {cooldownSeconds}s</span>
                        ) : (
                          <span>Resend Verification Link</span>
                        )}
                      </button>
                    )}
                  </div>
                )}

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
                ) : showForgotPassword ? (
                  <div className="space-y-4">
                    <div className="text-center pb-2">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Lock size={22} />
                      </div>
                      <h2 className="text-xl font-display font-bold text-dark tracking-tight">
                        Forgot Password
                      </h2>
                      <p className="text-xs text-gray-500 font-sans mt-1 leading-relaxed">
                        Enter your registered email address and we'll send you a link to reset your password.
                      </p>
                    </div>

                    {forgotSuccessMessage ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 text-center">
                        <p className="text-xs text-emerald-800 font-medium">
                          {forgotSuccessMessage}
                        </p>
                        <Button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setForgotSuccessMessage('');
                          }}
                          variant="outline"
                          className="w-full py-2.5 text-xs font-semibold cursor-pointer"
                        >
                          Back to Sign In
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                        {forgotErrorMessage && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                            {forgotErrorMessage}
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-dark/70 font-display flex items-center gap-1.5">
                            <Mail size={13} className="text-gray-400" />
                            <span>Account Email Address</span>
                          </label>
                          <input
                            type="email"
                            required
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full border px-4 py-3 text-sm rounded-xl text-dark focus:outline-none focus:border-primary font-sans bg-light-gray/20 transition-colors border-border-gray/80"
                          />
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          className="w-full py-3.5 rounded-xl font-display font-semibold text-xs uppercase tracking-wider mt-4"
                          disabled={forgotSubmitting}
                        >
                          {forgotSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Sending Reset Link...</span>
                            </span>
                          ) : (
                            'Send Password Reset Link'
                          )}
                        </Button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setForgotErrorMessage('');
                          }}
                          className="w-full text-center text-xs text-gray-500 font-sans hover:underline pt-2 cursor-pointer"
                        >
                          Back to Sign In
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Login Mode Toggle Tabs */}
                    <div className="flex p-1 bg-light-gray rounded-2xl border border-border-gray/50 mb-6">
                      <button
                        type="button"
                        onClick={() => setLoginMode('otp')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          loginMode === 'otp'
                            ? 'bg-white text-dark shadow-xs'
                            : 'text-gray-500 hover:text-dark'
                        }`}
                      >
                        <Phone size={13} className="text-primary" />
                        <span>Mobile OTP</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginMode('password')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          loginMode === 'password'
                            ? 'bg-white text-dark shadow-xs'
                            : 'text-gray-500 hover:text-dark'
                        }`}
                      >
                        <Mail size={13} className="text-primary" />
                        <span>Email & Password</span>
                      </button>
                    </div>

                    {loginMode === 'otp' ? (
                      /* Mobile OTP Login Flow */
                      <div className="space-y-4 text-left">
                        {otpStep === 'phone' && (
                          <div className="space-y-3">
                            <p className="text-xs text-gray-500 font-sans leading-relaxed">
                              Sign in instantly using your mobile number and a fast SMS OTP code.
                            </p>
                            <div>
                              <label className="text-xs font-semibold text-dark/70 font-display block mb-1">
                                Mobile Phone Number
                              </label>
                              <div className="flex items-center gap-2">
                                <span className="bg-light-gray border border-border-gray/60 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-dark/80 font-display select-none">
                                  +91
                                </span>
                                <input
                                  type="tel"
                                  value={otpPhone}
                                  onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                  placeholder="10-digit mobile number"
                                  maxLength={10}
                                  className="w-full bg-white border border-border-gray/60 rounded-xl px-3.5 py-2.5 text-xs text-dark placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-sans"
                                />
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="primary"
                              onClick={handleSendPhoneOtp}
                              disabled={isSendingOtp || otpPhone.replace(/\D/g, '').length !== 10}
                              className="w-full py-3.5 rounded-xl font-display font-semibold text-xs uppercase tracking-wider mt-4"
                            >
                              {isSendingOtp ? 'Sending OTP Code...' : 'Send OTP via SMS'}
                            </Button>
                          </div>
                        )}

                        {otpStep === 'otp' && (
                          <div className="space-y-3 bg-primary/[0.02] border border-primary/10 rounded-2xl p-4">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 font-sans">
                                Code sent to <strong className="text-dark">+91 {otpPhone}</strong>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setOtpStep('phone');
                                  setOtpCode('');
                                }}
                                className="text-primary hover:underline font-semibold text-[11px] cursor-pointer"
                              >
                                Edit Number
                              </button>
                            </div>

                            {simulatedOtpHint && (
                              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-2.5 rounded-xl flex items-center justify-between">
                                <span>Dev Mode OTP: <strong>{simulatedOtpHint}</strong></span>
                                <button
                                  type="button"
                                  onClick={() => setOtpCode(simulatedOtpHint)}
                                  className="text-amber-900 underline font-semibold text-[10px]"
                                >
                                  Auto Fill
                                </button>
                              </div>
                            )}

                            <div>
                              <label className="text-xs font-semibold text-dark/70 font-display block mb-1 text-center">
                                Enter 6-Digit Verification Code
                              </label>
                              <OtpInput
                                value={otpCode}
                                onChange={setOtpCode}
                                disabled={isVerifyingOtp}
                              />
                            </div>

                            <div className="flex items-center justify-between pt-1 text-xs">
                              <button
                                type="button"
                                disabled={otpCooldown > 0 || isSendingOtp}
                                onClick={handleSendPhoneOtp}
                                className={`font-medium ${
                                  otpCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary hover:underline cursor-pointer'
                                }`}
                              >
                                {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : 'Resend Code'}
                              </button>
                            </div>

                            <Button
                              type="button"
                              variant="primary"
                              onClick={handleVerifyPhoneOtp}
                              disabled={isVerifyingOtp || otpCode.length !== 6}
                              className="w-full py-3.5 rounded-xl font-display font-semibold text-xs uppercase tracking-wider mt-4"
                            >
                              {isVerifyingOtp ? 'Verifying Code...' : 'Verify OTP & Sign In'}
                            </Button>
                          </div>
                        )}

                        {otpStep === 'name' && (
                          <div className="space-y-3 bg-primary/[0.02] border border-primary/10 rounded-2xl p-4">
                            <div className="space-y-1">
                              <h4 className="font-display font-semibold text-dark text-sm">
                                Complete Account Setup
                              </h4>
                              <p className="text-xs text-gray-500 font-sans leading-relaxed">
                                Your phone number is verified! Please enter your name to complete onboarding.
                              </p>
                            </div>

                            <div className="space-y-3 pt-2">
                              <div>
                                <label className="text-xs font-semibold text-dark/70 font-display block mb-1">
                                  Full Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={otpName}
                                  onChange={(e) => setOtpName(e.target.value)}
                                  placeholder="e.g. Rahul Patel"
                                  className="w-full bg-white border border-border-gray/60 rounded-xl px-3.5 py-2.5 text-xs text-dark placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-sans"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-semibold text-dark/70 font-display block mb-1">
                                  Email Address <span className="text-gray-400 text-[10px]">(Optional)</span>
                                </label>
                                <input
                                  type="email"
                                  value={otpEmail}
                                  onChange={(e) => setOtpEmail(e.target.value)}
                                  placeholder="e.g. rahul@example.com"
                                  className="w-full bg-white border border-border-gray/60 rounded-xl px-3.5 py-2.5 text-xs text-dark placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-sans"
                                />
                              </div>

                              <Button
                                type="button"
                                variant="primary"
                                onClick={handleCompletePhoneOnboarding}
                                disabled={isOnboarding || otpName.trim().length < 2}
                                className="w-full py-3.5 rounded-xl font-display font-semibold text-xs uppercase tracking-wider mt-4"
                              >
                                {isOnboarding ? 'Saving Profile...' : 'Complete & Sign In'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Existing Email & Password Login Flow */
                      <form onSubmit={formik.handleSubmit} className="space-y-4">
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
                              {String(formik.errors.email)}
                            </div>
                          )}
                        </div>

                        {/* Password input */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-dark/70 font-display flex items-center gap-1.5">
                              <Lock size={13} className="text-gray-400" />
                              <span>Password</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setForgotEmail(formik.values.email);
                                setShowForgotPassword(true);
                              }}
                              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                            >
                              Forgot Password?
                            </button>
                          </div>
                          
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              placeholder="••••••••••••"
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
                              {String(formik.errors.password)}
                            </div>
                          )}
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
                              <span>Signing In...</span>
                            </span>
                          ) : (
                            'Sign In With Email'
                          )}
                        </Button>
                      </form>
                    )}

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
                    <SocialLoginButtons redirectPage="login" />

                    <p className="text-center text-xs text-gray-500 font-sans pt-2">
                      Don't have a CosmeGlow Account?{' '}
                      <Link to="/register" className="font-semibold text-primary hover:underline">
                        Create Account
                      </Link>
                    </p>
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

export default Login;
