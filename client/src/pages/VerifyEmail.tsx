import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Button from '../components/layout/Button';

export const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Checking...');
  const hasCalled = React.useRef(false);

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;

    const performVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing verification token. Please double check the link in your email.');
        return;
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const res = await verifyEmail(token);

        if (res.success) {
          setStatus('success');
          setMessage(res.message);
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2500);
        } else {
          setStatus('error');
          setMessage(res.message);
        }
      } catch (err) {
        console.error('Verify Email fetch error:', err);
        setStatus('error');
        setMessage('A network error occurred. Please check your connection and try again.');
      }
    };

    performVerification();
  }, [token, verifyEmail, navigate]);

  return (
    <>
      <Helmet>
        <title>Verify Email — CosmeGlow Skincare</title>
      </Helmet>

      <Navbar />

      <main className="pt-24 pb-20 min-h-screen bg-light-gray/30 flex items-center justify-center">
        <Container>
          <div className="max-w-md w-full mx-auto bg-white rounded-3xl p-8 border border-border-gray/30 shadow-xl text-center space-y-6">
            
            {status === 'loading' && (
              <div className="py-8 space-y-6">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
                  <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-display font-bold text-dark">Checking...</h2>
                  <p className="text-xs text-gray-500 font-sans max-w-xs mx-auto leading-relaxed">
                    Verifying your email token with CosmeGlow cellular database. Please hold on.
                  </p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="py-4 space-y-6">
                <div className="w-16 h-16 bg-emerald-50/50 text-emerald-500 border border-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 size={28} className="stroke-[1.5]" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-display font-extrabold text-slate-800 tracking-tight">Email Verified!</h2>
                  <p className="text-xs text-slate-500 font-sans max-w-sm mx-auto leading-relaxed px-2">
                    Email verified successfully! Logging you in and redirecting to the homepage...
                  </p>
                </div>
                <div className="pt-4">
                  <Link to="/" className="block w-full">
                    <Button
                      variant="primary"
                      rightIcon={<ArrowRight size={14} />}
                      className="w-full py-3.5 rounded-xl font-display font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/10"
                    >
                      Go to Homepage
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="py-4 space-y-6">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 border border-rose-250 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <XCircle size={32} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-display font-bold text-dark">Verification Failed</h2>
                  <p className="text-xs text-rose-600/90 font-sans max-w-sm mx-auto leading-relaxed bg-rose-50/40 p-3 rounded-xl border border-rose-100">
                    {message}
                  </p>
                </div>
                <div className="pt-4 flex flex-col gap-3">
                  <Link to="/login" className="w-full">
                    <Button variant="primary" className="w-full py-3.5 rounded-xl font-display font-semibold uppercase tracking-wider text-xs">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-semibold font-display uppercase tracking-widest pt-2 border-t border-slate-100">
              <ShieldCheck size={12} className="text-primary" />
              <span>Dermatologist Approved Apothecary</span>
            </div>

          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
};

export default VerifyEmail;
