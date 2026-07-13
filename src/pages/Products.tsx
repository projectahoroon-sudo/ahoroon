import { useState, useEffect, useMemo } from 'react';
import { PRODUCTS as STATIC_PRODUCTS, CATEGORIES as STATIC_CATEGORIES } from '../data';
import { ProductCard } from '../components/ProductCard';
import { SlidersHorizontal, Search, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { storeService } from '../services/storeService';
import { Product, Category } from '../types';
import { FilterDrawer } from '../components/FilterDrawer';
import { CategoryIcon } from '../components/CategoryIcon';
import { cn } from '../lib/utils';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(STATIC_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [filters, setFilters] = useState({
    priceRange: [0, 100000] as [number, number],
    brands: [] as string[],
    colors: [] as string[],
    sizes: [] as string[],
  });

  // Set page meta
  useEffect(() => {
    document.title = "আমাদের পণ্যসমূহ | আহরোণ (Ahoroon)";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'আহরোণের শতভাগ খাঁটি ও প্রাকৃতিক উপাদানে প্রস্তুত পণ্যসমূহের তালিকা দেখুন। ঘি, মধু, সরিষার তেল এবং আরও অনেক কিছু সংগ্রহ করুন।');
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = "আহরোণের শতভাগ খাঁটি ও প্রাকৃতিক উপাদানে প্রস্তুত পণ্যসমূহের তালিকা দেখুন। ঘি, মধু, সরিষার তেল এবং আরও অনেক কিছু সংগ্রহ করুন।";
      document.head.appendChild(meta);
    }
  }, []);

  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach(p => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const list = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPrice = p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1];
      
      const matchesBrand = filters.brands.length === 0 || (p.brand && filters.brands.includes(p.brand));
      
      const matchesColor = filters.colors.length === 0 || 
                           (p.colors && p.colors.some(c => filters.colors.includes(c)));
      
      const matchesSize = filters.sizes.length === 0 || 
                          (p.sizes && p.sizes.some(s => filters.sizes.includes(s)));
      
      return matchesSearch && matchesPrice && matchesBrand && matchesColor && matchesSize;
    });

    if (sortBy === 'price-low') return [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') return [...list].sort((a, b) => b.price - a.price);
    if (sortBy === 'newest') return [...list].sort((a, b) => b.id.localeCompare(a.id)); 
    
    return list;
  }, [products, searchQuery, filters, sortBy]);

  const groupedProducts = useMemo(() => {
    const groups: { [key: string]: Product[] } = {};
    filteredProducts.forEach(p => {
      const catId = p.category || 'other';
      if (!groups[catId]) {
        groups[catId] = [];
      }
      groups[catId].push(p);
    });
    return groups;
  }, [filteredProducts]);

  useEffect(() => {
    async function load() {
      try {
        const [p, c] = await Promise.all([
          storeService.getProducts(),
          storeService.getCategories()
        ]);
        if (p && p.length > 0) setProducts(p);
        else setProducts(STATIC_PRODUCTS);

        if (c && c.length > 0) setCategories(c);
      } catch (e) {
        console.error('Error loading products list page:', e);
        setProducts(STATIC_PRODUCTS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="px-4 md:px-8 py-10 space-y-10 min-h-screen pb-24 max-w-7xl mx-auto bg-slate-50/50">
      
      {/* Header section with category selections */}
      <div className="flex flex-col gap-6 text-center space-y-2 max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
          <Sparkles size={14} className="text-emerald-500 animate-pulse" />
          <span>আমাদের প্রিমিয়াম ক্যাটালগ</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-black text-slate-900 tracking-tight">আসল ও খাঁটি পণ্যের স্বাদ</h1>
        <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
          বাংলার সেরা ঐতিহ্যবাহী উপাদানসমূহ যা অত্যন্ত বিশুদ্ধতা ও সতর্কতার সাথে সরাসরি উৎস থেকে আপনার দোরগোড়ায় নিয়ে আসা হয়েছে।
        </p>
      </div>

      {/* Search and sorting tools */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative group w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#005900] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="পণ্য খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-[#005900]/50 focus:ring-4 focus:ring-[#005900]/5 transition-all shadow-xs"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-slate-100 rounded-2xl text-[11px] font-bold uppercase tracking-wider px-5 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer outline-none shadow-xs text-slate-700"
          >
            <option value="relevance">Sort By: relevance</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs text-gray-500 hover:text-primary transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer"
          >
            <SlidersHorizontal size={16} />
            Filter
            {(filters.brands.length > 0 || filters.colors.length > 0 || filters.sizes.length > 0) && (
              <span className="w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Products list grouped by Category */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(idx => (
            <div key={`prod-shim-${idx}`} className="animate-pulse space-y-3">
              <div className="aspect-square bg-slate-200 rounded-3xl" />
              <div className="h-4 bg-slate-200 rounded-md w-3/4" />
              <div className="h-5 bg-slate-200 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {categories.map((cat) => {
            const categoryProducts = groupedProducts[cat.id] || [];
            if (categoryProducts.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-4">
                {/* Category Row Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                      <CategoryIcon name={cat.icon} size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-display font-black text-slate-800">
                        {cat.name}
                      </h2>
                      <p className="text-xs text-slate-400 font-medium font-mono">
                        {categoryProducts.length}টি পণ্য
                      </p>
                    </div>
                  </div>
                </div>

                {/* Horizontal scrollable line of products */}
                <div className="relative">
                  <div className="flex overflow-x-auto gap-6 pb-4 pt-1 px-1 scrollbar-thin scrollbar-thumb-emerald-500/20 hover:scrollbar-thumb-emerald-500/40 -mx-4 md:-mx-8 px-4 md:px-8">
                    {categoryProducts.map((product, idx) => (
                      <div 
                        key={`${cat.id}-${product.id}-${idx}`} 
                        className="w-[180px] sm:w-[220px] md:w-[260px] shrink-0"
                      >
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Uncategorized products group */}
          {groupedProducts['other'] && groupedProducts['other'].length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <CategoryIcon name="MoreHorizontal" size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-display font-black text-slate-800">
                      অন্যান্য পণ্যসমূহ
                    </h2>
                    <p className="text-xs text-slate-400 font-medium font-mono">
                      {groupedProducts['other'].length}টি পণ্য
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="flex overflow-x-auto gap-6 pb-4 pt-1 px-1 scrollbar-thin scrollbar-thumb-emerald-500/20 hover:scrollbar-thumb-emerald-500/40 -mx-4 md:-mx-8 px-4 md:px-8">
                  {groupedProducts['other'].map((product, idx) => (
                    <div 
                      key={`other-${product.id}-${idx}`} 
                      className="w-[180px] sm:w-[220px] md:w-[260px] shrink-0"
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProducts.length === 0 && (
        <div className="py-24 text-center space-y-4">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
            <Search size={32} />
          </div>
          <p className="text-gray-400 font-medium">আপনার খোঁজা ফিল্টারগুলির সাথে কোনো পণ্য মেলেনি।</p>
          <button 
            onClick={() => {
              setFilters({ priceRange: [0, 100000], brands: [], colors: [], sizes: [] });
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="text-primary font-bold text-sm hover:underline cursor-pointer"
          >
            সব ফিল্টার মুছুন
          </button>
        </div>
      )}

      <FilterDrawer 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        availableBrands={availableBrands}
        onFilterChange={setFilters}
      />
    </div>
  );
}
