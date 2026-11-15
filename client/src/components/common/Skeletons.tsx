import React from 'react';
import { Container } from '../layout/Container';

// Single category card skeleton
export const CategoryCardSkeleton: React.FC = () => (
  <div className="w-[145px] sm:w-[170px] md:w-[180px] lg:w-[190px] aspect-[3/4] rounded-2xl bg-slate-200/90 animate-pulse relative p-4 flex flex-col justify-end overflow-hidden shadow-2xs">
    <div className="w-16 h-2.5 bg-slate-300/80 rounded-md mb-2" />
    <div className="w-24 h-4 bg-slate-300/80 rounded-md mb-2" />
    <div className="w-20 h-2 bg-slate-300/80 rounded-md" />
  </div>
);

// Entire categories section skeleton
export const CategoriesSectionSkeleton: React.FC = () => (
  <section className="py-14 sm:py-20 bg-light-gray">
    <Container>
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <div className="w-24 h-5 bg-slate-200 rounded-full mx-auto animate-pulse" />
        <div className="w-72 sm:w-96 h-8 bg-slate-200 rounded-lg mx-auto animate-pulse" />
        <div className="w-64 sm:w-80 h-4 bg-slate-200 rounded mx-auto animate-pulse" />
      </div>
      <div className="flex flex-wrap justify-center gap-4 sm:gap-5">
        {[...Array(6)].map((_, i) => (
          <CategoryCardSkeleton key={i} />
        ))}
      </div>
    </Container>
  </section>
);

// Single product card skeleton
export const ProductCardSkeleton: React.FC = () => (
  <div className="flex flex-col h-full bg-white relative w-full sm:w-[280px] md:w-[300px] lg:w-[230px] xl:w-[270px] max-w-[320px] animate-pulse">
    <div className="aspect-[4/5] rounded-2xl bg-slate-200/80 mb-4 border border-slate-100" />
    <div className="space-y-2 px-1">
      <div className="w-16 h-2.5 bg-slate-200 rounded" />
      <div className="w-3/4 h-4 bg-slate-200 rounded" />
      <div className="w-24 h-3 bg-slate-200 rounded" />
      <div className="flex justify-between items-center pt-2">
        <div className="w-20 h-5 bg-slate-200 rounded" />
        <div className="w-10 h-8 bg-slate-200 rounded-lg" />
      </div>
    </div>
  </div>
);

// Entire featured products section skeleton
export const ProductsGridSkeleton: React.FC = () => (
  <section className="py-14 sm:py-20 bg-white">
    <Container>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
        <div className="space-y-2">
          <div className="w-20 h-5 bg-slate-200 rounded-full animate-pulse" />
          <div className="w-64 sm:w-80 h-8 bg-slate-200 rounded-lg animate-pulse" />
          <div className="w-56 h-4 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <div className="w-24 h-8 bg-slate-200 rounded-full animate-pulse" />
          <div className="w-24 h-8 bg-slate-200 rounded-full animate-pulse" />
          <div className="w-24 h-8 bg-slate-200 rounded-full animate-pulse" />
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-10">
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </Container>
  </section>
);

// Product block under banner skeleton
export const ProductBlockSkeleton: React.FC = () => (
  <section className="py-8 sm:py-12 md:py-16 bg-white border-b border-border-gray/30">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-14 items-center animate-pulse">
        <div className="md:col-span-6 space-y-4">
          <div className="aspect-square sm:aspect-4/3 md:aspect-square rounded-2xl bg-slate-200" />
          <div className="flex gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-16 h-16 rounded-xl bg-slate-200" />
            ))}
          </div>
        </div>
        <div className="md:col-span-6 space-y-4">
          <div className="w-28 h-5 bg-slate-200 rounded-full" />
          <div className="w-3/4 h-8 bg-slate-200 rounded-lg" />
          <div className="w-40 h-4 bg-slate-200 rounded" />
          <div className="w-full h-16 bg-slate-200 rounded-lg" />
          <div className="w-36 h-7 bg-slate-200 rounded" />
          <div className="flex gap-4 pt-4">
            <div className="w-32 h-11 bg-slate-200 rounded-xl" />
            <div className="w-32 h-11 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

// Best Seller / Spotlight Formulation section skeleton
export const BestSellerSkeleton: React.FC = () => (
  <section className="py-14 sm:py-20 bg-light-gray relative overflow-hidden">
    <Container>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center animate-pulse">
        <div className="lg:col-span-6">
          <div className="aspect-square sm:aspect-4/3 lg:aspect-square rounded-3xl bg-slate-200" />
        </div>
        <div className="lg:col-span-6 space-y-5 lg:pl-6">
          <div className="w-36 h-4 bg-slate-200 rounded" />
          <div className="w-3/4 h-9 bg-slate-200 rounded-lg" />
          <div className="w-48 h-4 bg-slate-200 rounded" />
          <div className="w-full h-20 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-6 bg-slate-200 rounded" />
            <div className="h-6 bg-slate-200 rounded" />
            <div className="h-6 bg-slate-200 rounded" />
            <div className="h-6 bg-slate-200 rounded" />
          </div>
          <div className="w-40 h-10 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </Container>
  </section>
);

// General placeholder section skeleton
export const SectionSkeleton: React.FC = () => (
  <section className="py-14 sm:py-20 bg-white">
    <Container>
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="w-28 h-5 bg-slate-200 rounded-full mx-auto" />
        <div className="w-72 h-8 bg-slate-200 rounded-lg mx-auto" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <div className="h-40 bg-slate-100 rounded-2xl" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
          <div className="h-40 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    </Container>
  </section>
);
