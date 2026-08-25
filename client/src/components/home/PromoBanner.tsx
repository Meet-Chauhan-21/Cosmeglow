import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import { Sparkles, Truck, Gift } from 'lucide-react';
import { Container } from '../layout/Container';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-fade';

interface PromoItem {
  icon: React.ReactNode;
  text: string;
  linkText: string;
  href: string;
}

export const PromoBanner: React.FC = () => {
  const promos: PromoItem[] = [
    {
      icon: <Sparkles size={16} className="text-primary flex-shrink-0" />,
      text: 'SEASON RENEWAL SALE — Enjoy 20% off all Targeted Serums. Use code: RENEW20',
      linkText: 'Shop Serums',
      href: '#shop',
    },
    {
      icon: <Truck size={16} className="text-primary flex-shrink-0" />,
      text: 'COMPLIMENTARY DELIVERY — Free express carbon-neutral shipping on all orders over ₹75.',
      linkText: 'Learn More',
      href: '#about',
    },
    {
      icon: <Gift size={16} className="text-primary flex-shrink-0" />,
      text: 'JOIN THE COSMEGLOW CIRCLE — Subscribe to our newsletter to receive double rewards points.',
      linkText: 'Subscribe',
      href: '#contact',
    },
  ];

  return (
    <section className="bg-accent-sage border-y border-accent-sage-dark py-3.5 sm:py-4 select-none overflow-hidden">
      <Container>
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          spaceBetween={30}
          slidesPerView={1}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          loop={true}
          className="promo-swiper h-6 flex items-center justify-center"
        >
          {promos.map((promo, idx) => (
            <SwiperSlide key={idx} className="flex items-center justify-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 text-primary text-xs sm:text-sm font-medium font-sans text-center px-4 w-full">
                {promo.icon}
                <span className="truncate sm:overflow-visible sm:whitespace-normal">
                  {promo.text}
                </span>
                <a
                  href={promo.href}
                  className="font-bold underline hover:text-primary-light transition-colors ml-1.5 inline-flex items-center gap-0.5 whitespace-nowrap"
                >
                  {promo.linkText} →
                </a>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </Container>
    </section>
  );
};

export default PromoBanner;
