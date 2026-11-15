import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CartDrawer from './CartDrawer';
import WishlistDrawer from './WishlistDrawer';
import ProductModal from './ProductModal';
import Home from '../../pages/Home';

export const Layout: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return (
    <>
      <div
        className={isHome ? '' : 'fixed inset-0 -z-50 opacity-0 pointer-events-none'}
        aria-hidden={!isHome}
        inert={!isHome ? true : undefined}
      >
        <Home isActive={isHome} />
      </div>
      {!isHome && <Outlet />}
      <CartDrawer />
      <WishlistDrawer />
      <ProductModal />
    </>
  );
};

export default Layout;
