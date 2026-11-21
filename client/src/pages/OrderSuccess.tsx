import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ShoppingBag, MapPin, ArrowRight } from 'lucide-react';
import SEO from '../components/common/SEO';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import { trackPurchase } from '../util/metaPixel';
import { loadOrderConfirmation, type OrderConfirmation } from '../util/orderConfirmation';

const formatINR = (n: number) => `₹${(Number(n) || 0).toFixed(2)}`;

// ---------------------------------------------------------------------------
// Party-popper confetti: two bursts from the bottom corners that arc up and
// fall back down. Particles are generated once at module load (not in render).
// ---------------------------------------------------------------------------
const CONFETTI_COLORS = ['#581C87', '#A855F7', '#10B981', '#F59E0B', '#EC4899', '#38BDF8'];
const PARTICLES_PER_POPPER = 38;

interface Particle {
  id: number;
  side: 'left' | 'right';
  color: string;
  shape: 'rect' | 'circle' | 'strip';
  peakX: number; // vw
  peakY: number; // vh (negative = up)
  endX: number;
  endY: number;
  rotate: number;
  delay: number;
  duration: number;
}

const makeParticles = (): Particle[] => {
  const list: Particle[] = [];
  (['left', 'right'] as const).forEach((side, s) => {
    for (let i = 0; i < PARTICLES_PER_POPPER; i++) {
      const angle = ((48 + Math.random() * 34) * Math.PI) / 180; // 48°–82° from the ground
      const power = 45 + Math.random() * 45;
      const dir = side === 'left' ? 1 : -1;
      const peakX = Math.cos(angle) * power * 0.9 * dir;
      const peakY = -Math.sin(angle) * power;
      list.push({
        id: s * PARTICLES_PER_POPPER + i,
        side,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        shape: (['rect', 'circle', 'strip'] as const)[i % 3],
        peakX,
        peakY,
        endX: peakX + (8 + Math.random() * 14) * dir,
        endY: peakY + 55 + Math.random() * 35,
        rotate: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
        delay: Math.random() * 0.18,
        duration: 2.4 + Math.random() * 1.1,
      });
    }
  });
  return list;
};

const PARTICLES = makeParticles();

const shapeClass: Record<Particle['shape'], string> = {
  rect: 'w-2 h-3 rounded-[2px]',
  circle: 'w-2 h-2 rounded-full',
  strip: 'w-1 h-4 rounded-full',
};

const PartyPopper: React.FC = () => (
  <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden" aria-hidden="true">
    {PARTICLES.map((p) => (
      <motion.span
        key={p.id}
        className={`absolute bottom-0 ${shapeClass[p.shape]}`}
        style={{ backgroundColor: p.color, [p.side]: 0 }}
        initial={{ x: '0vw', y: '0vh', rotate: 0, opacity: 1 }}
        animate={{
          x: ['0vw', `${p.peakX}vw`, `${p.endX}vw`],
          y: ['0vh', `${p.peakY}vh`, `${p.endY}vh`],
          rotate: [0, p.rotate * 0.4, p.rotate],
          opacity: [1, 1, 1, 0],
        }}
        transition={{
          duration: p.duration,
          delay: p.delay,
          times: [0, 0.32, 1],
          ease: ['easeOut', 'easeIn'],
          opacity: { duration: p.duration, delay: p.delay, times: [0, 0.3, 0.75, 1] },
        }}
      />
    ))}
  </div>
);

