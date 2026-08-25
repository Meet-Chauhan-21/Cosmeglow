import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

const PRODUCTION_DOMAIN = 'https://www.cosmeglow.com';

const getSiteUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
    return window.location.origin;
  }
  return PRODUCTION_DOMAIN;
};

export const ensureAbsoluteUrl = (url?: string): string => {
  if (!url) return `${getSiteUrl()}/og-image.png`;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${getSiteUrl()}${url}`;
  return `${getSiteUrl()}/${url}`;
};

const DEFAULT_TITLE = 'CosmeGlow — Organic Botanical Skincare & Cellular Restoration';
const DEFAULT_DESCRIPTION = 'Unlock your skin\'s biological potential with CosmeGlow\'s luxury organic, cruelty-free botanical skincare formulas. Formulated for deep moisture, collagen restoration, and natural glow.';
const DEFAULT_KEYWORDS = 'cosmeglow, cosmeglow skincare, organic skincare, botanical skincare India, face serum, collagen serum, natural glow cream, vegan skincare brand, anti aging cream India, organic skincare shop';

export const SEO: React.FC<SEOProps> = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogImage,
  ogType = 'website',
  jsonLd
}) => {
  const siteUrl = getSiteUrl();
  const pageUrl = canonical || (typeof window !== 'undefined' ? window.location.href : siteUrl);
  const absoluteOgImage = ensureAbsoluteUrl(ogImage || `${siteUrl}/og-image.png`);

  const fullTitle = title.includes('CosmeGlow') ? title : `${title} | CosmeGlow Skincare`;

  const defaultOrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CosmeGlow Skincare',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      'https://instagram.com/cosmeglowskincare',
      'https://facebook.com/cosmeglowskincare'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Gujarati', 'Hindi']
    }
  };

  const schemasToRender = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [defaultOrganizationSchema];

  return (
    <Helmet>
      {/* Primary Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <link rel="canonical" href={pageUrl} />

      {/* Favicons for Google Search & Tab */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:site_name" content="CosmeGlow Skincare" />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteOgImage} />
      <meta property="og:url" content={pageUrl} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteOgImage} />

      {/* JSON-LD Structured Data Schema */}
      {schemasToRender.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
