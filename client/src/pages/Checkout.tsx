import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/common/SEO';

import { ArrowLeft, CreditCard, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
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

import { API_BASE_URL } from '../config';

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
  const { user, placeOrder, loading, addAddress, accessToken } = useAuth();

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

  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const validateAddressForm = (form = newAddressForm) => {
    const errs: Record<string, string> = {};
    if (!form.name || form.name.trim().length < 2) {
      errs.name = 'Please enter recipient full name (min 2 letters)';
    }
    if (!form.street || form.street.trim().length < 5) {
      errs.street = 'Please enter full street address (min 5 characters)';
    }
    if (!form.country) {
      errs.country = 'Country selection is required';
    }
    if (!form.state) {
      errs.state = 'State selection is required';
    }
    if (!form.district) {
      errs.district = 'District selection is required';
    }
    const zipClean = form.zip.replace(/\D/g, '');
    if (!zipClean || zipClean.length !== 6) {
      errs.zip = 'ZIP / Pincode must be exactly 6 digits';
    }
    const phoneClean = form.phone.replace(/\D/g, '');
    if (!phoneClean || phoneClean.length !== 10) {
      errs.phone = 'Mobile phone number must be exactly 10 digits';
    } else if (!/^[6-9]/.test(phoneClean)) {
      errs.phone = 'Please enter a valid 10-digit mobile number starting with 6-9';
    }
    return errs;
  };

  const handleBlurField = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    const errs = validateAddressForm();
    setAddressErrors(errs);
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

  // Orders are created server-side and require auth
  React.useEffect(() => {
    if (loading) return;
    if (!user && !orderPlaced) {
      toast.error('Please sign in to place an order.');
      navigate('/login', { state: { from: '/checkout' } });
    }
  }, [user, loading, navigate, orderPlaced]);

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

  // Cascading Address Dropdowns for new addresses
  const countryOptions = locationData.map((c) => c.name);
  const selectedCountryObj = locationData.find((c) => c.name === newAddressForm.country);
  const stateOptions = selectedCountryObj ? selectedCountryObj.states.map((s) => s.name) : [];
  const selectedStateObj = selectedCountryObj?.states.find((s) => s.name === newAddressForm.state);
  const districtOptions = selectedStateObj ? selectedStateObj.districts : [];

  const handleCountryChange = (val: string) => {
    setNewAddressForm({
      ...newAddressForm,
      country: val,
      state: '',
      district: ''
    });
  };

  const handleStateChange = (val: string) => {
    setNewAddressForm({
      ...newAddressForm,
      state: val,
      district: ''
    });
  };

  const handleDistrictChange = (val: string) => {
    setNewAddressForm({
      ...newAddressForm,
      district: val
    });
  };

  const processOrderSuccess = async (result: any, shippingAddress: any, txId?: string) => {
    // Save the new address to the user's saved addresses
    if (useNewAddress && addAddress) {
      try {
        await addAddress(shippingAddress);
      } catch (addrErr) {
        console.error('Failed to save new address during checkout:', addrErr);
      }
    }

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
        zip: true,
        phone: true
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

    const shippingAddress = useNewAddress
      ? {
          name: newAddressForm.name,
          phone: newAddressForm.phone,
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
          image: settings.logo || 'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=200&auto=format&fit=crop',
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

      <main className="pt-28 pb-20 bg-light-gray/30 min-h-screen">
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
              
              {/* Step 1: Shipping Address */}
              <div className="bg-white border border-border-gray/30 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
                <div className="flex items-center gap-2 border-b border-border-gray/40 pb-4 justify-between flex-wrap">
                  <div className="flex items-center gap-2">
                    <Truck size={18} className="text-primary" />
                    <h2 className="text-base font-display font-semibold text-dark">Shipping Logistics Address</h2>
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
                        <label className="text-xs font-semibold text-dark/70 font-display">Recipient Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="Enter recipient full name"
                          value={newAddressForm.name}
                          onBlur={() => handleBlurField('name')}
                          onChange={(e) => {
                            const updated = { ...newAddressForm, name: e.target.value };
                            setNewAddressForm(updated);
                            if (touchedFields.name) setAddressErrors(validateAddressForm(updated));
                          }}
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
                        <label className="text-xs font-semibold text-dark/70 font-display">Street Address *</label>
                        <input
                          type="text"
                          required
                          placeholder="Enter house/flat no., street, area, landmark"
                          value={newAddressForm.street}
                          onBlur={() => handleBlurField('street')}
                          onChange={(e) => {
                            const updated = { ...newAddressForm, street: e.target.value };
                            setNewAddressForm(updated);
                            if (touchedFields.street) setAddressErrors(validateAddressForm(updated));
                          }}
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
                            onChange={(val) => {
                              handleCountryChange(val);
                              handleBlurField('country');
                            }}
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
                            onChange={(val) => {
                              handleStateChange(val);
                              handleBlurField('state');
                            }}
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
                            onChange={(val) => {
                              handleDistrictChange(val);
                              handleBlurField('district');
                            }}
                            placeholder={newAddressForm.state ? "Select District" : "Choose State first"}
                            disabled={!newAddressForm.state}
                          />
                          {touchedFields.district && addressErrors.district && (
                            <span className="text-[10px] text-red-500 font-medium font-sans mt-1 block">{addressErrors.district}</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-dark/70 font-display">ZIP / Postal Code *</label>
                        <input
                          type="text"
                          required
                          placeholder="Enter 6-digit pincode"
                          value={newAddressForm.zip}
                          onBlur={() => handleBlurField('zip')}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 6) {
                              const updated = { ...newAddressForm, zip: val };
                              setNewAddressForm(updated);
                              if (touchedFields.zip) setAddressErrors(validateAddressForm(updated));
                            }
                          }}
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

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-dark/70 font-display">Mobile Phone Number *</label>
                        <input
                          type="text"
                          required
                          placeholder="Enter 10-digit mobile number"
                          value={newAddressForm.phone}
                          onBlur={() => handleBlurField('phone')}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 10) {
                              const updated = { ...newAddressForm, phone: val };
                              setNewAddressForm(updated);
                              if (touchedFields.phone) setAddressErrors(validateAddressForm(updated));
                            }
                          }}
                          maxLength={10}
                          className={`w-full border px-4 py-3 text-sm rounded-xl text-dark focus:outline-none font-sans bg-light-gray/10 transition-colors ${
                            touchedFields.phone && addressErrors.phone
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-border-gray/80 focus:border-primary'
                          }`}
                        />
                        {touchedFields.phone && addressErrors.phone && (
                          <span className="text-[10px] text-red-500 font-medium font-sans mt-1 block">{addressErrors.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Payment Details */}
              <div className="bg-white border border-border-gray/30 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center gap-2 border-b border-border-gray/40 pb-4">
                  <CreditCard size={18} className="text-primary" />
                  <h2 className="text-base font-display font-semibold text-dark">Payment Method</h2>
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
                      
                      {paymentMethod === 'razorpay' && (
                        <div className="mt-4 pl-8 space-y-3 animate-fade-in-up">
                          <p className="text-xs text-gray-500 font-sans leading-relaxed">
                            Clicking <strong>Pay & Place Order</strong> opens the official Razorpay Checkout popup. Your payment is verified securely before order confirmation.
                          </p>
                          <div className="flex flex-wrap gap-2 text-[9px] font-medium text-gray-500">
                            <span className="bg-white border border-gray-200 px-2 py-0.5 rounded">UPI / GPay / PhonePe</span>
                            <span className="bg-white border border-gray-200 px-2 py-0.5 rounded">Visa / Mastercard / RuPay</span>
                            <span className="bg-white border border-gray-200 px-2 py-0.5 rounded">NetBanking</span>
                          </div>
                        </div>
                      )}
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
                      
                      {paymentMethod === 'cod' && (
                        <div className="mt-4 pl-8 space-y-2 animate-fade-in-up">
                          <p className="text-xs text-gray-500 font-sans leading-relaxed">
                            You will pay the total amount of <strong className="text-primary font-bold">₹{total.toFixed(2)}</strong> in cash or via mobile UPI QR scan to the courier agent upon arrival.
                          </p>
                        </div>
                      )}
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
                      <span>{paymentMethod === 'razorpay' ? `Pay ₹${total.toFixed(2)} via Razorpay` : 'Confirm COD Order'}</span>
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