/** Clean success mark: solid circle that scales in, then the check draws itself. */
const SuccessMark: React.FC<{ animate: boolean }> = ({ animate }) => (
  <div className="relative mx-auto w-[88px] h-[88px] flex items-center justify-center">
    <motion.span
      className="absolute inset-0 rounded-full bg-emerald-500/10"
      initial={animate ? { scale: 0.6, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    />
    <motion.svg
      viewBox="0 0 64 64"
      className="relative w-16 h-16"
      initial={animate ? { scale: 0.4, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      role="img"
      aria-label="Order confirmed"
    >
      <circle cx="32" cy="32" r="32" className="fill-emerald-600" />
      <motion.path
        d="M19 33.5 L28 42.5 L45.5 23.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animate ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.45, ease: 'easeOut' }}
      />
    </motion.svg>
  </div>
);

/**
 * Thank-you / order confirmation page (/thank-you).
 * Opens after every successful order (COD and online). The Meta Pixel
 * Purchase event is sent from here, once per order number.
 */
export const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [showConfetti, setShowConfetti] = useState(true);

  const [data] = useState<OrderConfirmation | null>(() => {
    const fromState = location.state as OrderConfirmation | null;
    return fromState?.order?.orderNumber ? fromState : loadOrderConfirmation();
  });

  useEffect(() => {
    if (!data) {
      navigate('/', { replace: true });
      return;
    }
    // Meta Pixel: Purchase — confirmed order only, never twice for the same order
    trackPurchase(data.order);
  }, [data, navigate]);

  // Remove the confetti layer once the burst is over
  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  if (!data) return null;

  const { order, paymentMethod, transactionId } = data;
  const isCOD = paymentMethod === 'cod';
  const totals = order.totals || { subtotal: 0, shipping: 0, tax: 0, total: 0 };
  const address = order.shippingAddress;
  const itemCount = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);

  const details: { label: string; value: string; mono?: boolean }[] = [
    { label: 'Order number', value: `#${order.orderNumber}`, mono: true },
    { label: 'Payment method', value: isCOD ? 'Cash on Delivery' : 'Online Payment' },
    { label: 'Items', value: `${itemCount} item${itemCount === 1 ? '' : 's'}` },
    ...(transactionId ? [{ label: 'Transaction ref', value: transactionId, mono: true }] : []),
  ];

  return (
    <>
      <SEO
        title="Thank You — Order Confirmed | CosmeGlow Skincare"
        description="Your CosmeGlow order has been placed successfully."
        noindex
      />

      {showConfetti && !reduceMotion && <PartyPopper />}

      <Navbar />

      <main className="pt-5 sm:pt-12 pb-16 sm:pb-20 bg-light-gray/30 min-h-screen">
        <Container>
          <div className="max-w-xl mx-auto space-y-4 sm:space-y-6">

            {/* Confirmation card */}
            <motion.section
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="bg-white border border-border-gray/30 rounded-3xl px-5 py-7 sm:p-8 shadow-xs text-center"
            >
              <SuccessMark animate={!reduceMotion} />

              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                {isCOD ? 'Order placed successfully' : 'Payment confirmed'}
              </p>
              <h1 className="mt-1.5 text-[22px] leading-tight sm:text-3xl font-display font-bold text-dark tracking-tight">
                Thank you for your order!
              </h1>
              <p className="mt-2 text-sm text-gray-500 font-sans leading-relaxed">
                {isCOD
                  ? 'We have received your order and will deliver it soon.'
                  : 'Your payment is confirmed and your order is being prepared.'}
              </p>

              {/* Receipt-style details */}
              <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 text-left text-sm font-sans">
                <dl className="divide-y divide-slate-200/70 px-4">
                  {details.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-gray-500 shrink-0">{row.label}</dt>
                      <dd className={`font-semibold text-dark text-right min-w-0 truncate ${row.mono ? 'font-mono text-[13px]' : ''}`}>
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="flex items-center justify-between gap-4 px-4 py-3.5 border-t border-slate-200/70 bg-emerald-50/60 rounded-b-2xl">
                  <span className="font-semibold text-dark">{isCOD ? 'Amount payable' : 'Amount paid'}</span>
                  <span className="font-display font-extrabold text-emerald-600 text-xl">{formatINR(totals.total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Link
                  to="/profile"
                  className="py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white rounded-xl font-semibold text-sm font-sans shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <span>View My Orders</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/shop"
                  className="py-3.5 px-4 bg-white border border-border-gray/70 hover:border-primary hover:text-primary active:scale-[0.99] text-dark rounded-xl font-semibold text-sm font-sans flex items-center justify-center transition-all"
                >
                  Continue Shopping
                </Link>
              </div>
            </motion.section>

            {/* Order summary */}
            <section className="bg-white border border-border-gray/30 rounded-3xl px-5 py-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 border-b border-border-gray/40 pb-4 mb-4">
                <ShoppingBag size={18} className="text-primary" />
                <h2 className="text-base font-display font-semibold text-dark">Order Summary</h2>
              </div>

              <ul className="divide-y divide-border-gray/30">
                {(order.items || []).map((item) => (
                  <li key={`${item.productId}-${item.selectedSize}`} className="py-3 flex justify-between gap-3 text-sm font-sans first:pt-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-dark truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.selectedSize ? `${item.selectedSize} · ` : ''}Qty {item.quantity}
                      </p>
                    </div>
                    <span className="font-display font-bold text-dark whitespace-nowrap">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-4 border-t border-border-gray/40 space-y-2 text-sm font-sans">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-dark">{formatINR(totals.subtotal)}</span>
                </div>
                {totals.shipping > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Shipping</span>
                    <span className="font-semibold text-dark">{formatINR(totals.shipping)}</span>
                  </div>
                )}
                {totals.tax > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Tax</span>
                    <span className="font-semibold text-dark">{formatINR(totals.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 font-display text-dark">
                  <span className="font-bold text-sm uppercase tracking-wider">Total</span>
                  <span className="font-bold text-lg text-primary">{formatINR(totals.total)}</span>
                </div>
              </div>

              {address && (
                <div className="mt-5 pt-4 border-t border-border-gray/40 flex gap-3 text-sm font-sans text-gray-600">
                  <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                  <div className="leading-relaxed min-w-0">
                    <p className="font-semibold text-dark">{address.name} · {address.phone}</p>
                    <p className="break-words">{address.street}, {address.district}, {address.state}, {address.country} - {address.zip}</p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </Container>
      </main>

      <Footer />
    </>
  );
};

export default OrderSuccess;
