import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const GoogleLoginMock: React.FC = () => {
  const [loadingAccount, setLoadingAccount] = useState<string | null>(null);
  const [customUser, setCustomUser] = useState({ name: '', email: '' });
  const [showCustomForm, setShowCustomForm] = useState(false);

  const handleSelectAccount = (name: string, email: string) => {
    setLoadingAccount(email);
    setTimeout(() => {
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'GOOGLE_LOGIN_SUCCESS',
            user: {
              name,
              email,
              avatar: name.split(' ').map(n => n[0]).join('').toUpperCase()
            }
          },
          window.location.origin
        );
      }
      window.close();
    }, 1200);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUser.name || !customUser.email) return;
    handleSelectAccount(customUser.name, customUser.email);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F9] flex items-center justify-center p-4 font-sans text-[#1F1F1F]">
      <div className="bg-white rounded-3xl p-8 max-w-[450px] w-full border border-[#D0D4DC] shadow-md flex flex-col items-center">
        
        {/* Google Branding Logo */}
        <div className="flex items-center gap-1.5 mb-6">
          <svg className="w-10 h-10" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        </div>

        {/* Text Headers */}
        <h1 className="text-2xl font-normal text-center text-[#1f1f1f] mb-1">
          Sign in with Google
        </h1>
        <p className="text-sm text-center text-[#444746] mb-8">
          to continue to <span className="font-semibold text-primary">CosmeGlow Skincare</span>
        </p>

        {loadingAccount ? (
          <div className="flex flex-col items-center py-12 justify-center space-y-4 w-full">
            <div className="w-12 h-12 border-4 border-[#0F3D2E]/20 border-t-[#0F3D2E] rounded-full animate-spin" />
            <p className="text-xs text-gray-500 font-medium animate-pulse">
              Signing in as {loadingAccount}...
            </p>
          </div>
        ) : !showCustomForm ? (
          <div className="w-full space-y-3">
            {/* Account List */}
            <button
              onClick={() => handleSelectAccount('Meet Chauhan', 'meet.chauhan@example.com')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-[#F2F5FA] transition-colors border border-transparent hover:border-[#D0D4DC] text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0F3D2E] text-white flex items-center justify-center font-bold text-sm">
                  MC
                </div>
                <div>
                  <h3 className="font-medium text-sm text-[#1F1F1F] group-hover:text-black">Meet Chauhan</h3>
                  <p className="text-xs text-[#5E6266]">meet.chauhan@example.com</p>
                </div>
              </div>
              <span className="text-[10px] bg-[#EBF3F0] text-primary px-2 py-0.5 rounded-full font-bold uppercase">
                Logged in
              </span>
            </button>

            <button
              onClick={() => handleSelectAccount('Guest User', 'guest.user@gmail.com')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-[#F2F5FA] transition-colors border border-transparent hover:border-[#D0D4DC] text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1F7A4D] text-white flex items-center justify-center font-bold text-sm">
                  GU
                </div>
                <div>
                  <h3 className="font-medium text-sm text-[#1F1F1F] group-hover:text-black">Guest User</h3>
                  <p className="text-xs text-[#5E6266]">guest.user@gmail.com</p>
                </div>
              </div>
            </button>

            {/* Divider */}
            <div className="h-px bg-[#E0E2EC] my-4" />

            {/* Use another account button */}
            <button
              onClick={() => setShowCustomForm(true)}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-[#F2F5FA] transition-colors border border-transparent hover:border-[#D0D4DC] text-left cursor-pointer text-[#0F3D2E] font-medium text-sm"
            >
              <div className="w-10 h-10 rounded-full border border-dashed border-[#D0D4DC] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#5F6368]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span>Use another account</span>
            </button>
          </div>
        ) : (
          /* Custom User Form */
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleCustomSubmit}
            className="w-full space-y-4"
          >
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Your Full Name</label>
              <input
                type="text"
                placeholder="e.g. Priyesh Patel"
                required
                value={customUser.name}
                onChange={(e) => setCustomUser({ ...customUser, name: e.target.value })}
                className="w-full border border-[#D0D4DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4285F4] bg-[#FAFCFF]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Google Email Address</label>
              <input
                type="email"
                placeholder="your.name@gmail.com"
                required
                value={customUser.email}
                onChange={(e) => setCustomUser({ ...customUser, email: e.target.value })}
                className="w-full border border-[#D0D4DC] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4285F4] bg-[#FAFCFF]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="flex-1 border border-[#D0D4DC] rounded-full py-2.5 text-xs font-semibold text-[#5E6266] hover:bg-gray-50 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#4285F4] hover:bg-[#357AE8] text-white rounded-full py-2.5 text-xs font-semibold shadow-sm cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </motion.form>
        )}

        <div className="mt-8 text-[11px] text-[#5E6266] text-center leading-relaxed">
          To continue, Google will share your name, email address, language preference, and profile picture with CosmeGlow.
        </div>
      </div>
    </div>
  );
};

export default GoogleLoginMock;
