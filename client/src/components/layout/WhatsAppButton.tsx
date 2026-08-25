import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useStore } from '../../context/StoreContext';

export const WhatsAppButton: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const { products, settings } = useStore();

  // Determine message based on current page path
  const emojiHerb = '\uD83C\uDF3F';
  let message = `Hello CosmeGlow, I am interested in your products. Could you please assist me with my inquiry? Thank you! ${emojiHerb}`;

  if (path.startsWith('/product/')) {
    const productId = path.split('/product/')[1];
    const product = products.find((p) => p.id === productId);
    if (product) {
      message = `Hello, I am interested in purchasing ${product.name} - Rs. ${product.price.toFixed(2)}. Can you please help me with my order?`;
    }
  }

  const formatWhatsAppLink = (num: string) => {
    const cleanNum = num.replace(/\D/g, '');
    return cleanNum.length === 10 ? `91${cleanNum}` : cleanNum;
  };

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${formatWhatsAppLink(settings.whatsappNumber)}?text=${encodedMessage}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', delay: 1, damping: 15 }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-40 bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl hover:bg-[#20bd5a] transition-all flex items-center justify-center group cursor-pointer focus:outline-none"
      aria-label="Contact us on WhatsApp"
    >
      {/* WhatsApp SVG logo */}
      <svg
        className="w-7 h-7 fill-current flex-shrink-0"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662a11.81 11.81 0 005.707 1.456h.005c6.554 0 11.89-5.335 11.893-11.893 0-3.177-1.237-6.166-3.488-8.416"/>
      </svg>

      {/* Slide-out tooltip helper on hover (slides out to the left) */}
      <span className="absolute right-full mr-3 bg-white text-dark border border-border-gray/80 px-3 py-1.5 rounded-lg text-xs font-semibold font-display shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        Chat with CosmeGlow
      </span>
    </motion.a>
  );
};

export default WhatsAppButton;
