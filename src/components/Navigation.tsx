import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, Settings, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import { SearchOverlay } from './SearchOverlay';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { adminService } from '../services/adminService';
import { CATEGORIES as STATIC_CATEGORIES } from '../data';
import { storeService } from '../services/storeService';
import { Category } from '../types';
import { CategoryIcon } from './CategoryIcon';

export const TopNav = () => {
  const { cartCount } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(STATIC_CATEGORIES);
  const [siteLogo, setSiteLogo] = useState<string>(
    localStorage.getItem('siteLogo') || ""
  );
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/products', label: 'Products' },
    { path: '/about', label: 'About Us' },
    { path: '/contact', label: 'Contact' },
  ];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isUserAdmin = await adminService.isAdmin();
        setIsAdmin(isUserAdmin);
      } else {
        setIsAdmin(false);
      }
    });

    // Load active firestore/local categories
    storeService.getCategories()
      .then(cats => {
        if (cats && cats.length > 0) {
          setCategories(cats);
        }
      })
      .catch(err => console.error("Error loading categories in TopNav:", err));

    // Load site setting for logo
    adminService.getSettings()
      .then(settings => {
        if (settings && settings.logoUrl) {
          setSiteLogo(settings.logoUrl);
        }
      })
      .catch(err => console.error("Error loading settings:", err));

    const handleLogoUpdate = () => {
      const newLogo = localStorage.getItem('siteLogo');
      if (newLogo) setSiteLogo(newLogo);
    };
    window.addEventListener('siteLogoUpdated', handleLogoUpdate);

    return () => {
      unsub();
      window.removeEventListener('siteLogoUpdated', handleLogoUpdate);
    };
  }, []);

  // Keyboard navigation for closing drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav id="top-nav-bar" className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-3.5 flex items-center justify-between gap-3 md:gap-6 w-full">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <img 
            src={siteLogo} 
            alt="আহরোণ" 
            className="h-10 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </Link>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-bold tracking-wide transition-colors relative py-2 px-1 group",
                  isActive ? "text-[#005900]" : "text-slate-600 hover:text-[#005900]"
                )}
              >
                <span>{link.label}</span>
                {/* Active Indicator Underline */}
                {isActive ? (
                  <motion.div 
                    layoutId="activeNavUnderline" 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#005900] rounded-full" 
                  />
                ) : (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#005900] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <Link to="/admin" className="px-3 py-2 md:px-4 md:py-2.5 text-primary hover:bg-primary/10 bg-primary/5 border border-primary/20 transition-all rounded-xl flex items-center gap-2 text-xs md:text-sm font-black mr-1 shadow-sm hover:scale-[1.02] active:scale-[0.98]">
              <Settings size={18} className="animate-spin-slow" />
              <span className="font-sans">Admin</span>
            </Link>
          )}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsSearchOpen(true)}
            className="p-2.5 md:p-2.5 text-gray-600 hover:text-primary transition-colors bg-gray-50 rounded-xl cursor-pointer"
            aria-label="Search products"
          >
            <Search size={18} className="md:w-[20px] md:h-[20px]" />
          </motion.button>
          
          <Link to="/cart" className="relative p-2.5 md:p-2.5 text-gray-600 hover:text-primary bg-gray-50 rounded-xl transition-all" aria-label="Open Cart">
            <ShoppingBag size={18} className="md:w-[20px] md:h-[20px]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-lg shadow-primary/30 ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Mobile Hamburger Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2.5 text-gray-600 hover:text-[#005900] hover:bg-slate-100 bg-gray-50 rounded-xl transition-all cursor-pointer"
            aria-expanded={isMobileMenuOpen}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay Back Drop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-xs md:hidden"
            />
            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 210 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-white shadow-2xl p-6 flex flex-col justify-between md:hidden"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <span className="font-display font-black text-[#005900] text-xl">আহরোণ</span>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5" role="menu">
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        role="menuitem"
                        className={cn(
                          "px-4.5 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                          isActive 
                            ? "bg-[#005900]/10 text-[#005900]" 
                            : "text-slate-600 hover:bg-slate-50 hover:text-[#005900]"
                        )}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Drawer Footer with Quick actions */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full px-4.5 py-3 bg-[#005900]/5 text-[#005900] rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-[#005900]/10"
                  >
                    <Settings size={14} className="animate-spin-slow" />
                    <span>Admin Control Panel</span>
                  </Link>
                )}
                <div className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest">
                  © ২০২৬ আহরোণ
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};


import { Home, LayoutGrid, Heart, User, ShoppingBag as BagIcon } from 'lucide-react';

export const BottomNav = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/categories', label: 'Explore', icon: LayoutGrid },
    { path: '/wishlist', label: 'Saved', icon: Heart },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white/90 backdrop-blur-xl border-t border-gray-100 px-6 py-3 md:hidden thumb-safe-bottom">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className="flex flex-row items-center gap-2 p-1 px-3 rounded-full transition-all duration-500"
            >
              <div className={cn(
                "p-2 rounded-[1.25rem] transition-all duration-300",
                isActive ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "text-gray-400"
              )}>
                <Icon size={20} />
              </div>
              <AnimatePresence>
                {isActive && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-xs font-bold tracking-tight text-primary overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

