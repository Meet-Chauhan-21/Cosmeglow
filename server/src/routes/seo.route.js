const express = require('express');
const router = express.Router();
const Product = require('../models/product.model');
const Category = require('../models/category.model');

// @desc    Generate dynamic XML Sitemap
// @route   GET /sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
  try {
    const clientUrl = process.env.CLIENT_URL || 'https://www.cosmeglow.com';
    const currentDate = new Date().toISOString();

    const [products, categories] = await Promise.all([
      Product.find({ status: 'active' }).select('_id updatedAt slug').lean(),
      Category.find({ isActive: true }).select('_id updatedAt slug').lean()
    ]);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    // Static Pages
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/shop', priority: '0.9', changefreq: 'daily' },
      { url: '/terms-and-conditions', priority: '0.3', changefreq: 'monthly' },
      { url: '/privacy-policy', priority: '0.3', changefreq: 'monthly' }
    ];

    staticPages.forEach((page) => {
      xml += `  <url>\n`;
      xml += `    <loc>${clientUrl}${page.url}</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Categories
    categories.forEach((cat) => {
      const catSlug = cat.slug || cat._id;
      const lastmod = cat.updatedAt ? new Date(cat.updatedAt).toISOString() : currentDate;
      xml += `  <url>\n`;
      xml += `    <loc>${clientUrl}/category/${catSlug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    // Products
    products.forEach((prod) => {
      const prodId = prod._id;
      const lastmod = prod.updatedAt ? new Date(prod.updatedAt).toISOString() : currentDate;
      xml += `  <url>\n`;
      xml += `    <loc>${clientUrl}/product/${prodId}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.85</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Generate Sitemap Error:', error);
    return res.status(500).send('Error generating sitemap');
  }
});

// @desc    Serve dynamic robots.txt
// @route   GET /robots.txt
router.get('/robots.txt', (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'https://www.cosmeglow.com';
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /checkout
Disallow: /profile

Sitemap: ${clientUrl}/sitemap.xml
`;
  res.header('Content-Type', 'text/plain');
  return res.status(200).send(robots);
});

module.exports = router;
