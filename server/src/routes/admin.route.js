const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyJWT, authorizeRoles } = require('../middleware/auth.middleware');

// Import Admin Controllers
const dashboardController = require('../controller/admin/dashboard.controller');
const productController = require('../controller/admin/product.controller');
const orderController = require('../controller/admin/order.controller');
const userController = require('../controller/admin/user.controller');
const shipmentController = require('../controller/admin/shipment.controller');

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/avif'];
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, PNG, WEBP, AVIF, and SVG images are allowed.'), false);
    }
  }
});

// Multer error handling wrapper to return JSON
const uploadSingleImage = (req, res, next) => {
  const uploadHandler = upload.single('image');
  uploadHandler(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

const uploadVideo = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024 // 30 MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, WebM, OGG, and QuickTime videos are allowed.'), false);
    }
  }
});

const uploadSingleVideo = (req, res, next) => {
  const uploadHandler = uploadVideo.single('video');
  uploadHandler(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Admin middleware - apply to all admin routes
router.use(verifyJWT, authorizeRoles('admin'));

// Dashboard endpoints
router.get('/dashboard', dashboardController.getDashboardStats);
router.get('/api-metrics', dashboardController.getApiMetrics);
router.post('/test-email', dashboardController.sendTestEmailAdmin);

// Settings endpoints
router.get('/settings', dashboardController.getSettings);
router.put('/settings', dashboardController.updateSettings);

// Notifications (Bell Icon)
router.get('/notifications', dashboardController.getNotifications);
router.put('/notifications/:id/read', dashboardController.markNotificationRead);
router.delete('/notifications', dashboardController.clearNotifications);

// Upload endpoints
router.post('/upload', uploadSingleImage, productController.uploadImage);
router.post('/upload-video', uploadSingleVideo, productController.uploadVideo);
router.post('/cloudinary/delete', productController.deleteCloudinaryAsset);

// Product CRUD endpoints
router.get('/products', productController.getAllProductsAdmin);
router.post('/products', productController.createProduct);
router.post('/products/:id/copy', productController.copyProduct);
router.put('/products/:id', productController.updateProduct);
router.patch('/products/:id/stock', productController.updateProductStock);
router.put('/products/:id/stock', productController.updateProductStock);
router.delete('/products/:id', productController.deleteProduct);

// Category CRUD endpoints
router.post('/categories', productController.createCategory);
router.put('/categories/:id', productController.updateCategory);
router.delete('/categories/:id', productController.deleteCategory);

// Order endpoints
router.get('/orders', orderController.getAllOrders);
router.put('/orders/bulk-status', orderController.bulkUpdateOrderStatus);
router.post('/orders/bulk-delete', orderController.bulkDeleteOrders);
router.get('/orders/:id', orderController.getOrderById);
router.put('/orders/:id/status', orderController.updateOrderStatus);
router.delete('/orders/:id', orderController.deleteOrder);

// Shiprocket Delivery endpoints
router.post('/orders/:id/create-shipment', shipmentController.createShipment);
router.get('/orders/:id/shipment', shipmentController.getShipmentDetails);
router.get('/orders/:id/couriers', shipmentController.getAvailableCouriers);
router.post('/orders/:id/generate-awb', shipmentController.generateAwb);
router.post('/orders/:id/generate-label', shipmentController.generateLabel);
router.post('/orders/:id/generate-manifest', shipmentController.generateManifest);
router.post('/orders/:id/schedule-pickup', shipmentController.schedulePickup);
router.post('/orders/:id/generate-invoice', shipmentController.generateInvoice);
router.post('/orders/:id/refresh-status', shipmentController.refreshStatus);
router.post('/orders/:id/cancel-shipment', shipmentController.cancelShipment);

// User endpoints
router.get('/users', userController.getAllUsers);
router.post('/users/bulk-delete', userController.bulkDeleteUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

module.exports = router;
