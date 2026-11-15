import React from 'react';
import { Droplet, Trees, Recycle } from 'lucide-react';
import { Container } from '../layout/Container';
import { SectionTitle } from '../layout/SectionTitle';
import { WHY_CHOOSE_US } from '../../data/mockData';
import { useStore } from '../../context/StoreContext';

export const WhyChooseUs: React.FC = () => {
  const { settings } = useStore();
  const themeColor = settings?.themeColor || '#581C87';

  return (
    <section id="about" className="py-14 sm:py-20 bg-white relative overflow-hidden">
      <Container className="space-y-16 sm:space-y-24">
        
        {/* Core Editorial About Block - Content Left, Images Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Left Column: Editorial Copy */}
          <div className="lg:col-span-6 space-y-6 text-left order-2 lg:order-1">
            <div className="space-y-2.5">
              <span
                className="text-xs font-bold font-display uppercase tracking-widest px-3 py-1 rounded-full inline-block text-white shadow-2xs"
                style={{ backgroundColor: themeColor }}
              >
                About CosmeGlow
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-dark tracking-tight leading-tight">
                Crafting Skincare In Harmony With Nature's Intellect
              </h2>
            </div>

            <p className="text-gray-600 font-sans text-sm sm:text-base leading-relaxed">
              At CosmeGlow, we believe that true skin rejuvenation is an act of raw restoration. Our laboratory processes extracts from wild-harvested trees, organic flora, and active cellular compounds to stimulate biological renewal without synthetic fillers or chemical shortcuts.
            </p>

            <p className="text-gray-500 font-sans text-xs sm:text-sm leading-relaxed">
              Every formulation is balanced to reinforce your skin's natural moisture barrier, neutralize oxidative stressors, and deliver deep, biological hydration. We honor the Earth's apothecary to feed your skin's natural glow.
            </p>

            {/* List highlights - Styled dynamically with Store Theme Color */}
            <div className="space-y-4 pt-4">
              <div
                className="flex gap-4 items-start p-4 sm:p-5 rounded-2xl border text-white shadow-2xs"
                style={{ backgroundColor: themeColor, borderColor: `${themeColor}40` }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white flex-shrink-0 mt-0.5 border border-white/10 backdrop-blur-xs">
                  <Droplet size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-xs sm:text-sm text-white">Molecular Bio-Fractionation</h4>
                  <p className="text-[11px] text-white/85 font-sans leading-relaxed">We extract active botanical molecules at low temperatures to preserve their enzyme potency.</p>
                </div>
              </div>

              <div
                className="flex gap-4 items-start p-4 sm:p-5 rounded-2xl border text-white shadow-2xs"
                style={{ backgroundColor: themeColor, borderColor: `${themeColor}40` }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white flex-shrink-0 mt-0.5 border border-white/10 backdrop-blur-xs">
                  <Trees size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-xs sm:text-sm text-white">One Bottle, One Tree Program</h4>
                  <p className="text-[11px] text-white/85 font-sans leading-relaxed">For every premium botanical formulation purchased, we plant a native tree to offset carbon footprints.</p>
                </div>
              </div>

              <div
                className="flex gap-4 items-start p-4 sm:p-5 rounded-2xl border text-white shadow-2xs"
                style={{ backgroundColor: themeColor, borderColor: `${themeColor}40` }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white flex-shrink-0 mt-0.5 border border-white/10 backdrop-blur-xs">
                  <Recycle size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-xs sm:text-sm text-white">100% Zero-Waste Packaging</h4>
                  <p className="text-[11px] text-white/85 font-sans leading-relaxed">Our UV-protective glass jars and biodegradable cartons prevent active oxidation and eliminate plastic waste.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Overlapping Editorial Images */}
          <div className="lg:col-span-6 relative order-1 lg:order-2">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-light-gray border border-border-gray/30 shadow-md">
              <img
                src={settings.homepageImages?.about?.main || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop"}
                alt="Apothecary laboratory formulation"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            
            {/* Overlapping Secondary Image */}
            <div className="absolute -bottom-8 -left-8 w-1/2 aspect-square rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-light-gray hidden sm:block z-10">
              <img
                src={settings.homepageImages?.about?.secondary || "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=600&auto=format&fit=crop"}
                alt="Pure plant extracts"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Overlapping Info Card */}
            <div className="absolute -right-6 bottom-10 glassmorphism border border-white/60 p-4 sm:p-5 rounded-2xl shadow-lg max-w-[220px] z-10">
              <span className="text-2xl font-display font-bold text-primary block text-right">Est. 2024</span>
              <span className="text-[10px] text-gray-500 font-sans leading-relaxed block mt-1 text-right">
                Handcrafting cellular-active botanical products in Ahmedabad, Gujarat.
              </span>
            </div>
          </div>

        </div>

        {/* Divider border line */}
        <div className="w-full h-px bg-border-gray/40" />

        {/* Values Section List */}
        <div className="space-y-10 sm:space-y-12">
          <SectionTitle
            badge="Our Values"
            title="Pure Botanicals, Proven Outcomes"
            description="We prioritize safety, ethics, and ecological longevity. Every luxury formula is designed to honor both your skin and our planet."
            align="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {WHY_CHOOSE_US.map((item, idx) => (
              <div
                key={item.id}
                className="group p-6 sm:p-7 rounded-3xl bg-light-gray/30 border border-border-gray/40 hover:bg-primary transition-colors duration-300 flex flex-col h-full text-left relative overflow-hidden shadow-2xs hover:shadow-md cursor-default"
              >
                {/* Card Number 1,2,3,4 */}
                <span className="font-display font-bold text-4xl text-primary/30 group-hover:text-white/60 transition-colors duration-300 leading-none">
                  0{idx + 1}
                </span>

                <h3 className="font-display font-semibold text-lg text-dark group-hover:text-white transition-colors duration-300 mt-6 mb-3">
                  {item.title}
                </h3>
                
                <p className="text-gray-600 group-hover:text-white/80 text-xs sm:text-sm leading-relaxed font-sans transition-colors duration-300">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default WhyChooseUs;
