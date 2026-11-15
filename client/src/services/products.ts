import type { Product } from '../types';

import { API_BASE_URL } from '../config';

type ProductPayload = Record<string, any>;

const toNumber = (value: any, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toOptionalNumber = (value: any) => {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toArray = (value: any) => {
  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .map((item) => {
        if (typeof item === 'object' && item !== null && item.url) {
          return String(item.url);
        }
        return String(item);
      })
      .filter(Boolean);
  }
  return [];
};

export const normalizeProduct = (product: ProductPayload): Product => ({
  id: product._id || product.id,
  name: product.name || '',
  category: typeof product.category === 'object' && product.category ? product.category.name : (product.category || ''),
  categoryId: typeof product.category === 'object' && product.category ? (product.category._id || product.category.id) : (product.category || ''),
  description: product.description || '',
  rating: toNumber(product.rating, 0),
  reviewsCount: toNumber(product.reviewsCount, 0),
  price: toNumber(product.price, 0),
  oldPrice: toOptionalNumber(product.oldPrice),
  discount: toOptionalNumber(product.discount) ?? 0,
  image: product.image || '',
  hoverImage: product.hoverImage || product.image || '',
  images: toArray(product.images),
  isBestSeller: Boolean(product.isBestSeller),
  isNew: Boolean(product.isNew ?? product.isNewArrival),
  ingredients: toArray(product.ingredients),
  benefits: toArray(product.benefits),
  status: product.status,
  stock: toOptionalNumber(product.stock),
  sku: product.sku,
  volume: product.volume || '50ml',
  video: product.video || '',
  descriptionBanners: toArray(product.descriptionBanners),
  directionOfUse: product.directionOfUse || '',
  additionalInfo: product.additionalInfo || '',
  whyLoveIt: toArray(product.whyLoveIt),
  isNewArrival: Boolean(product.isNewArrival ?? product.isNew),
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

export const normalizeProducts = (products: ProductPayload[] = []) => products.map(normalizeProduct);

export const fallbackProducts = [];

export const fetchPublicProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${API_BASE_URL}/products?limit=100`);

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  const data = await response.json();
  return normalizeProducts(Array.isArray(data.products) ? data.products : []);
};

export const fetchPublicProductById = async (id: string): Promise<Product | null> => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`);

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch product');
  }

  const data = await response.json();
  return data.product ? normalizeProduct(data.product) : null;
};
