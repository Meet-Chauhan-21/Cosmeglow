import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  PanelLeftClose,
  Sparkles,
  FileText,
  Folder,
  Image,
  ChevronDown,
  PlusCircle,
  List,
  Activity
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

interface SubMenuItem {
  label: string;
  path: string;
  icon: React.ComponentType<any>;
}

interface MenuItem {
  label: string;
  icon: React.ComponentType<any>;
  path?: string;
  defaultPath?: string;
  subItems?: SubMenuItem[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' }
    ]
  },
  {
    title: 'Catalog & Orders',
    items: [
      {
        label: 'Products',
        icon: Package,
        defaultPath: '/admin/products',
        subItems: [
          { label: 'All Products', path: '/admin/products', icon: List },
          { label: 'Add Product', path: '/admin/products/create', icon: PlusCircle },
          { label: 'Categories', path: '/admin/categories', icon: Folder }
        ]
      },
      { label: 'Orders', icon: ShoppingCart, path: '/admin/orders' }
    ]
  },
  {
    title: 'User Management',
    items: [
      { label: 'Users', icon: Users, path: '/admin/users' }
    ]
  },
  {
    title: 'Store Settings',
    items: [
      {
        label: 'Settings',
        icon: Settings,
        defaultPath: '/admin/settings',
        subItems: [
          { label: 'Store Information', path: '/admin/settings', icon: Settings },
          { label: 'Homepage Banners', path: '/admin/homepage-images', icon: Image },
          { label: 'API Integrations', path: '/admin/api-metrics', icon: Activity },
          { label: 'Legal Pages', path: '/admin/legal', icon: FileText }
        ]
      }
    ]
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const { settings } = useStore();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    menuSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.subItems) {
          const hasActiveSub = item.subItems.some(sub => location.pathname === sub.path);
          if (hasActiveSub) {
            initialState[item.label] = true;
          }
        }
      });
    });
    return initialState;
  });

  const logoUrl = settings?.logo || '/logo.png';

  // Auto-expand menus that contain active sub-items on mount or path change
  useEffect(() => {
    if (collapsed) return; // Keep clean when collapsed
    
    const newOpenState = { ...openMenus };
    let changed = false;

    menuSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.subItems) {
          const hasActiveSub = item.subItems.some(sub => location.pathname === sub.path);
          if (hasActiveSub && !openMenus[item.label]) {
            newOpenState[item.label] = true;
            changed = true;
          }
        }
      });
    });

    if (changed) {
      setOpenMenus(newOpenState);
    }
  }, [location.pathname, collapsed]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const isItemActive = (item: MenuItem) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    if (item.subItems) {
      return item.subItems.some((sub) => location.pathname === sub.path);
    }
    return false;
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#090D16] border-r border-slate-800/60 transition-all duration-300 z-30 flex flex-col justify-between shadow-xl ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <style>{`
        @keyframes submenuSlideDown {
          from {
            opacity: 0;
            max-height: 0px;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            max-height: 200px;
            transform: translateY(0);
          }
        }
        .animate-submenu {
          animation: submenuSlideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          overflow: hidden;
        }
      `}</style>

      <div className="flex flex-col h-full overflow-hidden">
        {/* Sidebar Header (Logo) */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700/40 bg-[#161D30] flex items-center justify-center p-1 shadow-sm flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="CosmeGlow Logo" className="w-full h-full object-contain" />
                ) : (
                  <Sparkles size={18} className="text-amber-400" />
                )}
              </div>
              <span className="text-base font-black font-display text-white tracking-tight">CosmeGlow</span>
            </div>
          )}
          {collapsed && (
            <div className="flex-1 flex justify-center">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700/40 bg-[#161D30] flex items-center justify-center p-1 shadow-sm">
                {logoUrl ? (
                  <img src={logoUrl} alt="CosmeGlow Logo" className="w-full h-full object-contain" />
                ) : (
                  <Sparkles size={18} className="text-amber-400" />
                )}
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 hover:bg-white/5 border border-slate-800 hover:border-slate-700 rounded-lg transition-all text-slate-400 hover:text-white cursor-pointer"
              title="Collapse Sidebar"
            >
              <PanelLeftClose size={14} />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {menuSections.map((section, sIndex) => {
            const hasVisibleItems = section.items.length > 0;
            if (!hasVisibleItems) return null;

            return (
              <div key={sIndex} className="space-y-1">
                {/* Section Header with bold separator line */}
                {!collapsed ? (
                  <div className="space-y-1">
                    {sIndex > 0 && <hr className="border-t border-slate-800/80 my-3.5 mx-2" />}
                    <div className="px-3 py-1.5">
                      <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-widest block font-display">
                        {section.title}
                      </span>
                    </div>
                  </div>
                ) : (
                  sIndex > 0 && <hr className="border-t border-slate-800/80 my-3 mx-2" />
                )}

                {/* Section Items */}
                <div className="space-y-1">
                  {section.items.map((item, iIndex) => {
                    const isActive = isItemActive(item);
                    const isMenuOpen = openMenus[item.label];

                    // If collapsed, clicking always navigates to default or path
                    const navigatePath = item.path || item.defaultPath || '#';

                    if (item.subItems && !collapsed) {
                      // Expandable group when NOT collapsed
                      return (
                        <div key={iIndex} className="space-y-0.5">
                          <button
                            onClick={() => toggleMenu(item.label)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer focus:outline-none ${
                              isActive
                                ? 'bg-white/[0.08] text-white font-bold border border-white/[0.12]'
                                : 'text-slate-400 hover:bg-white/[0.03] hover:text-white hover:translate-x-0.5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon
                                size={18}
                                className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200 transition-colors duration-200'}
                              />
                              <span className="text-xs font-semibold">{item.label}</span>
                            </div>
                            <ChevronDown
                              size={14}
                              className={`text-slate-500 transition-transform duration-200 ${
                                isMenuOpen ? 'rotate-180 text-white' : ''
                              }`}
                            />
                          </button>

                          {/* Sub-items list with smooth expand/collapse transition */}
                          <div 
                            className={`pl-3.5 space-y-1 border-l border-slate-800/80 ml-5 transition-all duration-300 ease-in-out overflow-hidden ${
                              isMenuOpen 
                                ? 'max-h-48 opacity-100 mt-1 mb-2 visible' 
                                : 'max-h-0 opacity-0 mt-0 mb-0 invisible pointer-events-none'
                            }`}
                          >
                            {item.subItems.map((sub, subIndex) => {
                              const isSubActive = location.pathname === sub.path;
                              return (
                                <Link
                                  key={subIndex}
                                  to={sub.path}
                                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] transition-all duration-200 group ${
                                    isSubActive
                                      ? 'text-white font-bold bg-white/[0.06] border border-white/[0.1]'
                                      : 'text-slate-400 hover:bg-white/[0.02] hover:text-white hover:translate-x-0.5'
                                  }`}
                                >
                                  <sub.icon
                                    size={12}
                                    className={isSubActive ? 'text-white' : 'text-slate-555 group-hover:text-slate-350 transition-colors duration-200'}
                                  />
                                  <span>{sub.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    // Standard link item (no submenus, or collapsed parent)
                    return (
                      <Link
                        key={iIndex}
                        to={navigatePath}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                          isActive
                            ? 'bg-white/[0.08] text-white font-semibold border border-white/[0.12] shadow-3xs'
                            : 'text-slate-400 hover:bg-white/[0.03] hover:text-white hover:translate-x-0.5'
                        } ${collapsed ? 'justify-center' : ''}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon
                          size={18}
                          className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200 transition-colors duration-200'}
                        />
                        {!collapsed && <span className="text-xs font-semibold">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
