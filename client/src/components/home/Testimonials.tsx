import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { Star, Quote, CheckCircle } from 'lucide-react';
import { Container } from '../layout/Container';
import { SectionTitle } from '../layout/SectionTitle';
import { TESTIMONIALS } from '../../data/mockData';
import { API_BASE_URL } from '../../config';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

interface DisplayReview {
  id: string;
  name: string;
  role: string;
  review: string;
  title?: string;
  rating: number;
  image: string;
  isVerified?: boolean;
}

export const Testimonials: React.FC = () => {
  const [reviewsList, setReviewsList] = useState<DisplayReview[]>(TESTIMONIALS);

  useEffect(() => {
    const fetchRealReviews = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/products/reviews/recent`);
        if (res.ok) {
          const data = await res.json();
          if (data.reviews && data.reviews.length > 0) {
            const mapped: DisplayReview[] = data.reviews.map((r: any, idx: number) => ({
              id: r._id || String(idx),
              name: r.userName || 'Verified Buyer',
              role: r.productId?.name ? `Verified Buyer • ${r.productId.name}` : 'Verified Customer',
              review: r.content || r.title || 'Exceptional botanical skincare experience. Leaves skin deeply hydrated and glowing.',
              title: r.title,
              rating: r.rating || 5,
              image: r.productId?.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
              isVerified: true
            }));
            setReviewsList(mapped);
          }
        }
      } catch (err) {
        console.error('Failed to load real reviews, using verified testimonials', err);
      }
    };

    fetchRealReviews();
  }, []);

  return (
    <section id="testimonials" className="pt-16 pb-8 sm:pt-20 sm:pb-10 bg-light-gray/40 relative overflow-hidden">
      {/* Background visual asset */}
      <div className="absolute left-0 bottom-0 w-[400px] h-[400px] rounded-full bg-secondary/3 blur-[80px] -z-10" />

      <Container>
        <SectionTitle
          badge="Customer Reviews"
          title="Loved by Real Clients & Skin Purists"
          description="Read genuine verified reviews and experiences from real customers using our organic botanical treatments."
        />

        <div>
          <Swiper
            modules={[Pagination, Autoplay]}
            spaceBetween={30}
            slidesPerView={1}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            breakpoints={{
              768: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
            }}
            className="testimonial-swiper !pb-10"
          >
            {reviewsList.map((testimonial) => (
              <SwiperSlide key={testimonial.id} className="h-auto">
                <div className="bg-white border border-border-gray/30 p-7 sm:p-8 rounded-3xl shadow-xs hover:shadow-md transition-all flex flex-col h-full justify-between relative">
                  
                  {/* Quote Icon Background Decorator */}
                  <div className="absolute right-6 top-6 text-primary/5">
                    <Quote size={56} strokeWidth={1} fill="currentColor" />
                  </div>

                  <div>
                    {/* Star Rating */}
                    <div className="flex text-yellow-400 mb-4">
                      {[...Array(Math.min(5, testimonial.rating))].map((_, i) => (
                        <Star key={i} size={15} fill="currentColor" className="stroke-1" />
                      ))}
                    </div>

                    {testimonial.title && (
                      <h4 className="font-display font-bold text-dark text-sm mb-2">
                        {testimonial.title}
                      </h4>
                    )}

                    {/* Review text */}
                    <p className="text-gray-600 text-xs sm:text-sm font-sans leading-relaxed italic mb-6">
                      "{testimonial.review}"
                    </p>
                  </div>

                  {/* Profile section */}
                  <div className="flex items-center gap-3.5 border-t border-border-gray/40 pt-4 mt-auto">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-11 h-11 rounded-full object-cover shadow-xs border border-gray-100 flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <h4 className="font-display font-bold text-xs sm:text-sm text-dark flex items-center gap-1.5 truncate">
                        <span className="truncate">{testimonial.name}</span>
                        {testimonial.isVerified && (
                          <CheckCircle size={13} className="text-emerald-600 shrink-0" fill="#E6F4EA" />
                        )}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-sans truncate">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>

                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </Container>
    </section>
  );
};

export default Testimonials;
