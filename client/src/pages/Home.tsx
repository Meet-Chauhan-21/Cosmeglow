import SEO from '../components/common/SEO';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/home/Hero';
import PromoBanner from '../components/home/PromoBanner';
import Categories from '../components/home/Categories';
import BannerCarousel from '../components/home/BannerCarousel';
import FeaturedProducts from '../components/home/FeaturedProducts';
import BestSeller from '../components/home/BestSeller';
import WhyChooseUs from '../components/home/WhyChooseUs';
import Testimonials from '../components/home/Testimonials';
import Newsletter from '../components/home/Newsletter';
import Footer from '../components/layout/Footer';
import WhatsAppButton from '../components/layout/WhatsAppButton';

export const Home: React.FC = () => {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TREEBORN Skincare',
    url: 'https://www.treeborn.shop',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.treeborn.shop/shop?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: 'TREEBORN Skincare',
    url: 'https://www.treeborn.shop',
    logo: 'https://www.treeborn.shop/logo.png',
    image: 'https://www.treeborn.shop/og-image.png',
    description: "Unlock your skin's biological potential with TREEBORN's luxury organic, cruelty-free botanical skincare formulas."
  };

  return (
    <>
      <SEO
        title="TREEBORN — Organic Botanical Skincare & Cellular Restoration"
        description="Unlock your skin's biological potential with TREEBORN's luxury organic, cruelty-free botanical skincare formulas. Formulated for deep moisture, collagen restoration, and natural glow."
        keywords="treeborn, treeborn skincare, botanical skincare India, organic face serum, collagen serum, natural glow cream, vegan skincare brand, anti aging cream India, clear skin formula"
        jsonLd={[websiteSchema, storeSchema]}
      />

      <Navbar />
      <main>
        <Hero />
        <PromoBanner />
        <BannerCarousel />
        <Categories />
        <FeaturedProducts />
        <BestSeller />
        <WhyChooseUs />
        <Testimonials />
        <Newsletter />
      </main>
      <WhatsAppButton />
      <Footer />
    </>
  );
};

export default Home;
