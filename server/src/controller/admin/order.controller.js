const mongoose = require('mongoose');
const Order = require('../../models/order.model');
const Notification = require('../../models/notification.model');
const User = require('../../models/user.model');

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    let limit = parseInt(req.query.limit || '50', 10);
    if (req.query.all === 'true' || limit >= 2000) {
      limit = Math.min(Math.max(limit, 1), 10000);
    } else {
      limit = Math.min(Math.max(limit, 1), 5000);
    }
    const skip = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const status = (req.query.status || '').trim();
    const date = (req.query.date || '').trim();

    let query = {};
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const matchingUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }]
      }).select('_id');
      const userIds = matchingUsers.map(u => u._id);

      query.$or = [
        { orderNumber: searchRegex },
        { 'shippingAddress.name': searchRegex },
        { 'shippingAddress.phone': searchRegex },
        { 'items.name': searchRegex },
        { user: { $in: userIds } }
      ];
    }

    if (status && status !== 'all') {
      query.status = { $regex: `^${status}$`, $options: 'i' };
    }

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const baseQuery = { ...query };
    delete baseQuery.status;

    const [orders, total, confirmedCount, pendingCount, revenueResult] = await Promise.all([
      Order.find(query).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(query),
      Order.countDocuments({ ...baseQuery, status: { $regex: '^Confirmed$', $options: 'i' } }),
      Order.countDocuments({ ...baseQuery, status: { $regex: '^Pending$', $options: 'i' } }),
      Order.aggregate([
        { $match: query },
        { $group: { _id: null, totalRevenue: { $sum: '$totals.total' } } }
      ])
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    return res.status(200).json({
      orders,
      total,
      confirmedCount,
      pendingCount,
      totalRevenue,
      page,
      limit
    });
  } catch (error) {
    console.error('Get Admin Orders Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to fetch orders.' });
  }
};

// @desc    Get order by ID
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error('Get Admin Order Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to fetch order.' });
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'Confirmed', 'Cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = status;
    const updatedOrder = await order.save();

    // Trigger notification if status changes to Cancelled
    if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
      try {
        await Notification.create({
          type: 'order_cancelled',
          title: 'Order Cancelled',
          message: `Order #${order.orderNumber} has been cancelled by administrator.`,
          link: `/admin/orders/${order._id}`
        });
      } catch (err) {
        console.error('Failed to create notification for cancelled order:', err);
      }
    }

    return res.status(200).json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to update order status.' });
  }
};

// @desc    Delete order
// @route   DELETE /api/admin/orders/:id
// @access  Private/Admin
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    let order = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findByIdAndDelete(id);
    }
    
    if (!order) {
      order = await Order.findOneAndDelete({ orderNumber: id });
    }

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Clean up notifications related to this order
    try {
      await Notification.deleteMany({
        $or: [
          { link: `/admin/orders/${order._id}` },
          { link: `/admin/orders/${order.orderNumber}` }
        ]
      });
    } catch (notifErr) {
      console.error('Failed to cleanup order notifications:', notifErr);
    }

    return res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete Order Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to delete order.' });
  }
};

// @desc    Bulk update order status
// @route   PUT /api/admin/orders/bulk-status
// @access  Private/Admin
const bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { orderIds, status } = req.body;
    const allowedStatuses = ['Pending', 'Confirmed', 'Cancelled'];

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'No orders selected.' });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status.' });
    }

    const validObjectIds = orderIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validObjectIds.length === 0) {
      return res.status(400).json({ message: 'Invalid order IDs provided.' });
    }

    const result = await Order.updateMany(
      { _id: { $in: validObjectIds } },
      { $set: { status } }
    );

    if (status === 'Cancelled') {
      try {
        const notifications = validObjectIds.map((id) => ({
          type: 'order_cancelled',
          title: 'Order Cancelled',
          message: `Order was cancelled by administrator during bulk update.`,
          link: `/admin/orders/${id}`
        }));
        await Notification.insertMany(notifications);
      } catch (notifErr) {
        console.error('Failed to create bulk cancellation notifications:', notifErr);
      }
    }

    return res.status(200).json({
      message: `Successfully updated status to ${status} for ${result.modifiedCount || validObjectIds.length} orders.`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk Update Order Status Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to bulk update order status.' });
  }
};

// @desc    Bulk delete orders
// @route   POST /api/admin/orders/bulk-delete
// @access  Private/Admin
const bulkDeleteOrders = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'No orders selected.' });
    }

    const validObjectIds = orderIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validObjectIds.length === 0) {
      return res.status(400).json({ message: 'Invalid order IDs provided.' });
    }

    const result = await Order.deleteMany({ _id: { $in: validObjectIds } });

    try {
      const notifLinks = validObjectIds.map((id) => `/admin/orders/${id}`);
      await Notification.deleteMany({ link: { $in: notifLinks } });
    } catch (notifErr) {
      console.error('Failed to cleanup bulk order notifications:', notifErr);
    }

    return res.status(200).json({
      message: `Successfully deleted ${result.deletedCount || validObjectIds.length} orders.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk Delete Orders Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to bulk delete orders.' });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  bulkUpdateOrderStatus,
  bulkDeleteOrders,
};
