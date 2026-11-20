import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Container } from './Container';
import logoImg from '../../images/logo.png';
import { useStore } from '../../context/StoreContext';

interface FooterLink {
  name: string;
  path: string;
}

const linkClass = 'text-white/60 hover:text-white transition-colors font-sans';

export const Footer: React.FC = () => {
  const { settings } = useStore();
  const location = useLocation();

  const phoneDigits = (settings.whatsappNumber || '').replace(/\D/g, '');
  const phoneWithCode = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;
  const phoneDisplay = phoneWithCode.startsWith('91') && phoneWithCode.length === 12
    ? `+91 ${phoneWithCode.slice(2)}`
    : settings.whatsappNumber;

  // Smooth-scroll when the target is on the page that is already open.
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (location.pathname !== '/') return;

    if (path === '/') {
      e.preventDefault();
      window.history.replaceState(window.history.state, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (path.startsWith('/#')) {
      const targetId = path.slice(2);
      const section = document.getElementById(targetId);
      if (section) {
        e.preventDefault();
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(window.history.state, '', `/#${targetId}`);
      }
    }
  };

  const renderLink = (link: FooterLink) => (
    <Link to={link.path} onClick={(e) => handleClick(e, link.path)} className={linkClass}>
      {link.name}
    </Link>
  );

  const companyLinks: FooterLink[] = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'About Us', path: '/#about' },
  ];

  const supportLinks: FooterLink[] = [
    { name: 'Contact Us', path: '/#contact' },
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Terms & Conditions', path: '/terms-conditions' },
  ];

  return (
    <footer className="bg-[#130F1A] text-white/90 pt-10 pb-8 border-t border-primary/20">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Column 1 - Brand Info */}
          <div className="md:col-span-2 flex flex-col items-start">
            <Link
              to="/"
              onClick={(e) => handleClick(e, '/')}
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

            <div className="select-none">
              <img src={settings.logo || logoImg} alt="CosmeGlow Logo" className="h-24 w-auto object-contain opacity-90" />
            </div>
          </div>

          {/* Column 2 - Company */}
          <div>
            <h4 className="font-display text-sm font-semibold tracking-wider uppercase mb-5 text-white">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              {companyLinks.map((link) => (
                <li key={link.name}>{renderLink(link)}</li>
              ))}
            </ul>
          </div>

          {/* Column 3 - Support */}
          <div>
            <h4 className="font-display text-sm font-semibold tracking-wider uppercase mb-5 text-white">
              Support
            </h4>
            <ul className="space-y-3 text-sm">
              {supportLinks.map((link) => (
                <li key={link.name}>{renderLink(link)}</li>
              ))}
              {settings.email && (
                <li className="text-white/60 font-sans pt-2.5 border-t border-white/10 mt-1">
                  <span className="block text-white/40 text-[9px] uppercase font-bold tracking-wider mb-0.5">Email</span>
                  <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors break-all">
                    {settings.email}
                  </a>
                </li>
              )}
              {phoneWithCode && (
                <li className="text-white/60 font-sans pt-1">
                  <span className="block text-white/40 text-[9px] uppercase font-bold tracking-wider mb-0.5">Mobile Number</span>
                  <a href={`tel:+${phoneWithCode}`} className="hover:text-white transition-colors">
                    {phoneDisplay}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
