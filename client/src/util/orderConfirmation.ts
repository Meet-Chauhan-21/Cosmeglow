import type { Order } from '../types';

/** What the thank-you page needs about the order that was just placed. */
export interface OrderConfirmation {
  order: Order;
  paymentMethod: 'razorpay' | 'cod';
  transactionId?: string;
}

const STORAGE_KEY = 'cg_last_order_confirmation';

/** Kept in sessionStorage so the thank-you page still works after a refresh. */
export const saveOrderConfirmation = (data: OrderConfirmation) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage blocked — router state still carries the data */
  }
};

export const loadOrderConfirmation = (): OrderConfirmation | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OrderConfirmation;
    return parsed?.order?.orderNumber ? parsed : null;
  } catch {
    return null;
  }
};
