import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from './Container';
import logoImg from '../../images/logo.png';
import { useStore } from '../../context/StoreContext';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { settings } = useStore();

  const formatWhatsAppLink = (num: string) => {
    const cleanNum = num.replace(/\D/g, '');
    return cleanNum.length === 10 ? `91${cleanNum}` : cleanNum;
  };

  const handleHashScroll = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (window.location.pathname === '/') {
      const targetId = path.replace('/#', '');
      const section = document.getElementById(targetId);
      if (section) {
        e.preventDefault();
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', '#' + targetId);
      }
    }
  };

  const renderLink = (link: { name: string; path: string }) => {
    if (link.path.startsWith('/#')) {
      return (
        <Link
          to={link.path}
          onClick={(e) => handleHashScroll(e, link.path)}
          className="text-white/60 hover:text-white transition-colors font-sans"
        >
          {link.name}
        </Link>
      );
    }
    if (link.path.startsWith('/')) {
      return (
        <Link
          to={link.path}
          className="text-white/60 hover:text-white transition-colors font-sans"
        >
          {link.name}
        </Link>
      );
    }
    return (
      <a
        href={link.path}
        className="text-white/60 hover:text-white transition-colors font-sans"
      >
        {link.name}
      </a>
    );
  };

  const categoryLinks = [
    { name: 'Cleansers', path: '/#shop' },
    { name: 'Toners', path: '/#shop' },
    { name: 'Serums', path: '/#shop' },
    { name: 'Moisturizers', path: '/#shop' },
    { name: 'Face Oils', path: '/#shop' },
    { name: 'Treatment Masks', path: '/#shop' },
  ];

  const companyLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop Collection', path: '/#shop' },
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Terms & Conditions', path: '/terms-conditions' },
    { name: 'My Profile', path: '/profile' },
  ];

  const supportLinks = [
    { name: 'Contact Us', path: '/#contact' },
    { name: 'Story & Origin', path: '/#about' },
    { name: 'FAQs', path: '/#about' },
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Terms & Conditions', path: '/terms-conditions' },
  ];

  return (
    <footer className="bg-[#130F1A] text-white/90 pt-10 pb-6 border-t border-primary/20">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-8">
          
          {/* Column 1 - Brand Info */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <Link
              to="/"
              className="font-display text-2xl font-bold tracking-widest text-white flex items-center gap-1.5 mb-5 focus:outline-none"
            >
              <span>COSME GLOW</span>
              <span className="h-1.5 w-1.5 rounded-full bg-secondary"></span>
            </Link>
            <p className="text-white/60 text-sm font-sans max-w-sm mb-6 leading-relaxed">
              Formulating botanical solutions with advanced cellular science. We offer biological, cruelty-free premium skincare designed to restore your natural glow.
            </p>
            <div className="flex items-center space-x-4 mb-6">
              <a
                href="https://www.instagram.com/cosmeglowskincare"
                target="_blank"
                rel="noreferrer"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/share/18rKR6dvJV/"
                target="_blank"
                rel="noreferrer"
                className="text-white/60 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
            </div>

            {/* Enlarge logo and position below social icons */}
            <div className="mb-4 select-none">
              <img src={settings.logo || logoImg} alt="CosmeGlow Logo" className="h-24 w-auto object-contain opacity-90" />
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-semibold text-white/50 font-sans">
              <span className="text-[10px] font-display font-semibold tracking-widest text-white/30 uppercase">CosmeGlow</span>
              <span className="text-white/20 select-none">|</span>
              <Link to="/terms-conditions" className="hover:text-white transition-colors">
                Terms & Conditions
              </Link>
              <span className="text-white/20 select-none">|</span>
              <Link to="/privacy-policy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Column 2 - Categories */}
          <div>
            <h4 className="font-display text-sm font-semibold tracking-wider uppercase mb-5 text-white">
              Category
            </h4>
            <ul className="space-y-3 text-sm">
              {categoryLinks.map((link) => (
                <li key={link.name}>
                  {renderLink(link)}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Company */}
          <div>
            <h4 className="font-display text-sm font-semibold tracking-wider uppercase mb-5 text-white">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  {renderLink(link)}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 - Support */}
          <div>
            <h4 className="font-display text-sm font-semibold tracking-wider uppercase mb-5 text-white">
              Support
            </h4>
            <ul className="space-y-3 text-sm">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  {renderLink(link)}
                </li>
              ))}
              <li className="text-white/60 font-sans pt-2.5 border-t border-white/10 mt-1">
                <span className="block text-white/40 text-[9px] uppercase font-bold tracking-wider mb-0.5">Email Support</span>
                <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors break-all">
                  {settings.email}
                </a>
              </li>
              <li className="text-white/60 font-sans pt-1">
                <span className="block text-white/40 text-[9px] uppercase font-bold tracking-wider mb-0.5">WhatsApp Support</span>
                <a 
                  href={`https://wa.me/${formatWhatsAppLink(settings.whatsappNumber)}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-white transition-colors"
                >
                  {settings.whatsappNumber.startsWith('+') || settings.whatsappNumber.startsWith('91') 
                    ? settings.whatsappNumber 
                    : `+91 ${settings.whatsappNumber}`}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider & Centered Copyright and Developer block */}
        <div className="border-t border-white/10 pt-6 flex flex-col items-center justify-center gap-2 text-center text-sm font-medium text-white/50 font-sans">
          <p>
            &copy; {currentYear} CosmeGlow Skincare. All rights reserved. Designed for pure restoration.
          </p>
          <p className="text-white/40 text-xs">
            Developed by{' '}
            <a
              href="https://revolixstudio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-primary-light transition-colors font-semibold"
            >
              Revolix Studio
            </a>{' '}
            —{' '}
            <a
              href="https://revolixstudio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 hover:text-primary-light transition-colors"
            >
              revolixstudio.com
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
