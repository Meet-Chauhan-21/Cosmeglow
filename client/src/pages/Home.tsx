import React, { lazy, Suspense } from 'react';
import SEO from '../components/common/SEO';
import Navbar from '../components/layout/Navbar';
import SliderBanner from '../components/home/SliderBanner';
import ProductBlock from '../components/home/ProductBlock';
import Footer from '../components/layout/Footer';
import WhatsAppButton from '../components/layout/WhatsAppButton';
import { SectionSkeleton } from '../components/common/Skeletons';

const WhyChooseUs = lazy(() => import('../components/home/WhyChooseUs'));
const Testimonials = lazy(() => import('../components/home/Testimonials'));
const Newsletter = lazy(() => import('../components/home/Newsletter'));

interface HomeProps {
  isActive?: boolean;
}

export const Home: React.FC<HomeProps> = ({ isActive = true }) => {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CosmeGlow Skincare',
    url: 'https://www.cosmeglow.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.cosmeglow.com/shop?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: 'CosmeGlow Skincare',
    url: 'https://www.cosmeglow.com',
    logo: 'https://www.cosmeglow.com/logo.png',
    image: 'https://www.cosmeglow.com/og-image.png',
    description: "Unlock your skin's biological potential with CosmeGlow's luxury organic, cruelty-free botanical skincare formulas."
  };

  return (
    <>
      {isActive && (
        <SEO
          title="CosmeGlow — Organic Botanical Skincare & Cellular Restoration"
          description="Unlock your skin's biological potential with CosmeGlow's luxury organic, cruelty-free botanical skincare formulas. Formulated for deep moisture, collagen restoration, and natural glow."
          keywords="cosmeglow, cosmeglow skincare, botanical skincare India, organic face serum, collagen serum, natural glow cream, vegan skincare brand, anti aging cream India, clear skin formula"
          jsonLd={[websiteSchema, storeSchema]}
        />
      )}

      <Navbar />
      <main>
        <SliderBanner />
        <ProductBlock />

        <Suspense fallback={<SectionSkeleton />}>
          <WhyChooseUs />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <Testimonials />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <Newsletter />
        </Suspense>
      </main>

      <WhatsAppButton />
      <Footer />
    </>
  );
};

export default Home;
