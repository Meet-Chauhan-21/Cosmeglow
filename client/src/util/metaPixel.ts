import type { CartItem, Order, OrderItem, Product } from '../types';

/**
 * Meta Pixel e-commerce tracking — the ONLY place standard events are sent from.
 *
 * The pixel base code + `fbq('init')` live in index.html (with automatic
 * button-click detection turned off). Every event below is fired only after
 * the matching action has actually succeeded:
 *
 *   PageView         → every real route change (Layout)
 *   ViewContent      → product detail page loaded (ProductDetail)
 *   AddToCart        → product actually added to the cart (StoreContext.addToCart)
 *   InitiateCheckout → checkout page opened with a non-empty cart (Checkout)
 *   AddPaymentInfo   → Razorpay payment submitted successfully / COD order accepted (Checkout)
 *   Purchase         → order confirmed by the server (Checkout)
 *
 * Every event carries an `eventID`, so a server-side Conversions API (CAPI)
 * integration can be added later and deduplicated against these browser events.
 */

export const META_PIXEL_ID = '1118528594309235';
const CURRENCY = 'INR';

type Fbq = (...args: unknown[]) => void;

interface MetaContent {
  id: string;
  quantity: number;
  item_price: number;
}

interface LineItem {
  productId: string;
  quantity: number;
  price: number;
}

/**
 * The id Meta receives for a product. It must match the id used in the Meta
 * product catalog. Currently the product's database id (same as /product/:id).
 */
export const metaContentId = (productId: string): string => String(productId);

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

const getFbq = (): Fbq | null => {
  if (typeof window === 'undefined') return null;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof fbq === 'function' ? fbq : null;
};

