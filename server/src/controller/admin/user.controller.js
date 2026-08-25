const User = require('../../models/user.model');
const Order = require('../../models/order.model');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 10000);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query).select('-password -refreshToken').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query)
    ]);

    // Get order count for each user
    const usersWithOrderCount = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ user: user._id });
        return {
          ...user.toObject(),
          orders: orderCount
        };
      })
    );

    return res.status(200).json({
      users: usersWithOrderCount,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Get Admin Users Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to fetch users.' });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user || user.role !== 'user') {
      return res.status(404).json({ message: 'User not found' });
    }

    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(10);
    const orderCount = await Order.countDocuments({ user: user._id });

    return res.status(200).json({
      user: {
        ...user.toObject(),
        orders: orderCount,
        recentOrders: orders
      }
    });
  } catch (error) {
    console.error('Get Admin User Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to fetch user.' });
  }
};

// @desc    Update user details
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
  try {
    const { name, email, phone, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email ? email.toLowerCase() : user.email;
    user.phone = phone || user.phone;
    user.role = role === 'admin' ? 'admin' : 'user';

    const updatedUser = await user.save();

    return res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update Admin User Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to update user.' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user.' });
    }
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete Admin User Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to delete user.' });
  }
};

// @desc    Bulk delete users
// @route   POST /api/admin/users/bulk-delete
// @access  Private/Admin
const bulkDeleteUsers = async (req, res) => {
  try {
    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'No users selected.' });
    }

    // Exclude any admin users from bulk deletion
    const result = await User.deleteMany({
      _id: { $in: userIds },
      role: { $ne: 'admin' }
    });

    return res.status(200).json({
      message: `Successfully deleted ${result.deletedCount} user(s).`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk Delete Users Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to delete users.' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  bulkDeleteUsers
};
