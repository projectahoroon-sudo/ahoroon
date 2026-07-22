import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, Settings, Menu, X, Home, Package, LayoutGrid, Info, PhoneCall, Users, Heart, User } from 'lucide-react';
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
    { path: '/', label: 'Home', icon: Home },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/categories', label: 'Categories', icon: LayoutGrid },
    { path: '/about', label: 'About Us', icon: Info },
    { path: '/contact', label: 'Contact', icon: PhoneCall },
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
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
        {/* Main Navbar */}
        <nav id="top-nav-bar" className="px-4 md:px-8 py-3 flex items-center justify-between gap-3 md:gap-6 w-full max-w-7xl mx-auto">
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
              className={cn(
                "md:hidden p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border shadow-xs",
                isMobileMenuOpen 
                  ? "bg-[#005900] text-white border-[#005900] shadow-md" 
                  : "bg-emerald-50 text-[#005900] border-emerald-200/80 hover:bg-emerald-100/80 active:scale-95"
              )}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              <span className="text-xs font-black uppercase tracking-wider pr-0.5">মেণু</span>
            </button>
          </div>
        </nav>
      </header>

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
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
            />
            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 210 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-white shadow-2xl p-6 flex flex-col justify-between md:hidden overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <img 
                      src={siteLogo} 
                      alt="আহরোণ" 
                      className="h-9 w-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <span className="font-display font-black text-[#005900] text-lg">মেণু</span>
                  </div>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-1" role="menu">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3 mb-2 block">নেভিগেশন মেনু</span>
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    const Icon = link.icon;
                    return (
                      <Link
                        key={`drawer-${link.path}`}
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        role="menuitem"
                        className={cn(
                          "px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group",
                          isActive 
                            ? "bg-[#005900] text-white shadow-md shadow-emerald-900/10" 
                            : "text-slate-700 hover:bg-emerald-50 hover:text-[#005900]"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                            isActive ? "bg-white/20 text-white" : "bg-slate-100 text-emerald-700 group-hover:bg-emerald-100"
                          )}>
                            <Icon size={16} />
                          </div>
                          <span>{link.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Popular Categories inside Mobile Drawer */}
                {categories.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-3 mb-2.5 block">পপুলার ক্যাটাগরি</span>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.slice(0, 6).map((cat) => (
                        <Link
                          key={`drawer-cat-${cat.id}`}
                          to={`/category/${cat.id}`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 transition-colors text-xs font-bold text-slate-700 truncate"
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-emerald-500/20 bg-emerald-100 flex items-center justify-center text-[10px]">
                            {cat.image ? (
                              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <span className="font-extrabold text-emerald-700">#</span>
                            )}
                          </div>
                          <span className="truncate">{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Drawer Footer with Quick actions */}
              <div className="border-t border-slate-100 pt-5 space-y-3 mt-6">
                {isAdmin && (
                  <Link 
                    to="/admin" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full px-4.5 py-3 bg-[#005900]/10 text-[#005900] rounded-2xl text-xs font-black flex items-center justify-center gap-2 border border-[#005900]/20"
                  >
                    <Settings size={16} className="animate-spin-slow" />
                    <span>Admin Control Panel</span>
                  </Link>
                )}
                <div className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-widest">
                  © ২০২৬ আহরোণ • অর্গানিক ফুড
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