const newEventId = (eventName: string) =>
  `${eventName}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;

const send = (eventName: string, params: Record<string, unknown> = {}, eventId?: string) => {
  const fbq = getFbq();
  if (!fbq) return;
  try {
    // trackSingle → only our pixel receives the event, even if another
    // pixel gets initialised on the page (e.g. by a GTM tag).
    fbq('trackSingle', META_PIXEL_ID, eventName, params, { eventID: eventId || newEventId(eventName) });
  } catch (err) {
    console.error(`[Meta Pixel] Failed to send ${eventName}`, err);
  }
};

// ---- Storage helpers (storage can be blocked in private mode) ----
const readStorage = (storage: Storage | undefined, key: string): string | null => {
  try {
    return storage ? storage.getItem(key) : null;
  } catch {
    return null;
  }
};

const writeStorage = (storage: Storage | undefined, key: string, value: string | null) => {
  try {
    if (!storage) return;
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {
    /* ignore */
  }
};

const session = typeof window !== 'undefined' ? window.sessionStorage : undefined;
const local = typeof window !== 'undefined' ? window.localStorage : undefined;

const INITIATE_CHECKOUT_KEY = 'cg_meta_initiate_checkout';
const PAYMENT_INFO_KEY = 'cg_meta_payment_info';
const PURCHASE_KEY = 'cg_meta_purchases';

// ---- Payload builders ----
/** Groups lines by content id (same product in two sizes → one entry). */
const buildContents = (lines: LineItem[]): MetaContent[] => {
  const byId = new Map<string, MetaContent>();
  lines.forEach((line) => {
    const quantity = Math.max(0, Math.floor(Number(line.quantity) || 0));
    if (!line.productId || quantity === 0) return;
    const id = metaContentId(line.productId);
    const existing = byId.get(id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      byId.set(id, { id, quantity, item_price: round2(line.price) });
    }
  });
  return Array.from(byId.values());
};

const multiItemPayload = (lines: LineItem[], value: number) => {
  const contents = buildContents(lines);
  return {
    content_ids: contents.map((c) => c.id),
    contents,
    content_type: 'product',
    value: round2(value),
    currency: CURRENCY,
    num_items: contents.reduce((sum, c) => sum + c.quantity, 0),
  };
};

const cartLines = (cart: CartItem[]): LineItem[] =>
  cart.map((item) => ({ productId: item.product.id, quantity: item.quantity, price: item.product.price }));

const orderLines = (items: OrderItem[]): LineItem[] =>
  items.map((item) => ({ productId: item.productId, quantity: item.quantity, price: item.price }));

// ---- Events ----

let lastPageViewPath: string | null = null;

/** PageView — once per real route change (same path twice in a row is ignored). */
export const trackPageView = (pathname: string) => {
  if (pathname === lastPageViewPath) return;
  lastPageViewPath = pathname;
  send('PageView');
};

let lastViewContentKey: string | null = null;

/**
 * ViewContent — product detail page only. `navigationKey` is the router
 * location key, so re-renders don't re-fire but a new visit does.
 */
export const trackViewContent = (product: Product, navigationKey: string) => {
  if (!product?.id) return;
  const key = `${product.id}|${navigationKey}`;
  if (key === lastViewContentKey) return;
  lastViewContentKey = key;

  const id = metaContentId(product.id);
  const price = round2(product.price);
  send('ViewContent', {
    content_ids: [id],
    content_type: 'product',
    content_name: product.name,
    contents: [{ id, quantity: 1, item_price: price }],
    value: price,
    currency: CURRENCY,
  });
};

/** AddToCart — call only after the cart actually changed, with the quantity really added. */
export const trackAddToCart = (product: Product, quantityAdded: number) => {
  const quantity = Math.floor(Number(quantityAdded) || 0);
  if (!product?.id || quantity <= 0) return;

  const id = metaContentId(product.id);
  const price = round2(product.price);
  send('AddToCart', {
    content_ids: [id],
    content_type: 'product',
    content_name: product.name,
    contents: [{ id, quantity, item_price: price }],
    value: round2(price * quantity),
    currency: CURRENCY,
  });
};

const cartSignature = (cart: CartItem[], value: number) =>
  cart
    .map((item) => `${item.product.id}:${item.selectedSize}:${item.quantity}`)
    .sort()
    .join('|') + `|${round2(value)}`;

/**
 * InitiateCheckout — checkout page opened with items. Refreshing the page or
 * re-opening checkout with the exact same cart does not fire it again.
 */
export const trackInitiateCheckout = (cart: CartItem[], value: number) => {
  if (!cart.length) return;
  const signature = cartSignature(cart, value);
  if (readStorage(session, INITIATE_CHECKOUT_KEY) === signature) return;
  writeStorage(session, INITIATE_CHECKOUT_KEY, signature);
  send('InitiateCheckout', multiItemPayload(cartLines(cart), value));
};

/**
 * AddPaymentInfo — payment details successfully submitted. `paymentRef` is a
 * unique reference for this payment (Razorpay payment id / COD order number).
 * No card, UPI or other payment credentials are ever sent.
 */
export const trackAddPaymentInfo = (cart: CartItem[], value: number, paymentRef: string) => {
  if (!cart.length || !paymentRef) return;
  if (readStorage(session, PAYMENT_INFO_KEY) === paymentRef) return;
  writeStorage(session, PAYMENT_INFO_KEY, paymentRef);
  send('AddPaymentInfo', multiItemPayload(cartLines(cart), value), `AddPaymentInfo.${paymentRef}`);
};

const readFiredPurchases = (): string[] => {
  try {
    const parsed = JSON.parse(readStorage(local, PURCHASE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Purchase — only for an order the server has created and confirmed.
 * Online orders must be Paid; COD orders count once they are created
 * (purchase policy: order creation, not cash collection).
 * Each order id is sent once, even after a refresh or revisit.
 */
export const trackPurchase = (order: Order | null | undefined) => {
  if (!order) return;
  const orderRef = order.orderNumber || order._id;
  if (!orderRef || !Array.isArray(order.items) || order.items.length === 0) return;

  const method = String(order.payment?.method || '').toLowerCase();
  const status = String(order.payment?.status || '').toLowerCase();
  const isConfirmed =
    method === 'cod' ? !['failed', 'cancelled', 'refunded'].includes(status) : status === 'paid';
  if (!isConfirmed) return;

  const fired = readFiredPurchases();
  if (fired.includes(orderRef)) return;
  writeStorage(local, PURCHASE_KEY, JSON.stringify([...fired, orderRef].slice(-50)));

  send(
    'Purchase',
    { ...multiItemPayload(orderLines(order.items), order.totals?.total ?? 0), order_id: orderRef },
    `Purchase.${orderRef}`
  );

  // The checkout is finished — a new checkout with the same items is a new initiation.
  writeStorage(session, INITIATE_CHECKOUT_KEY, null);
};
