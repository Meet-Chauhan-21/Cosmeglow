require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./src/config/db.config');
const userRoutes = require('./src/routes/user.route');
const orderRoutes = require('./src/routes/order.route');
const productRoutes = require('./src/routes/product.route');
const adminRoutes = require('./src/routes/admin.route');
const webhookRoutes = require('./src/routes/webhook.route');
const seoRoutes = require('./src/routes/seo.route');
const dns = require("dns");

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (Render, Vercel, Heroku, etc.)
app.set('trust proxy', 1);

// To Set Custom DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Connect to Database
connectDB();

// CORS configuration (allow credentials for HttpOnly cookie transfer)
const allowedOrigins = [
  'http://localhost:5173',
  'https://cosmeglow.vercel.app',
  'https://www.cosmeglow.com',
  'https://cosmeglow.com'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    // Check if the origin matches any allowed pattern or CLIENT_URL env
    if (allowedOrigins.includes(origin) || origin === process.env.CLIENT_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Standard Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'CosmeGlow Backend API is running successfully' });
});

const Settings = require('./src/models/settings.model');

const Category = require('./src/models/category.model');
const Product = require('./src/models/product.model');

// API Routes
app.use('/', seoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);

// Public Categories Configuration Endpoint
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    
    // Dynamically calculate the product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat._id, status: 'active' });
        return {
          id: cat._id,
          _id: cat._id,
          name: cat.name,
          slug: cat.slug,
          image: cat.image,
          altText: cat.altText,
          isActive: cat.isActive,
          sortOrder: cat.sortOrder,
          count: count
        };
      })
    );
    
    return res.status(200).json(categoriesWithCount);
  } catch (error) {
    console.error('Fetch Categories Error:', error);
    return res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Public Settings Configuration Endpoint
app.get('/api/settings', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    } else if (settings.whatsappNumber === '8905330954') {
      settings.whatsappNumber = '9023374410';
      await settings.save();
    }
    return res.status(200).json(settings);
  } catch (error) {
    console.error('Fetch Settings Error:', error);
    return res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    message: 'An unexpected error occurred on the server',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

const { startShipmentStatusSync } = require('./src/services/shipmentSync.service');

// Start listening
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  startShipmentStatusSync();
});
