const Product = require('../models/product.model');
const Category = require('../models/category.model');
const mongoose = require('mongoose');
const { parseLineList, parseImageList } = require('../util/productFields.util');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getAllProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';

    let query = { status: 'active' };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        const foundCat = await Category.findOne({ $or: [{ slug: category }, { name: category }] });
        if (foundCat) {
          query.category = foundCat._id;
        } else {
          query.category = new mongoose.Types.ObjectId();
        }
      }
    }

    const [products, total] = await Promise.all([
      Product.find(query).populate('category').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(query)
    ]);

    return res.status(200).json({
      products,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Get Products Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to fetch products.' });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json({ product });
  } catch (error) {
    console.error('Get Product Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to fetch product.' });
  }
};

// @desc    Create product (Admin only)
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      price,
      oldPrice,
      discount,
      image,
      hoverImage,
      images,
      ingredients,
      isBestSeller,
      isNewArrival,
      stock,
      sku,
      status,
      volume,
      video,
      descriptionBanners,
      directionOfUse,
      additionalInfo,
      whyLoveIt
    } = req.body;

    if (!name || !category || !description || price === undefined || price === null || image === undefined || image === '' || stock === undefined || stock === null || sku === undefined || sku === '') {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: 'Invalid category selection.' });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Selected category does not exist.' });
    }

    const skuExists = await Product.findOne({ sku });
    if (skuExists) {
      return res.status(400).json({ message: 'SKU already exists.' });
    }

    const product = await Product.create({
      name,
      category,
      description,
      price,
      oldPrice: oldPrice || null,
      discount: discount || 0,
      image,
      hoverImage: hoverImage || (Array.isArray(images) && (images[1] && typeof images[1] === 'object' ? images[1].url : images[1])) || image,
      images: Array.isArray(images) ? images.filter(Boolean) : [],
      ingredients: ingredients || [],
      rating: 0,
      reviewsCount: 0,
      isBestSeller: isBestSeller || false,
      isNewArrival: isNewArrival || false,
      stock,
      sku,
      status: status || 'active',
      volume: volume || '50ml',
      video: video || '',
      descriptionBanners: parseImageList(descriptionBanners),
      directionOfUse: directionOfUse || '',
      additionalInfo: additionalInfo || '',
      whyLoveIt: parseLineList(whyLoveIt, req.body.whyLoveItText)
    });

    return res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to create product.' });
  }
};

// @desc    Update product (Admin only)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const {
      name,
      category,
      description,
      price,
      oldPrice,
      discount,
      image,
      hoverImage,
      images,
      ingredients,
      isBestSeller,
      isNewArrival,
      stock,
      sku,
      status,
      volume,
      video,
      descriptionBanners,
      directionOfUse,
      additionalInfo,
      whyLoveIt
    } = req.body;

    if (sku && sku !== product.sku) {
      const skuExists = await Product.findOne({ sku });
      if (skuExists) {
        return res.status(400).json({ message: 'SKU already exists.' });
      }
    }

    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({ message: 'Invalid category selection.' });
      }
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Selected category does not exist.' });
      }
    }

    product.name = name || product.name;
    product.category = category || product.category;
    product.description = description || product.description;
    product.price = price !== undefined ? price : product.price;
    product.oldPrice = oldPrice !== undefined ? oldPrice : product.oldPrice;
    product.discount = discount !== undefined ? discount : product.discount;
    product.image = image || product.image;
    product.hoverImage = hoverImage !== undefined ? hoverImage : product.hoverImage;
    product.images = Array.isArray(images) ? images.filter(Boolean) : product.images;
    product.ingredients = ingredients !== undefined ? (Array.isArray(ingredients) ? ingredients : [ingredients]) : product.ingredients;
    product.isBestSeller = isBestSeller !== undefined ? isBestSeller : product.isBestSeller;
    product.isNewArrival = isNewArrival !== undefined ? isNewArrival : product.isNewArrival;
    product.stock = stock !== undefined ? stock : product.stock;
    product.sku = sku || product.sku;
    product.status = status || product.status;
    product.volume = volume !== undefined ? volume : product.volume;
    product.video = video !== undefined ? video : product.video;
    if (descriptionBanners !== undefined) {
      product.descriptionBanners = parseImageList(descriptionBanners);
      product.markModified('descriptionBanners');
    }
    product.directionOfUse = directionOfUse !== undefined ? directionOfUse : product.directionOfUse;
    product.additionalInfo = additionalInfo !== undefined ? additionalInfo : product.additionalInfo;
    if (whyLoveIt !== undefined || req.body.whyLoveItText !== undefined) {
      product.whyLoveIt = parseLineList(whyLoveIt, req.body.whyLoveItText);
      product.markModified('whyLoveIt');
    }

    const updatedProduct = await product.save();

    return res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update Product Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to update product.' });
  }
};

// @desc    Delete product (Admin only)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to delete product.' });
  }
};

// @desc    Get all products for admin (including inactive)
// @route   GET /api/admin/products
// @access  Private/Admin
const getAllProductsAdmin = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 100);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const status = req.query.status || '';

    let query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        const foundCat = await Category.findOne({ $or: [{ slug: category }, { name: category }] });
        if (foundCat) {
          query.category = foundCat._id;
        } else {
          query.category = new mongoose.Types.ObjectId();
        }
      }
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const [products, total] = await Promise.all([
      Product.find(query).populate('category').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(query)
    ]);

    return res.status(200).json({
      products,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Get Admin Products Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to fetch products.' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin
};
