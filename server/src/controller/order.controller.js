const crypto = require('crypto');
const Order = require('../models/order.model');
const Settings = require('../models/settings.model');
const { sendOrderConfirmationEmail, sendAdminNewOrderEmail } = require('../util/email.util');

const ORDER_NUMBER_PREFIX = 'COSMEGLOW';

const generateOrderNumber = async () => {
  // Retry a few times to avoid collisions.
  for (let attempt = 0; attempt < 8; attempt++) {
    const generated = `${ORDER_NUMBER_PREFIX}-${Math.floor(1000 + Math.random() * 9000)}`;
    // eslint-disable-next-line no-await-in-loop
    const exists = await Order.findOne({ orderNumber: generated });
    if (!exists) return generated;
  }
  // Fallback (very low probability of collision).
  return `${ORDER_NUMBER_PREFIX}-${Date.now()}`;
};

const getRequiredAddressFields = () => ['name', 'phone', 'street', 'country', 'state', 'district', 'zip'];

const validateAddress = (shippingAddress) => {
  const required = getRequiredAddressFields();
  const missing = required.filter((f) => !shippingAddress || !shippingAddress[f]);
  return missing;
};

// @desc    Create a Razorpay Order
// @route   POST /api/users/orders/razorpay-create
// @access  Protected
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required.' });
    }

    const storeSettings = (await Settings.findOne()) || {};
    if (storeSettings.enableRazorpay === false) {
      return res.status(400).json({ message: 'Online payments via Razorpay are currently disabled by store administrator.' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TFHJjhLymJTyfs';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'r0EJomid7zHjRUt0GX3iB6Qf';

    const amountInPaise = Math.round(amount * 100);
    const receipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: { store: 'CosmeGlow Skincare' }
      })
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error(`Razorpay API Non-JSON Response (Status ${response.status}):`, responseText);
      return res.status(502).json({
        message: 'Razorpay Gateway is temporarily unavailable. Please try again in a few moments or select Cash on Delivery.'
      });
    }

    if (!response.ok) {
      console.error('Razorpay API Error Response:', data);
      return res.status(400).json({
        message: data.error?.description || data.message || 'Failed to create Razorpay order.'
      });
    }

    return res.status(200).json({
      razorpayOrderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId
    });
  } catch (error) {
    console.error('Create Razorpay Order Error:', error);
    return res.status(500).json({ message: 'Server error creating Razorpay order.' });
  }
};

