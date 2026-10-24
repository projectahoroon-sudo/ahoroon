import { 
  PRODUCTS as STATIC_PRODUCTS, 
  CATEGORIES as STATIC_CATEGORIES, 
  STATIC_SLIDERS, 
  PRODUCERS as FALLBACK_PRODUCERS, 
  PRESS_COVERAGES as FALLBACK_PRESS 
} from '../data';
import { ProductCard } from '../components/ProductCard';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Heart, 
  Star, 
  Users, 
  Sparkles, 
  Clock, 
  ArrowUpRight,
  TrendingUp,
  Award,
  Newspaper,
  ExternalLink,
  X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { storeService } from '../services/storeService';
import { adminService } from '../services/adminService';
import { safeGetItem } from '../lib/safeStorage';
import { Product, Category, SliderImage, Producer, PressCoverage } from '../types';
import { CategoryIcon } from '../components/CategoryIcon';
import { RecommendedProducts } from '../components/RecommendedProducts';
import { AharonVideoSection } from '../components/AharonVideoSection';
import { PremiumCategoryCard } from '../components/PremiumCategoryCard';

export default function Home() {
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>(() => {
    const cached = safeGetItem('products');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return STATIC_PRODUCTS;
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const cached = safeGetItem('categories');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return STATIC_CATEGORIES;
  });
  const [sliders, setSliders] = useState<SliderImage[]>(() => {
    const cached = safeGetItem('sliders');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return STATIC_SLIDERS;
  });
  const [producers, setProducers] = useState<Producer[]>(() => {
    const cached = safeGetItem('producers');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return FALLBACK_PRODUCERS;
  });
  const [press, setPress] = useState<PressCoverage[]>(() => {
    const cached = safeGetItem('press');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return FALLBACK_PRESS;
  });
  const [loading, setLoading] = useState(false);
  const [selectedPress, setSelectedPress] = useState<PressCoverage | null>(null);
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  
  // Carousel States
  const [activeSlide, setActiveSlide] = useState(0);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [p, c, s, pr, ps] = await Promise.all([
          storeService.getProducts(),
          storeService.getCategories(),
          adminService.getSliders().catch(() => []),
          adminService.getProducers().catch(() => []),
          adminService.getPress().catch(() => [])
        ]);
        
        if (p && p.length > 0) setProducts(p);
        if (c && c.length > 0) setCategories(c);
        if (s && s.length > 0) setSliders(s);
        if (pr && pr.length > 0) setProducers(pr);
        if (ps && ps.length > 0) setPress(ps);
      } catch (e) {
        console.error('Error fetching home data:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Hero Slider AutoPlay Logic
  useEffect(() => {
    if (sliders.length === 0 || isCarouselHovered) {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % sliders.length);
    }, 3000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [sliders, isCarouselHovered]);

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + sliders.length) % sliders.length);
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % sliders.length);
  };

  // Derive custom featured and popular indicators with clean UI fallbacks
  const featuredProducts = products.filter(p => p.isFeatured === true);
  const activeFeatured = featuredProducts.length > 0 
    ? featuredProducts 
    : products.filter((_, idx) => idx === 0 || idx === 2 || idx === 4);

  const popularProducts = products.filter(p => p.isPopular === true);
  const activePopular = popularProducts.length > 0 
    ? popularProducts 
    : products.filter((_, idx) => idx === 1 || idx === 3 || idx === 2);

  return (
    <div className="space-y-24 pb-24 overflow-x-hidden pt-4 bg-slate-50/50">
      
      {/* Hero Action Carousel Section */}
      {(sliders.length > 0 || loading) && (
      <section className="px-4 md:px-8 max-w-7xl mx-auto select-none">
        <div 
          onMouseEnter={() => setIsCarouselHovered(true)}
          onMouseLeave={() => setIsCarouselHovered(false)}
          className="relative w-full aspect-[16/9] xs:aspect-[2/1] md:aspect-[2.39/1] lg:h-[580px] xl:h-[620px] rounded-[1.25rem] sm:rounded-[2rem] md:rounded-[3.5rem] overflow-hidden group shadow-2xl bg-slate-900 border border-slate-100 flex items-center justify-center"
        >
          {loading && sliders.length === 0 ? (
            <div className="absolute inset-0 bg-slate-200 animate-pulse" />
          ) : (
            <>
              {/* Transition wrapper */}
              <AnimatePresence mode="wait">
                {sliders.map((slide, index) => {
                  if (index !== activeSlide) return null;
                  
                  const hasContent = slide.title && slide.title.trim().length > 0;
                  
                  return (
                    <motion.div
                      key={slide.id}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                      className="absolute inset-0 w-full h-full"
                    >
                      {/* Backdrop Cover Image */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent z-[2]" />
                      <img 
                        src={slide.imageUrl} 
                        alt={slide.title || "আহরোণ ক্যাম্পেইন"} 
                        className="w-full h-full object-cover brightness-100 object-center"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=1600&q=80';
                        }}
                      />

                      {/* Text Overlay - Only render if title is provided */}
                      {hasContent && (
                        <div className="absolute inset-0 z-[3] flex flex-col justify-end p-4 xs:p-6 sm:p-10 md:p-16 lg:p-20 text-white max-w-4xl">
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="w-fit bg-emerald-500/20 backdrop-blur-md px-2.5 py-1 md:px-4 md:py-1.5 rounded-full border border-emerald-500/30 text-emerald-300 text-[8px] sm:text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-1.5 sm:mb-3 md:mb-5 flex items-center gap-1.5"
                          >
                            <Sparkles size={10} className="text-emerald-400" />
                            <span>আহরোণ প্রিমিয়াম ক্যাম্পেইন</span>
                          </motion.div>

                          <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.5 }}
                            className="text-base xs:text-lg sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-black text-white leading-[1.25] md:leading-[1.15] mb-1 sm:mb-3 md:mb-5 tracking-tight font-sans drop-shadow-md"
                          >
                            {slide.title}
                          </motion.h2>

                          {slide.description && (
                            <motion.p
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.35 }}
                              className="text-white/85 text-[9px] xs:text-[11px] sm:text-xs md:text-base max-w-xl leading-relaxed mb-2.5 sm:mb-5 md:mb-8 font-light line-clamp-1 xs:line-clamp-2 md:line-clamp-none"
                            >
                              {slide.description}
                            </motion.p>
                          )}

                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            className="flex flex-wrap gap-2"
                          >
                            <Link 
                              to={slide.link || '/category/all'} 
                              className="bg-emerald-500 text-white px-3.5 py-1.5 sm:px-6 sm:py-3.5 rounded-lg sm:rounded-2xl font-bold text-[9px] sm:text-xs md:text-sm hover:bg-white hover:text-emerald-600 transition-all shadow-xl shadow-emerald-500/10 flex items-center gap-1 sm:gap-2 active:scale-95"
                            >
                              আসল স্বাদ দেখুন
                              <ArrowRight size={12} className="sm:w-4 sm:h-4" />
                            </Link>
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Left Arrow */}
              <button 
                onClick={handlePrevSlide}
                className="hidden md:flex absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-[5] w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 border border-white/15"
              >
                <ChevronLeft size={22} />
              </button>

              {/* Right Arrow */}
              <button 
                onClick={handleNextSlide}
                className="hidden md:flex absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-[5] w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 border border-white/15"
              >
                <ChevronRight size={22} />
              </button>

              {/* Dot indicators */}
              <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 sm:gap-2.5 bg-slate-950/40 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/10">
                {sliders.map((_, idx) => (
                  <button
                    key={`dot-${idx}`}
                    onClick={() => setActiveSlide(idx)}
                    className={cn(
                      "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300",
                      activeSlide === idx 
                        ? "bg-emerald-400 w-4 sm:w-6" 
                        : "bg-white/50 hover:bg-white"
                    )}
                  />
                ))}
              </div>

              {/* Progress bar ticker */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-[5]">
                <motion.div 
                  key={`bar-${activeSlide}`}
                  initial={{ width: '0%' }}
                  animate={{ width: isCarouselHovered ? '0%' : '100%' }}
                  transition={{ duration: 3, ease: 'linear' }}
                  className="h-full bg-emerald-400"
                />
              </div>
            </>
          )}
        </div>
      </section>
      )}

      {/* Circular Avatar Category Navigation Grid */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto my-8">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 sm:p-6 md:p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base sm:text-lg md:text-xl font-display font-black text-slate-800 tracking-tight">ক্যাটাগরি সমূহ</h2>
            </div>
            <Link 
              to="/categories" 
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>সবগুলো দেখুন</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div id="category-quick-grid" className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-5 md:gap-6 justify-items-center">
            {/* All Products Circular Button */}
            <Link
              to="/category/all"
              className="group flex flex-col items-center text-center select-none"
            >
              <div className={cn(
                "w-16 h-16 xs:w-20 xs:h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-full overflow-hidden relative flex items-center justify-center transition-all duration-300 border-2 shadow-sm group-hover:shadow-xl group-hover:scale-105 active:scale-95",
                location.pathname === '/category/all'
                  ? "bg-emerald-600 border-emerald-600 text-white ring-4 ring-emerald-500/30 shadow-lg"
                  : "bg-emerald-50 border-emerald-500/20 text-emerald-600 group-hover:border-emerald-500 group-hover:ring-4 group-hover:ring-emerald-500/15"
              )}>
                <div className="flex flex-col items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">ALL</span>
                </div>
              </div>
              <span className={cn(
                "mt-2 text-[11px] sm:text-xs md:text-sm font-bold transition-colors text-center line-clamp-1 max-w-[85px] sm:max-w-[105px]",
                location.pathname === '/category/all' ? "text-emerald-700 font-extrabold" : "text-slate-800 group-hover:text-emerald-600"
              )}>
                সব পণ্য
              </span>
            </Link>

            {/* Category Circular Image Items */}
            {categories.map((cat, idx) => {
              const isActive = location.pathname === `/category/${cat.id}`;

              return (
                <Link
                  key={`${cat.id}-${idx}`}
                  to={`/category/${cat.id}`}
                  className="group flex flex-col items-center text-center select-none"
                >
                  <div className={cn(
                    "w-16 h-16 xs:w-20 xs:h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-full overflow-hidden relative bg-slate-100 transition-all duration-300 border-2 shadow-sm group-hover:shadow-xl group-hover:scale-105 active:scale-95",
                    isActive
                      ? "border-emerald-600 ring-4 ring-emerald-500/30 shadow-md shadow-emerald-600/20"
                      : "border-slate-200/80 group-hover:border-emerald-500 group-hover:ring-4 group-hover:ring-emerald-500/15"
                  )}>
                    {cat.image ? (
                      <img 
                        src={cat.image} 
                        alt={cat.name} 
                        className="w-full h-full object-cover rounded-full group-hover:scale-115 transition-transform duration-500 ease-out"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Fallback on load error
                          (e.target as HTMLElement).style.display = 'none';
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) {
                            parent.classList.add('flex', 'items-center', 'justify-center', 'bg-emerald-50', 'text-emerald-600');
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center text-emerald-600 group-hover:from-emerald-500 group-hover:to-teal-600 group-hover:text-white transition-all duration-300">
                        <CategoryIcon name={cat.icon || 'Tag'} size={24} strokeWidth={2} />
                      </div>
                    )}
                  </div>

                  <span className={cn(
                    "mt-2 text-[11px] sm:text-xs md:text-sm font-bold transition-colors text-center line-clamp-2 max-w-[85px] sm:max-w-[105px] leading-tight",
                    isActive ? "text-emerald-700 font-black" : "text-slate-800 group-hover:text-emerald-600"
                  )}>
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products Section - Minimalist / Luxury */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-100 pb-6 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest.">
              <Sparkles size={14} className="text-emerald-500 animate-pulse" />
              <span>Premium Select</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-slate-900 tracking-tight">বিশেষভাবে নির্বাচিত পণ্যসমূহ</h2>
            <p className="text-slate-400 text-xs md:text-sm font-medium">নিখাদ আন্তরিকতায় উৎপাদিত শতভাগ খাঁটি ও সেরা মানের উপাদানগুলির সংগ্রহ।</p>
          </div>
          <Link 
            to="/category/all" 
            className="text-xs font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1.5 transition-colors shrink-0"
          >
            <span>সব পণ্য দেখন</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(idx => (
              <div key={`shim-${idx}`} className="animate-pulse space-y-3">
                <div className="aspect-square bg-slate-200 rounded-3xl" />
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-5 bg-slate-200 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {activeFeatured.map((prod) => (
              <ProductCard key={`featured-${prod.id}`} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* Meet the Producer - Emotional Connection */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="bg-amber-100 text-amber-800 font-semibold text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-amber-200 inline-block mb-1">Meet the Producers</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900">যাদের হাতে গড়া আমাদের অমূল্য সম্পদ</h2>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-light">
            আমরা সরাসরি কাজ করি দেশের প্রত্যন্ত অঞ্চলের কৃষক ও কারিগরদের সাথে। তাদের সততা আর ভালোবাসাই আমাদের মূল শক্তি।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {producers.map((producer, idx) => (
            <motion.div
              key={producer.id || `producer-${idx}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedProducer(producer)}
              className="group relative h-[380px] rounded-[2.5rem] overflow-hidden shadow-lg border border-slate-100 cursor-pointer hover:shadow-2xl hover:border-amber-500/30 transition-all duration-300"
            >
              <img 
                src={producer.img} 
                alt={producer.name} 
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent p-8 flex flex-col justify-end text-white z-10 transition-colors duration-500">
                <p className="text-amber-300 font-bold text-xs uppercase tracking-widest mb-1.5">{producer.role}</p>
                <h3 className="text-xl font-bold mb-3 text-[#6fde03]">{producer.name}</h3>
                <p className="text-white/80 text-xs leading-relaxed transition-opacity duration-500 line-clamp-3">
                  {producer.story}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 group-hover:text-amber-300 transition-colors self-start">
                  <span>সম্পূর্ণ গল্প পড়ুন</span>
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Most Popular Products Section - Elegant Frame Display */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-100 pb-6 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-widest">
              <TrendingUp size={14} className="text-amber-500" />
              <span>Trending Now</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-slate-900 tracking-tight">সবচেয়ে জনপ্রিয় পছন্দসমূহ</h2>
            <p className="text-slate-400 text-xs md:text-sm font-medium">সহস্রাধিক পরিবারের আস্থার প্রথম পছন্দ এবং পুনঃক্রয় তালিকায় শীর্ষে থাকা সেরা পণ্যসমূহ।</p>
          </div>
          <Link 
            to="/category/all" 
            className="bg-slate-150 text-slate-800 border border-slate-200 rounded-xl px-5 py-2.5 hover:bg-slate-200 transition-all font-bold text-xs flex items-center gap-2 active:scale-95"
          >
            <span>অন্যান্য জনপ্রিয় আইটেম</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3].map(idx => (
              <div key={`pop-shim-${idx}`} className="animate-pulse space-y-3">
                <div className="aspect-square bg-slate-200 rounded-3xl" />
                <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                <div className="h-5 bg-slate-200 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 md:gap-8">
            {activePopular.map((prod, idx) => (
              <motion.div 
                key={`pop-${prod.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.4, delay: idx * 0.05, ease: "easeOut" }}
                className="group relative bg-white border border-slate-100 rounded-3xl p-4 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <Link to={`/product/${prod.id}`} className="block select-none space-y-4">
                  {/* Photo area */}
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-50 shrink-0">
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur text-white px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase flex items-center gap-1 border border-white/10 shadow-sm">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <span>{prod.rating} Rating</span>
                    </div>
                  </div>

                  {/* Metadata descriptive and reviews */}
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-800 text-sm md:text-base leading-snug line-clamp-1 group-hover:text-emerald-500 transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>
                </Link>

                <div className="pt-4 border-t border-slate-50 mt-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs text-slate-400 font-medium">মূল্য</p>
                    <p className="text-md md:text-lg font-black text-slate-800">৳{prod.price}</p>
                  </div>
                  <Link 
                    to={`/product/${prod.id}`}
                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white px-4.5 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    <span>সংগ্রহ করুন</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Dynamic Smart Recommendations */}
      <RecommendedProducts />

      {/* Newspaper Coverage Section - Brand Trust & Story */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-slate-100 pb-6 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest">
              <Newspaper size={14} className="text-emerald-500" />
              <span>Ahoron in the Press</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black text-slate-900 tracking-tight">সংবাদপত্রের পাতায় ‘আহরোণ’</h2>
            <p className="text-slate-400 text-xs md:text-sm font-medium">দেশের শীর্ষস্থানীয় গণমাধ্যমে আমাদের খাঁটি পণ্যের উদ্যোগ ও কারিগরদের জীবন নিয়ে প্রকাশিত কিছু প্রতিবেদন।</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {press.map((item, idx) => (
            <motion.div
              key={item.id || `press-${idx}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedPress(item)}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-4">
                {/* News Thumbnail Container */}
                <div className="aspect-[16/10] overflow-hidden bg-slate-50 relative border-b border-slate-100 flex items-center justify-center p-4">
                  <img 
                    src={item.img} 
                    alt={item.source} 
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
                    }}
                  />
                  <div className="absolute top-4 left-4 bg-emerald-500/90 text-white font-black text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full shadow-sm">
                    {item.source}
                  </div>
                </div>

                {/* Text Content */}
                <div className="px-6 pb-6 space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold block">{item.date}</span>
                  <h3 className="font-bold text-slate-800 text-base md:text-lg leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                    {item.excerpt}
                  </p>
                </div>
              </div>

              {item.link && item.link !== '#' && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-50/50">
                  <span className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-1 hover:underline">
                    <span>খবরটি বিস্তারিত পড়ুন</span>
                    <ArrowRight size={12} />
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <AharonVideoSection />

      {/* Social Proof Badges with Minimalist Icons */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 select-none">
        {[
          { icon: ShieldCheck, title: "১০০% খাঁটি ও বিশুদ্ধ", desc: "ল্যাব সার্টিফাইড পণ্য" },
          { icon: Heart, title: "প্রাকৃতিক সোর্সিং", desc: "সরাসরি গ্রাম থেকে" },
          { icon: Users, title: "সেরা গ্রাহক মূল্যায়ন", desc: "হাজারো পরিবারের বিশ্বাস" },
          { icon: Award, title: "প্রিমিয়াম প্যাকেটজাত", desc: "অক্ষুণ্ণ পুষ্টিগুণ মান" }
        ].map((item, i) => (
          <motion.div
            key={`trust-${i}`}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: i * 0.08 }}
            className="bg-white border border-slate-100 p-6.5 rounded-3xl flex flex-col items-center text-center gap-4 shadow-sm hover:shadow-[0_20px_40px_-5px_rgba(16,185,129,0.14)] hover:border-emerald-500/20 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
              <item.icon size={26} strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Featured Categories Premium Grid */}
      <section className="relative px-4 md:px-8 max-w-7xl mx-auto space-y-12 py-16">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-50/60 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 flex items-end justify-between border-b-2 border-slate-100 pb-6">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-4xl font-display font-black text-slate-900">ঐতিহ্যবাহী স্বাদের সমাহার</h2>
            <p className="text-slate-600 font-serif italic text-xs md:text-sm">The soul of legendary Bengal in every single jar...</p>
          </div>
          <Link to="/categories" className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs uppercase tracking-widest font-bold px-5 py-3 rounded-xl border border-slate-200/50 transition-colors">
            সব ক্যাটাগরি
          </Link>
        </div>
        
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.slice(0, 5).map((cat, idx) => (
            <PremiumCategoryCard key={`home-cat-${cat.id || 'cat'}-${idx}`} category={cat} index={idx} />
          ))}
        </div>
      </section>

      {/* Producer Story Modal */}
      <AnimatePresence>
        {selectedProducer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.3)]"
            onClick={() => setSelectedProducer(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-white to-slate-50/50 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative border border-slate-100"
            >
              <button
                onClick={() => setSelectedProducer(null)}
                className="absolute top-5 right-5 z-20 w-10 h-10 flex items-center justify-center bg-white/90 backdrop-blur-md text-slate-800 rounded-full hover:bg-slate-200 hover:scale-105 transition-all shadow-md border border-slate-100 cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="overflow-y-auto">
                <div className="flex flex-col md:flex-row min-h-[450px]">
                  {/* Left Side: Stunning Producer Image Panel */}
                  <div className="md:w-5/12 bg-slate-100 relative min-h-[300px] md:min-h-auto flex items-stretch">
                    <img 
                      src={selectedProducer.img} 
                      alt={selectedProducer.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 z-10 text-white">
                      <span className="bg-amber-400 text-slate-950 font-black text-[10px] tracking-wider uppercase px-3.5 py-1.5 rounded-full shadow-lg border border-amber-300">
                        {selectedProducer.role}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Elegant Biography & Info */}
                  <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-between space-y-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                          <Users size={14} className="text-amber-500 animate-pulse" />
                          <span>আহরোণ কারিগর ও উদ্যোক্তা প্রোফাইল</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight leading-tight">
                          {selectedProducer.name}
                        </h2>
                      </div>

                      {/* Decorative Divider */}
                      <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full" />

                      {/* Story Text content styled for high-readability */}
                      <div className="prose prose-slate prose-emerald font-serif text-slate-700 leading-relaxed text-base md:text-lg max-w-none">
                        {selectedProducer.story.split('\n').map((paragraph, i) => (
                          <p key={i} className="mb-4 font-normal tracking-wide drop-shadow-[0_0.5px_0.5px_rgba(255,255,255,0.8)]">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Aesthetic signature footer */}
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-slate-400 text-xs font-mono font-medium">
                      <span>ঐতিহ্যবাহী ও নিরাপদ পণ্যের স্বপ্ন</span>
                      <span className="text-[#005900] font-bold font-sans">#আহরোণ_উদ্যোগ</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Press Coverage Modal */}
      <AnimatePresence>
        {selectedPress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm shadow-[0_0_50px_rgba(0,0,0,0.1)]"
            onClick={() => setSelectedPress(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative"
            >
              <button
                onClick={() => setSelectedPress(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-md text-slate-800 rounded-full hover:bg-slate-200 transition-colors shadow-sm"
              >
                <X size={18} />
              </button>

              <div className="overflow-y-auto">
                <div className="bg-slate-50 w-full p-6 flex flex-col items-center justify-center border-b border-slate-100">
                  <img 
                    src={selectedPress.img} 
                    alt={selectedPress.source} 
                    className="max-h-[300px] w-auto object-contain rounded-xl shadow-sm"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
                    }}
                  />
                  <div className="mt-4 bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full">
                    {selectedPress.source}
                  </div>
                </div>

                <div className="p-6 md:p-10 space-y-6">
                  <span className="text-sm font-medium text-slate-400 block">{selectedPress.date}</span>
                  <h2 className="text-2xl md:text-3xl font-display font-black text-slate-900 leading-tight">
                    {selectedPress.title}
                  </h2>
                  <div className="prose prose-slate prose-emerald font-serif text-slate-700 leading-relaxed max-w-none">
                    {selectedPress.excerpt.split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-4">{paragraph}</p>
                    ))}
                  </div>

                  {selectedPress.link && selectedPress.link !== '#' && (
                    <div className="pt-6 border-t border-slate-100">
                      <a 
                        href={selectedPress.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white px-6 py-3 rounded-xl font-bold transition-colors"
                      >
                        <span>মূল ওয়েবসাইটে খবরটি পড়ুন</span>
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


