export interface Product {
  id: string;
  _id?: string;
  name: string;
  category: string;
  categoryId?: string;
  description: string;
  rating: number;
  reviewsCount: number;
  price: number;
  oldPrice?: number;
  discount?: number; // percentage, e.g., 15
  image: string;
  hoverImage: string;
  images?: string[];
  isBestSeller?: boolean;
  isNew?: boolean;
  isNewArrival?: boolean;
  ingredients?: string[];
  benefits?: string[];
  status?: 'active' | 'inactive' | string;
  stock?: number;
  sku?: string;
  volume?: string;
  video?: string;
  descriptionBanners?: string[];
  directionOfUse?: string;
  additionalInfo?: string;
  whyLoveIt?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  image: string;
  altText?: string;
  isActive?: boolean;
  sortOrder?: number;
  count: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  review: string;
  rating: number;
  image: string;
  isVerified?: boolean;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string; // matches name in lucide-react
}

export interface WhyChooseItem {
  id: string;
  title: string;
  description: string;
  icon: string; // matches name in lucide-react
}

export interface CountryData {
  name: string;
  code: string;
  states: {
    name: string;
    districts: string[];
  }[];
}

export interface AppSettings {
  email: string;
  whatsappNumber: string;
  themeColor: string;
  enableCreditCard: boolean;
  enableRazorpay?: boolean;
  razorpayKeyId?: string;
  enablePaypal: boolean;
  enableCOD: boolean;
  facebookAppId?: string;
  shopName?: string;
  address?: string;
  gstNumber?: string;
  logo?: string;
    homepageImages?: {
      spotlightProductId?: string;
      spotlight: string;
      spotlightName?: string;
      spotlightDescription?: string;
      spotlightPrice?: number;
      spotlightOldPrice?: number | null;
      about: {
        main: string;
        secondary: string;
      };
    };
    enableTax?: boolean;
    taxPercentage?: number;
    taxName?: string;
    enableDeliveryCharge?: boolean;
    deliveryCharge?: number;
    enableFreeDeliveryThreshold?: boolean;
    freeDeliveryThreshold?: number;
    banners?: string[];
    shopBanner?: string;
    shopBanners?: string[];
  }

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
}

export interface Address {
  _id?: string;
  name: string;
  phone: string;
  street: string;
  country: string;
  state: string;
  district: string;
  zip: string;
  isDefault?: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  selectedSize?: string;
}

export interface Order {
  _id?: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  shippingAddress?: Omit<Address, '_id'>;
  totals: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  payment?: {
    method: 'card' | 'cod' | 'razorpay' | string;
    status: 'Pending' | 'Paid' | 'Failed' | 'Cancelled' | 'Refunded' | string;
    transactionId?: string;
    paidAt?: string | Date;
    currency?: string;
    amount?: number;
    cardName?: string;
    cardLast4?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  };
  createdAt?: string;
  user?: User; // added optionally just in case some components reference it

  // Shiprocket Delivery Fields
  shipmentCreated?: boolean;
  shipmentId?: string;
  awbCode?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  courierName?: string;
  courierCompanyId?: string;
  labelUrl?: string;
  invoiceUrl?: string;
  deliveryStatus?: string;
  shiprocketResponse?: any;
  pickupScheduled?: boolean;
  manifestGenerated?: boolean;
  createdShipmentAt?: string;
  updatedShipmentAt?: string;
}

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  password?: string;
  addresses?: Address[];
  provider?: string;
}

