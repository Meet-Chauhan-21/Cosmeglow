const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required']
    },
    description: {
      type: String,
      required: [true, 'Product description is required']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    oldPrice: {
      type: Number,
      default: null,
      min: [0, 'Old price cannot be negative']
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    image: {
      type: String,
      required: [true, 'Product image is required']
    },
    hoverImage: {
      type: String,
      default: ''
    },
    images: {
      type: Array,
      default: []
    },
    ingredients: {
      type: [String],
      default: []
    },
    benefits: {
      type: [String],
      default: []
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    isBestSeller: {
      type: Boolean,
      default: false
    },
    isNewArrival: {
      type: Boolean,
      default: false
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    volume: {
      type: String,
      default: '100ml'
    },
    video: {
      type: String,
      default: ''
    },
    descriptionBanners: {
      type: [String],
      default: []
    },
    directionOfUse: {
      type: String,
      default: ''
    },
    additionalInfo: {
      type: String,
      default: ''
    },
    whyLoveIt: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
module.exports = Product;
