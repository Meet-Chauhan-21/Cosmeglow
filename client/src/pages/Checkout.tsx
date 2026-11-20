import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/common/SEO';

import { ArrowLeft, CreditCard, ShieldCheck, ShoppingBag, Truck, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { SearchableDropdown } from '../components/layout/SearchableDropdown';
import { locationData } from '../data/locationData';
import { toast } from 'sonner';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/layout/Container';
import Button from '../components/layout/Button';
import { PaymentSuccessModal } from '../components/checkout/PaymentSuccessModal';
import { OtpInput } from '../components/common/OtpInput';

import { API_BASE_URL } from '../config';
import { trackInitiateCheckout, trackAddPaymentInfo, trackPurchase } from '../util/metaPixel';

const formatWhatsAppMessage = (
  orderNumber: string,
  shippingAddress: any,
  cartItems: any[],
  totalAmount: number,
  paymentMethod: string
) => {
  const emojiHerb = '\uD83C\uDF3F';
  const emojiPackage = '\uD83D\uDCE6';
  const emojiBags = '\uD83D\uDECD\uFE0F';
  const emojiSmallSquare = '\u25AB\uFE0F';
  const emojiDollar = '\uD83D\uDCB5';
  const emojiPin = '\uD83D\uDCCD';
  const emojiHouse = '\uD83C\uDFE0';
  const emojiCity = '\uD83C\uDFD9\uFE0F';
  const emojiIndia = '\uD83C\uDDEE\uD83C\uDDF3';
  const emojiSeedling = '\uD83C\uDF31';

  let message = `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `${emojiHerb} *COSMEGLOW - NEW ORDER* ${emojiHerb}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  message += `${emojiPackage} *Order Details:*\n`;
  message += `• *Order ID:* #${orderNumber}\n`;
  message += `• *Customer:* ${shippingAddress.name}\n`;
  message += `• *Mobile:* ${shippingAddress.phone}\n`;
  message += `• *Payment Method:* ${paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Razorpay Online Payment'}\n\n`;
  
  message += `${emojiBags} *Items Ordered:*\n`;
  cartItems.forEach((item, index) => {
    message += `${index + 1}. *${item.product.name}*\n`;
    message += `   ${emojiSmallSquare} Qty: ${item.quantity}\n`;
    message += `   ${emojiSmallSquare} Price: Rs. ${(item.product.price * item.quantity).toFixed(2)}\n`;
  });
  message += `\n`;
  
  message += `${emojiDollar} *Total Amount:* Rs. ${totalAmount.toFixed(2)}\n\n`;
  
  message += `${emojiPin} *Shipping Address:*\n`;
  message += `${emojiHouse} ${shippingAddress.street},\n`;
  message += `${emojiCity} ${shippingAddress.district}, ${shippingAddress.state},\n`;
  message += `${emojiIndia} ${shippingAddress.country} - ${shippingAddress.zip}\n\n`;
  
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Thank you for choosing CosmeGlow! ${emojiSeedling}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━`;
  
  return encodeURIComponent(message);
};

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart, settings } = useStore();
  const { 
    user, 
    placeOrder, 
    addAddress, 
    accessToken, 
    logout,
    sendPhoneOtp, 
    verifyPhoneOtp, 
    completePhoneOnboarding 
  } = useAuth();

  // Load user saved addresses
  const savedAddresses = user?.addresses || [];
  const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];

  const [useNewAddress, setUseNewAddress] = useState<boolean>(savedAddresses.length === 0);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(defaultAddr?._id || '');

  // Redirect if cart is empty
  React.useEffect(() => {
    if (cart.length === 0 && !orderPlaced) {
      toast.error('Your cart is empty. Please add products to check out.');
      navigate('/');
    }
  }, [cart, navigate]);

  // Shipping Form State (Fallback / Guest)
  const [newAddressForm, setNewAddressForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: '',
    country: 'India',
    state: '',
    district: '',
    zip: ''
  });

  // Phone OTP & Onboarding State for quick verification
  const [onboardingPhone, setOnboardingPhone] = useState(user?.phone || '');
  const [onboardingOtp, setOnboardingOtp] = useState('');
  const [onboardingName, setOnboardingName] = useState(user?.name || '');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [simulatedOtpHint, setSimulatedOtpHint] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  // Sync user details into shipping form and onboarding states when user logs in
  React.useEffect(() => {
    if (user) {
      setNewAddressForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        phone: prev.phone || user.phone || ''
      }));
      if (user.phone) setOnboardingPhone(user.phone);
      if (user.name) setOnboardingName(user.name);
    }
  }, [user]);

  // OTP Resend Cooldown Timer
  React.useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = onboardingPhone.replace(/\D/g, '');
    if (clean.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!/^[6-9]/.test(clean)) {
      toast.error('Mobile number should start with 6, 7, 8, or 9.');
      return;
    }

    // Clean previously entered OTP and hint so boxes start fresh for each number
    setOnboardingOtp('');
    setSimulatedOtpHint(null);
    setOtpError(null);
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

  const handleVerifyOtp = async (e?: React.FormEvent, codeOverride?: string) => {
    if (e) e.preventDefault();
    const cleanOtp = (codeOverride || onboardingOtp).trim();
    if (cleanOtp.length !== 6) {
      setOtpError('Please enter the 6-digit OTP code.');
      return;
    }

    setOtpError(null);
    setIsVerifyingOtp(true);
    try {
      const res = await verifyPhoneOtp(onboardingPhone, cleanOtp);
      setIsVerifyingOtp(false);

      if (res.success) {
        setOtpError(null);
        if (res.isNewUser) {
          // New user whose phone is verified: show name collection onboarding
          setOtpStep('name');
        } else {
          // Existing user logged in
          toast.success('Mobile verified and logged in successfully!');
        }
      } else {
        setOtpError(res.message || 'Invalid or expired OTP code. Please check and try again.');
      }
    } catch (err: any) {
      setIsVerifyingOtp(false);
      setOtpError(err?.message || 'OTP verification failed. Please try again.');
    }
  };

  const handleCompleteOnboarding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onboardingName.trim() || onboardingName.trim().length < 2) {
      toast.error('Please enter your full name (minimum 2 characters).');
      return;
    }

    setIsOnboarding(true);
    try {
      const res = await completePhoneOnboarding(onboardingPhone, onboardingName);
      setIsOnboarding(false);

      if (res.success) {
        toast.success(`Welcome to CosmeGlow, ${onboardingName}!`);
      }
    } catch (err) {
      setIsOnboarding(false);
      toast.error('Onboarding failed. Please try again.');
    }
  };

  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const validateAddressField = (field: string, form = newAddressForm): string => {
    switch (field) {
      case 'name': {
        const v = form.name.trim();
        if (!v) return 'Recipient full name is required';
        if (v.length < 2) return 'Name must be at least 2 characters';
        if (!/^[A-Za-z][A-Za-z .'-]*$/.test(v)) return 'Name can contain only letters, spaces, dot and hyphen';
        return '';
      }
      case 'street': {
        const v = form.street.trim();
        if (!v) return 'Street address is required';
        if (v.length < 5) return 'Please enter full street address (min 5 characters)';
        return '';
      }
      case 'country':
        return form.country ? '' : 'Please select a country';
      case 'state':
        return form.state ? '' : 'Please select a state';
      case 'district':
        return form.district ? '' : 'Please select a district';
      case 'zip': {
        const v = form.zip.replace(/\D/g, '');
        if (!v) return 'Pincode is required';
        if (form.country === 'India') {
          if (v.length !== 6) return 'Pincode must be exactly 6 digits';
          if (v.startsWith('0')) return 'Pincode cannot start with 0';
        } else if (v.length < 4) {
          return 'Please enter a valid postal code';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const ADDRESS_FIELDS = ['name', 'street', 'country', 'state', 'district', 'zip'] as const;

  const validateAddressForm = (form = newAddressForm) => {
    const errs: Record<string, string> = {};
    ADDRESS_FIELDS.forEach((f) => {
      const msg = validateAddressField(f, form);
      if (msg) errs[f] = msg;
    });
    return errs;
  };

  // Update one or more fields, then live-validate only the changed fields
  // against the NEW values (avoids stale-state errors on dropdown select).
  const updateAddressFields = (changes: Partial<typeof newAddressForm>, markTouched = false) => {
    const updated = { ...newAddressForm, ...changes };
    setNewAddressForm(updated);
    const changedKeys = Object.keys(changes);
    if (markTouched) {
      setTouchedFields((prev) => {
        const next = { ...prev };
        changedKeys.forEach((k) => (next[k] = true));
        return next;
      });
    }
    setAddressErrors((prev) => {
      const next = { ...prev };
      changedKeys.forEach((k) => {
        const msg = validateAddressField(k, updated);
        if (msg) next[k] = msg;
        else delete next[k];
      });
      return next;
    });
  };

  const handleBlurField = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    setAddressErrors((prev) => {
      const next = { ...prev };
      const msg = validateAddressField(field);
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [confirmedTotal, setConfirmedTotal] = useState<number>(0);
  const [lastTransactionId, setLastTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [whatsappOrderUrl, setWhatsappOrderUrl] = useState('');

  const isRazorpayEnabled = settings.enableRazorpay !== false;
  const isCODEnabled = settings.enableCOD !== false;

  // Synchronize payment selection based on admin settings
  React.useEffect(() => {
    if (isRazorpayEnabled) {
      setPaymentMethod('razorpay');
    } else if (isCODEnabled) {
      setPaymentMethod('cod');
    }
  }, [isRazorpayEnabled, isCODEnabled]);

  // Cart values
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Settings-based shipping
  const isShippingEnabled = settings.enableDeliveryCharge;
  const standardShipping = settings.deliveryCharge || 0;
  const isFreeShippingEnabled = settings.enableFreeDeliveryThreshold;
  const freeShippingThreshold = settings.freeDeliveryThreshold || 0;

  const shipping = isShippingEnabled 
    ? (isFreeShippingEnabled && subtotal >= freeShippingThreshold ? 0 : standardShipping)
    : 0;

  // Settings-based tax
  const isTaxEnabled = settings.enableTax;
  const taxPercent = settings.taxPercentage || 0;
  const tax = isTaxEnabled ? subtotal * (taxPercent / 100) : 0;

  const total = subtotal + shipping + tax;

  // Meta Pixel: InitiateCheckout when the checkout page opens with items in the cart
  // (Buy Now, Proceed to Checkout from the cart, or any other link here).
  // Refreshing or re-opening with the same cart does not fire it again.
  React.useEffect(() => {
    if (cart.length > 0) trackInitiateCheckout(cart, total);
    // Fire once when the checkout opens, not on every cart/settings re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cascading Address Dropdowns for new addresses
  const countryOptions = locationData.map((c) => c.name);
  const selectedCountryObj = locationData.find((c) => c.name === newAddressForm.country);
  const stateOptions = selectedCountryObj ? selectedCountryObj.states.map((s) => s.name) : [];
  const selectedStateObj = selectedCountryObj?.states.find((s) => s.name === newAddressForm.state);
  const districtOptions = selectedStateObj ? selectedStateObj.districts : [];

  const handleCountryChange = (val: string) => {
    // Only the country is marked touched; state/district errors stay hidden
    // until the user interacts with them (or submits).
    const updated = { ...newAddressForm, country: val, state: '', district: '' };
    setNewAddressForm(updated);
    setTouchedFields((prev) => ({ ...prev, country: true }));
    setAddressErrors((prev) => {
      const next = { ...prev };
      (['country', 'state', 'district', 'zip'] as const).forEach((k) => {
        const msg = validateAddressField(k, updated);
        if (msg) next[k] = msg;
        else delete next[k];
      });
      return next;
    });
  };

  const handleStateChange = (val: string) => {
    const updated = { ...newAddressForm, state: val, district: '' };
    setNewAddressForm(updated);
    setTouchedFields((prev) => ({ ...prev, state: true }));
    setAddressErrors((prev) => {
      const next = { ...prev };
      (['state', 'district'] as const).forEach((k) => {
        const msg = validateAddressField(k, updated);
        if (msg) next[k] = msg;
        else delete next[k];
      });
      return next;
    });
  };

  const handleDistrictChange = (val: string) => {
    updateAddressFields({ district: val }, true);
  };

  const processOrderSuccess = async (result: any, shippingAddress: any, txId?: string) => {
    // Save the new address to the user's saved addresses
    // Fire-and-forget so the success screen is not delayed by this request.
    if (useNewAddress && addAddress) {
      Promise.resolve(addAddress(shippingAddress)).catch((addrErr) =>
        console.error('Failed to save new address during checkout:', addrErr)
      );
    }

    // Meta Pixel: Purchase — only for the order the server just confirmed
    trackPurchase(result?.order);

    const exactTotal = result?.order?.totals?.total || total;
    setConfirmedTotal(exactTotal);
    setOrderId(result.order.orderNumber);
    if (txId) setLastTransactionId(txId);

    if (paymentMethod === 'cod') {
      const orderMsg = formatWhatsAppMessage(
        result.order.orderNumber,
        shippingAddress,
        cart,
        exactTotal,
        paymentMethod
      );
      const formatWhatsAppLink = (num: string) => {
        const cleanNum = num.replace(/\D/g, '');
        return cleanNum.length === 10 ? `91${cleanNum}` : cleanNum;
      };
      const url = `https://wa.me/${formatWhatsAppLink(settings.whatsappNumber)}?text=${orderMsg}`;
      setWhatsappOrderUrl(url);

      toast.success('Order placed successfully (Cash on Delivery)!');

      // Auto open WhatsApp tab ONLY for COD orders
      try {
        window.open(url, '_blank');
      } catch (e) {
        console.error('Popup blocked by browser:', e);
      }
    } else {
      toast.success('Razorpay Payment verified & Order confirmed!');
      setWhatsappOrderUrl(''); // Explicitly hide WhatsApp for online payments!
    }

    setOrderPlaced(true);
    clearCart();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auth Validation - Ensure user is verified via Phone OTP
    if (!user) {
      toast.error('Please verify your mobile number in Section 1 to proceed with checkout.');
      const elem = document.getElementById('checkout-auth-card');
      if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Address Validation
    if (useNewAddress) {
      const errs = validateAddressForm();
      setAddressErrors(errs);
      setTouchedFields({
        name: true,
        street: true,
        country: true,
        state: true,
        district: true,
        zip: true
      });

      const firstErrMsg = Object.values(errs)[0];
      if (firstErrMsg) {
        toast.error(firstErrMsg);
        return;
      }
    } else {
      if (!selectedAddressId) {
        toast.error('Please select a saved shipping address.');
        return;
      }
    }

    const selectedSavedAddress =
      !useNewAddress ? savedAddresses.find((a) => a._id === selectedAddressId) : undefined;

    if (!useNewAddress && !selectedSavedAddress) {
      toast.error('Please select a valid saved shipping address.');
      return;
    }

    const finalPhone = (useNewAddress ? newAddressForm.phone : selectedSavedAddress?.phone) || onboardingPhone || user?.phone || '';

    const shippingAddress = useNewAddress
      ? {
          name: newAddressForm.name,
          phone: finalPhone,
          street: newAddressForm.street,
          country: newAddressForm.country,
          state: newAddressForm.state,
          district: newAddressForm.district,
          zip: newAddressForm.zip
        }
      : {
          name: selectedSavedAddress!.name,
          phone: selectedSavedAddress!.phone,
          street: selectedSavedAddress!.street,
          country: selectedSavedAddress!.country,
          state: selectedSavedAddress!.state,
          district: selectedSavedAddress!.district,
          zip: selectedSavedAddress!.zip
        };

    if (paymentMethod === 'razorpay' && !isRazorpayEnabled) {
      toast.error('Razorpay online payments are currently disabled by store administrator.');
      return;
    }
    if (paymentMethod === 'cod' && !isCODEnabled) {
      toast.error('Cash on Delivery (COD) is currently disabled by store administrator.');
      return;
    }

    setIsSubmitting(true);

    if (paymentMethod === 'razorpay') {
      try {
        // Step 1: Create Razorpay Order on Backend
        const res = await fetch(`${API_BASE_URL}/users/orders/razorpay-create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({ amount: total })
        });

        const data = await res.json();
        if (!res.ok) {
          toast.error(data.message || 'Failed to initiate Razorpay transaction.');
          setIsSubmitting(false);
          return;
        }

        const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || data.keyId || 'rzp_test_TFHJjhLymJTyfs';

        // Step 2: Open Razorpay Modal
        const options = {
          key: razorpayKeyId,
          amount: data.amount,
          currency: data.currency || 'INR',
          name: settings.shopName || 'CosmeGlow Skincare',
          description: 'Botanical Skincare Order Payment',
          image: settings.logo || '/logo.png',
          order_id: data.razorpayOrderId,
          prefill: {
            name: shippingAddress.name,
            contact: shippingAddress.phone,
            email: user?.email || ''
          },
          theme: {
            color: settings.themeColor || '#581C87'
          },
          handler: async function (response: any) {
            // Meta Pixel: AddPaymentInfo — payment details were submitted successfully
            // in the Razorpay popup (only the payment id is used as a reference).
            trackAddPaymentInfo(cart, total, response.razorpay_payment_id);

            // Step 3 & 4: Payment Success -> Send parameters to backend for HMAC Signature Verification
            setIsVerifying(true);
            try {
              const orderResult = await placeOrder({
                items: cart.map((item) => ({
                  productId: item.product.id,
                  name: item.product.name,
                  quantity: item.quantity,
                  price: item.product.price,
                  selectedSize: item.selectedSize
                })),
                shippingAddress,
                paymentMethod: 'razorpay',
                paymentDetails: {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                },
                totals: { subtotal, shipping, tax, total }
              });

              if (orderResult) {
                await processOrderSuccess(orderResult, shippingAddress, response.razorpay_payment_id);
              } else {
                toast.error('Payment verification failed on server.');
              }
            } catch (verifyErr) {
              console.error('Signature verification call error:', verifyErr);
              toast.error('Razorpay signature verification failed.');
            } finally {
              setIsSubmitting(false);
              setIsVerifying(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
              toast.error('Razorpay checkout window closed.');
            }
          }
        };

        const razorpayInstance = new (window as any).Razorpay(options);
        razorpayInstance.on('payment.failed', function (errResp: any) {
          setIsSubmitting(false);
          toast.error(errResp.error?.description || 'Razorpay payment failed.');
        });
        razorpayInstance.open();
      } catch (razorpayErr) {
        console.error('Razorpay error:', razorpayErr);
        toast.error('Failed to launch Razorpay gateway.');
        setIsSubmitting(false);
      }
    } else {
      // COD Order Execution Flow
      try {
        const result = await placeOrder({
          items: cart.map((item) => ({
            productId: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.price,
            selectedSize: item.selectedSize
          })),
          shippingAddress,
          paymentMethod: 'cod',
          totals: { subtotal, shipping, tax, total }
        });

        setIsSubmitting(false);
        if (result) {
          // Meta Pixel: AddPaymentInfo — COD payment choice accepted with the order
          trackAddPaymentInfo(cart, result.order?.totals?.total ?? total, `cod-${result.order?.orderNumber}`);
          await processOrderSuccess(result, shippingAddress);
        }
      } catch (err) {
        console.error('Checkout COD error:', err);
        toast.error('Failed to place COD order.');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <>
      <SEO
        title="Secure Checkout — CosmeGlow Skincare"
        description="Complete your order securely with CosmeGlow Skincare. Fast shipping and 100% genuine organic botanical products."
      />

      <Navbar />

      <main className="pt-6 sm:pt-8 pb-20 bg-light-gray/30 min-h-screen">
        <Container>
          
          <Link
            to="/"
            onClick={(e) => {
              if (cart.length > 0) {
                e.preventDefault();
                navigate(-1);
              }
            }}
            className="inline-flex items-center gap-1 text-xs font-display font-semibold text-gray-500 hover:text-primary mb-6 transition-colors uppercase tracking-wider focus:outline-none"
          >
            <ArrowLeft size={14} />
            <span>Continue Shopping</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-display font-bold text-dark tracking-tight mb-8">
            Botanical Secure Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Shipping & Payment Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
              
              {/* Step 1: Customer Contact & Mobile Verification */}
              <div id="checkout-auth-card" className="bg-white border border-border-gray/30 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
                <div className="flex items-center gap-2 border-b border-border-gray/40 pb-4 justify-between flex-wrap">
                  <div className="flex items-center gap-2">
                    <Phone size={18} className="text-primary" />
                    <h2 className="text-base font-display font-semibold text-dark">
                      1. Contact & Mobile Verification
                    </h2>
                  </div>
                  {user ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      Verified
                    </span>
                  ) : (
                    <Link
                      to="/login"
                      state={{ from: '/checkout' }}
                      className="text-xs font-semibold font-display text-primary hover:text-primary-light transition-colors"
                    >
                      Already have an account? Sign In
                    </Link>
                  )}
                </div>

                {user ? (
                  // Logged In Status Card
                  <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold font-display text-sm shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-dark text-sm flex items-center gap-1.5">
                          <span>{user.name}</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-sans font-medium">Verified Customer</span>
                        </div>
                        <div className="text-gray-500 font-sans mt-0.5">
                          {user.phone ? `+91 ${user.phone}` : user.email}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="text-[11px] font-medium text-gray-500 hover:text-rose-600 underline cursor-pointer self-end sm:self-auto"
                    >
                      Use a different account
                    </button>
                  </div>
                ) : (
                  // Onboarding & Verification Forms (Flutter & Mobile-App Style)
                  <div className="space-y-4 text-left">
                    {otpStep === 'phone' && (
                      <div className="space-y-4 pt-1">
                        <div>
                          <label className="text-xs font-bold text-gray-700 font-display block mb-1.5 uppercase tracking-wider">
                            Mobile Phone Number <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center bg-gray-50 border border-gray-200 px-4 h-12 rounded-xl text-sm font-bold text-dark font-display select-none shrink-0 shadow-xs min-w-[64px]">
                              +91
                            </div>
                            <input
                              type="tel"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={onboardingPhone}
                              onChange={(e) => {
                                setOnboardingPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                                setOnboardingOtp('');
                                setSimulatedOtpHint(null);
                                setOtpError(null);
                              }}
                              placeholder="Enter 10-digit mobile number"
                              maxLength={10}
                              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 h-12 text-sm sm:text-base font-semibold text-dark placeholder:text-gray-400 placeholder:font-normal focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-sans"
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="primary"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp || onboardingPhone.replace(/\D/g, '').length !== 10}
                          className="w-full h-12 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isSendingOtp ? 'Sending Verification Code...' : 'Get OTP on Phone'}
                        </Button>
                      </div>
                    )}

                    {otpStep === 'otp' && (
                      <div className="space-y-4 pt-1">
                        {/* Mobile-App Clean Phone Info Pill */}
                        <div className="flex items-center justify-between bg-primary/[0.04] border border-primary/15 rounded-xl px-3.5 py-2.5 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                            <span className="text-gray-600 font-sans truncate">
                              OTP sent to <strong className="text-dark font-mono">+91 {onboardingPhone}</strong>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setOtpStep('phone');
                              setOnboardingOtp('');
                              setSimulatedOtpHint(null);
                            }}
                            className="text-primary hover:text-primary-dark font-bold text-xs cursor-pointer hover:underline shrink-0 ml-2"
                          >
                            Edit
                          </button>
                        </div>

                        {simulatedOtpHint && (
                          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-2.5 rounded-xl flex items-center justify-between">
                            <span>Development Mode OTP: <strong>{simulatedOtpHint}</strong></span>
                            <button
                              type="button"
                              onClick={() => setOnboardingOtp(simulatedOtpHint)}
                              className="text-amber-900 underline font-semibold text-[10px] cursor-pointer"
                            >
                              Auto Fill
                            </button>
                          </div>
                        )}

                        {/* Flutter-style Centered 6-Box OTP Input */}
                        <div className="text-center pt-1">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2 font-display">
                            Enter 6-Digit OTP Code
                          </span>
                          <OtpInput
                            value={onboardingOtp}
                            onChange={(val) => {
                              setOnboardingOtp(val);
                              if (otpError) setOtpError(null);
                            }}
                            onComplete={(val) => {
                              handleVerifyOtp(undefined, val);
                            }}
                            hasError={!!otpError}
                            disabled={isVerifyingOtp}
                          />
                          {otpError && (
                            <div className="flex items-center justify-center gap-1.5 text-rose-600 text-xs font-semibold pt-2">
                              <AlertCircle size={14} className="shrink-0 text-rose-500" />
                              <span>{otpError}</span>
                            </div>
                          )}
                        </div>

                        {/* Resend OTP Timer Row */}
                        <div className="flex items-center justify-center text-xs pt-1">
                          {otpCooldown > 0 ? (
                            <span className="text-gray-400 font-sans">
                              Resend OTP in <strong className="font-mono text-dark">{otpCooldown}s</strong>
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isSendingOtp}
                              onClick={handleSendOtp}
                              className="text-primary hover:text-primary-dark font-bold font-display cursor-pointer hover:underline"
                            >
                              {isSendingOtp ? 'Sending...' : 'Resend OTP via SMS'}
                            </button>
                          )}
                        </div>

                        {/* Verify & Continue Button */}
                        <Button
                          type="button"
                          variant="primary"
                          onClick={() => handleVerifyOtp()}
                          disabled={isVerifyingOtp || onboardingOtp.length !== 6}
                          className="w-full h-12 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isVerifyingOtp ? 'Verifying Code...' : 'Verify OTP & Continue'}
                        </Button>
                      </div>
                    )}

                    {otpStep === 'name' && (
                      <div className="space-y-4 pt-1">
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-emerald-800">
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">✓</span>
                          <span>Mobile number <strong>+91 {onboardingPhone}</strong> verified successfully!</span>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-bold text-gray-700 font-display block mb-1.5 uppercase tracking-wider">
                              Full Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={onboardingName}
                              onChange={(e) => setOnboardingName(e.target.value)}
                              placeholder="Enter your full name"
                              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-4 h-12 text-sm font-semibold text-dark placeholder:text-gray-400 placeholder:font-normal focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-sans"
                            />
                          </div>

                          <Button
                            type="button"
                            variant="primary"
                            onClick={handleCompleteOnboarding}
                            disabled={isOnboarding || onboardingName.trim().length < 2}
                            className="w-full h-12 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {isOnboarding ? 'Saving Profile...' : 'Continue to Shipping Address'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Shipping Logistics Address */}
              <div className="bg-white border border-border-gray/30 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
                <div className="flex items-center gap-2 border-b border-border-gray/40 pb-4 justify-between flex-wrap">
                  <div className="flex items-center gap-2">
                    <Truck size={18} className="text-primary" />
                    <h2 className="text-base font-display font-semibold text-dark">2. Shipping Logistics Address</h2>
                  </div>
                  {savedAddresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUseNewAddress(!useNewAddress)}
                      className="text-xs font-semibold font-display text-primary hover:text-primary-light transition-colors cursor-pointer"
                    >
                      {useNewAddress ? 'Use Saved Address' : 'Enter New Address'}
                    </button>
                  )}
                </div>

                {savedAddresses.length > 0 && !useNewAddress ? (
                  /* Saved Addresses selector */
                  <div className="space-y-4">
                    <label className="text-xs font-semibold text-dark/70 font-display block">
                      Select one of your registered shipping addresses
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr._id;
                        return (
                          <div
                            key={addr._id}
                            onClick={() => setSelectedAddressId(addr._id || '')}
                            className={`border rounded-2xl p-4 cursor-pointer flex flex-col justify-between transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/2 shadow-xs'
                                : 'border-border-gray/50 bg-white hover:border-primary/20'
                            }`}
                          >
                            <div className="space-y-2 font-sans text-xs text-left">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`inline-block border px-2 py-0.5 rounded-md font-display font-bold uppercase tracking-wider text-[8px] ${
                                  addr.isDefault
                                    ? 'bg-primary/10 text-primary border-primary/20'
                                    : 'bg-gray-50 text-gray-500 border-border-gray/30'
                                }`}>
                                  {addr.isDefault ? 'Primary' : 'Shipping'}
                                </span>
                                {isSelected && (
                                  <span className="w-2.5 h-2.5 bg-primary rounded-full flex items-center justify-center border border-white" />
                                )}
                              </div>
                              <h4 className="font-semibold text-dark text-xs">{addr.name}</h4>
                              <div className="text-gray-500 space-y-0.5 leading-relaxed font-medium">
                                <p>{addr.street}</p>
                                <p>{addr.district}, {addr.state}</p>
                                <p>{addr.country} - {addr.zip}</p>
                                <p className="mt-1.5 block text-dark/70 font-semibold">Phone: {addr.phone}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Enter New Address details Form */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-dark/70 font-display block">
                          Recipient Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Enter recipient full name"
                          value={newAddressForm.name}
                          onBlur={() => handleBlurField('name')}
                          onChange={(e) => updateAddressFields({ name: e.target.value })}
                          className={`w-full border px-4 py-3 text-sm rounded-xl text-dark focus:outline-none font-sans bg-light-gray/10 transition-colors ${
                            touchedFields.name && addressErrors.name
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-border-gray/80 focus:border-primary'
                          }`}
                        />
                        {touchedFields.name && addressErrors.name && (
                          <span className="text-[10px] text-red-500 font-medium font-sans mt-1 block">{addressErrors.name}</span>
                        )}
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-dark/70 font-display block">
                          Street Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Enter house/flat no., street, area, landmark"
                          value={newAddressForm.street}
                          onBlur={() => handleBlurField('street')}
                          onChange={(e) => updateAddressFields({ street: e.target.value })}
                          className={`w-full border px-4 py-3 text-sm rounded-xl text-dark focus:outline-none font-sans bg-light-gray/10 transition-colors ${
                            touchedFields.street && addressErrors.street
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-border-gray/80 focus:border-primary'
                          }`}
                        />
                        {touchedFields.street && addressErrors.street && (
                          <span className="text-[10px] text-red-500 font-medium font-sans mt-1 block">{addressErrors.street}</span>
                        )}
                      </div>

                      {/* Cascaded Country -> State -> District dropdowns */}
                      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <SearchableDropdown
                            label="Country"
                            required
                            options={countryOptions}
                            value={newAddressForm.country}
                            hasError={!!(touchedFields.country && addressErrors.country)}
                            onChange={(val) => handleCountryChange(val)}
                          />
                          {touchedFields.country && addressErrors.country && (
                            <span className="text-[10px] text-red-500 font-medium font-sans mt-1 block">{addressErrors.country}</span>
                          )}
                        </div>

                        <div>
                          <SearchableDropdown
                            label="State"
                            required
                            options={stateOptions}
                            value={newAddressForm.state}
                            hasError={!!(touchedFields.state && addressErrors.state)}
                            onChange={(val) => handleStateChange(val)}
                            placeholder={newAddressForm.country ? "Select State" : "Choose Country first"}
                            disabled={!newAddressForm.country}
                          />
                          {touchedFields.state && addressErrors.state && (
                            <span className="text-[10px] text-red-500 font-medium font-sans mt-1 block">{addressErrors.state}</span>
                          )}
                        </div>

                        <div>
                          <SearchableDropdown
                            label="District"
                            required
                            options={districtOptions}
                            value={newAddressForm.district}
                            hasError={!!(touchedFields.district && addressErrors.district)}
                            onChange={(val) => handleDistrictChange(val)}
                            placeholder={newAddressForm.state ? "Select District" : "Choose State first"}
                            disabled={!newAddressForm.state}
                          />
                          {touchedFields.district && addressErrors.district && (
                            <span className="text-[10px] text-red-500 font-medium font-sans mt-1 block">{addressErrors.district}</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-xs font-semibold text-dark/70 font-display block">
                          ZIP / Postal Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Enter 6-digit pincode"
                          value={newAddressForm.zip}
                          onBlur={() => handleBlurField('zip')}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            updateAddressFields({ zip: val });
                          }}
                          inputMode="numeric"
                          maxLength={6}
                          className={`w-full border px-4 py-3 text-sm rounded-xl text-dark focus:outline-none font-sans bg-light-gray/10 transition-colors ${
                            touchedFields.zip && addressErrors.zip
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-border-gray/80 focus:border-primary'
                          }`}
                        />
                        {touchedFields.zip && addressErrors.zip && (
                          <span className="text-[10px] text-red-500 font-medium font-sans mt-1 block">{addressErrors.zip}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Payment Details */}
              <div className="bg-white border border-border-gray/30 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center gap-2 border-b border-border-gray/40 pb-4">
                  <CreditCard size={18} className="text-primary" />
                  <h2 className="text-base font-display font-semibold text-dark">3. Payment Method</h2>
                </div>

                {/* Payment Mode Selector */}
                <div className="border border-border-gray/50 rounded-2xl overflow-hidden divide-y divide-border-gray/40">
                  {isRazorpayEnabled && (
                    <div 
                      onClick={() => setPaymentMethod('razorpay')}
                      className={`p-5 transition-all cursor-pointer text-left ${
                        paymentMethod === 'razorpay' ? 'bg-primary/[0.02]' : 'bg-white hover:bg-slate-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all bg-white ${
                          paymentMethod === 'razorpay' ? 'border-primary ring-4 ring-primary/10' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'razorpay' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                        </div>
                        
                        <div className="flex-grow flex flex-wrap items-center justify-between gap-2">
                          <span className="font-display font-bold text-sm text-dark flex items-center gap-2">
                            <CreditCard size={16} className="text-primary" />
                            <span>Pay Online (UPI, Cards, NetBanking, Wallets)</span>
                          </span>
                          <span className="bg-primary/10 px-2 py-0.5 rounded text-[9px] font-semibold text-primary">Instant Verification</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {isCODEnabled && (
                    <div 
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-5 transition-all cursor-pointer text-left ${
                        paymentMethod === 'cod' ? 'bg-primary/[0.02]' : 'bg-white hover:bg-slate-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all bg-white ${
                          paymentMethod === 'cod' ? 'border-primary ring-4 ring-primary/10' : 'border-gray-300'
                        }`}>
                          {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                        </div>
                        
                        <div className="flex-grow flex flex-wrap items-center justify-between gap-2">
                          <span className="font-display font-bold text-sm text-dark flex items-center gap-2">
                            <Truck size={16} className="text-primary" />
                            <span>Cash on Delivery (COD)</span>
                          </span>
                          <span className="bg-emerald-50 text-emerald-750 border border-emerald-200/50 px-2 py-0.5 rounded text-[9px] font-semibold">Pay on Delivery</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isRazorpayEnabled && !isCODEnabled && (
                    <div className="p-5 bg-amber-50 text-amber-850 text-xs font-semibold text-center leading-relaxed">
                      ⚠️ No payment methods are currently enabled by the store administrator.
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-4 text-sm font-semibold tracking-wider uppercase rounded-full cursor-pointer flex justify-center items-center shadow-md focus:outline-none"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying & Processing...</span>
                      </span>
                    ) : (
                      <span>{paymentMethod === 'razorpay' ? `Pay ₹${total.toFixed(2)}` : 'Confirm COD Order'}</span>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {/* Right: Order Summary */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <div className="bg-white border border-border-gray/30 rounded-3xl p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-2 border-b border-border-gray/40 pb-4 mb-5">
                  <ShoppingBag size={18} className="text-primary" />
                  <h2 className="text-base font-display font-semibold text-dark">Bag Summary ({cart.reduce((s,i) => s + i.quantity, 0)})</h2>
                </div>

                {/* Items preview list */}
                <div className="divide-y divide-border-gray/30 border-b border-border-gray/40 pb-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.map((item) => (
                    <div key={`${item.product.id}-${item.selectedSize}`} className="py-3 flex gap-3 text-xs font-sans first:pt-0">
                      <div className="w-12 h-12 bg-light-gray rounded-lg overflow-hidden border border-border-gray/20 flex-shrink-0">
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="font-semibold text-dark truncate">{item.product.name}</h4>
                        <span className="text-[10px] text-gray-400 block mt-0.5">Size: {item.selectedSize} • Qty: {item.quantity}</span>
                      </div>
                      <span className="font-display font-bold text-dark">₹{(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Costs breakdown */}
                <div className="space-y-2 border-b border-border-gray/40 py-4 text-xs font-sans">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-dark">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {isShippingEnabled && (
                    <div className="flex justify-between text-gray-500">
                      <span>Logistics Shipping</span>
                      <span className="font-semibold text-dark">
                        {shipping === 0 ? <span className="text-emerald-600 font-bold uppercase text-[10px]">FREE</span> : `₹${shipping.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  {isTaxEnabled && (
                    <div className="flex justify-between text-gray-500">
                      <span>{settings.taxName || 'Sales Tax'} ({taxPercent}%)</span>
                      <span className="font-semibold text-dark">₹{tax.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 font-display text-dark">
                  <span className="font-bold text-sm uppercase tracking-wider">Order Total</span>
                  <span className="font-bold text-xl text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </Container>
      </main>

      {/* Full-Screen Verification Backdrop Loader */}
      {isVerifying && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white p-6 space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
            <ShieldCheck className="absolute text-emerald-400" size={32} />
          </div>
          <div className="text-center space-y-1.5 max-w-sm">
            <h3 className="text-xl font-bold font-display text-white">Verifying Payment Security</h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Verifying HMAC SHA-256 digital signature with Razorpay servers...
            </p>
            <p className="text-[11px] text-amber-400/90 font-mono pt-2 animate-pulse">
              Please do not refresh, click back, or close your browser tab.
            </p>
          </div>
        </div>
      )}

      {/* Google Pay / Paytm Style Success Animation Modal */}
      <PaymentSuccessModal
        isOpen={orderPlaced}
        orderNumber={orderId}
        totalAmount={confirmedTotal || total}
        paymentMethod={paymentMethod}
        transactionId={lastTransactionId}
        whatsappUrl={whatsappOrderUrl}
        onClose={() => setOrderPlaced(false)}
      />

      <Footer />
    </>
  );
};

export default Checkout;
