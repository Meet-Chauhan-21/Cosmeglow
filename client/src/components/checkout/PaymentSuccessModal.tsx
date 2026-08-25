import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  orderNumber: string;
  totalAmount: number;
  paymentMethod: string;
  transactionId?: string;
  whatsappUrl?: string;
  onClose: () => void;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  orderNumber,
  totalAmount,
  paymentMethod,
  transactionId,
  whatsappUrl,
  onClose
}) => {
  const navigate = useNavigate();

  // Trigger optional device vibration if supported
  useEffect(() => {
    if (isOpen && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isCOD = paymentMethod === 'cod';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-hidden">
        {/* Confetti Particles Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(24)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: '50vw',
                y: '50vh',
                scale: 0,
                rotate: 0,
                opacity: 1
              }}
              animate={{
                x: `${Math.random() * 100}vw`,
                y: `${Math.random() * 100}vh`,
                scale: [0, 1.2, 0.8],
                rotate: Math.random() * 360,
                opacity: [1, 1, 0]
              }}
              transition={{
                duration: 2.5,
                ease: 'easeOut',
                delay: Math.random() * 0.3
              }}
              className={`absolute w-3 h-3 rounded-sm ${
                i % 4 === 0
                  ? 'bg-emerald-400'
                  : i % 4 === 1
                  ? 'bg-indigo-400'
                  : i % 4 === 2
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            />
          ))}
        </div>

        {/* Modal Main Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden border border-slate-100"
        >
          {/* Top Decorative Header Wave */}
          <div className="absolute -top-16 -left-16 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Google Pay / Paytm Style Checkmark Animation */}
          <div className="relative flex justify-center items-center my-4">
            {/* Outer Pulsing Glow Ring */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.8, 1.35, 1.2], opacity: [0.3, 0.6, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse' }}
              className="absolute w-24 h-24 rounded-full bg-emerald-500/20"
            />

            {/* Inner Ring */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
              className="relative w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30"
            >
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 250, delay: 0.25 }}
              >
                <CheckCircle2 size={46} className="text-white stroke-[2.5]" />
              </motion.div>
            </motion.div>
          </div>

          {/* Title & Brand */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-1"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={14} />
              {isCOD ? 'Order Placed Successfully' : 'Payment Verified & Confirmed'}
            </span>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 pt-2">
              {isCOD ? 'Order Confirmed!' : 'Payment Successful!'}
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              Thank you for shopping with <strong className="text-slate-800">CosmeGlow Skincare</strong>.
            </p>
          </motion.div>

          {/* Amount Paid Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 font-sans space-y-2"
          >
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
              {isCOD ? 'Total Amount Payable' : 'Amount Paid'}
            </span>
            <div className="text-3xl font-display font-extrabold text-emerald-600">
              ₹{totalAmount.toFixed(2)}
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex flex-col gap-1 text-[11px] text-slate-600 font-medium text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Order Number:</span>
                <span className="font-mono font-bold text-slate-900">#{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Method:</span>
                <span className="font-semibold uppercase text-indigo-700">
                  {isCOD ? 'Cash on Delivery (COD)' : 'Razorpay Online'}
                </span>
              </div>
              {transactionId && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction Ref:</span>
                  <span className="font-mono font-semibold text-slate-800 truncate max-w-[170px]">
                    {transactionId}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Actions & WhatsApp Sharing (WhatsApp ONLY rendered for COD orders) */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="space-y-3"
          >
            {/* Conditional WhatsApp Share Button: Rendered ONLY if paymentMethod is COD */}
            {isCOD && whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] text-white rounded-xl font-semibold text-xs font-sans shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#25D366]"
              >
                {/* Official WhatsApp SVG Logo */}
                <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662a11.81 11.81 0 005.707 1.456h.005c6.554 0 11.89-5.335 11.893-11.893 0-3.177-1.237-6.166-3.488-8.416"/>
                </svg>
                <span className="whitespace-nowrap">Share Order Details on WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/profile');
              }}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white rounded-xl font-semibold text-xs font-sans shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>View Order Details</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/');
              }}
              className="w-full py-2.5 px-4 text-slate-500 hover:text-slate-800 text-xs font-semibold font-sans cursor-pointer transition-colors"
            >
              Return to Store Homepage
            </button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentSuccessModal;
