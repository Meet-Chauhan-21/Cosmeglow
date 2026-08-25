const Product = require('../../models/product.model');
const Category = require('../../models/category.model');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary (in case it is used directly)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @desc    Get all products for admin
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

// @desc    Create product
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
      benefits,
      rating,
      reviewsCount,
      isBestSeller,
      isNewArrival,
      stock,
      sku,
      status,
      volume,
      video
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
      benefits: benefits || [],
      rating: rating !== undefined ? rating : 0,
      reviewsCount: reviewsCount !== undefined ? reviewsCount : 0,
      isBestSeller: isBestSeller || false,
      isNewArrival: isNewArrival || false,
      stock,
      sku,
      status: status || 'active',
      volume: volume || '50ml',
      video: video || ''
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

// @desc    Update product
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
      benefits,
      rating,
      reviewsCount,
      isBestSeller,
      isNewArrival,
      stock,
      sku,
      status,
      volume,
      video
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
    product.ingredients = ingredients || product.ingredients;
    product.benefits = benefits || product.benefits;
    product.rating = rating !== undefined ? rating : product.rating;
    product.reviewsCount = reviewsCount !== undefined ? reviewsCount : product.reviewsCount;
    product.isBestSeller = isBestSeller !== undefined ? isBestSeller : product.isBestSeller;
    product.isNewArrival = isNewArrival !== undefined ? isNewArrival : product.isNewArrival;
    product.stock = stock !== undefined ? stock : product.stock;
    product.sku = sku || product.sku;
    product.status = status || product.status;
    product.volume = volume !== undefined ? volume : product.volume;
    product.video = video !== undefined ? video : product.video;

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

// @desc    Quick update product stock
// @route   PATCH /api/admin/products/:id/stock
// @access  Private/Admin
const updateProductStock = async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || stock === null || Number.isNaN(Number(stock)) || Number(stock) < 0) {
      return res.status(400).json({ message: 'Valid non-negative stock number is required.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    product.stock = parseInt(stock, 10);
    const updatedProduct = await product.save();

    return res.status(200).json({
      message: `Stock updated to ${updatedProduct.stock} for "${updatedProduct.name}"`,
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update Product Stock Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to update stock.' });
  }
};

// @desc    Delete product
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

// @desc    Upload Single Image
// @route   POST /api/admin/upload
// @access  Private/Admin
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const folder = req.body.folder || 'CosmeGlow/products';

    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: folder,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary stream upload error:', error);
          return res.status(500).json({ message: 'Cloudinary upload failed', error: error.message });
        }
        return res.status(200).json({ 
          public_id: result.public_id,
          url: result.secure_url 
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload Endpoint Error:', error);
    return res.status(500).json({ message: 'Internal server upload error', error: error.message });
  }
};

// @desc    Upload Single Video
// @route   POST /api/admin/upload-video
// @access  Private/Admin
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: 'CosmeGlow/videos',
        resource_type: 'video'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary stream upload error:', error);
          return res.status(500).json({ message: 'Cloudinary upload failed', error: error.message });
        }
        return res.status(200).json({ 
          public_id: result.public_id,
          url: result.secure_url 
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload Video Endpoint Error:', error);
    return res.status(500).json({ message: 'Internal server upload error', error: error.message });
  }
};

// @desc    Delete Cloudinary Asset
// @route   POST /api/admin/cloudinary/delete
// @access  Private/Admin
const deleteCloudinaryAsset = async (req, res) => {
  try {
    const { public_id, resource_type } = req.body;
    if (!public_id) {
      return res.status(400).json({ message: 'public_id is required' });
    }

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type || 'image'
    });

    if (result.result === 'ok' || result.result === 'not found') {
      return res.status(200).json({ message: 'Asset deleted from Cloudinary', result });
    } else {
      return res.status(400).json({ message: 'Cloudinary deletion failed', result });
    }
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    return res.status(500).json({ message: 'Internal server deletion error', error: error.message });
  }
};

// @desc    Create Category
// @route   POST /api/admin/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, slug, image, altText, isActive, sortOrder } = req.body;
    if (!name || !slug || !image) {
      return res.status(400).json({ message: 'Name, slug, and image are required.' });
    }

    const nameExists = await Category.findOne({ name });
    if (nameExists) {
      return res.status(400).json({ message: 'Category name already exists.' });
    }

    const slugExists = await Category.findOne({ slug });
    if (slugExists) {
      return res.status(400).json({ message: 'Category slug already exists.' });
    }

    const category = await Category.create({
      name,
      slug,
      image,
      altText: altText || '',
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0
    });

    return res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    console.error('Admin Create Category Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to create category.' });
  }
};

// @desc    Update Category
// @route   PUT /api/admin/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { name, slug, image, altText, isActive, sortOrder } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    if (name && name !== category.name) {
      const nameExists = await Category.findOne({ name });
      if (nameExists) {
        return res.status(400).json({ message: 'Category name already exists.' });
      }
      category.name = name;
    }

    if (slug && slug !== category.slug) {
      const slugExists = await Category.findOne({ slug });
      if (slugExists) {
        return res.status(400).json({ message: 'Category slug already exists.' });
      }
      category.slug = slug;
    }

    category.image = image !== undefined ? image : category.image;
    category.altText = altText !== undefined ? altText : category.altText;
    category.isActive = isActive !== undefined ? isActive : category.isActive;
    category.sortOrder = sortOrder !== undefined ? Number(sortOrder) : category.sortOrder;

    const updated = await category.save();
    return res.status(200).json({ message: 'Category updated successfully', category: updated });
  } catch (error) {
    console.error('Admin Update Category Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to update category.' });
  }
};

// @desc    Delete Category
// @route   DELETE /api/admin/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res) => {
  try {
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category. It is currently linked to ${productCount} ${productCount === 1 ? 'product' : 'products'}.`
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }
    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Admin Delete Category Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to delete category.' });
  }
};

// @desc    Copy / Duplicate product
// @route   POST /api/admin/products/:id/copy
// @access  Private/Admin
const copyProduct = async (req, res) => {
  try {
    const originalProduct = await Product.findById(req.params.id);
    if (!originalProduct) {
      return res.status(404).json({ message: 'Product to copy not found.' });
    }

    // Generate unique SKU
    let newSku = `${originalProduct.sku}-copy`;
    let skuExists = await Product.findOne({ sku: newSku });
    let counter = 1;
    while (skuExists) {
      newSku = `${originalProduct.sku}-copy-${counter}`;
      skuExists = await Product.findOne({ sku: newSku });
      counter++;
    }

    // Clone the product document details
    const productData = originalProduct.toObject();
    delete productData._id;
    delete productData.createdAt;
    delete productData.updatedAt;

    productData.name = `Copy of ${originalProduct.name}`;
    productData.sku = newSku;
    // Set to inactive so that admin has to explicitly publish it (Hidden)
    productData.status = 'inactive';

    const copiedProduct = await Product.create(productData);
    
    // Populate category so it displays nicely in the list
    const populated = await Product.findById(copiedProduct._id).populate('category');

    return res.status(201).json({
      message: 'Product duplicated successfully',
      product: populated
    });
  } catch (error) {
    console.error('Copy Product Error:', error);
    return res.status(500).json({ message: 'Server error. Failed to duplicate product.' });
  }
};

module.exports = {
  getAllProductsAdmin,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  copyProduct,
  uploadImage,
  uploadVideo,
  deleteCloudinaryAsset,
  createCategory,
  updateCategory,
  deleteCategory
};
