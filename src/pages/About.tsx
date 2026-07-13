import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Heart, Users, Award, Sparkles, Newspaper, ExternalLink, X, ArrowRight } from 'lucide-react';
import { adminService } from '../services/adminService';
import { Producer, PressCoverage } from '../types';
import { AharonVideoSection } from '../components/AharonVideoSection';

export default function About() {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [press, setPress] = useState<PressCoverage[]>([]);
  const [selectedPress, setSelectedPress] = useState<PressCoverage | null>(null);
  const [loading, setLoading] = useState(true);

  // Set page meta
  useEffect(() => {
    document.title = "আমাদের সম্পর্কে | আহরোণ (Ahoroon)";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'আহরোণের উদ্যোক্তা কাহিনী, ভিশন, মিশন এবং আমাদের গর্বিত কৃষক ও কারিগরদের গল্প জানুন। আমরা সরাসরি গ্রামের খাঁটি উপাদান সংগ্রহ করে পরিবেশন করি।');
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = "আহরোণের উদ্যোক্তা কাহিনী, ভিশন, মিশন এবং আমাদের গর্বিত কৃষক ও কারিগরদের গল্প জানুন। আমরা সরাসরি গ্রামের খাঁটি উপাদান সংগ্রহ করে পরিবেশন করি।";
      document.head.appendChild(meta);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [pr, ps] = await Promise.all([
          adminService.getProducers().catch(() => []),
          adminService.getPress().catch(() => [])
        ]);
        if (pr && pr.length > 0) setProducers(pr);
        if (ps && ps.length > 0) setPress(ps);
      } catch (err) {
        console.error("Error loading About page collections:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-24 pb-24 overflow-x-hidden pt-10 bg-slate-50/50">
      
      {/* Brand Story Hero Introduction */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto text-center space-y-6 max-w-4xl">
        <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
          <Sparkles size={14} className="text-emerald-500 animate-pulse" />
          <span>আমাদের উদ্যোক্তা কাহিনী</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-black text-slate-900 tracking-tight leading-[1.15]">
          শতভাগ ভেজালমুক্ত বিশুদ্ধতার আস্থার নাম <span className="text-[#005900]">আহরোণ</span>
        </h1>
        <p className="text-slate-600 text-sm md:text-lg leading-relaxed font-light max-w-3xl mx-auto">
          বাংলার প্রত্যন্ত অঞ্চল থেকে খাঁটি, ঐতিহ্যবাহী এবং পুষ্টিগুণে সমৃদ্ধ প্রাকৃতিক খাদ্য উপাদানসমূহ সরাসরি কোনো মধ্যস্বত্বভোগী ছাড়া সংগ্রহ করে শহুরে জীবনের প্রতিটি টেবিলে পৌঁছে দেওয়ার অঙ্গীকার নিয়ে আমাদের যাত্রা শুরু। আহরোণ শুধুমাত্র একটি ই-কমার্স ব্র্যান্ড নয়, এটি সুস্থ জীবনধারার একটি আস্থার আন্দোলন।
        </p>
      </section>

      {/* Vision & Mission Section */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Our Vision Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-slate-100 p-8 sm:p-12 rounded-[2.5rem] shadow-xs space-y-4"
          >
            <div className="w-12 h-12 bg-[#005900]/10 rounded-2xl flex items-center justify-center text-[#005900]">
              <Sparkles size={24} />
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900">আমাদের লক্ষ্য (Our Vision)</h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed font-light">
              এমন একটি সমাজ বিনির্মাণ করা যেখানে কৃত্রিম কেমিক্যাল বা প্রিজারভেটিভমুক্ত সম্পূর্ণ প্রাকৃতিক ও স্বাস্থ্যকর খাবার হবে প্রতিটি মানুষের জন্য সহজলভ্য। আমরা বাংলার ঐতিহ্যবাহী বিশুদ্ধ খাদ্যাভ্যাস পুনরুজ্জীবিত করতে চাই এবং ভবিষ্যৎ প্রজন্মকে একটি সুস্থ ও দীর্ঘায়ু জীবনের নিশ্চয়তা দিতে চাই।
            </p>
          </motion.div>

          {/* Our Mission Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-slate-100 p-8 sm:p-12 rounded-[2.5rem] shadow-xs space-y-4"
          >
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
              <Users size={24} />
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900">আমাদের উদ্দেশ্য (Our Mission)</h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed font-light">
              সরাসরি সৎ কৃষক ও ঐতিহ্যবাহী উৎপাদকদের থেকে পণ্যের গুণগত মান নিশ্চিত করে সরাসরি গ্রাহকের ঘরে পৌঁছে দেওয়া। আমরা কৃত্রিম উপায়ে স্বাদ বৃদ্ধি বা দীর্ঘস্থায়ী করার ক্ষতিকারক পদ্ধতিকে সম্পূর্ণরূপে প্রত্যাখ্যান করি এবং প্রান্তিক খামারি ও কারিগরদের মেহনতি শ্রমের সঠিক মূল্যায়ন নিশ্চিত করি।
            </p>
          </motion.div>
        </div>
      </section>

      {/* Meet the Producer - Emotional Connection (Verbatim) */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="bg-amber-100 text-amber-800 font-semibold text-[10px] px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-amber-200 inline-block mb-1">Meet the Producers</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-slate-900">যাদের হাতে গড়া আমাদের অমূল্য সম্পদ</h2>
          <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-light">
            আমরা সরাসরি কাজ করি দেশের প্রত্যন্ত অঞ্চলের কৃষক ও কারিগরদের সাথে। তাদের সততা আর ভালোবাসাই আমাদের মূল শক্তি।
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(idx => (
              <div key={`prod-load-${idx}`} className="h-[380px] rounded-[2.5rem] bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {producers.map((producer, idx) => (
              <motion.div
                key={producer.id || `producer-${idx}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative h-[380px] rounded-[2.5rem] overflow-hidden shadow-lg border border-slate-100"
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
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Video Introduction Section */}
      <AharonVideoSection />

      {/* Newspaper Coverage Section - Brand Trust & Story (Verbatim) */}
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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(idx => (
              <div key={`press-load-${idx}`} className="h-[250px] rounded-3xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
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
        )}
      </section>

      {/* Social Proof Badges with Minimalist Icons (Verbatim) */}
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

      {/* Press Coverage Modal (Verbatim) */}
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
