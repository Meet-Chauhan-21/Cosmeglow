import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../layout/Container';
import { SectionTitle } from '../layout/SectionTitle';
import { useStore } from '../../context/StoreContext';

export const Categories: React.FC = () => {
  const { categories } = useStore();
  const activeCategories = categories.filter((c) => c.isActive);

  if (activeCategories.length === 0) {
    return null;
  }

  return (
    <section id="categories" className="py-14 sm:py-20 bg-light-gray">
      <Container>
        <SectionTitle
          badge="Shop by Category"
          title="Browse by Skin Concern & Category"
          description="Every skin is unique. Explore our cellular-level targeted treatments designed for specific skincare regimens."
        />

        <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
          {activeCategories.map((category) => (
            <Link
              to={`/shop?category=${encodeURIComponent(category.slug || category.name)}`}
              key={category.id || category._id}
              className="group relative block overflow-hidden rounded-2xl w-[145px] sm:w-[170px] md:w-[180px] lg:w-[190px] aspect-[3/4] bg-dark shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
            >
              {/* Image */}
              <img
                src={category.image}
                alt={category.altText || category.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-75"
                loading="lazy"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark/85 via-dark/20 to-transparent" />

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col justify-end text-white">
                <span className="text-[10px] text-white/90 font-bold font-display uppercase tracking-widest block mb-1 drop-shadow-sm">
                  {category.count} {category.count === 1 ? 'Product' : 'Products'}
                </span>
                <h3 className="font-display font-semibold text-base sm:text-lg tracking-tight drop-shadow-md">
                  {category.name}
                </h3>
                
                {/* Explore under line */}
                <div className="mt-2 flex items-center gap-1 text-[11px] font-sans text-white/80 group-hover:text-white transition-colors">
                  <span className="relative">
                    Explore Collection →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default Categories;
