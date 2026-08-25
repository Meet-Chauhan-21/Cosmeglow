import React from 'react';
import { motion } from 'framer-motion';
import { Droplet, Trees, Recycle } from 'lucide-react';
import { Container } from '../layout/Container';
import { SectionTitle } from '../layout/SectionTitle';
import { WHY_CHOOSE_US } from '../../data/mockData';
import { useStore } from '../../context/StoreContext';

export const WhyChooseUs: React.FC = () => {
  const { settings } = useStore();
  const themeColor = settings?.themeColor || '#581C87';

  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      {/* Dynamic brand graphic blur shapes */}
      <div
        className="absolute left-0 top-1/4 w-[300px] h-[300px] rounded-full blur-[100px] -z-10 opacity-20 transition-all duration-500"
        style={{ backgroundColor: themeColor }}
      />
      <div
        className="absolute right-0 bottom-1/4 w-[250px] h-[250px] rounded-full blur-[100px] -z-10 opacity-15 transition-all duration-500"
        style={{ backgroundColor: themeColor }}
      />

      <Container className="space-y-24">
        
        {/* Core Editorial About Block - Content Left, Images Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Editorial Copy */}
          <div className="lg:col-span-6 space-y-6 text-left order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-2.5"
            >
              <span
                className="text-xs font-bold font-display uppercase tracking-widest px-3 py-1 rounded-full inline-block text-white transition-all duration-300 shadow-2xs"
                style={{ backgroundColor: themeColor }}
              >
                About CosmeGlow
              </span>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-dark tracking-tight leading-tight">
                Crafting Skincare In Harmony With Nature's Intellect
              </h2>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-gray-600 font-sans text-sm sm:text-base leading-relaxed"
            >
              At CosmeGlow, we believe that true skin rejuvenation is an act of raw restoration. Our laboratory processes extracts from wild-harvested trees, organic flora, and active cellular compounds to stimulate biological renewal without synthetic fillers or chemical shortcuts.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-gray-500 font-sans text-xs sm:text-sm leading-relaxed"
            >
              Every formulation is balanced to reinforce your skin's natural moisture barrier, neutralize oxidative stressors, and deliver deep, biological hydration. We honor the Earth's apothecary to feed your skin's natural glow.
            </motion.p>

            {/* List highlights - Styled dynamically with Store Theme Color */}
            <div className="space-y-4 pt-4">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex gap-4 items-start p-4 sm:p-5 rounded-2xl border text-white transition-all duration-300 shadow-2xs hover:scale-[1.01]"
                style={{ backgroundColor: themeColor, borderColor: `${themeColor}40` }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white flex-shrink-0 mt-0.5 border border-white/10 backdrop-blur-xs">
                  <Droplet size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-xs sm:text-sm text-white">Molecular Bio-Fractionation</h4>
                  <p className="text-[11px] text-white/85 font-sans leading-relaxed">We extract active botanical molecules at low temperatures to preserve their enzyme potency.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex gap-4 items-start p-4 sm:p-5 rounded-2xl border text-white transition-all duration-300 shadow-2xs hover:scale-[1.01]"
                style={{ backgroundColor: themeColor, borderColor: `${themeColor}40` }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white flex-shrink-0 mt-0.5 border border-white/10 backdrop-blur-xs">
                  <Trees size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-xs sm:text-sm text-white">One Bottle, One Tree Program</h4>
                  <p className="text-[11px] text-white/85 font-sans leading-relaxed">For every premium botanical formulation purchased, we plant a native tree to offset carbon footprints.</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex gap-4 items-start p-4 sm:p-5 rounded-2xl border text-white transition-all duration-300 shadow-2xs hover:scale-[1.01]"
                style={{ backgroundColor: themeColor, borderColor: `${themeColor}40` }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white flex-shrink-0 mt-0.5 border border-white/10 backdrop-blur-xs">
                  <Recycle size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-xs sm:text-sm text-white">100% Zero-Waste Packaging</h4>
                  <p className="text-[11px] text-white/85 font-sans leading-relaxed">Our UV-protective glass jars and biodegradable cartons prevent active oxidation and eliminate plastic waste.</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Column: Overlapping Editorial Images */}
          <div className="lg:col-span-6 relative order-1 lg:order-2">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-light-gray border border-border-gray/30 shadow-md">
              <img
                src={settings.homepageImages?.about?.main || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop"}
                alt="Apothecary laboratory formulation"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Overlapping Secondary Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute -bottom-8 -left-8 w-1/2 aspect-square rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-light-gray hidden sm:block z-10"
            >
              <img
                src={settings.homepageImages?.about?.secondary || "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=600&auto=format&fit=crop"}
                alt="Pure plant extracts"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Overlapping Info Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="absolute -right-6 bottom-10 glassmorphism border border-white/60 p-4 sm:p-5 rounded-2xl shadow-lg max-w-[220px] z-10"
            >
              <span className="text-2xl font-display font-bold text-primary block text-right">Est. 2024</span>
              <span className="text-[10px] text-gray-500 font-sans leading-relaxed block mt-1 text-right">
                Handcrafting cellular-active botanical products in Ahmedabad, Gujarat.
              </span>
            </motion.div>
          </div>

        </div>

        {/* Divider border line */}
        <div className="w-full h-px bg-border-gray/40" />

        {/* Values Section List - Numbers 1,2,3,4 with fill hover animation */}
        <div className="space-y-12">
          <SectionTitle
            badge="Our Values"
            title="Pure Botanicals, Proven Outcomes"
            description="We prioritize safety, ethics, and ecological longevity. Every luxury formula is designed to honor both your skin and our planet."
            align="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {WHY_CHOOSE_US.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group p-6 sm:p-7 rounded-3xl bg-light-gray/30 border border-border-gray/40 hover:bg-primary transition-all duration-500 flex flex-col h-full text-left relative overflow-hidden shadow-2xs hover:shadow-xl cursor-default"
              >
                {/* Visual ornament for slide-fill indicator (simulating premium hover depth) */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-[#1F7A4D]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

                {/* Card Number 1,2,3,4 */}
                <span className="font-display font-bold text-4xl text-primary/30 group-hover:text-accent-sage transition-colors duration-500 leading-none">
                  0{idx + 1}
                </span>

                <h3 className="font-display font-semibold text-lg text-dark group-hover:text-white transition-colors duration-500 mt-6 mb-3">
                  {item.title}
                </h3>
                
                <p className="text-gray-600 group-hover:text-white/80 text-xs sm:text-sm leading-relaxed font-sans transition-colors duration-500">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default WhyChooseUs;