// @desc    Create an order for the logged-in user
// @route   POST /api/users/orders
// @access  Protected
const createOrder = async (req, res) => {
  try {
    const userId = req.user?._id;
    const userEmail = req.user?.email;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { items, shippingAddress, paymentMethod, paymentDetails, totals } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Items are required.' });
    }

    const missingAddress = validateAddress(shippingAddress);
    if (missingAddress.length > 0) {
      return res.status(400).json({
        message: 'Please provide all required shipping fields.',
        missing: missingAddress
      });
    }

    if (!paymentMethod || !['card', 'cod', 'razorpay'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'paymentMethod must be "razorpay", "card", or "cod".' });
    }

    const storeSettings = (await Settings.findOne()) || {};
    if (paymentMethod === 'cod' && storeSettings.enableCOD === false) {
      return res.status(400).json({ message: 'Cash on Delivery (COD) is currently disabled by store administrator.' });
    }
    if (paymentMethod === 'razorpay' && storeSettings.enableRazorpay === false) {
      return res.status(400).json({ message: 'Razorpay online payments are currently disabled by store administrator.' });
    }

    if (!totals) return res.status(400).json({ message: 'Totals are required.' });

    const requiredTotals = ['subtotal', 'shipping', 'tax', 'total'];
    const missingTotals = requiredTotals.filter((k) => totals[k] === undefined || totals[k] === null || Number.isNaN(totals[k]));
    if (missingTotals.length > 0) {
      return res.status(400).json({ message: 'Invalid totals provided.', missing: missingTotals });
    }

    // Pre-validate product stock before proceeding
    const Product = require('../models/product.model');
    for (const item of items) {
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct) {
        return res.status(400).json({ message: `Product "${item.name}" was not found.` });
      }
      if (dbProduct.status !== 'active') {
        return res.status(400).json({ message: `Product "${dbProduct.name}" is currently inactive.` });
      }
      if (dbProduct.stock !== undefined && dbProduct.stock !== null && dbProduct.stock < item.quantity) {
        if (dbProduct.stock <= 0) {
          return res.status(400).json({ message: `Product "${dbProduct.name}" is out of stock.` });
        }
        return res.status(400).json({ message: `Insufficient stock for "${dbProduct.name}". Only ${dbProduct.stock} left in stock.` });
      }
    }

    let paymentData = {};

    // Strict Razorpay Signature Verification
    if (paymentMethod === 'razorpay') {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = paymentDetails || {};

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ message: 'Razorpay payment details missing.' });
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET || 'r0EJomid7zHjRUt0GX3iB6Qf';
      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        console.error('Razorpay Signature Verification Failed!');
        return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
      }

      // Duplicate Payment Protection: Prevent duplicate orders if callback or request is submitted multiple times
      const existingOrder = await Order.findOne({
        $or: [
          { 'payment.razorpayPaymentId': razorpayPaymentId },
          { 'payment.transactionId': razorpayPaymentId }
        ]
      });

      if (existingOrder) {
        console.warn(`Duplicate payment submission blocked for Razorpay Payment ID: ${razorpayPaymentId}`);
        return res.status(200).json({
          message: 'Order already processed for this payment.',
          order: existingOrder
        });
      }

      paymentData = {
        method: 'razorpay',
        status: 'Paid',
        transactionId: razorpayPaymentId,
        paidAt: new Date(),
        currency: 'INR',
        amount: totals.total,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      };
    } else if (paymentMethod === 'cod') {
      paymentData = {
        method: 'cod',
        status: 'Pending',
        transactionId: `COD-${Date.now()}`,
        paidAt: null,
        currency: 'INR',
        amount: totals.total
      };
    } else if (paymentMethod === 'card') {
      paymentData = {
        method: 'card',
        status: 'Paid',
        transactionId: `CARD-${Date.now()}`,
        paidAt: new Date(),
        currency: 'INR',
        amount: totals.total,
        cardName: paymentDetails?.cardName || '',
        cardLast4: paymentDetails?.cardLast4 || ''
      };
    }

    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      orderNumber,
      user: userId,
      items: items.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        selectedSize: i.selectedSize || '50ml'
      })),
      shippingAddress,
      payment: paymentData,
      totals: {
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        tax: totals.tax,
        total: totals.total
      },
      status: 'Pending'
    });

    // Create notification for admin
    try {
      const Notification = require('../models/notification.model');
      await Notification.create({
        type: 'new_order',
        title: paymentData.status === 'Paid' ? 'New Paid Order Placed' : 'New COD Order Placed',
        message: `Order #${order.orderNumber} (${paymentData.method.toUpperCase()}) placed by ${shippingAddress.name} for ₹${totals.total.toFixed(2)}`,
        link: `/admin/orders/${order._id}`
      });
    } catch (notificationError) {
      console.error('Failed to create order notification:', notificationError);
    }

    // Handle stock decrement and low stock notification if applicable
    try {
      const Product = require('../models/product.model');
      const Notification = require('../models/notification.model');
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          if (product.stock !== undefined && product.stock !== null) {
            product.stock = Math.max(0, product.stock - item.quantity);
            await product.save();
            if (product.stock <= 10) {
              await Notification.create({
                type: 'low_stock',
                title: 'Low Stock Alert',
                message: `Product "${product.name}" has low stock (${product.stock} units remaining).`,
                link: `/admin/products/${product._id}`
              });
            }
          }
        }
      }
    } catch (stockError) {
      console.error('Failed to decrement stock / create low stock notification:', stockError);
    }

    // Send Emails (Customer Confirmation & Admin Alert)
    try {
      const settings = await Settings.findOne();
      const adminEmail = settings?.email || 'dabhisanjay901@gmail.com';
      
      if (userEmail) {
        await sendOrderConfirmationEmail(order, userEmail);
      }
      await sendAdminNewOrderEmail(order, adminEmail);
    } catch (emailError) {
      console.error('Failed to dispatch order emails:', emailError);
    }

    // Automatically push order to Shiprocket
    try {
      const shiprocketService = require('../services/shiprocket.service');
      if (process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD) {
        const parts = (shippingAddress.name || '').trim().split(/\s+/);
        const firstName = parts[0] || 'Customer';
        const lastName = parts.slice(1).join(' ') || '.';
        const pickupLocation = await shiprocketService.resolvePickupLocation(process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary');

        const pad = (num) => String(num).padStart(2, '0');
        const d = new Date(order.createdAt);
        const orderDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

        const shipPayload = {
          order_id: order.orderNumber,
          order_date: orderDateStr,
          pickup_location: pickupLocation,
          billing_customer_name: firstName,
          billing_last_name: lastName,
          billing_address: shippingAddress.street,
          billing_city: shippingAddress.district || shippingAddress.state,
          billing_pincode: shippingAddress.zip,
          billing_state: shippingAddress.state,
          billing_country: shippingAddress.country || 'India',
          billing_email: userEmail || 'customer@example.com',
          billing_phone: shippingAddress.phone || '9999999999',
          shipping_is_billing: true,
          order_items: order.items.map((item) => ({
            name: item.name,
            sku: item.productId,
            units: Number(item.quantity),
            selling_price: Number(item.price)
          })),
          payment_method: order.payment.method === 'cod' ? 'COD' : 'Prepaid',
          sub_total: Number(totals.subtotal),
          length: 15,
          breadth: 10,
          height: 10,
          weight: 0.5
        };

        console.log(`Auto-pushing order #${order.orderNumber} to Shiprocket...`);
        const shipRes = await shiprocketService.createAdhocOrder(shipPayload);
        if (shipRes && (shipRes.order_id || shipRes.shipment_id)) {
          order.shipmentCreated = true;
          order.shipmentId = String(shipRes.shipment_id || shipRes.response?.shipment_id || '');
          order.deliveryStatus = 'Draft';
          order.shiprocketResponse = shipRes;
          order.createdShipmentAt = new Date();
          order.updatedShipmentAt = new Date();
          await order.save();
          console.log(`Order #${order.orderNumber} successfully pushed to Shiprocket! Shipment ID: ${order.shipmentId}`);
        }
      }
    } catch (shipError) {
      console.error('Failed to auto-create Shiprocket order upon checkout:', shipError.message || shipError);
    }

    return res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to create order.' });
  }
};

// @desc    List orders for the logged-in user
// @route   GET /api/users/orders
// @access  Protected
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments({ user: userId })
    ]);

    return res.status(200).json({
      orders,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Get Orders Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to fetch orders.' });
  }
};

module.exports = {
  createRazorpayOrder,
  createOrder,
  getUserOrders
};


